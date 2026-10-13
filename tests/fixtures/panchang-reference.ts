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
  // Cross-provider audit: values independently published on 2026-10-13.
  // Drik times carry the city coordinate; second source supports sunrise,
  // sunset, Tithi/Nakshatra, and local Rahu geometry. Exact ephemeris methods
  // may differ by 1–2 minutes, so test a narrow tolerance rather than equality.
  {
    city:"mumbai",
    date:"2026-10-13",
    source:"https://www.drikpanchang.com/marathi/panchang/marathi-day-panchang.html?geoname-id=1275339 | https://vedicspace.com/panchang/mumbai/2026-10-13/",
    expected:{
      sunrise:"06:32",sunset:"18:17",
      tithi:"Tritiya",tithiEnd:"23:27",
      nakshatra:"Vishakha",nakshatraEnd:"01:43",
      yoga:"Priti",karana:"Taitila",hinduMonth:"Ashwin",
      vikramSamvat:2083,shakaSamvat:1948,
      rahu:["15:21","16:49"],yamaganda:["09:28","10:56"],
      gulika:["12:25","13:53"],abhijit:["12:01","12:48"]
    }
  },
  {
    city:"delhi",
    date:"2026-10-13",
    source:"https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=997719 | https://www.livepanditji.com/panchang-in/delhi/october-2026/13/",
    expected:{
      sunrise:"06:20",sunset:"17:54",
      tithi:"Tritiya",tithiEnd:"23:27",
      nakshatra:"Vishakha",nakshatraEnd:"01:43",
      yoga:"Priti",karana:"Taitila",hinduMonth:"Ashwin",
      vikramSamvat:2083,shakaSamvat:1948,
      rahu:["15:00","16:27"],yamaganda:["09:14","10:40"],
      gulika:["12:07","13:34"],abhijit:["11:44","12:30"]
    }
  },
];
