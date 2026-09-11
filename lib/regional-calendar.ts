import type { Panchang } from "./panchang";
import type {LunarMonthConventions,RegionalCalendarConventions} from "./calendar-conventions";
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

const adhikaSuffix=(value:string,adhika:boolean)=>adhika?`${value} (Adhika)`:value;

export function getRegionalCalendarProfile(
  language:string,
  data:Panchang,
  lunar:LunarMonthConventions,
  regional:RegionalCalendarConventions
):RegionalCalendarProfile{
  if(language==="bengali"){
    const profile=getBengaliPanjikaProfile(data,regional.bengaliSolarRashi);
    return {
      calendarSystem:profile.calendarLabel,
      month:profile.month.en,
      monthNative:profile.month.native,
      yearLabel:profile.yearLabel,
      nakshatra:data.nakshatra,
      solarSign:profile.solarSign,
      note:"Bengali civil month is assigned from the sidereal solar transition using the Bengal day-boundary convention; a Sankranti after local midnight belongs to the following civil month day rather than being inferred from sunrise alone."
    };
  }

  if(language==="tamil"){
    const index=Math.max(0,solarSigns.indexOf(regional.tamilSolarRashi));
    return {
      calendarSystem:"Tamil Solar Calendar",
      month:tamilMonths[index],
      nakshatra:tamilNakshatra[data.nakshatra]??data.nakshatra,
      solarSign:regional.tamilSolarRashi,
      note:"Tamil civil month follows the sidereal Sankranti rule: a solar ingress between sunrise and sunset starts the new month on that same civil day; an ingress after sunset starts it on the following day."
    };
  }

  if(language==="malayalam"){
    return {
      calendarSystem:"Malayalam Solar Calendar",
      month:malayalamMonthBySign[regional.malayalamSolarRashi]??lunar.amantaMonth,
      nakshatra:malayalamNakshatra[data.nakshatra]??data.nakshatra,
      solarSign:regional.malayalamSolarRashi,
      note:"Malayalam civil month uses the Kerala Sankranti day rule: an ingress within the first three-fifths of the local daylight interval is assigned to the same day; a later ingress starts the new month on the following day."
    };
  }

  if(language==="gujarati"){
    const month=gujaratiMonth[lunar.amantaMonth]??lunar.amantaMonth;
    return {
      calendarSystem:"Gujarati Panchang · Amanta",
      month:adhikaSuffix(month,lunar.amantaIsAdhika),
      yearLabel:`Gujarati Samvat ${regional.gujaratiSamvat}`,
      nakshatra:data.nakshatra,
      note:"Gujarati Panchang uses the Amanta lunar month convention. Gujarati Samvat changes at Kartika Shukla Pratipada after the Diwali Amavasya, so its year boundary is different from the Chaitradi Vikram Samvat shown on the generic Panchang."
    };
  }

  if(language==="marathi"){
    const month=marathiMonth[lunar.amantaMonth]??lunar.amantaMonth;
    return {
      calendarSystem:"Marathi Panchang · Amanta",
      month:adhikaSuffix(month,lunar.amantaIsAdhika),
      nakshatra:data.nakshatra,
      note:"Marathi Panchang uses the Amanta lunar month convention. Adhika Maas is identified when no sidereal solar ingress occurs between the two new moons that bound the lunar month."
    };
  }

  return {
    calendarSystem:"Regional Panchang",
    month:lunar.amantaLabel,
    nakshatra:data.nakshatra,
    note:"Regional terminology is layered over the same location-sensitive astronomical calculation with the calendar convention stated explicitly."
  };
}
