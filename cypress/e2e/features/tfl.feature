Feature: User API

  Background:
    Given the TfL API is available

  Scenario: I want to plan a journey from  69 Notting Hill Gate to Southbank Centre
    Given I that I want to travel from "69 Notting Hill Gate"
    And I want to travel to "the Southbank Centre"
    When I plan my journey
    Then I want to find the quickest journey between the two


