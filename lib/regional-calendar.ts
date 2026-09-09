import type { Panchang } from "./panchang";
import { getBengaliPanjikaProfile } from "./bengali-panjika";

export type RegionalCalendarProfile={
  calendarSystem:string;
  month:string;
  monthNative?:string;
  yearLabel?:string;
  nakshatra:string;
  solarSign?:string;
  note:string;
};

const solarSigns=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"];

const tamilMonths=[
  "Chithirai","Vaikaasi","Aani","Aadi","Aavani","Purattaasi",
  "Aippasi","Karthikai","Maargazhi","Thai","Maasi","Panguni"
];

const malayalamMonthBySign:Record<string,string>={
  Mesha:"Medam",
  Vrishabha:"Edavam",
  Mithuna:"Mithunam",
  Karka:"Karkadakam",
  Simha:"Chingam",
  Kanya:"Kanni",
  Tula:"Thulam",
  Vrishchika:"Vrishchikam",
  Dhanu:"Dhanu",
  Makara:"Makaram",
  Kumbha:"Kumbham",
  Meena:"Meenam",
};

const tamilNakshatra:Record<string,string>={
  Ashwini:"Aswini",Bharani:"Bharani",Krittika:"Karthigai",Rohini:"Rohini",
  Mrigashirsha:"Mirugasirisham",Ardra:"Thiruvathirai",Punarvasu:"Punarpoosam",
  Pushya:"Poosam",Ashlesha:"Ayilyam",Magha:"Magam","Purva Phalguni":"Pooram",
  "Uttara Phalguni":"Uthiram",Hasta:"Hastham",Chitra:"Chithirai",Swati:"Swathi",
  Vishakha:"Visakam",Anuradha:"Anusham",Jyeshtha:"Kettai",Mula:"Moolam",
  "Purva Ashadha":"Pooradam","Uttara Ashadha":"Uthiradam",Shravana:"Thiruvonam",
  Dhanishta:"Avittam",Shatabhisha:"Sathayam","Purva Bhadrapada":"Poorattathi",
  "Uttara Bhadrapada":"Uthirattathi",Revati:"Revathi"
};

const malayalamNakshatra:Record<string,string>={
  Ashwini:"Ashwathi",Bharani:"Bharani",Krittika:"Karthika",Rohini:"Rohini",
  Mrigashirsha:"Makayiram",Ardra:"Thiruvathira",Punarvasu:"Punartham",
  Pushya:"Pooyam",Ashlesha:"Ayilyam",Magha:"Makam","Purva Phalguni":"Pooram",
  "Uttara Phalguni":"Uthram",Hasta:"Atham",Chitra:"Chithira",Swati:"Chothi",
  Vishakha:"Vishakham",Anuradha:"Anizham",Jyeshtha:"Thrikketta",Mula:"Moolam",
  "Purva Ashadha":"Pooradam","Uttara Ashadha":"Uthradam",Shravana:"Thiruvonam",
  Dhanishta:"Avittam",Shatabhisha:"Chathayam","Purva Bhadrapada":"Pooruruttathi",
  "Uttara Bhadrapada":"Uthrattathi",Revati:"Revathi"
};

const gujaratiMonth:Record<string,string>={
  Chaitra:"Chaitra",Vaishakha:"Vaishakha",Jyeshtha:"Jetha",Ashadha:"Ashadha",
  Shravana:"Shravana",Bhadrapada:"Bhadarvo",Ashwin:"Aso",Kartika:"Kartak",
  Margashirsha:"Magshar",Pausha:"Posh",Magha:"Maha",Phalguna:"Phaguna"
};

const marathiMonth:Record<string,string>={
  Chaitra:"Chaitra",Vaishakha:"Vaishakha",Jyeshtha:"Jyeshtha",Ashadha:"Ashadha",
  Shravana:"Shravana",Bhadrapada:"Bhadrapada",Ashwin:"Ashwina",Kartika:"Kartika",
  Margashirsha:"Margashirsha",Pausha:"Pausha",Magha:"Magha",Phalguna:"Phalguna"
};

export function getRegionalCalendarProfile(language:string,data:Panchang):RegionalCalendarProfile{
  if(language==="bengali"){
    const profile=getBengaliPanjikaProfile(data);
    return {
      calendarSystem:profile.calendarLabel,
      month:profile.month.en,
      monthNative:profile.month.native,
      yearLabel:profile.yearLabel,
      nakshatra:data.nakshatra,
      solarSign:profile.solarSign,
      note:"Bengali month is derived from the sidereal solar sign rather than reusing the North-Indian lunar month label."
    };
  }

  if(language==="tamil"){
    const index=Math.max(0,solarSigns.indexOf(data.solarRashi));
    return {
      calendarSystem:"Tamil Solar Calendar",
      month:tamilMonths[index],
      nakshatra:tamilNakshatra[data.nakshatra]??data.nakshatra,
      solarSign:data.solarRashi,
      note:"Tamil month follows the sidereal solar-sign cycle; Nakshatra uses the conventional Tamil star name."
    };
  }

  if(language==="malayalam"){
    return {
      calendarSystem:"Malayalam Solar Calendar",
      month:malayalamMonthBySign[data.solarRashi]??data.hinduMonth,
      nakshatra:malayalamNakshatra[data.nakshatra]??data.nakshatra,
      solarSign:data.solarRashi,
      note:"Malayalam month follows the solar-sign calendar used for Kollavarsham month naming; Nakshatra uses the Malayalam star-name tradition."
    };
  }

  if(language==="gujarati"){
    return {
      calendarSystem:"Gujarati Panchang",
      month:gujaratiMonth[data.hinduMonth]??data.hinduMonth,
      nakshatra:data.nakshatra,
      note:"Gujarati month naming is applied to the calculated lunar Panchang month instead of displaying the generic Sanskrit label unchanged."
    };
  }

  if(language==="marathi"){
    return {
      calendarSystem:"Marathi Panchang",
      month:marathiMonth[data.hinduMonth]??data.hinduMonth,
      nakshatra:data.nakshatra,
      note:"Marathi month naming is applied to the calculated lunar Panchang month while retaining the local astronomical timings for the selected city."
    };
  }

  return {
    calendarSystem:"Regional Panchang",
    month:data.hinduMonth,
    nakshatra:data.nakshatra,
    note:"Regional terminology is layered over the same location-sensitive astronomical calculation."
  };
}
