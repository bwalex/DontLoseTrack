require 'rubygems'
require 'bundler/setup'
require 'digest/sha1'

require 'dalli'

require 'active_record'
require 'action_dispatch'
require 'foreigner'

require 'redcarpet'
require 'pygments'

require 'diffy'

require 'sinatra'
require 'logger'

require 'haml'

require './db.rb'



@config = YAML::load(File.open('config/config.yml'))


class HTMLwithPygments < Redcarpet::Render::HTML
  def block_code(code, language)
    Pygments.highlight(code, :lexer => language)
  end
end


set :static_cache_control, [:public, :max_age => 43200] # 12 hours


if defined? @config['optimized'] and @config['optimized']
  puts "Using optimized static files"
  set :public, File.dirname(__FILE__) + '/public_opt'
  set :public_folder, File.dirname(__FILE__) + '/public_opt'
end


if defined? @config['silent'] and @config['silent']
  set :logging, false
# Disable useless rack logger completely! Yay, yay!
  module Rack
    class CommonLogger
      def call(env)
        # do nothing
        @app.call(env)
      end
    end
  end

  disable :logging
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

#  dbconfig = YAML::load(File.open('config/database.yml'))

#  ActiveRecord::Base.logger = Logger.new(STDOUT)
#  ActiveRecord::Base.establish_connection(dbconfig)

  ActiveRecord::Base.include_root_in_json = false

#  enable :sessions
end


#after do
#  ActiveRecord::Base.clear_active_connections!
#end


get '/login*' do
  cache_control :public, :max_age => 43200
  haml :login, :format => :html5
end


post '/login' do
  u = User.authenticate(params[:username], params[:password])

  if u == nil
    haml :login, :format => :html5,
                 :locals => {
                   :errors => ['Invalid username or password']
                 }
  else
    session[:user] = u.id
    redirect '/'
  end
end


post '/login/openid' do
  resp = request.env["rack.openid.response"]
  if resp

    if resp.status == :success
      u = User.auth_by_openid(resp.identity_url)
      u = User.create!(:openid => resp.identity_url) if u.nil?

      session[:user] = u.id
      redirect '/'
    else
      haml :login, :format => :html5,
                   :locals => {
                     :errors => [
                       'OpenID Authentication unsuccessful',
                       resp.message
                     ]
                   }
    end
  else
    headers 'WWW-Authenticate' => Rack::OpenID.build_header(
      :identifier => params["openid_identifier"],
      :required => ["http://axschema.org/contact/email"]
    )
    throw :halt, [401, 'got openid?']
  end
end


get '/register' do
  haml :login, :format => :html5
end


get '/register/openid' do
  haml :register_openid, :format => :html5
end


post '/register/openid' do
  begin
    @user = User.find(session[:user])
    halt 403 unless @user.is_new_openid?
  rescue ActiveRecord::RecordNotFound
    halt 403
  end

  begin
    @user.is_new_openid = false
    @user.alias = params[:alias]
    @user.name = params[:name]
    @user.email = params[:email]
    @user.alias = params[:alias]
    @user.new_password = params[:password]
    @user.new_password_confirmation = params[:password_confirmation]
    @user.save!

    session[:user] = @user.id
    redirect '/'
  rescue ActiveRecord::RecordInvalid => invalid
    errors = []

    invalid.record.errors.each do |k, v|
      errors.push(k.to_s.split("_").each{|w| w.capitalize!}.join(" ") + " " + v);
    end

    haml :register_openid, :format => :html5, :locals => {:errors => errors, :params => params }
  end
end


post '/register' do
  begin
    u = User.create!(
      :name => params[:name],
      :email => params[:email],
      :alias => params[:alias],
      :new_password => params[:password],
      :new_password_confirmation => params[:password_confirmation]
    )

    session[:user] = u.id
    redirect '/'
  rescue ActiveRecord::RecordInvalid => invalid
    errors = []

    invalid.record.errors.each do |k, v|
      errors.push(k.to_s.split("_").each{|w| w.capitalize!}.join(" ") + " " + v);
    end

    haml :login, :format => :html5, :locals => {:errors => errors, :params => params }
  end
end


get '/logout' do
  session[:user] = nil
  redirect '/'
end




get '/' do
  redirect '/login' unless session[:user]

  user = User.find(session[:user])
  redirect '/register/openid' if user.is_new_openid?

  cache_control :public, :must_revalidate, :max_age => 43200

  haml :main, :format => :html5
end


get '/markdown-cheatsheet' do
  cache_control :public, :max_age => 43200

  haml :markdown_cheat, :format => :html5
end


set(:is_owner) do |v|
  return (defined? @project and not @project.nil? and (@project.owner == @user))
end

before '/api/*' do
  begin
    @user = User.find(session[:user])
    halt 403 if @user.is_new_openid?
  rescue ActiveRecord::RecordNotFound
    halt 403
  end
end

before '/api/project/:project_id*' do
  @project = @user.projects.find(params[:project_id])
  halt 404 unless @project != nil # not reached normally, as above raises RecordNotFound

  # Force revalidation of every single request
  expires 0, :public, :must_revalidate
  last_modified @project.updated_at
end

after '/api/project/:project_id*' do
  if request.put? or request.delete? or request.post?
    @project.touch unless @project.nil?
  end
end

before '/api/project/:project_id/note/:note_id*' do
  @note = @project.notes.find(params[:note_id])
  halt 404 unless @note != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/task/:task_id*' do
  @task = @project.tasks.find(params[:task_id])
  halt 404 unless @task != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/wiki/:wiki_id*' do
  @wiki = @project.wikis.find(params[:wiki_id])
  halt 404 unless @wiki != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/wiki/:wiki_id/wikicontent/:wc_id' do
  @wikicontent = @wiki.wiki_contents.find(params[:wc_id])
  halt 404 unless @wikicontent != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/settings/:setting_id*' do
  @setting = @user.user_project_settings.where(:project_id => @project.id, :id => params[:setting_id]).first
  halt 404 unless @setting != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/extresource/:extres_id*' do
  @extres = @project.ext_resources.find(params[:extres_id])
  halt 404 unless @extres != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/tag/:tag_id*' do
  @tag = @project.tags.find(params[:tag_id])
  halt 404 unless @tag != nil # not reached normally, as above raises RecordNotFound
end

before '/api/project/:project_id/taskdep/:tdep_id' do
end

before '/api/project/:project_id/tasktag/:tag_id' do
end

before '/api/project/:project_id/notetag/:tag_id' do
end

before '/api/project/:project_id/wikitag/:tag_id' do
end



get '/api/project' do
  @user.projects.to_json(:user => @user)
end

get '/api/project/:project_id' do
  @project.to_json(:user => @user)
end

put '/api/project/:project_id', :is_owner => true do
  content_type :json
  JSON.parse(request.body.read).each { |k, v| @project.send(k + "=", v) }
  @project.save!
  @project.to_json

end

post '/api/project' do
  content_type :json
  data = JSON.parse(request.body.read)
  @project = @user.projects.create!(:name => data['name'], :owner => @user)
  pu = ProjectUser.where(:project_id => @project.id, :user_id => @user.id).first
  pu.is_owner = true
  pu.save!
  @project.to_json
end

delete '/api/project/:project_id', :is_owner => true do
  Project.destroy(@project)
end



get '/api/project/:project_id/events' do
  content_type :json

  filters = [ "extres" ]
  s = @user.user_project_settings.where(:project_id => @project.id, :key => 'timeline:events')
  if not s.empty?
    filters = filters | s[0].value.split(',')
  end

  q = Event.where(
    :project_id => @project.id,
    :type => filters
  )
  .order('occurred_at DESC')
  if not params[:offset].nil? or not params[:limit].nil?
    q = q.limit(params[:limit]).offset(params[:offset].to_i)
  end
  q.to_json
end




get '/api/project/:project_id/projectuser' do
  content_type :json
  @project.project_users.to_json
end

post '/api/project/:project_id/projectuser', :is_owner => true do
  content_type :json
  data = JSON.parse(request.body.read)
  user = User.where(:alias => data['user_alias']).first
  halt 404 if user.nil?
  pu = ProjectUser.create!(:project => @project, :user => user)
  pu.to_json
end


delete '/api/project/:project_id/projectuser/:pu_id' do
  pu = @project.project_users.find(params[:pu_id])
  # Normal users can only delete themselves from the project,
  # the project owner cannot ever remove himself
  halt 403 unless (pu.project.owner != @user and pu.user == @user) or
                  (pu.project.owner == @user and pu.user != @user)
  ProjectUser.destroy(pu)
end




get '/api/project/:project_id/user' do
  @project.users.to_json(:user => @user)
end

get '/api/user' do
  @user.to_json(:user => @user)
end

put '/api/user' do
  content_type :json
  JSON.parse(request.body.read).each { |k, v| @user.send(k + "=", v) }
  @user.save!
  @user.to_json(:user => @user)
end

delete '/api/user' do
  User.destroy(@user)
end




get '/api/project/:project_id/note' do
  content_type :json

  if not params[:filter].nil? or not params[:offset].nil? or not params[:limit].nil?
    q = Note

    if not params[:filter].nil? and not params[:filter][:tags].nil? and not params[:filter][:tags].empty?
      q = q.joins(:note_tags)
        .where(
          :note_tags => { :tag_id => params[:filter][:tags] }
        )
    end

    q = q.where(
        :project_id => @project.id
      )
      .order('updated_at DESC')
      .limit(params[:limit])
      .offset(params[:offset])
      .includes(:note_tags)
      .to_json
  else
    @project.notes.includes(:note_tags).to_json
  end
end

get '/api/project/:project_id/note/:note_id' do
  @note.to_json
end

put '/api/project/:project_id/note/:note_id' do
  status 500
end

post '/api/project/:project_id/note' do
  content_type :json
  data = JSON.parse(request.body.read)
  n = @project.notes.create!(:text => data['text'], :user => @user)
  e = @project.events.create!(
      :user => @user,
      :type => 'notes',
      :occurred_at => DateTime.now,
      :summary => "Note added",
      :body => "<span class='timeline-note'><blockquote>" + $markdown.render(snippet(n.text)) + "</blockquote></span>"
  );
  n.to_json
end

delete '/api/project/:project_id/note/:note_id' do
  e = @project.events.create!(
      :user => @user,
      :type => 'notes',
      :occurred_at => DateTime.now,
      :summary => "Note deleted",
      :body => "<span class='timeline-note'><blockquote>" + $markdown.render(snippet(@note.text)) + "</blockquote></span>"
  );
  Note.destroy(@note)
end


def snippet(thought)
  thought[0..140]
end 









get '/api/project/:project_id/wiki' do
  content_type :json

  if params[:filter] != nil and params[:filter][:tags] != nil and not params[:filter][:tags].empty?

#    Wiki.joins(:wiki_tags).where(
#      :project_id => params[:project_id],
#      :wiki_tags => { :tag_id => params[:filter][:tags] }
#    ).limit(params[:limit]).offset(params[:offset]).includes(:wiki_tags, :wiki_contents).to_json

#    Wiki.includes(:wiki_tags).where(
#      Wiki.arel_table[:project_id].eq(params[:project_id]).and(
#      WikiTag.arel_table[:tag_id].in([1,2]))#params[:filter][:tags])
#    ).limit(params[:limit]).offset(params[:offset]).to_json

     Wiki.includes(:wiki_tags)
       .where('project_id = ?', params[:project_id])
       .where(WikiTag.arel_table[:tag_id].in(params[:filter][:tags]))
       .limit(params[:limit])
       .offset(params[:offset])
       .to_json
  else
    @project.wikis.order("updated_at DESC").includes(:wiki_tags, :wiki_contents).to_json
  end
end

get '/api/project/:project_id/wiki/:wiki_id' do
  @wiki.to_json
end

put '/api/project/:project_id/wiki/:wiki_id' do
  content_type :json
  old_title = @wiki.title
  JSON.parse(request.body.read).each { |p, v| @wiki.send(p + "=", v) }
  @wiki.save!

  if @wiki.title != old_title
    e = @project.events.create!(
        :user => @user,
        :type => 'wikis',
        :occurred_at => DateTime.now,
        :summary => "Wiki <span class='timeline-wiki'>" + old_title + "</span> renamed to <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{@wiki.id}'>" + @wiki.title + "</a></span>"
    );

  end

  @wiki.to_json
end

post '/api/project/:project_id/wiki' do
  content_type :json
  data = JSON.parse(request.body.read)
  w = @project.wikis.create!(:title => data['title'])
  e = @project.events.create!(
      :user => @user,
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{w.id}'>" + w.title + "</a></span> added"
  );
  w.to_json
end

delete '/api/project/:project_id/wiki/:wiki_id' do
  e = @project.events.create!(
      :user => @user,
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{@wiki.id}'>" + @wiki.title + "</a></span> deleted"
  );
  Wiki.destroy(@wiki)
end







get '/api/project/:project_id/settings' do
  @user.user_project_settings.where(:project_id => @project.id).to_json
end

put '/api/project/:project_id/settings/:setting_id' do
  content_type :json
  JSON.parse(request.body.read).each { |p, v| @setting.send(p + "=", v) }
  @setting.save!
  @setting.to_json
end

post '/api/project/:project_id/settings' do
  content_type :json
  data = JSON.parse(request.body.read)
  s = @user.user_project_settings.create!(:project => @project, :key => data['key'], :value => data['value'])
  s.to_json
end




get '/api/project/:project_id/extresource', :is_owner => true do
  @project.ext_resources.to_json
end

post '/api/project/:project_id/extresource', :is_owner => true do
  content_type :json
  data = JSON.parse(request.body.read)
  e = @project.ext_resources.create!(:type => data['type'], :location => data['location'])
  e.to_json
end

delete '/api/project/:project_id/extresource/:extres_id', :is_owner => true do
  ExtResource.destroy(@extres)
end





get '/api/project/:project_id/tag' do
  @project.tags.includes(:note_tags, :task_tags, :wiki_tags).to_json
end

get '/api/project/:project_id/tag/:tag_id' do
  @tag.includes(:note_tags, :task_tags, :wiki_tags).to_json
end

put '/api/project/:project_id/tag/:tag_id' do
  content_type :json
  JSON.parse(request.body.read).each { |p, v| @tag.send(p + "=", v) }
  @tag.save!
  @tag.to_json
end

post '/api/project/:project_id/tag' do
  content_type :json
  data = JSON.parse(request.body.read)
  t = @project.tags.create!(:name => data['name'])
  t.to_json
end

delete '/api/project/:project_id/tag/:tag_id' do
  Tag.destroy(@tag)
end




post '/api/project/:project_id/tasktag' do
  content_type :json
  data = JSON.parse(request.body.read)
  task = @project.tasks.find(data['task_id'])
  tag = @project.tags.find(data['tag_id'])
  tt = TaskTag.create!(:task => task, :tag => tag)
  tt.to_json
end


delete '/api/project/:project_id/tasktag/:tasktag_id' do
  tt = TaskTag.find(params[:tasktag_id])

  t = @project.tasks.find(tt.task_id)
  halt 404 unless t != nil

  TaskTag.destroy(tt)
end




post '/api/project/:project_id/notetag' do
  content_type :json
  data = JSON.parse(request.body.read)
  note = @project.notes.find(data['note_id'])
  tag = @project.tags.find(data['tag_id'])
  nt = NoteTag.create!(:note => note, :tag => tag)
  nt.to_json
end


delete '/api/project/:project_id/notetag/:notetag_id' do
  nt = NoteTag.find(params[:notetag_id])

  n = @project.notes.find(nt.note_id)
  halt 404 unless n != nil

  NoteTag.destroy(nt)
end







post '/api/project/:project_id/wikitag' do
  content_type :json
  data = JSON.parse(request.body.read)
  wiki = @project.wikis.find(data['wiki_id'])
  tag = @project.tags.find(data['tag_id'])
  wt = WikiTag.create!(:wiki => wiki, :tag => tag)
  wt.to_json
end


delete '/api/project/:project_id/wikitag/:wikitag_id' do
  wt = WikiTag.find(params[:wikitag_id])

  w = @project.wikis.find(wt.wiki_id)
  halt 404 unless w != nil

  WikiTag.destroy(wt)
end




post '/api/project/:project_id/wiki/:wiki_id/wikicontent' do
  content_type :json
  data = JSON.parse(request.body.read)
  wc = @wiki.wiki_contents.create!(:text => data['text'], :comment => data['comment'], :user => @user)
  @wiki.touch
  e = @project.events.create!(
      :user => @user,
      :type => 'wikis',
      :occurred_at => DateTime.now,
      :summary => "Wiki <span class='timeline-wiki'><a href='#project/#{params[:project_id]}/wikis/#{@wiki.id}'>" + @wiki.title + "</a></span> updated"
  );
  wc.to_json
end


get '/api/project/:project_id/wiki/:wiki_id/wikicontent' do
  # @wiki.wiki_contents.to_json
  q = WikiContent.where(
    :wiki_id => @wiki.id
  )
  .order('updated_at DESC')
  if not params[:offset].nil? or not params[:limit].nil?
    q = q.limit(params[:limit]).offset(params[:offset])
  end
  q.to_json
end


get '/api/project/:project_id/wiki/:wiki_id/wikicontent/:wc_id' do
  @wikicontent.to_json
end










post '/api/project/:project_id/wiki/:wiki_id/diff' do
  content_type :html
  wc1 = @wiki.wiki_contents.find(params[:ids][0])
  wc2 = @wiki.wiki_contents.find(params[:ids][1])

  Diffy::Diff.new(wc1.text, wc2.text).to_s(:html)
end




post '/api/preview' do
  content_type :html
  $markdown.render(params[:text])
end









post '/api/project/:project_id/taskdep' do
  content_type :json
  data = JSON.parse(request.body.read)
  task = @project.tasks.find(data['task_id'])
  dep = @project.tasks.find(data['dependency_id'])
  tdep = TaskDep.create!(:task => task, :dependency => dep)
  tdep.to_json
end


delete '/api/project/:project_id/taskdep/:taskdep_id' do
  tdep = TaskDep.find(params[:taskdep_id])

  t = @project.tasks.find(tdep.task_id)
  halt 404 unless t != nil

  TaskDep.destroy(tdep)
end








get '/api/project/:project_id/task' do
  content_type :json
  if params[:filter] != nil and defined? params[:filter][:completed]
    tasks = @project.tasks
      .where('completed = ?', params[:filter][:completed])
      .includes(:task_deps, :dep_tasks, :task_tags)

    task_ids = []
    tasks.each { |x| task_ids << x.id }

    # Load first order (fo) dependencies
    deps = @project.tasks
      .includes(:dep_tasks)
      .where('completed = ?', true)
      .where(TaskDep.arel_table[:task_id].in(task_ids))

    tasks_and_fo_deps = tasks | deps;
    tasks_and_fo_deps.to_json({ completed_no_inc: true })

      
  else
    @project.tasks.includes(:task_deps, :dep_tasks, :task_tags).to_json
  end
end

get '/api/project/:project_id/task_non_eager' do
  content_type :json
  @project.tasks.to_json
end


get '/api/project/:project_id/task/:task_id' do
  @task.to_json
end

post '/api/project/:project_id/task' do
  content_type :json
  data = JSON.parse(request.body.read)
  t = @project.tasks.create!(:summary => data['summary'])
  e = @project.events.create!(
      :user => @user,
      :type => 'tasks',
      :occurred_at => DateTime.now,
      :summary => "Task <span class='timeline-task'>" + t.summary + "</span> added"
  );
  t.to_json
end

put '/api/project/:project_id/task/:task_id' do
  content_type :json
  completed = @task.completed
  JSON.parse(request.body.read).each { |p, v| @task.send(p + "=", v) }
  @task.save!

  if @task.completed and not completed
    e = @project.events.create!(
        :user => @user,
        :type => 'tasks',
        :occurred_at => DateTime.now,
        :summary => "Task <span class='timeline-task'>" + @task.summary + "</span> completed"
    );
  elsif not @task.completed and completed
    e = @project.events.create!(
        :user => @user,
        :type => 'tasks',
        :occurred_at => DateTime.now,
        :summary => "Task <span class='timeline-task'>" + @task.summary + "</span> back in the game"
    );
  end

  @task.to_json
end

delete '/api/project/:project_id/task/:task_id' do
  e = @project.events.create!(
      :user => @user,
      :type => 'tasks',
      :occurred_at => DateTime.now,
      :summary => "Task <span class='timeline-task'>" + @task.summary + "</span> deleted"
  );

  Task.destroy(@task)
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
  { "errors" => ["Resource not found"] }.to_json
  status 404
end


error 403 do
  "Not authenticated"
end


not_found do
  "Resource not found"
end

