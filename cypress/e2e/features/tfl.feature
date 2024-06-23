Feature: TfL Journey Planner API

  Background:
    Given the TfL API is available
    And I want to travel from "69 Notting Hill Gate"

  # Requirement A:
  # Its the day of the Kaluza annual conference being held at the Southbank Centre in London
  # but you're at the office in 69 Notting Hill Gate in London. Plan the quickest journey
  # between the two

  # Assumptions/observations;
  # I have observed that this will have different results depending on when a journey has been planned this will mean,
  # that i wont be able to assert the journey its self but i can assert Status Code,Response Structure,Journey Properties,Leg Properties
  Scenario: I want to plan a journey from  69 Notting Hill Gate to Southbank Centre that takes the least time
    Given I want to travel to "the Southbank Centre"
    When I plan my journey with preference "leasttime"
    Then I should get a successful response

  # Requirement B
  #You're at the office in 69 Notting Hill Gate London but need to get to the Bristol office that is around the corner
  # from Bristol Temple Meads train station. Plan your journey from the london office to the train station in bristol
  Scenario: I want to plan a journey from  69 Notting Hill Gate to Bristol Temple Meads
    Given I want to travel to "Bristol Temple Meads"
    When I plan my journey
    Then I should get a successful response


