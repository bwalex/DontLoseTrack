require 'rubygems'
require 'bundler/setup'

require 'active_record'
require 'foreigner'

require 'redcarpet'
require 'pygments'

require 'sinatra'
require 'logger'

require 'haml'

require 'db'


class HTMLwithPygments < Redcarpet::Render::HTML
  def block_code(code, language)
    Pygments.highlight(code, :lexer => language)
  end
end


configure do
  $markdown = Redcarpet::Markdown.new(
    HTMLwithPygments.new(:hard_wrap => true), {
      :autolink => true,
      :tables => true,
      :no_intra_empahsis => true,
      :strikethrough => true,
      :lax_html_blocks => true,
      :fenced_code_blocks => true,
      :space_after_headers => true
    })

  dbconfig = YAML::load(File.open('config/database.yml'))

  ActiveRecord::Base.logger = Logger.new(STDOUT)
  ActiveRecord::Base.establish_connection(dbconfig)

  ActiveRecord::Base.include_root_in_json = false
end


after do
  ActiveRecord::Base.clear_active_connections!
end


get '/' do
  haml :main, :format => :html5
end




get '/api/project' do
  Project.all.to_json
end

get '/api/project/:project_id' do
  Project.find(params[:project_id]).to_json
end

put '/api/project/:project_id' do
  status 500
end

post '/api/project' do
  content_type :json
  data = JSON.parse(request.body.read)
  p = Project.create!(:name => data['name'])
  p.to_json
end

delete '/api/project/:project_id' do
  p = Project.find(params[:project_id])
  Project.destroy(p)
end






get '/api/project/:project_id/note' do
  content_type :json

  if params[:filter] != nil and params[:filter][:tags] != nil
    Note.joins(:note_tags).where(
      :project_id => params[:project_id],
      :note_tags => { :tag_id => params[:filter][:tags] }
    ).limit(:params[:limit]).offset(:params[:offset]).to_json
  else
    Note.where("project_id = ?", params[:project_id]).to_json
  end
end

get '/api/project/:project_id/note/:note_id' do
  Note.find(params[:note_id]).to_json
end

put '/api/project/:project_id/note/:note_id' do
end

post '/api/project/:project_id/note' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  n = Note.create!(:text => data['text'], :project => p)
  n.to_json
end

delete '/api/project/:project_id/note/:note_id' do
  n = Note.find(params[:note_id])
  Note.destroy(n)
end







get '/api/project/:project_id/tag' do
  Tag.where("project_id = ?", params[:project_id]).to_json
end

get '/api/project/:project_id/tag/:tag_id' do
  Tag.find(params[:tag_id]).to_json
end

put '/api/project/:project_id/tag/:tag_id' do
  content_type :json
  t = Tag.find(params[:tag_id])
  JSON.parse(request.body.read).each { |p, v| t.send(p + "=", v) }
  t.save!
  t.to_json
end

post '/api/project/:project_id/tag' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  t = Tag.create!(:name => data['name'], :project => p)
  t.to_json
end

delete '/api/project/:project_id/tag/:tag_id' do
  t = Tag.find(params[:tag_id])
  Tag.destroy(t)
end




post '/api/project/:project_id/tasktag' do
  content_type :json
  data = JSON.parse(request.body.read)
  task = Task.find(data['task_id'])
  tag = Tag.find(data['tag_id'])
  tt = TaskTag.create!(:task => task, :tag => tag)
  tt.to_json
end


delete '/api/project/:project_id/tasktag/:tasktag_id' do
  tt = TaskTag.find(params[:tasktag_id])
  TaskTag.destroy(tt)
end




post '/api/project/:project_id/notetag' do
  content_type :json
  data = JSON.parse(request.body.read)
  note = Note.find(data['note_id'])
  tag = Tag.find(data['tag_id'])
  nt = NoteTag.create!(:note => note, :tag => tag)
  nt.to_json
end


delete '/api/project/:project_id/notetag/:notetag_id' do
  nt = NoteTag.find(params[:notetag_id])
  NoteTag.destroy(nt)
end







post '/api/project/:project_id/taskdep' do
  content_type :json
  data = JSON.parse(request.body.read)
  task = Task.find(data['task_id'])
  dep = Task.find(data['dependency_id'])
  tdep = TaskDep.create!(:task => task, :dependency => dep)
  tdep.to_json
end


delete '/api/project/:project_id/taskdep/:taskdep_id' do
  tdep = TaskDep.find(params[:taskdep_id])
  TaskDep.destroy(tdep)
end








get '/api/project/:project_id/task' do
  content_type :json
  Task.where("project_id = ?", params[:project_id]).to_json
end

get '/api/project/:project_id/task/:task_id' do
  Task.find(params[:task_id]).to_json
end

post '/api/project/:project_id/task' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  t = Task.create!(:summary => data['summary'], :project => p)
  t.to_json
end

put '/api/project/:project_id/task/:task_id' do
  content_type :json
  t = Task.find(params[:task_id])
  JSON.parse(request.body.read).each { |p, v| t.send(p + "=", v) }
  t.save!
  t.to_json
end

delete '/api/project/:project_id/task/:task_id' do
  t = Task.find(params[:task_id])
  Task.destroy(t)
end





set :raise_errors, false
set :show_exceptions, false

error do
  env['sinatra.error'].backtrace
end


error ActiveRecord::RecordInvalid do
  env['sinatra.error'].errors_to_json
end


error ActiveRecord::RecordNotUnique do
  { "errors" => [env['sinatra.error'].to_s] }.to_json
end


get '/db_populate' do
  p = Project.create(:name => 'mrf24j40-driver', :github_repo => 'bwalex/mrf24j40-driver')
  tag1 = p.tags.create(:color => '#00ff00', :name => 'Tag1')
  tag2 = p.tags.create(:color => '#0000ff', :name => 'Tag2')
  tag3 = p.tags.create(:color => '#00ffff', :name => 'Tag3')
  tag4 = p.tags.create(:color => '#ffff00', :name => 'Tag4')
  tag5 = p.tags.create(:color => '#ff00ff', :name => 'Tag5')
  p.tags.create(:color => '#eebbcc', :name => 'Tag Master 6')
  p.tags.create(:color => '#F3918F', :name => 'Long Tag Number 7')
  p.tags.create(:color => '#391AAA', :name => 'Another long tag 8')
  p.tags.create(:color => '#13dfa9', :name => 'taggi tag')
  p.tags.create(:color => '#316131', :name => 'moo tag')
  p.tags.create(:color => '#986301', :name => 'meh tag')
  p.tags.create(:color => '#750931', :name => 'foo tag')
  p.tags.create(:color => '#865dfa', :name => 'Very, very, extremely long, tag')

  n = p.notes.create(:text => 'Next time I need to revise the initial PCB layout')
  n.tags << tag1
  n.tags << tag5
  n.save

  n = p.notes.create(:text => 'Last time I tried to debug some SPI issue with some italian guy')
  n.tags << tag1
  n.tags << tag2
  n.tags << tag3
  n.save

  t1 = p.tasks.create(:summary => 'Take garbage out')
  t1.tags << tag2
  t1.tags << tag4
  t1.save


  t2 = p.tasks.create(:summary => 'Finish this web app', :importance => 'high')
  t2.tags << tag1
  t2.tags << tag3
  t2.tags << tag4
  t2.tags << tag5
  t2.save

  t = p.tasks.create(:summary => 'Pick up parcels', :importance => 'low')
  t.tags << tag3
  dep = TaskDep.create(:task => t, :dependency => t1)
  t.task_deps << dep
  dep = TaskDep.create(:task => t, :dependency => t2)
  t.task_deps << dep
  t.save

  p = Project.create(:name => 'tc-play', :github_repo => 'bwalex/tc-play')
  p = Project.create(:name => 'sniff802154')
end


not_found do
  "This is not the web page you are looking for."
end




#error do
#end
