require 'spec_helper'

require 'capybara'
require 'capybara/rspec'
require 'capybara/dsl'
require 'json_spec'

Capybara.app = Sinatra::Application

RSpec.configure do |config|
  config.include JsonSpec::Helpers
end
