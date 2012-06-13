ENV['RACK_ENV'] = 'test'

require 'capybara'
require 'capybara/cucumber'
require 'capybara/webkit'
require 'rspec'
#require 'rspec/expectations'
require 'json_spec/cucumber'

require 'factory_girl'

require 'database_cleaner'
require 'database_cleaner/cucumber'

#Dir["../../spec/factories/*.rb"].each {|file| require_relative file }



app_file = File.join(File.dirname(__FILE__), *%w[.. .. dlt.rb])
require app_file
#Sinatra::Application.app_file = app_file

DatabaseCleaner.strategy = :truncation

Capybara.register_driver :webkit do |app|
  Capybara::Driver::Webkit.new(app, :stdout => nil)
end

Capybara.app = Sinatra::Application
Capybara.default_driver = :rack_test
Capybara.javascript_driver = :webkit
Capybara.default_wait_time = 10

class Capybara::Node::Element # < Capybara::Node::Base
  def get_computed_style(name)
    wait_until { base.get_computed_style(name) }
  end

  def dblclick
    wait_until { base.dblclick }
  end
end


class DltWorld
  include Capybara::DSL
  include JsonSpec::Helpers
  include RSpec::Expectations
  #include RSpec::Matchers

  def last_json
    page.source
  end

  def wait_for_ajax(timeout = Capybara.default_wait_time)
    page.wait_until(timeout) do
      page.evaluate_script 'jQuery.active == 0'
    end
  end
end

env = ENV['RACK_ENV'] || 'test'
dbconfig = YAML::load(File.open('config/database.yml'))
ActiveRecord::Base.establish_connection(dbconfig[env])
ActiveRecord::Base.logger = Logger.new(File.open('database.rakefile.log', 'w'))


World do
  DltWorld.new
end


Before do
  DatabaseCleaner.start
end

After do |scenario|
  DatabaseCleaner.clean
end


Dir[File.join(File.dirname(__FILE__), "../../spec/factories/*.rb")].each { |file| puts "Loading Factory file: #{file}"; require_relative file }

require 'factory_girl/step_definitions'


Transform /^table:(?:.*,)?users(?:,.*)?$/ do |table|
  table.map_column!("users") do |users|
    user_objs = users.split(',').map {|user| user.strip }
    User.where(:alias => user_objs)
  end
  table
end

Transform /^table:(?:.*,)?tags(?:,.*)?$/ do |table|
  table.map_column!("tags") do |tags|
    tag_objs = tags.split(',').map {|tag| tag.strip }
    Tag.where(:name => tag_objs)
  end
  table
end
