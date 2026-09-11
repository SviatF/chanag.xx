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

export function getBengaliPanjikaProfile(data:Panchang,solarRashiOverride?:string){
  const solarRashi=solarRashiOverride??data.solarRashi;
  const index=Math.max(0,solarSigns.indexOf(solarRashi));
  const month=bengaliMonths[index];
  const gregorianYear=Number(data.date.slice(0,4));

  // Panchvani's India-facing Bengali civil month follows the traditional solar
  // boundary rule: the month changes according to the civil day assigned to the
  // Sankranti, not simply the Rashi active at sunrise.
  const year=gregorianYear-(index>=9?594:593);

  return {
    year,
    month,
    solarSign:solarRashi,
    calendarLabel:"Bengali Solar Panjika",
    yearLabel:`${year} বঙ্গাব্দ`,
  };
}
