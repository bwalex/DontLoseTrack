Feature: Create and Edit tags
  In order for Don't Lose Track to be useful,
  users need to be able to create tags

  Background:
    Given the following user exists:
    | email          | alias     | name      | new_password |
    | test@dlt.io    | testuser3 | Test User | moo          |
    And the following project exists:
    | name           | owner             | users            |
    | Test Project 2 | alias: testuser3  | testuser3        |
    And  I log in using "test@dlt.io" and password "moo"
    And  I am on the home page
    And  I follow "testuser3/Test Project 2"


  @javascript
    Scenario: Create Tag
    When I fill in "newtagname" with "Sample Tag 1" and press Enter
    And  I wait for AJAX to load
    Then I should see "Sample Tag 1" within ".tagView"

  @javascript
    Scenario: Create and edit Tag
    When I fill in "newtagname" with "Sample Tag 1" and press Enter
    And  I wait for AJAX to load
    And  I follow "Edit Tag" within ".tag"
    And  I fill in xpath ".magic-tag-text > input" with "Cool Tag" within ".tag-edit" and press Enter
    And  I wait for AJAX to load
    Then I should see "Cool Tag" within ".tagView"
