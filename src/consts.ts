import type {
  BookingData,
  CheckInData,
  CheckInStep,
  CheckInStepConfig,
  GlobePosition,
} from "./domain/types";

/** The single booking accepted by this local mini-game. */
export const EXPECTED_BOOKING = {
  lastName: "Васильев",
  firstName: "Александр",
  shortName: "Саша",
  middleName: "Олегович",
  birthDate: "1991-12-19",
  flightNumber: "AVA 303",
  bookingCode: "VB3393",
  departureDate: "2026-10-08",
  passportLastFour: "8436",
} as const satisfies BookingData;

export const FLIGHT = {
  originCode: "LED",
  destinationCode: "HND",
  originCity: "Санкт-Петербург",
  destinationCity: "Токио · Ханэда",
  departureTime: "10:40",
  arrivalTime: "12:10",
  duration: "1 ч 39 мин",
  gate: "34**",
  seat: "74A",
  terminal: "B",
  boardingTime: "10:10",
  airline: "AVA security check",
  motto: "AVA MARIA, AVA VICTORIA",
  displayDestination: "в счастье епт",
} as const;

export const GLOBE_ROUTE = {
  originCode: "LED",
  originCity: "Санкт-Петербург",
  destinationCode: "HND",
  destinationCity: "Токио · Ханэда",
  originLongitude: 30.262,
  originLatitude: 39.74,
  destinationLongitude: 139.78,
  destinationLatitude: 35.55,
} as const;

export const INITIAL_CHECK_IN_DATA: CheckInData = {
  lastName: "",
  firstName: "",
  middleName: "",
  birthDate: "",
  flightNumber: "",
  bookingCode: "",
  departureDate: "",
  passportLastFour: "",
};

export const STEP_FIELDS = {
  passenger: ["lastName", "firstName", "middleName", "birthDate"],
  flight: ["flightNumber", "bookingCode", "departureDate"],
  document: ["passportLastFour"],
} as const satisfies Record<CheckInStep, readonly (keyof CheckInData)[]>;

export const STEPS = [
  {
    id: "passenger",
    label: "Пассажир",
    title: "Давайте знакомиться.",
    description: "Введите данные пассажира, как в маршрутной квитанции.",
  },
  {
    id: "flight",
    label: "Рейс",
    title: "Найдём ваш рейс.",
    description: "Номер рейса и код брони — ваш ключ к путешествию.",
  },
  {
    id: "document",
    label: "Документ",
    title: "Последняя проверка.",
    description: "Подтвердите документ. До посадочного талона — один шаг.",
  },
] as const satisfies readonly CheckInStepConfig[];

export const REQUIRED_ERRORS: Record<keyof CheckInData, string> = {
  lastName: "Введите фамилию",
  firstName: "Введите имя",
  middleName: "Введите отчество",
  birthDate: "Укажите дату рождения",
  flightNumber: "Введите номер рейса",
  bookingCode: "Введите код брони",
  departureDate: "Укажите дату вылета",
  passportLastFour: "Введите последние 4 цифры паспорта",
};

export const MISMATCH_ERROR = "Данные не совпадают с квитанцией";

export const BAR_WIDTHS = [
  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 3, 1,
  2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4,
] as const;

// The tear bends around the GATE field, keeping its number on the left.
export const LEFT_TEAR =
  "polygon(0 0, 50% 0, 49.3% 7%, 50.8% 15%, 49.1% 23%, 50.3% 32%, 48.9% 41%, 50.6% 48%, 51.9% 57%, 52.8% 64%, 52% 72%, 49.2% 79%, 50.8% 87%, 49.4% 94%, 50% 100%, 0 100%)";
export const RIGHT_TEAR =
  "polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 49.4% 94%, 50.8% 87%, 49.2% 79%, 52% 72%, 52.8% 64%, 51.9% 57%, 50.6% 48%, 48.9% 41%, 50.3% 32%, 49.1% 23%, 50.8% 15%, 49.3% 7%)";

export const ASSETS = {
  prayingFigure: "pray_man.jpg",
  securityPortrait: "security.jpg",
  ticket: "ticket.jpg",
  ticketDownload: "ticket_clue.jpg",
  downloadJoke: "why.webp",
} as const;

export const DOWNLOAD_JOKE_TEXT =
  "А нахуя ты скачиваешь, если он перед тобой лежит?";
export const TOUCH_QUERY = "(pointer: coarse) and (hover: none)";
export const PHONE_USER_AGENT_PATTERN =
  /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|BB10/i;
export const PHONE_SCREEN_MAX_EDGE = 640;
export const GLOBE_LOAD_DELAY_MS = 200;
export const SECURITY_TIMELINE = { tearMs: 1050, gateMs: 2050 } as const;

export const GLOBE_RADIUS = 1.22;
export const INITIAL_ROTATION = { x: 0.58, y: -85 * (Math.PI / 180) };
export const PETERSBURG: GlobePosition = [
  GLOBE_ROUTE.originLongitude,
  GLOBE_ROUTE.originLatitude,
];
export const HANEDA: GlobePosition = [
  GLOBE_ROUTE.destinationLongitude,
  GLOBE_ROUTE.destinationLatitude,
];
export const ROUTE_SEGMENTS = 96;
export const ROUTE_RADIAL_SEGMENTS = 6;
export const ROUTE_DURATION = 2.8;

// Simplified coastlines drawn locally: the illustration needs no model or texture requests.
export const CONTINENTS: readonly (readonly GlobePosition[])[] = [
  [
    [-168, 71],
    [-150, 70],
    [-140, 60],
    [-131, 56],
    [-124, 48],
    [-124, 40],
    [-117, 31],
    [-108, 29],
    [-102, 23],
    [-97, 16],
    [-87, 15],
    [-83, 9],
    [-78, 9],
    [-81, 18],
    [-87, 21],
    [-90, 28],
    [-82, 25],
    [-80, 32],
    [-75, 36],
    [-67, 45],
    [-60, 46],
    [-56, 53],
    [-63, 60],
    [-76, 63],
    [-82, 69],
    [-95, 72],
    [-113, 74],
    [-134, 70],
  ],
  [
    [-52, 60],
    [-42, 61],
    [-25, 72],
    [-21, 80],
    [-37, 84],
    [-54, 80],
    [-62, 71],
  ],
  [
    [-80, 10],
    [-72, 12],
    [-62, 10],
    [-55, 5],
    [-48, -1],
    [-35, -6],
    [-38, -16],
    [-43, -23],
    [-51, -30],
    [-54, -38],
    [-66, -55],
    [-73, -52],
    [-75, -39],
    [-71, -29],
    [-75, -18],
    [-81, -5],
  ],
  [
    [-17, 34],
    [-6, 36],
    [9, 37],
    [22, 32],
    [33, 31],
    [35, 23],
    [43, 12],
    [51, 11],
    [44, 0],
    [40, -11],
    [33, -20],
    [28, -32],
    [18, -35],
    [11, -26],
    [13, -15],
    [8, -3],
    [-2, 5],
    [-12, 7],
    [-17, 15],
  ],
  [
    [-10, 36],
    [-9, 43],
    [-2, 44],
    [-5, 49],
    [4, 52],
    [8, 55],
    [8, 58],
    [4, 62],
    [14, 70],
    [27, 71],
    [34, 69],
    [44, 68],
    [58, 69],
    [71, 73],
    [93, 76],
    [112, 73],
    [128, 73],
    [145, 69],
    [165, 65],
    [178, 66],
    [180, 60],
    [169, 59],
    [161, 54],
    [156, 50],
    [146, 46],
    [141, 39],
    [129, 35],
    [123, 29],
    [121, 23],
    [113, 20],
    [108, 13],
    [104, 9],
    [101, 3],
    [98, 8],
    [95, 17],
    [91, 22],
    [87, 21],
    [80, 7],
    [77, 10],
    [72, 21],
    [67, 25],
    [59, 25],
    [57, 22],
    [51, 16],
    [44, 13],
    [40, 20],
    [36, 30],
    [29, 36],
    [23, 39],
    [22, 36],
    [16, 40],
    [13, 45],
    [7, 43],
    [3, 42],
  ],
  [
    [-8, 50],
    [-5, 50],
    [1, 52],
    [-2, 58],
    [-5, 59],
    [-7, 55],
  ],
  [
    [-11, 51],
    [-6, 51],
    [-6, 55],
    [-9, 56],
  ],
  [
    [-24, 64],
    [-14, 64],
    [-13, 66],
    [-19, 67],
  ],
  [
    [43, -12],
    [50, -14],
    [49, -23],
    [45, -26],
    [43, -20],
  ],
  [
    [130, 32],
    [134, 34],
    [137, 36],
    [141, 39],
    [142, 43],
    [145, 44],
    [143, 39],
    [139, 35],
    [135, 33],
  ],
  [
    [121, 25],
    [122, 22],
    [120, 21],
    [120, 24],
  ],
  [
    [120, 18],
    [123, 17],
    [126, 9],
    [123, 6],
    [121, 11],
  ],
  [
    [96, 5],
    [102, 1],
    [106, -6],
    [103, -6],
    [99, -2],
  ],
  [
    [109, 7],
    [119, 6],
    [118, -4],
    [112, -4],
    [109, 1],
  ],
  [
    [105, -6],
    [114, -7],
    [115, -9],
    [108, -8],
  ],
  [
    [131, -2],
    [142, -3],
    [150, -7],
    [143, -10],
    [135, -7],
  ],
  [
    [113, -22],
    [115, -16],
    [124, -13],
    [130, -12],
    [138, -15],
    [143, -11],
    [146, -18],
    [153, -26],
    [151, -34],
    [145, -39],
    [137, -35],
    [130, -32],
    [122, -34],
    [115, -29],
  ],
  [
    [166, -34],
    [174, -38],
    [177, -41],
    [174, -41],
    [170, -38],
  ],
  [
    [173, -41],
    [169, -45],
    [167, -47],
    [172, -46],
    [175, -43],
  ],
];
