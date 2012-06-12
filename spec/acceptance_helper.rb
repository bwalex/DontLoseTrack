require 'spec_helper'

require 'capybara'
require 'capybara/rspec'
require 'capybara/dsl'
require 'capybara/webkit'
require 'json_spec'
require 'factory_girl'
require 'database_cleaner'

Capybara.app = Sinatra::Application
Capybara.default_driver = :rack_test
Capybara.javascript_driver = :webkit


Dir[File.join(File.dirname(__FILE__), "../spec/factories/*.rb")].each { |file| require_relative file }


RSpec.configure do |config|
  config.include JsonSpec::Helpers
  config.include FactoryGirl::Syntax::Methods

  config.before :suite do
    DatabaseCleaner.clean_with :truncation
  end

  config.before :each do
    if Capybara.current_driver == :rack_test
      DatabaseCleaner.strategy = :transaction
    else
      DatabaseCleaner.strategy = :truncation
    end

    DatabaseCleaner.start
  end

  config.after :each do
    DatabaseCleaner.clean
  end
end

def wait_for_ajax(timeout = Capybara.default_wait_time)
  page.wait_until(timeout) do
    page.evaluate_script 'jQuery.active == 0'
  end
end
