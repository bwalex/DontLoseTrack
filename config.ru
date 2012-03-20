require 'sinatra'

set :env,  :production
disable :run

require './dlt.rb'

run Sinatra::Application
