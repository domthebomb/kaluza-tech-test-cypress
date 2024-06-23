Feature: TfL Journey Planner API

  Background:
    Given the TfL API is available

  # Requirement A:
  # Its the day of the Kaluza annual conference being held at the Southbank Centre in London
  # but you're at the office in 69 Notting Hill Gate in London. Plan the quickest journey
  # between the two

  # Assumptions/observations;
  # I have observed that this will have different results depending on when a journey has been planned this will mean,
  # that i wont be able to assert the journey its self but i can assert Status Code,Response Structure,Journey Properties,Leg Properties
  @smoke
  Scenario: I want to plan a journey from  69 Notting Hill Gate to Southbank Centre that takes the least time
    Given I want to travel from "69 Notting Hill Gate"
    And I want to travel to "the Southbank Centre"
    When I plan my journey with parameters
      | URL parameter     | value     |
      | journeyPreference | leasttime |
    Then I should get a successful response

  # Requirement B
  #You're at the office in 69 Notting Hill Gate London but need to get to the Bristol office that is around the corner
  # from Bristol Temple Meads train station. Plan your journey from the london office to the train station in bristol
  @regression
  Scenario: I want to plan a journey from  69 Notting Hill Gate to Bristol Temple Meads
    Given I want to travel from "69 Notting Hill Gate"
    And I want to travel to "Bristol Temple Meads"
    When I plan my journey
    Then I should get a successful response

  #  Our Belfast based Lead qa is traveling to london for a day of meetings. He's arriving into Luton Airport next wednesday
  #  for meetings and needs to arrive at the office by 8.50am. Plan a journey with the latest time he can leave luton airport
  #  to arrive at the office by 8.50am

  # if i took this literally there is a defect because TFL endpoint cannot handle the request of luton airport it gives the wrong results ie Newham [West Ham], Lufthansa, London City Airport
  # I dont know alot about the TFL API but i would assume that the endpoint is not able to handle the request of luton airport because its not in london? it seems to work when i pass the exact address
  # take a look at my screen shots for this root/bug-screenshots
  # okay im fairly certain that this is out of scope for TFL API i tried my address in Birmingham and it didnt have a clue either yay for black box testing :P
  #match quality is not a reliable indicator of the quality of the search results i got 649 when its wrong
  @regression
  Scenario: I want to plan a journey from Luton Airport next Wednesday to the office at 69 Notting Hill Gate I need to arrive to the office by no later than 8.50am and i want to leave luton airport at the latest time possible
  # Note: This test is expected to pass as the TfL API cannot accurately handle requests for journeys from Luton Airport
    Given I want to travel from "Luton Airport"
    And I want to travel to "69 Notting Hill Gate"
    When I plan my journey with parameters
      | URL parameter | value          |
      | timels        | Arriving       |
      | time          | 08:50          |
      | date          | next Wednesday |
    Then the match should be incorrect



    # if i had more time and not other work obligations i would have liked to have done the following
 # 1. I would have liked to have made it so that these test could be run in parallel
  #2. I would have experimented more the the journey parameters in the TFL API
# 3. i hated using the actual parameters keys in the cucumber again i would map these to keep them readable
  # i would of liked to have broken these into even more behaviours
  # more type safty in the step definitions
  # moved the helper methods out of step defs and into there own area



