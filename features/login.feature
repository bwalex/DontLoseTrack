Feature: Login
  In order to be able to access the API
  users need to be able to login.
	
  Background:
    Given the user "foobar" with password "moo" exists
    And  I am logged out

  Scenario: Un-authenticated API accesses
    When I go to /api/user
    Then I should see "Not authenticated"

    When I go to /api/project
    Then I should see "Not authenticated"

    When I go to /api/project/1
    Then I should see "Not authenticated"
