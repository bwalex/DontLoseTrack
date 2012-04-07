require 'rubygems'
require 'bundler/setup'

require 'active_record'
require 'foreigner'

require 'redcarpet'
require 'pygments'

require 'diffy'

require 'sinatra'
require 'logger'

require 'haml'

require './db.rb'


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
      :no_intra_emphasis => true,
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

get '/markdown-cheatsheet' do
  haml :markdown_cheat, :format => :html5
end



get '/api/project' do
  Project.all.to_json
end

get '/api/project/:project_id' do
  Project.find(params[:project_id]).to_json
end

put '/api/project/:project_id' do
  content_type :json
  p = Project.find(params[:project_id])
  JSON.parse(request.body.read).each { |k, v| p.send(k + "=", v) }
  p.save!
  p.to_json

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



get '/api/project/:project_id/events' do
  content_type :json

  s = Setting.where(:project_id => params[:project_id], :key => 'timeline:events')
  if s.empty?
    return [].to_json
  end

  filters = s[0].value.split(',')
  Event.where(:project_id => params[:project_id],
    :type => filters).order('occurred_at DESC').to_json
end



get '/api/project/:project_id/note' do
  content_type :json

  puts params.to_json

  if params[:filter] != nil and params[:filter][:tags] != nil and not params[:filter][:tags].empty?
    puts "Limit: " << params[:limit]
    puts "Offset: " << params[:offset]

    Note.joins(:note_tags).where(
      :project_id => params[:project_id],
      :note_tags => { :tag_id => params[:filter][:tags] }
    ).limit(params[:limit]).offset(params[:offset]).to_json
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
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'notes',
      :occurred_at => DateTime.now,
      :summary => "Note added",
      :body => "<span class='timeline-note'><blockquote>" + $markdown.render(snippet(n.text)) + "</blockquote></span>"
  );
  n.to_json
end

delete '/api/project/:project_id/note/:note_id' do
  n = Note.find(params[:note_id])
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'notes',
      :occurred_at => DateTime.now,
      :summary => "Note deleted",
      :body => "<span class='timeline-note'><blockquote>" + $markdown.render(snippet(n.text)) + "</blockquote></span>"
  );
  Note.destroy(n)
end


def snippet(thought)
  thought[0..140]
end 









get '/api/project/:project_id/wiki' do
  content_type :json

  puts params.to_json

  if params[:filter] != nil and params[:filter][:tags] != nil and not params[:filter][:tags].empty?
    puts "Limit: " << params[:limit]
    puts "Offset: " << params[:offset]

    Wiki.joins(:wiki_tags).where(
      :project_id => params[:project_id],
      :wiki_tags => { :tag_id => params[:filter][:tags] }
    ).limit(params[:limit]).offset(params[:offset]).to_json
  else
    Wiki.where("project_id = ?", params[:project_id]).order("updated_at DESC").to_json
  end
end

get '/api/project/:project_id/wiki/:wiki_id' do
  Wiki.find(params[:wiki_id]).to_json
end

put '/api/project/:project_id/wiki/:wiki_id' do
  content_type :json
  w = Wiki.find(params[:wiki_id])
  old_title = w.title
  JSON.parse(request.body.read).each { |p, v| w.send(p + "=", v) }
  w.save!

  if w.title != old_title
    e = Event.create!(
        :project => Project.find(params[:project_id]),
        :type => 'wikis',
        :occurred_at => DateTime.now,
        :summary => "Wiki <span class='timeline-wiki'>" + old_title + "</span> renamed to <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{w.id}'>" + w.title + "</a></span>"
    );

  end

  w.to_json
end

post '/api/project/:project_id/wiki' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  w = Wiki.create!(:title => data['title'], :project => p)
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{w.id}'>" + w.title + "</a></span> added"
  );
  w.to_json
end

delete '/api/project/:project_id/wiki/:wiki_id' do
  w = Wiki.find(params[:wiki_id])
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{w.id}'>" + w.title + "</a></span> deleted"
  );
  Wiki.destroy(w)
end







get '/api/project/:project_id/settings' do
  Setting.where("project_id = ?", params[:project_id]).to_json
end

put '/api/project/:project_id/settings/:setting_id' do
  content_type :json
  s = Setting.find(params[:setting_id])
  JSON.parse(request.body.read).each { |p, v| s.send(p + "=", v) }
  s.save!
  s.to_json
end

post '/api/project/:project_id/settings' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  s = Setting.create!(:key => data['key'], :value => data['value'], :project => p)
  s.to_json
end




get '/api/project/:project_id/extresource' do
  ExtResource.where("project_id = ?", params[:project_id]).to_json
end

post '/api/project/:project_id/extresource' do
  content_type :json
  p = Project.find(params[:project_id])
  data = JSON.parse(request.body.read)
  e = ExtResource.create!(:type => data['type'], :location => data['location'], :project => p)
  e.to_json
end

delete '/api/project/:project_id/extresource/:extres_id' do
  e = ExtResource.find(params[:extres_id])
  ExtResource.destroy(e)
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







post '/api/project/:project_id/wikitag' do
  content_type :json
  data = JSON.parse(request.body.read)
  wiki = Wiki.find(data['wiki_id'])
  tag = Tag.find(data['tag_id'])
  wt = WikiTag.create!(:wiki => wiki, :tag => tag)
  wt.to_json
end


delete '/api/project/:project_id/wikitag/:wikitag_id' do
  wt = WikiTag.find(params[:wikitag_id])
  WikiTag.destroy(wt)
end




post '/api/project/:project_id/wiki/:wiki_id/wikicontent' do
  content_type :json
  data = JSON.parse(request.body.read)
  wiki = Wiki.find(params[:wiki_id])
  wc = WikiContent.create!(:wiki => wiki, :text => data['text'], :comment => data['comment'])
  wiki.touch
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{wiki.id}'>" + wiki.title + "</a></span> updated"
  );
  wc.to_json
end


get '/api/project/:project_id/wiki/:wiki_id/wikicontent' do
  WikiContent.where("wiki_id = ?", params[:wiki_id]).to_json
end

get '/api/project/:project_id/wiki/:wiki_id/wikicontent/:wc_id' do
  wc_ids = 0;

  if params[:wc_id].include? ';'
    wc_ids = params[:wc_id].split(';')
  else
    wc_ids = params[:wc_id]
  end

  WikiContent.find(wc_ids).to_json
end










post '/api/project/:project_id/wiki/:wiki_id/diff' do
  content_type :html
  wiki = Wiki.find(params[:wiki_id])
  wc1 = WikiContent.find(params[:ids][0])
  wc2 = WikiContent.find(params[:ids][1])

  Diffy::Diff.new(wc1.text, wc2.text).to_s(:html)
end




post '/api/preview' do
  content_type :html
  $markdown.render(params[:text])
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
  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'tasks',
      :occurred_at => DateTime.now,
      :summary => "Task <span class='timeline-task'>" + t.summary + "</span> added"
  );
  t.to_json
end

put '/api/project/:project_id/task/:task_id' do
  content_type :json
  t = Task.find(params[:task_id])
  completed = t.completed
  JSON.parse(request.body.read).each { |p, v| t.send(p + "=", v) }
  t.save!

  if t.completed and not completed
    e = Event.create!(
        :project => Project.find(params[:project_id]),
        :type => 'tasks',
        :occurred_at => DateTime.now,
        :summary => "Task <span class='timeline-task'>" + t.summary + "</span> completed"
    );
  elsif not t.completed and completed
    e = Event.create!(
        :project => Project.find(params[:project_id]),
        :type => 'tasks',
        :occurred_at => DateTime.now,
        :summary => "Task <span class='timeline-task'>" + t.summary + "</span> back in the game"
    );
  end

  t.to_json
end

delete '/api/project/:project_id/task/:task_id' do
  t = Task.find(params[:task_id])

  e = Event.create!(
      :project => Project.find(params[:project_id]),
      :type => 'tasks',
      :occurred_at => DateTime.now,
      :summary => "Task <span class='timeline-task'>" + t.summary + "</span> deleted"
  );

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


error ActiveRecord::RecordNotFound do
  status 404
  { "errors" => ["Resource is not available"] }.to_json
end




not_found do
  "Resource not found"
end

