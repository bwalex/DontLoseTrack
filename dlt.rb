require 'rubygems'
require 'sinatra'

#require 'active_support'
#require 'active_support/json'
require 'json'
require 'haml'
require 'db.rb'



get '/' do
  haml :main, :format => :html5
end


get '/project' do
  #:limit =>, :offset =>
  Project.get(params[:project_id]).to_json
end


get '/tasks' do
  Task.all(:project_id => params[:project_id]).to_json(:relationships => {:tags => {:include => [:color, :name] }})
end


get '/notes' do
  Note.all(:project_id => params[:project_id]).to_json(:relationships => {:tags => {:include => [:color, :name] }})

end

post '/note_add' do
  p = Project.get(params[:project_id])
  n = p.notes.create(:text => params[:note_text])
  if n.valid?
    n.to_json
  else
    j = dm_errors_to_array(n)
    j.to_json
  end
end


get '/projects' do
  Project.all.to_json
end


get '/db_populate' do
  DataMapper.auto_migrate!
  p = Project.create(:name => 'mrf24j40-driver', :github_repo => 'bwalex/mrf24j40-driver')

  p.notes.create(:text => 'Last time I tried to debug some SPI issue with some italian guy')
  n = p.notes.create(:text => 'Next time I need to revise the initial PCB layout')
  n.tags.create(:color => '#0000ff', :name => 'Tag2')

  t = p.tasks.create(:summary => 'Take garbage out')
  t.tags.create(:color => '#ff0000', :name => 'Rubbish')
  p.tasks.create(:summary => 'Pick up parcels', :importance => 3)
  p.tasks.create(:summary => 'Finish this web app', :importance => 2)


  p = Project.create(:name => 'tc-play', :github_repo => 'bwalex/tc-play')

  p = Project.create(:name => 'sniff802154')
  if p.valid?
    redirect '/'
  else
    j = dm_errors_to_array(p)
    j.to_json
  end
end


not_found do
  "This is not the web page you are looking for."
end

