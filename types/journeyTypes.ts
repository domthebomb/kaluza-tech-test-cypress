export type Instruction = {
    summary: string;
    detailed: string;
};

export type Leg = {
    duration: number;
    instruction: Instruction;
    departureTime: string;
    arrivalTime: string;
    isDisrupted: boolean;
    hasFixedLocations: boolean;
};

export type LineStatus = {
    statusSeverity: number;
    statusSeverityDescription: string;
};

export type ServiceType = {
    name: string;
    uri: string;
};

export type Crowding = {};

export type JourneyOption = {
    duration: number;
};

export type FastestJourney = JourneyOption;

export type Journey = {
    startDateTime: string;
    duration: number;
    legs: Leg[];
    lineStatuses: LineStatus[];
    serviceTypes: ServiceType[];
    crowding: Crowding;
    journeyOption: JourneyOption;
    fastestJourney: FastestJourney;
};