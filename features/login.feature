Feature: Login
  In order to be able to access Don't Lose Track
  users need to be able to login.
	
  Background:
    Given the following user exists:
    | email          | alias | name      | new_password |
    | test@dlt.io    | test1 | Test User | moo          |
    And  I go to logout
    And  I am on the home page

  Scenario: Incorrect Password
    When I fill in "Email" with "test@dlt.io"
    And  I fill in "Password" with "incorrect"
    And  I press "Login" within ".login"
    Then I should see "Invalid username or password"


  Scenario: Incorrect username
    When I fill in "Email" with "incorrect"
    And  I fill in "Password" with "moo"
    And  I press "Login" within ".login"
    Then I should see "Invalid username or password"


  @javascript
  Scenario: Correct login
    When I fill in "Email" with "test@dlt.io"
    And  I fill in "Password" with "moo"
    And  I press "Login" within ".login"
    And  I wait for AJAX to load
    Then I should see "Test User"
    And  I should see "Logout"
