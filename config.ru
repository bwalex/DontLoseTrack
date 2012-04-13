require 'sinatra'

set :env,  :production
disable :run

require './dlt.rb'

use ActiveRecord::SessionStore

run Sinatra::Application
