import { City } from "./cities";
import { createDefaultSweData } from "@typescriptify/sweph/dist/types.js";
import { sweCalc, sweClose, sweSetSidMode } from "@typescriptify/sweph/dist/sweph.js";
import { sweRiseTrans } from "@typescriptify/sweph/dist/swecl.js";
import { julDay } from "@typescriptify/sweph/dist/swedate.js";
import {
  SE_SUN,
  SE_MOON,
  SEFLG_MOSEPH,
  SEFLG_SPEED,
  SEFLG_SIDEREAL,
  SE_SIDM_LAHIRI,
  SE_GREG_CAL,
  SE_CALC_RISE,
  SE_CALC_SET,
} from "@typescriptify/sweph/dist/constants.js";
import {
  addIsoDays,
  formatDatedTime,
  indiaCivilDayStartJulian,
  indiaLocalPartsFromJulian,
  isoDateFromParts,
  isoDateParts,
} from "./india-time";

export type TimeWindow = { start: string; end: string };

export type ChoghadiyaName =
  | "Udveg"
  | "Char"
  | "Labh"
  | "Amrit"
  | "Kaal"
  | "Shubh"
  | "Rog";

export type ChoghadiyaPeriod = {
  name: ChoghadiyaName;
  effect: "good" | "neutral" | "bad";
  start: string;
  end: string;
  startDayOffset: 0 | 1;
  endDayOffset: 0 | 1;
};

export const PANCHANG_SUNRISE_CONVENTION = "Upper limb + atmospheric refraction · sea-level horizon" as const;

export type Panchang = {
  date: string;
  weekday: string;
  tithi: string;
  tithiEnd: string;
  tithiEndDate: string | null;
  paksha: "Shukla" | "Krishna";
  nakshatra: string;
  nakshatraEnd: string;
  nakshatraEndDate: string | null;
  nakshatraPada: number;
  rashi: string;
  solarRashi: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonriseDate: string | null;
  moonset: string;
  moonsetDate: string | null;
  moonIllumination: number;
  rahu: TimeWindow;
  yamaganda: TimeWindow;
  gulika: TimeWindow;
  abhijit: TimeWindow | null;
  dayChoghadiya: ChoghadiyaPeriod[];
  nightChoghadiya: ChoghadiyaPeriod[];
  hinduMonth: string;
  vikramSamvat: number;
  shakaSamvat: number;
  samvatYearStart: string;
  dayLord: string;
  sunriseConvention: typeof PANCHANG_SUNRISE_CONVENTION;
  engine: "Swiss Ephemeris · Moshier";
};

const nakshatras = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const yogas = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
const tithis = ["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const karanaCycle = ["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"];
const lords = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const rashis = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"];
const amantaMonthByPreviousNewMoonSunSign = ["Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna","Chaitra"];
const samvatYearStartCache = new Map<string, string>();

const dayChoghadiyaTable: ChoghadiyaName[][] = [
  ["Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg"],
  ["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"],
  ["Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog"],
  ["Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh"],
  ["Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh"],
  ["Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char"],
  ["Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal"],
];

const nightChoghadiyaTable: ChoghadiyaName[][] = [
  ["Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh"],
  ["Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char"],
  ["Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal"],
  ["Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg"],
  ["Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit"],
  ["Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog"],
  ["Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh"],
];

const choghadiyaEffect: Record<ChoghadiyaName, ChoghadiyaPeriod["effect"]> = {
  Udveg: "bad",
  Char: "neutral",
  Labh: "good",
  Amrit: "good",
  Kaal: "bad",
  Shubh: "good",
  Rog: "bad",
};

const norm = (value: number) => ((value % 360) + 360) % 360;
const pad = (n: number) => String(n).padStart(2, "0");

function localMinutesFromJulian(jd: number) {
  return indiaLocalPartsFromJulian(jd).minutes;
}

function formatMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  const value = ((rounded % 1440) + 1440) % 1440;
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

function dayOffset(minutes: number): 0 | 1 {
  return minutes >= 1440 ? 1 : 0;
}

function localEventFromJulian(jd: number | null | undefined) {
  if (typeof jd !== "number" || !Number.isFinite(jd)) return { time: "—", date: null as string | null };
  const value = indiaLocalPartsFromJulian(jd);
  return { time: value.time, date: value.date as string | null };
}

function karanaName(index: number) {
  if (index === 0) return "Kimstughna";
  if (index === 57) return "Shakuni";
  if (index === 58) return "Chatushpada";
  if (index === 59) return "Naga";
  return karanaCycle[(index - 1) % karanaCycle.length];
}

function segmentWindow(sunrise: number, sunset: number, index: number): TimeWindow {
  const segment = (sunset - sunrise) / 8;
  return {
    start: formatMinutes(sunrise + segment * index),
    end: formatMinutes(sunrise + segment * (index + 1)),
  };
}

function choghadiyaPeriods(
  startMinutes: number,
  endMinutes: number,
  names: ChoghadiyaName[]
): ChoghadiyaPeriod[] {
  const segment = (endMinutes - startMinutes) / 8;
  return names.map((name, index) => {
    const start = startMinutes + segment * index;
    const end = startMinutes + segment * (index + 1);
    return {
      name,
      effect: choghadiyaEffect[name],
      start: formatMinutes(start),
      end: formatMinutes(end),
      startDayOffset: dayOffset(start),
      endDayOffset: dayOffset(end),
    };
  });
}

export async function getPanchang(date: Date, city: City): Promise<Panchang> {
  const swed = createDefaultSweData();
  sweSetSidMode(swed, SE_SIDM_LAHIRI, 0, 0);

  try {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const dateIso = isoDateFromParts(year, month, day);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 12));
    const baseJd = indiaCivilDayStartJulian(year, month, day);
    const geopos = [city.lng, city.lat, 0];

    // `sweRiseTrans` searches forward from the supplied UT instant. Starting at
    // 00:00 UTC skipped same-date sunrises before 05:30 IST in eastern India.
    // Solar-day searches now begin at 00:00 IST for the requested civil date.
    const rise = sweRiseTrans(swed, baseJd, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);
    const set = sweRiseTrans(swed, baseJd, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_SET, geopos, 1013.25, 25, null);
    const nextRise = sweRiseTrans(swed, baseJd + 1, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);

    // The current public reference fixtures are aligned with the common upper-limb,
    // refraction-aware sunrise convention used by DrikPanchang by default. We keep
    // that convention explicit rather than silently mixing sunrise definitions.
    const sunriseJd = rise.retval >= 0 ? rise.tret : baseJd + 0.25;
    const sunsetJd = set.retval >= 0 ? set.tret : baseJd + 0.75;
    const nextSunriseJd = nextRise.retval >= 0 ? nextRise.tret : baseJd + 1.25;

    // A Panchang day runs from local sunrise to the next sunrise. Searching lunar
    // rise/set from sunrise prevents a pre-sunrise civil event from being assigned
    // to the wrong Panchang day and preserves next-day moonrise dates explicitly.
    const moonRise = sweRiseTrans(swed, sunriseJd, SE_MOON, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);
    const moonSet = sweRiseTrans(swed, sunriseJd, SE_MOON, null, SEFLG_MOSEPH, SE_CALC_SET, geopos, 1013.25, 25, null);

    const sunriseMinutes = localMinutesFromJulian(sunriseJd);
    let sunsetMinutes = localMinutesFromJulian(sunsetJd);
    if (sunsetMinutes <= sunriseMinutes) sunsetMinutes += 1440;
    let nextSunriseMinutes = localMinutesFromJulian(nextSunriseJd) + 1440;
    if (nextSunriseMinutes <= sunsetMinutes) nextSunriseMinutes += 1440;

    const stateAt = (jd: number) => {
      const tropicalFlags = SEFLG_MOSEPH | SEFLG_SPEED;
      const siderealFlags = SEFLG_MOSEPH | SEFLG_SPEED | SEFLG_SIDEREAL;
      const sun = sweCalc(swed, jd, SE_SUN, tropicalFlags).xx[0];
      const moon = sweCalc(swed, jd, SE_MOON, tropicalFlags).xx[0];
      const sunSidereal = sweCalc(swed, jd, SE_SUN, siderealFlags).xx[0];
      const moonSidereal = sweCalc(swed, jd, SE_MOON, siderealFlags).xx[0];
      const elongation = norm(moon - sun);
      return {
        elongation,
        sunSidereal: norm(sunSidereal),
        moonSidereal: norm(moonSidereal),
        tithiIndex: Math.floor(elongation / 12),
        nakshatraIndex: Math.floor(norm(moonSidereal) / (360 / 27)),
        yogaIndex: Math.floor(norm(sunSidereal + moonSidereal) / (360 / 27)),
      };
    };

    const findTransitionFrom = (startJd: number, selector: (jd: number) => number, maxDays = 2) => {
      const startIndex = selector(startJd);
      let low = startJd;
      let high = startJd + 2 / 24;
      const limit = startJd + maxDays;
      while (high < limit && selector(high) === startIndex) {
        low = high;
        high += 2 / 24;
      }
      if (selector(high) === startIndex) return null;
      for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        if (selector(mid) === startIndex) low = mid;
        else high = mid;
      }
      return high;
    };

    const atSunrise = stateAt(sunriseJd);
    const tithiNumber = atSunrise.tithiIndex + 1;
    const paksha: Panchang["paksha"] = tithiNumber <= 15 ? "Shukla" : "Krishna";
    const tithiBase = atSunrise.tithiIndex % 15;
    const tithi = tithiBase === 14
      ? (paksha === "Shukla" ? "Purnima" : "Amavasya")
      : tithis[tithiBase];

    const nakshatraSpan = 360 / 27;
    const nakshatra = nakshatras[atSunrise.nakshatraIndex];
    const nakshatraPada = Math.floor((atSunrise.moonSidereal % nakshatraSpan) / (nakshatraSpan / 4)) + 1;
    const rashi = rashis[Math.floor(atSunrise.moonSidereal / 30)];
    const solarRashi = rashis[Math.floor(atSunrise.sunSidereal / 30)];
    const yoga = yogas[atSunrise.yogaIndex];
    const karana = karanaName(Math.floor(atSunrise.elongation / 6));

    const findPreviousNewMoon = () => {
      let current = sunriseJd;
      let currentIndex = stateAt(current).tithiIndex;
      for (let i = 0; i < 140; i++) {
        const previous = current - 0.25;
        const previousIndex = stateAt(previous).tithiIndex;
        if (previousIndex > currentIndex) {
          let low = previous;
          let high = current;
          for (let j = 0; j < 32; j++) {
            const mid = (low + high) / 2;
            if (stateAt(mid).tithiIndex > 15) low = mid;
            else high = mid;
          }
          return high;
        }
        current = previous;
        currentIndex = previousIndex;
      }
      return sunriseJd - 29.5;
    };

    const sunriseForIso = (iso: string) => {
      const parts = isoDateParts(iso);
      const start = indiaCivilDayStartJulian(parts.year, parts.month, parts.day);
      const result = sweRiseTrans(swed, start, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);
      return result.retval >= 0 ? result.tret : null;
    };

    const resolveSamvatYearStart = () => {
      const cacheKey = `${city.slug}:${year}`;
      const cached = samvatYearStartCache.get(cacheKey);
      if (cached) return cached;

      // Chaitra Shukla Pratipada starts at the new moon whose sidereal Sun is in Meena.
      // Scan the spring window and refine the Amavasya -> Pratipada transition.
      const scanStart = julDay(year, 3, 1, 0, SE_GREG_CAL);
      const scanEnd = julDay(year, 5, 1, 0, SE_GREG_CAL);
      let previousJd = scanStart;
      let previousIndex = stateAt(previousJd).tithiIndex;
      let pratipadaStart: number | null = null;

      for (let currentJd = scanStart + 0.25; currentJd <= scanEnd; currentJd += 0.25) {
        const currentIndex = stateAt(currentJd).tithiIndex;
        if (previousIndex === 29 && currentIndex === 0) {
          let low = previousJd;
          let high = currentJd;
          for (let i = 0; i < 34; i++) {
            const mid = (low + high) / 2;
            if (stateAt(mid).tithiIndex === 29) low = mid;
            else high = mid;
          }
          if (Math.floor(stateAt(high + 0.000001).sunSidereal / 30) === 11) {
            pratipadaStart = high;
            break;
          }
        }
        previousJd = currentJd;
        previousIndex = currentIndex;
      }

      if (pratipadaStart === null) {
        throw new Error(`Unable to resolve Chaitra Shukla Pratipada for ${year} in ${city.slug}`);
      }

      const pratipadaEnd = findTransitionFrom(pratipadaStart + 0.000001, (jd) => stateAt(jd).tithiIndex, 2);
      if (pratipadaEnd === null) {
        throw new Error(`Unable to resolve Chaitra Shukla Pratipada end for ${year} in ${city.slug}`);
      }

      const startDate = indiaLocalPartsFromJulian(pratipadaStart).date;
      const nextDate = addIsoDays(startDate, 1);
      const startSunrise = sunriseForIso(startDate);
      const nextSunrise = sunriseForIso(nextDate);
      const activeAt = (jd: number | null) => jd !== null && jd >= pratipadaStart && jd < pratipadaEnd;

      // Normal case: use the civil date whose local sunrise falls inside Pratipada.
      // Kshaya-style case: if Pratipada begins and ends between two sunrises, keep
      // the civil date on which it begins instead of silently moving the year boundary.
      const boundary = activeAt(startSunrise)
        ? startDate
        : activeAt(nextSunrise)
          ? nextDate
          : startDate;

      samvatYearStartCache.set(cacheKey, boundary);
      return boundary;
    };

    const tithiEndJd = findTransitionFrom(sunriseJd, (jd) => stateAt(jd).tithiIndex);
    const nakshatraEndJd = findTransitionFrom(sunriseJd, (jd) => stateAt(jd).nakshatraIndex);
    const previousNewMoonJd = findPreviousNewMoon();
    const monthSunSign = Math.floor(stateAt(previousNewMoonJd + 0.001).sunSidereal / 30);
    const hinduMonth = amantaMonthByPreviousNewMoonSunSign[monthSunSign];

    const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" }).format(targetDate);
    const dayOfWeek = targetDate.getUTCDay();
    const rahuIndex = [7,1,6,4,5,3,2][dayOfWeek];
    const yamagandaIndex = [4,3,2,1,0,6,5][dayOfWeek];
    const gulikaIndex = [6,5,4,3,2,1,0][dayOfWeek];
    const muhurta = (sunsetMinutes - sunriseMinutes) / 15;
    const abhijit = dayOfWeek === 3 ? null : {
      start: formatMinutes(sunriseMinutes + muhurta * 7),
      end: formatMinutes(sunriseMinutes + muhurta * 8),
    };

    const dayChoghadiya = choghadiyaPeriods(
      sunriseMinutes,
      sunsetMinutes,
      dayChoghadiyaTable[dayOfWeek]
    );
    const nightChoghadiya = choghadiyaPeriods(
      sunsetMinutes,
      nextSunriseMinutes,
      nightChoghadiyaTable[dayOfWeek]
    );

    const samvatYearStart = resolveSamvatYearStart();
    const afterSamvatStart = dateIso >= samvatYearStart;
    const years = {
      vikram: year + (afterSamvatStart ? 57 : 56),
      shaka: year - (afterSamvatStart ? 78 : 79),
    };

    const tithiEnd = localEventFromJulian(tithiEndJd);
    const nakshatraEnd = localEventFromJulian(nakshatraEndJd);
    const moonrise = moonRise.retval >= 0 ? localEventFromJulian(moonRise.tret) : { time: "—", date: null };
    const moonset = moonSet.retval >= 0 ? localEventFromJulian(moonSet.tret) : { time: "—", date: null };

    return {
      date: dateIso,
      weekday,
      tithi,
      tithiEnd: tithiEnd.time,
      tithiEndDate: tithiEnd.date,
      paksha,
      nakshatra,
      nakshatraEnd: nakshatraEnd.time,
      nakshatraEndDate: nakshatraEnd.date,
      nakshatraPada,
      rashi,
      solarRashi,
      yoga,
      karana,
      sunrise: localEventFromJulian(sunriseJd).time,
      sunset: localEventFromJulian(sunsetJd).time,
      moonrise: moonrise.time,
      moonriseDate: moonrise.date,
      moonset: moonset.time,
      moonsetDate: moonset.date,
      moonIllumination: Math.round(((1 - Math.cos(atSunrise.elongation * Math.PI / 180)) / 2) * 100),
      rahu: segmentWindow(sunriseMinutes, sunsetMinutes, rahuIndex),
      yamaganda: segmentWindow(sunriseMinutes, sunsetMinutes, yamagandaIndex),
      gulika: segmentWindow(sunriseMinutes, sunsetMinutes, gulikaIndex),
      abhijit,
      dayChoghadiya,
      nightChoghadiya,
      hinduMonth,
      vikramSamvat: years.vikram,
      shakaSamvat: years.shaka,
      samvatYearStart,
      dayLord: lords[dayOfWeek],
      sunriseConvention: PANCHANG_SUNRISE_CONVENTION,
      engine: "Swiss Ephemeris · Moshier",
    };
  } finally {
    sweClose(swed);
  }
}

export const formatWindow = (window: TimeWindow | null) =>
  window ? `${window.start} — ${window.end}` : "Not available";

export const formatPanchangTime = (time: string, eventDate: string | null | undefined, baseDate: string) =>
  formatDatedTime(time, eventDate, baseDate);
