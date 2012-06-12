require 'acceptance_helper'


feature "Login", %q{
  In order to be able to access the API, users need
  to be able to login.
} do
  background do
  end

  scenario "Login with invalid credentials" do
    visit '/api/user'
    page.should have_content "Not authenticated"
  end
  scenario "Login with invalid credentials", :js => true do
    visit '/api/user'
    page.should have_content "Not authenticated"
  end
end
