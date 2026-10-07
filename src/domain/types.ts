export type CheckInData = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  flightNumber: string;
  bookingCode: string;
  departureDate: string;
  passportLastFour: string;
};

export type BookingData = CheckInData & { shortName: string };

export type CheckInStep = "passenger" | "flight" | "document";
export type CheckInErrors = Partial<Record<keyof CheckInData, string>>;
export type GlobePosition = readonly [longitude: number, latitude: number];

export type CheckInStepConfig = {
  id: CheckInStep;
  label: string;
  title: string;
  description: string;
};
