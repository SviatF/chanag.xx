export type ReferenceFixture = {
  city: string;
  date: string;
  source: string;
  expected: {
    sunrise: string;
    sunset: string;
    tithi: string;
    tithiEnd: string;
    nakshatra: string;
    nakshatraEnd: string;
    yoga: string;
    karana: string;
    hinduMonth: string;
    vikramSamvat: number;
    shakaSamvat: number;
    rahu: [string, string];
    yamaganda: [string, string];
    gulika: [string, string];
    abhijit: [string, string] | null;
    moonrise?: string;
    moonriseDate?: string;
  };
};

export const referenceFixtures: ReferenceFixture[] = [
  {
    city: "mumbai",
    date: "2026-09-09",
    source: "https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=1275339",
    expected: {
      sunrise: "06:25",
      sunset: "18:46",
      tithi: "Trayodashi",
      tithiEnd: "12:30",
      nakshatra: "Ashlesha",
      nakshatraEnd: "15:14",
      yoga: "Shiva",
      karana: "Vanija",
      hinduMonth: "Shravana",
      vikramSamvat: 2083,
      shakaSamvat: 1948,
      rahu: ["12:36", "14:08"],
      yamaganda: ["07:58", "09:30"],
      gulika: ["11:03", "12:36"],
      abhijit: null,
    },
  },
  {
    city: "delhi",
    date: "2026-09-09",
    source: "https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=934672",
    expected: {
      sunrise: "06:03",
      sunset: "18:34",
      tithi: "Trayodashi",
      tithiEnd: "12:30",
      nakshatra: "Ashlesha",
      nakshatraEnd: "15:14",
      yoga: "Shiva",
      karana: "Vanija",
      hinduMonth: "Shravana",
      vikramSamvat: 2083,
      shakaSamvat: 1948,
      rahu: ["12:18", "13:52"],
      yamaganda: ["07:37", "09:11"],
      gulika: ["10:44", "12:18"],
      abhijit: null,
    },
  },
  {
    city: "bengaluru",
    date: "2026-09-09",
    source: "https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=1277333",
    expected: {
      sunrise: "06:09",
      sunset: "18:25",
      tithi: "Trayodashi",
      tithiEnd: "12:30",
      nakshatra: "Ashlesha",
      nakshatraEnd: "15:14",
      yoga: "Shiva",
      karana: "Vanija",
      hinduMonth: "Shravana",
      vikramSamvat: 2083,
      shakaSamvat: 1948,
      rahu: ["12:17", "13:49"],
      yamaganda: ["07:41", "09:13"],
      gulika: ["10:45", "12:17"],
      abhijit: null,
    },
  },
  {
    city: "guwahati",
    date: "2026-09-09",
    source: "https://www.drikpanchang.com/muhurat/choghadiya.html?geoname-id=1271476",
    expected: {
      sunrise: "05:06",
      sunset: "17:34",
      tithi: "Trayodashi",
      tithiEnd: "12:30",
      nakshatra: "Ashlesha",
      nakshatraEnd: "15:14",
      yoga: "Shiva",
      karana: "Vanija",
      hinduMonth: "Shravana",
      vikramSamvat: 2083,
      shakaSamvat: 1948,
      rahu: ["11:20", "12:54"],
      yamaganda: ["06:40", "08:13"],
      gulika: ["09:47", "11:20"],
      abhijit: null,
      moonrise: "04:05",
      moonriseDate: "2026-09-10",
    },
  },
];
