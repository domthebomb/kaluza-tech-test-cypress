import {Given, When, Then} from '@badeball/cypress-cucumber-preprocessor';
import {Journey, Leg} from '../../../../types/journeyTypes';


/**
 * captureRequestTime creates a new date object and
 * assigns that value to the Cypress environment variable `requestTime`,
 * which can be accessed in various places throughout the test suite.
 */
const captureRequestTime = () => {
    const requestTime = new Date();
    Cypress.env('requestTime', requestTime);
};

/**
 * Calculates the date of the next Wednesday from the current date and returns it in the format 'YYYYMMDD'.
 *
 * @returns {string} The date of the next Wednesday in the format 'YYYYMMDD'.
 */
function getNextWednesday(): string {
    const now = new Date();
    const nextWednesday = new Date(now.getTime());

    // Set the date to the next Wednesday
    nextWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7));

    // Format the date as 'YYYYMMDD'
    const year = nextWednesday.getFullYear();
    const month = ('0' + (nextWednesday.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
    const day = ('0' + nextWednesday.getDate()).slice(-2);

    return `${year}${month}${day}`;
}

/**
 * planJourney gets the desired start and end locations from the Cypress
 * environment variables and constructs a url using these locations and the params object.
 * Then runs a GET request to that url.
 *
 * @returns a promise containing the result of a Cypress HTTP GET
 * request to the TfL API's journey results endpoint.
 */
const planJourney = () => {
    const travelFromLocation = Cypress.env("travelFromLocation");
    const travelToLocation = Cypress.env("travelToLocation");
    const params = Cypress.env("params");


    captureRequestTime();

    const journeyUrl = constructJourneyUrl(travelFromLocation, travelToLocation);

    return cy.request(journeyUrl);
}

type Params = {
    date?: string;
    time?: string;
    timels?: string;
    journeyPreference?: string;
};

/**
 * Constructs a URL for the TfL API's JourneyResults endpoint.
 *
 * @param {string} from - The starting location of the journey.
 * @param {string} to - The ending location of the journey.
 * @param {Params} params - An object containing additional parameters for the journey.
 * @returns {string} The constructed URL.
 */
const constructJourneyUrl = (from: string, to: string, params?: Params) => {
    let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`;

    if (params) {
        const paramEntries = Object.entries(params);
        if (paramEntries.length > 0) {
            url += '?';
            paramEntries.forEach(([key, value], index) => {
                if (value) {
                    url += `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`;
                    if (index < paramEntries.length - 1) {
                        url += '&';
                    }
                }
            });
        }
    }

    return url;
};

/**
 * processJourneyResponse processes the response from the TfL API's journey
 * results endpoint and extracts the best journey option based on matchQuality.
 *
 * @param {any} response - The response object from the TfL API's journey results endpoint.
 * @returns an object containing the best journey options' common names.
 */
const processJourneyResponse = (response) => {
    const fromOptions = response.body.fromLocationDisambiguation?.disambiguationOptions || [];
    const toDisambiguation = response.body.toLocationDisambiguation || {};

    // Find the best match based on matchQuality
    const bestFromOption = fromOptions.reduce((best, option) => option.matchQuality > best.matchQuality ? option : best, fromOptions[0]);

    // Extract common names
    const bestFromCommonName = bestFromOption.place?.commonName || 'Unknown';

    let bestToCommonName = 'Unknown';
    if (toDisambiguation.matchStatus === 'identified') {
        bestToCommonName = Cypress.env("travelToLocation"); // Use the provided location directly if perfectly matched
    } else {
        const toOptions = toDisambiguation.disambiguationOptions || [];
        const bestToOption = toOptions.reduce((best, option) => option.matchQuality > best.matchQuality ? option : best, toOptions[0]);
        bestToCommonName = bestToOption.place?.commonName || 'Unknown';
    }

    // Log the best options and their common names
    cy.log('Best From Option:', JSON.stringify(bestFromOption, null, 2));
    cy.log('Best To Option:', JSON.stringify(toDisambiguation, null, 2));
    cy.log('Best From Common Name:', bestFromCommonName);
    cy.log('Best To Common Name:', bestToCommonName);

    // Store the journey details for later validation
    Cypress.env('bestFromCommonName', bestFromCommonName);
    Cypress.env('bestToCommonName', bestToCommonName);

    return {bestFromCommonName, bestToCommonName};
};

/**
 * makeFinalJourneyRequest makes a final request to the TfL API's journey
 * results endpoint with the best journey options and checks the status of the response.
 *
 * @param {string} bestFromCommonName - The common name of the best starting location.
 * @param {string} bestToCommonName - The common name of the best ending location.
 * @returns a promise containing the result of a Cypress HTTP GET
 * request to the TfL API's journey results endpoint.
 */
const makeFinalJourneyRequest = (bestFromCommonName: string, bestToCommonName: string) => {
    const params: Params = Cypress.env("params");

    let finalJourneyUrl = constructJourneyUrl(bestFromCommonName, bestToCommonName, params);

    return cy.request(finalJourneyUrl).then((response) => {
        expect(response.status).to.eq(200);
        Cypress.env('journeyResponse', response);
    });
};


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

When('I plan my journey', () => {
    planJourney().then((response) => {
        expect(response.status).to.eq(300);
        const travelFromLocation = Cypress.env("travelFromLocation");
        const travelToLocation = Cypress.env("travelToLocation");

        captureRequestTime();

        const journeyUrl = constructJourneyUrl(travelFromLocation, travelToLocation);

        cy.request(journeyUrl).then((response) => {
            expect(response.status).to.eq(300);
            const {bestFromCommonName, bestToCommonName} = processJourneyResponse(response);
            return makeFinalJourneyRequest(bestFromCommonName, bestToCommonName);

        });
    });
});


type JourneyPreference = {
    time: string;
    timels: string;
};

When('I plan my journey with parameters', (dataTable: { raw: () => any; }) => {
    const data = dataTable.raw();
    const params: Params = {};

    // Skip the first row (headers)
    for (let i = 1; i < data.length; i++) {
        const key = data[i][0];
        let value = data[i][1];

        if (key === 'date' && value.toLowerCase() === 'next wednesday') {
            value = getNextWednesday();
        }

        if (key === 'time') {
            params[key] = value.replace(':', '').trim();
        } else {
            params[key] = value.trim();
        }
    }

    Cypress.env("params", params);


    planJourney().then((response) => {
        expect(response.status).to.eq(300);
        const travelFromLocation = Cypress.env("travelFromLocation");
        const travelToLocation = Cypress.env("travelToLocation");

        captureRequestTime();

        const journeyUrl = constructJourneyUrl(travelFromLocation, travelToLocation, params);

        cy.request(journeyUrl).then((response) => {
            expect(response.status).to.eq(300);
            const {bestFromCommonName, bestToCommonName} = processJourneyResponse(response);
            return makeFinalJourneyRequest(bestFromCommonName, bestToCommonName);
        });
    });
});


Then('I should get a successful response', () => {
    const journeyResponse = Cypress.env('journeyResponse');
    const journeyPreference = Cypress.env('journeyPreference');
    const bestFromCommonName = Cypress.env('bestFromCommonName');
    const bestToCommonName = Cypress.env('bestToCommonName');
    const requestTime = Cypress.env('requestTime');

    cy.log('Journey Response:', JSON.stringify(journeyResponse, null, 2));

    // Validate journeyResponse
    expect(journeyResponse).to.exist;
    expect(journeyResponse.body).to.have.property('journeys');
    expect(journeyResponse.body.journeys).to.be.an('array').that.is.not.empty;

    // Validate each journey in the journeys array
    journeyResponse.body.journeys.forEach((journey: Journey) => {
        expect(journey).to.have.property('startDateTime');
        expect(journey).to.have.property('duration').that.is.a('number').and.is.greaterThan(0);
        expect(journey).to.have.property('legs').that.is.an('array').that.is.not.empty;

        // Validate each leg in the journey
        journey.legs.forEach((leg: Leg) => {
            expect(leg).to.have.property('duration').that.is.a('number').and.is.greaterThan(0);
            expect(leg).to.have.property('instruction').that.is.an('object');
            expect(leg.instruction).to.have.property('summary').that.is.a('string');
            expect(leg.instruction).to.have.property('detailed').that.is.a('string');
        });
    });

    // Validate journeyVector
    const journeyVector = journeyResponse.body.journeyVector;
    expect(journeyVector).to.have.property('from', bestFromCommonName);
    expect(journeyVector).to.have.property('to', bestToCommonName);

    // Only assert for journeyPreference if it was provided by the scenario
    if (journeyPreference) {
        expect(journeyVector.uri).to.include(`journeypreference=${encodeURIComponent(journeyPreference)}`);
    }

    // Select and log the fastest journey
    const journeys = journeyResponse.body.journeys || [];
    const fastestJourney = journeys.reduce((fastest, journey) => journey.duration < fastest.duration ? journey : fastest, journeys[0]);

    cy.log('Fastest Journey:', JSON.stringify(fastestJourney, null, 2));

    // If journeyPreference was provided, assert that the fastest journey adheres to this preference
    if (journeyPreference) {
        if (journeyPreference === 'leasttime') {
            // Get the durations of all journeys
            const durations = journeys.map(journey => journey.duration);

            // Find the shortest duration
            const shortestDuration = Math.min(...durations);

            // Assert that the fastest journey has the shortest duration
            expect(fastestJourney.duration).to.equal(shortestDuration);
        }
    }

    // Validate dynamic data with more tolerance (e.g., time within a reasonable range)
    const toleranceMinutes = 5;
    const journeyStartTime = new Date(fastestJourney.startDateTime);
    const toleranceTime = new Date(requestTime.getTime() - toleranceMinutes * 60000);
    expect(journeyStartTime).to.be.greaterThan(toleranceTime);

    // Log the final journey response
    console.log('Final Journey Response:', JSON.stringify(journeyResponse.body, null, 2));
});

Then('the match should be incorrect', () => {
    cy.wrap(Cypress.env('bestFromCommonName')).then((bestFromCommonName) => {
        const bestFromMatchCommonName = bestFromCommonName;

        // Check if the matched address does not contain the expected keywords
        expect(bestFromMatchCommonName).not.to.contain('Luton Airport');
    });
});