import {Given, When, Then} from '@badeball/cypress-cucumber-preprocessor'


Given('the TfL API is available', () => {
    cy.request('https://api.tfl.gov.uk/').then((response) => {
        expect(response.status).to.eq(200);
    });
});


When('I plan my journey', () => {
    cy.request('https://api.tfl.gov.uk/Journey/JourneyResults/69 Notting Hill Gate/to/the Southbank Centre').then((response) => {
        // expect(response.status).to.eq(200);
        // // Example assertions on the response body
        // expect(response.body).to.have.property('property_name');
        // expect(response.body.property_name).to.equal(expected_value);
    });
});