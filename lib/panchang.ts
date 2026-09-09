import { City } from "./cities";
import { createDefaultSweData } from "@typescriptify/sweph/types";
import { sweCalc, sweClose, sweSetSidMode } from "@typescriptify/sweph/sweph";
import { sweRiseTrans } from "@typescriptify/sweph/swecl";
import { julDay, revJul } from "@typescriptify/sweph/swedate";
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
} from "@typescriptify/sweph/constants";

export type TimeWindow = { start: string; end: string };

export type Panchang = {
  date: string;
  weekday: string;
  tithi: string;
  tithiEnd: string;
  paksha: "Shukla" | "Krishna";
  nakshatra: string;
  nakshatraEnd: string;
  nakshatraPada: number;
  rashi: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahu: TimeWindow;
  yamaganda: TimeWindow;
  gulika: TimeWindow;
  abhijit: TimeWindow;
  hinduMonth: string;
  vikramSamvat: number;
  shakaSamvat: number;
  dayLord: string;
  engine: "Swiss Ephemeris · Moshier";
};

const nakshatras = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const yogas = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
const tithis = ["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const karanaCycle = ["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"];
const lords = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const rashis = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"];
const lunarMonthBySunSign = ["Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna","Chaitra"];

const norm = (value: number) => ((value % 360) + 360) % 360;
const pad = (n: number) => String(n).padStart(2, "0");

function localMinutesFromJulian(jd: number) {
  const value = revJul(jd, SE_GREG_CAL);
  const total = value.hour * 60 + 330;
  return ((total % 1440) + 1440) % 1440;
}

function formatMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  const value = ((rounded % 1440) + 1440) % 1440;
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

function formatJulianLocal(jd: number | null | undefined) {
  return typeof jd === "number" && Number.isFinite(jd) ? formatMinutes(localMinutesFromJulian(jd)) : "—";
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

function samvatYears(date: Date) {
  const year = date.getUTCFullYear();
  const afterMarch22 = date.getUTCMonth() > 2 || (date.getUTCMonth() === 2 && date.getUTCDate() >= 22);
  return {
    vikram: year + (afterMarch22 ? 57 : 56),
    shaka: year - (afterMarch22 ? 78 : 79),
  };
}

export async function getPanchang(date: Date, city: City): Promise<Panchang> {
  const swed = createDefaultSweData();
  sweSetSidMode(swed, SE_SIDM_LAHIRI, 0, 0);

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const baseJd = julDay(year, month, day, 0, SE_GREG_CAL);
  const geopos = [city.lng, city.lat, 0];

  const rise = sweRiseTrans(swed, baseJd, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);
  const set = sweRiseTrans(swed, baseJd, SE_SUN, null, SEFLG_MOSEPH, SE_CALC_SET, geopos, 1013.25, 25, null);
  const moonRise = sweRiseTrans(swed, baseJd, SE_MOON, null, SEFLG_MOSEPH, SE_CALC_RISE, geopos, 1013.25, 25, null);
  const moonSet = sweRiseTrans(swed, baseJd, SE_MOON, null, SEFLG_MOSEPH, SE_CALC_SET, geopos, 1013.25, 25, null);

  const sunriseJd = rise.retval >= 0 ? rise.tret : baseJd + 0.25;
  const sunsetJd = set.retval >= 0 ? set.tret : baseJd + 0.75;
  const sunriseMinutes = localMinutesFromJulian(sunriseJd);
  let sunsetMinutes = localMinutesFromJulian(sunsetJd);
  if (sunsetMinutes <= sunriseMinutes) sunsetMinutes += 1440;

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
  const yoga = yogas[atSunrise.yogaIndex];
  const karana = karanaName(Math.floor(atSunrise.elongation / 6));

  const findTransition = (selector: (jd: number) => number) => {
    const startIndex = selector(sunriseJd);
    let low = sunriseJd;
    let high = sunriseJd + 2 / 24;
    while (high < sunriseJd + 2 && selector(high) === startIndex) {
      low = high;
      high += 2 / 24;
    }
    if (high >= sunriseJd + 2) return null;
    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2;
      if (selector(mid) === startIndex) low = mid;
      else high = mid;
    }
    return high;
  };

  const tithiEndJd = findTransition((jd) => stateAt(jd).tithiIndex);
  const nakshatraEndJd = findTransition((jd) => stateAt(jd).nakshatraIndex);

  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" }).format(date);
  const dayOfWeek = date.getUTCDay();
  const rahuIndex = [7,1,6,4,5,3,2][dayOfWeek];
  const yamagandaIndex = [4,3,2,1,0,6,5][dayOfWeek];
  const gulikaIndex = [6,5,4,3,2,1,0][dayOfWeek];
  const muhurta = (sunsetMinutes - sunriseMinutes) / 15;
  const abhijit = {
    start: formatMinutes(sunriseMinutes + muhurta * 7),
    end: formatMinutes(sunriseMinutes + muhurta * 8),
  };
  const years = samvatYears(date);
  const hinduMonth = lunarMonthBySunSign[Math.floor(atSunrise.sunSidereal / 30)];

  const result: Panchang = {
    date: `${year}-${pad(month)}-${pad(day)}`,
    weekday,
    tithi,
    tithiEnd: formatJulianLocal(tithiEndJd),
    paksha,
    nakshatra,
    nakshatraEnd: formatJulianLocal(nakshatraEndJd),
    nakshatraPada,
    rashi,
    yoga,
    karana,
    sunrise: formatJulianLocal(sunriseJd),
    sunset: formatJulianLocal(sunsetJd),
    moonrise: moonRise.retval >= 0 ? formatJulianLocal(moonRise.tret) : "—",
    moonset: moonSet.retval >= 0 ? formatJulianLocal(moonSet.tret) : "—",
    rahu: segmentWindow(sunriseMinutes, sunsetMinutes, rahuIndex),
    yamaganda: segmentWindow(sunriseMinutes, sunsetMinutes, yamagandaIndex),
    gulika: segmentWindow(sunriseMinutes, sunsetMinutes, gulikaIndex),
    abhijit,
    hinduMonth,
    vikramSamvat: years.vikram,
    shakaSamvat: years.shaka,
    dayLord: lords[dayOfWeek],
    engine: "Swiss Ephemeris · Moshier",
  };

  sweClose(swed);
  return result;
}

export const formatWindow = (window: TimeWindow) => `${window.start} — ${window.end}`;
