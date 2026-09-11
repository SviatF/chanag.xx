import type {RegionalLanguageSlug} from "./regional-seo";
import type {RegionalCalendarProfile} from "./regional-calendar";

const rashi:Record<RegionalLanguageSlug,Record<string,string>>={
  bengali:{Mesha:"মেষ",Vrishabha:"বৃষ",Mithuna:"মিথুন",Karka:"কর্কট",Simha:"সিংহ",Kanya:"কন্যা",Tula:"তুলা",Vrishchika:"বৃশ্চিক",Dhanu:"ধনু",Makara:"মকর",Kumbha:"কুম্ভ",Meena:"মীন"},
  tamil:{Mesha:"மேஷம்",Vrishabha:"ரிஷபம்",Mithuna:"மிதுனம்",Karka:"கடகம்",Simha:"சிம்மம்",Kanya:"கன்னி",Tula:"துலாம்",Vrishchika:"விருச்சிகம்",Dhanu:"தனுசு",Makara:"மகரம்",Kumbha:"கும்பம்",Meena:"மீனம்"},
  malayalam:{Mesha:"മേടം",Vrishabha:"ഇടവം",Mithuna:"മിഥുനം",Karka:"കർക്കടകം",Simha:"ചിങ്ങം",Kanya:"കന്നി",Tula:"തുലാം",Vrishchika:"വൃശ്ചികം",Dhanu:"ധനു",Makara:"മകരം",Kumbha:"കുംഭം",Meena:"മീനം"},
  gujarati:{Mesha:"મેષ",Vrishabha:"વૃષભ",Mithuna:"મિથુન",Karka:"કર્ક",Simha:"સિંહ",Kanya:"કન્યા",Tula:"તુલા",Vrishchika:"વૃશ્ચિક",Dhanu:"ધન",Makara:"મકર",Kumbha:"કુંભ",Meena:"મીન"},
  marathi:{Mesha:"मेष",Vrishabha:"वृषभ",Mithuna:"मिथुन",Karka:"कर्क",Simha:"सिंह",Kanya:"कन्या",Tula:"तूळ",Vrishchika:"वृश्चिक",Dhanu:"धनु",Makara:"मकर",Kumbha:"कुंभ",Meena:"मीन"}
};

const tamilMonths:Record<string,string>={Chithirai:"சித்திரை",Vaikaasi:"வைகாசி",Aani:"ஆனி",Aadi:"ஆடி",Aavani:"ஆவணி",Purattaasi:"புரட்டாசி",Aippasi:"ஐப்பசி",Karthikai:"கார்த்திகை",Maargazhi:"மார்கழி",Thai:"தை",Maasi:"மாசி",Panguni:"பங்குனி"};
const malayalamMonths:Record<string,string>={Medam:"മേടം",Edavam:"ഇടവം",Mithunam:"മിഥുനം",Karkadakam:"കർക്കടകം",Chingam:"ചിങ്ങം",Kanni:"കന്നി",Thulam:"തുലാം",Vrishchikam:"വൃശ്ചികം",Dhanu:"ധനു",Makaram:"മകരം",Kumbham:"കുംഭം",Meenam:"മീനം"};
const gujaratiMonths:Record<string,string>={Chaitra:"ચૈત્ર",Vaishakha:"વૈશાખ",Jetha:"જેઠ",Ashadha:"અષાઢ",Shravana:"શ્રાવણ",Bhadarvo:"ભાદરવો",Aso:"આસો",Kartak:"કારતક",Magshar:"માગશર",Posh:"પોષ",Maha:"મહા",Phaguna:"ફાગણ"};
const marathiMonths:Record<string,string>={Chaitra:"चैत्र",Vaishakha:"वैशाख",Jyeshtha:"ज्येष्ठ",Ashadha:"आषाढ",Shravana:"श्रावण",Bhadrapada:"भाद्रपद",Ashwina:"आश्विन",Kartika:"कार्तिक",Margashirsha:"मार्गशीर्ष",Pausha:"पौष",Magha:"माघ",Phalguna:"फाल्गुन"};

const calendarNames:Record<RegionalLanguageSlug,string>={
  bengali:"বাংলা সৌর পঞ্জিকা",
  tamil:"தமிழ் சூரிய காலண்டர்",
  malayalam:"മലയാള സൗര കലണ്ടർ",
  gujarati:"ગુજરાતી પંચાંગ · અમાન્ત",
  marathi:"मराठी पंचांग · अमान्त",
};

export function nativeRashi(language:RegionalLanguageSlug,value:string|undefined){return value?rashi[language]?.[value]??value:"";}

export function nativeRegionalMonth(language:RegionalLanguageSlug,profile:RegionalCalendarProfile){
  if(profile.monthNative)return profile.monthNative;
  const adhika=/\s*\(Adhika\)\s*$/.test(profile.month);
  const base=profile.month.replace(/\s*\(Adhika\)\s*$/,"");
  if(language==="tamil")return tamilMonths[base]??base;
  if(language==="malayalam")return malayalamMonths[base]??base;
  if(language==="gujarati"){
    const month=gujaratiMonths[base]??base;
    return adhika?`અધિક ${month}`:month;
  }
  if(language==="marathi"){
    const month=marathiMonths[base]??base;
    return adhika?`अधिक ${month}`:month;
  }
  return profile.month;
}

export function nativeCalendarName(language:RegionalLanguageSlug){return calendarNames[language];}
