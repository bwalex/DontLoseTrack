ENV['RACK_ENV'] = 'test'

require 'rspec'
require 'rack/test'
require 'factory_girl'

app_file = File.join(File.dirname(__FILE__), *%w[.. dlt.rb])
require app_file

set :environment, :test

env = ENV['RACK_ENV'] || 'test'
dbconfig = YAML::load(File.open('config/database.yml'))
ActiveRecord::Base.establish_connection(dbconfig[env])
ActiveRecord::Base.logger = Logger.new(File.open('database.rakefile.log', 'w'))


RSpec.configure do |conf|
  conf.include Rack::Test::Methods
  #conf.include FactoryGirl::Syntax::Methods
end

def app
  Sinatra::Application
end
