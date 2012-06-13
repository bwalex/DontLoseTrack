Feature: Create Projects
  In order for Don't Lose Track to be useful,
  users need to be able to create projects.

  Background:
    Given the following user exists:
    | email          | alias     | name      | new_password |
    | test@dlt.io    | testuser2 | Test User | moo          |
    And  I log in using "test@dlt.io" and password "moo"


  @javascript
    Scenario: Create Project
    When I fill in "newprojectname" with "Test Project" and press Enter
    And  I wait for AJAX to load
    Then I should see "testuser2/Test Project" within ".ProjectLinkView"
