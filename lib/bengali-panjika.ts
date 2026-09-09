import type { Panchang } from "./panchang";

const solarSigns=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"];

const bengaliMonths=[
  {en:"Boishakh",native:"বৈশাখ"},
  {en:"Joishtho",native:"জ্যৈষ্ঠ"},
  {en:"Asharh",native:"আষাঢ়"},
  {en:"Srabon",native:"শ্রাবণ"},
  {en:"Bhadro",native:"ভাদ্র"},
  {en:"Ashshin",native:"আশ্বিন"},
  {en:"Kartik",native:"কার্তিক"},
  {en:"Ogrohaeon",native:"অগ্রহায়ণ"},
  {en:"Poush",native:"পৌষ"},
  {en:"Magh",native:"মাঘ"},
  {en:"Falgun",native:"ফাল্গুন"},
  {en:"Choitro",native:"চৈত্র"},
];

export function getBengaliPanjikaProfile(data:Panchang){
  const index=Math.max(0,solarSigns.indexOf(data.solarRashi));
  const month=bengaliMonths[index];
  const gregorianYear=Number(data.date.slice(0,4));

  // Traditional Bengali solar year starts with Mesha/Boishakh.
  // Makara–Meena fall in Jan–Apr of the following Gregorian year.
  const year=gregorianYear-(index>=9?594:593);

  return {
    year,
    month,
    solarSign:data.solarRashi,
    calendarLabel:"Bengali Solar Panjika",
    yearLabel:`${year} বঙ্গাব্দ`,
  };
}
