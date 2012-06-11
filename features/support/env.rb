ENV['RACK_ENV'] = 'test'

require 'capybara'
require 'capybara/cucumber'
require 'rspec'
#require 'rspec/expectations'
require 'json_spec/cucumber'

app_file = File.join(File.dirname(__FILE__), *%w[.. .. dlt.rb])
require app_file
#Sinatra::Application.app_file = app_file


Capybara.app = Sinatra::Application


class DltWorld
  include Capybara::DSL
  include JsonSpec::Helpers
  include RSpec::Expectations
  #include RSpec::Matchers
  def last_json
    page.source
  end
end

World do
  env = ENV['RACK_ENV'] || 'test'
  dbconfig = YAML::load(File.open('config/database.yml'))
  ActiveRecord::Base.establish_connection(dbconfig[env])
  ActiveRecord::Base.logger = Logger.new(File.open('database.rakefile.log', 'w'))

  DltWorld.new
end

