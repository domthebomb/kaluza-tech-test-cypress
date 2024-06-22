import {Given, When, Then} from '@badeball/cypress-cucumber-preprocessor';

Given('the TfL API is available', () => {
    cy.request('https://api.tfl.gov.uk/').then((response) => {
        expect(response.status).to.eq(200);
    });
});

Given('I want to travel from {string}', (travelFromLocation: string) => {
    Cypress.env("travelFromLocation", travelFromLocation);
});

Given('I want to travel to {string}', (travelToLocation: string) => {
    Cypress.env("travelToLocation", travelToLocation);
});

When('I plan my journey with preference {string}', (journeyPreference: string) => {
    const travelFromLocation = Cypress.env("travelFromLocation");
    const travelToLocation = Cypress.env("travelToLocation");

    // Capture the current time at the point of making the request so that i can use to validate later
    const requestTime = new Date();
    Cypress.env('requestTime', requestTime);

    const journeyUrl = `https://api.tfl.gov.uk/Journey/JourneyResults/${encodeURIComponent(travelFromLocation)}/to/${encodeURIComponent(travelToLocation)}?journeyPreference=${encodeURIComponent(journeyPreference)}`;

    cy.request(journeyUrl).then((response) => {
        expect(response.status).to.eq(300);
        const journeyResponse = response;

        const fromOptions = journeyResponse.body.fromLocationDisambiguation?.disambiguationOptions || [];
        const toOptions = journeyResponse.body.toLocationDisambiguation?.disambiguationOptions || [];

        // Find the best match based on matchQuality
        const bestFromOption = fromOptions.reduce((best, option) => option.matchQuality > best.matchQuality ? option : best, fromOptions[0]);
        const bestToOption = toOptions.reduce((best, option) => option.matchQuality > best.matchQuality ? option : best, toOptions[0]);

        // Extract common names
        const bestFromCommonName = bestFromOption.place?.commonName || 'Unknown';
        const bestToCommonName = bestToOption.place?.commonName || 'Unknown';

        // Log the best options and their common names
        cy.log('Best From Option:', JSON.stringify(bestFromOption, null, 2));
        cy.log('Best To Option:', JSON.stringify(bestToOption, null, 2));
        cy.log('Best From Common Name:', bestFromCommonName);
        cy.log('Best To Common Name:', bestToCommonName);

        // Store the journey preference for later validation
        Cypress.env('journeyPreference', journeyPreference);
        Cypress.env('bestFromCommonName', bestFromCommonName);
        Cypress.env('bestToCommonName', bestToCommonName);

        // Make the final request
        const finalJourneyUrl = `https://api.tfl.gov.uk/Journey/JourneyResults/${encodeURIComponent(bestFromCommonName)}/to/${encodeURIComponent(bestToCommonName)}?journeyPreference=${encodeURIComponent(journeyPreference)}`;
        return cy.request(finalJourneyUrl);
    }).then((response) => {
        expect(response.status).to.eq(200);
        const finalJourneyResponse = response;
        // Store the final journey response for the Then step
        Cypress.env('journeyResponse', finalJourneyResponse);
    });
});

Then('I should get a successful response', () => {
    const journeyResponse = Cypress.env('journeyResponse');
    const journeyPreference = Cypress.env('journeyPreference');
    const bestFromCommonName = Cypress.env('bestFromCommonName');
    const bestToCommonName = Cypress.env('bestToCommonName');
    const requestTime = Cypress.env('requestTime');


    cy.log('Journey Response:', JSON.stringify(journeyResponse, null, 2));

    expect(journeyResponse).to.exist;
    expect(journeyResponse.body).to.have.property('journeys');
    expect(journeyResponse.body.journeys).to.be.an('array').that.is.not.empty;

    // Validate journeyVector
    const journeyVector = journeyResponse.body.journeyVector;
    expect(journeyVector).to.have.property('from', bestFromCommonName);
    expect(journeyVector).to.have.property('to', bestToCommonName);
    expect(journeyVector.uri).to.include(`journeypreference=${encodeURIComponent(journeyPreference)}`);

    // Select and log the fastest journey
    const journeys = journeyResponse.body.journeys || [];
    const fastestJourney = journeys.reduce((fastest, journey) => journey.duration < fastest.duration ? journey : fastest, journeys[0]);

    cy.log('Fastest Journey:', JSON.stringify(fastestJourney, null, 2));

    // Validate the structure of the fastest journey
    expect(fastestJourney).to.have.property('startDateTime');
    expect(fastestJourney).to.have.property('duration').that.is.a('number').and.is.greaterThan(0);
    expect(fastestJourney).to.have.property('legs').that.is.an('array').that.is.not.empty;

    // Validate each leg in the fastest journey
    fastestJourney.legs.forEach((leg) => {
        expect(leg).to.have.property('duration').that.is.a('number').and.is.greaterThan(0);
        expect(leg).to.have.property('instruction').that.is.an('object');
        expect(leg.instruction).to.have.property('summary').that.is.a('string');
        expect(leg.instruction).to.have.property('detailed').that.is.a('string');
    });

    // Validate dynamic data with tolerance (e.g., time within a reasonable range)
    const toleranceMinutes = 1; // Tolerance of 1 minutes
    const journeyStartTime = new Date(fastestJourney.startDateTime);
    const toleranceTime = new Date(requestTime.getTime() - toleranceMinutes * 60000);
    expect(journeyStartTime).to.be.greaterThan(toleranceTime);

    // Log the final journey response
    console.log('Final Journey Response:', JSON.stringify(journeyResponse.body, null, 2));
});
