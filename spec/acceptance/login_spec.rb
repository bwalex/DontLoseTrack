require 'acceptance_helper'


feature "Login", %q{
  In order to be able to access the API, users need
  to be able to login.
} do
  background do
    create(:user, :email => "test@test.com", :new_password => "moo")
  end

  scenario "Access API resource without logging in" do
    get '/api/user'
    last_response.body.should have_content "Not authenticated"
  end

  scenario "Try logging in with incorrect password" do
    post '/login', { :username => "test@test.com", :password => "foo" }
    last_response.body.should have_content "Invalid username or password"
  end

  scenario "Try logging in with incorrect username" do
    post '/login', { :username => "foobar", :password => "moo" }
    last_response.body.should have_content "Invalid username or password"
  end

  scenario "Try logging in with empty username, password" do
    post '/login', { :username => "", :password => "" }
    last_response.body.should have_content "Invalid username or password"
  end

  scenario "Access API resource after logging in correctly" do
    post '/login', { :username => "test@test.com", :password => "moo" }
    get '/api/user'
    last_response.body.should_not have_content "Not authenticated"
    last_response.body.should have_json_path("id")
    last_response.body.should be_json_eql(%("test@test.com")).at_path("email")
  end
end
