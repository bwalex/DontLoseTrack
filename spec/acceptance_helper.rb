require 'spec_helper'

require 'capybara'
require 'capybara/rspec'
require 'capybara/dsl'
require 'capybara/webkit'
require 'json_spec'

Capybara.app = Sinatra::Application
Capybara.default_driver = :rack_test
Capybara.javascript_driver = :webkit


RSpec.configure do |config|
  config.include JsonSpec::Helpers
end
