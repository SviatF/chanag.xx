import type {City} from "./cities";
import type {Panchang,TimeWindow} from "./panchang";
import {choghadiyaNativeNames,localizeNakshatra,localizePaksha,localizeTithi,nativeCityName} from "./regional-i18n";
import {regional} from "./regional";
import type {RegionalIntentSlug,RegionalLanguageSlug} from "./regional-seo";

type Fact={label:string;value:string;note?:string};

export type RegionalPanchangQualityContent={
  directAnswer:string;
  facts:Fact[];
  fingerprintTitle:string;
  fingerprintBody:string;
  timingTitle:string;
  timingBody:string;
  lunarTitle:string;
  lunarBody:string;
};

export type RegionalIntentQualityContent={
  directAnswer:string;
  facts:Fact[];
  analysisTitle:string;
  analysisBody:string;
  relationTitle:string;
  relationBody:string;
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function span(start:string,end:string){const a=clockMinutes(start),b=clockMinutes(end);return b>=a?b-a:b+1440-a;}
function windowMinutes(window:TimeWindow){return span(window.start,window.end);}
function overlap(a:TimeWindow,b:TimeWindow){
  const as=clockMinutes(a.start),ae=clockMinutes(a.end),bs=clockMinutes(b.start),be=clockMinutes(b.end);
  return Math.max(0,Math.min(ae,be)-Math.max(as,bs));
}
function nativeSequence(language:RegionalLanguageSlug,data:Panchang,night=false){
  const names=choghadiyaNativeNames[language];
  return (night?data.nightChoghadiya:data.dayChoghadiya).map(p=>`${names[p.name]??p.name} ${p.start}–${p.end}`).join(" · ");
}
function nextDateNote(language:RegionalLanguageSlug,base:string|null,date:string){
  if(!base||base===date)return "";
  const map:Record<RegionalLanguageSlug,string>={
    bengali:`পরের তারিখ ${base}`,
    tamil:`அடுத்த தேதி ${base}`,
    malayalam:`അടുത്ത തീയതി ${base}`,
    gujarati:`આગલી તારીખ ${base}`,
    marathi:`पुढील तारीख ${base}`,
  };
  return map[language];
}

const labels:Record<RegionalLanguageSlug,{
  daySpan:string;rahuStart:string;goodDay:string;moon:string;tithiEnd:string;nakEnd:string;
  fpTitle:(city:string)=>string;timingTitle:string;lunarTitle:string;
  rahuOffset:string;rahuDuration:string;rahuOverlap:string;daySegment:string;nightGood:string;
  intentAnalysisRahu:string;intentRelationRahu:string;intentAnalysisChoghadiya:string;intentRelationChoghadiya:string;
}>={
  bengali:{daySpan:"দিনের দৈর্ঘ্য",rahuStart:"সূর্যোদয়ের পর রাহুকাল",goodDay:"দিনের শুভ চৌঘড়িয়া",moon:"চাঁদের আলোকিত অংশ",tithiEnd:"তিথি শেষ",nakEnd:"নক্ষত্র শেষ",fpTitle:city=>`${city}-এর আজকের পঞ্জিকা-স্বাক্ষর`,timingTitle:"আজকের স্থানীয় সময়ের গঠন",lunarTitle:"তিথি ও নক্ষত্রের আজকের পরিবর্তন",rahuOffset:"রাহুকাল শুরু",rahuDuration:"রাহুকালের দৈর্ঘ্য",rahuOverlap:"শুভ চৌঘড়িয়ার সঙ্গে ওভারল্যাপ",daySegment:"গড় দিনের চৌঘড়িয়া",nightGood:"রাতে শুভ পর্ব",intentAnalysisRahu:"রাহুকাল দিনের কোথায় পড়ছে",intentRelationRahu:"রাহুকাল ও চৌঘড়িয়া একসঙ্গে পড়ুন",intentAnalysisChoghadiya:"আজকের চৌঘড়িয়া-বিন্যাস",intentRelationChoghadiya:"রাহুকালের সঙ্গে সম্পর্ক"},
  tamil:{daySpan:"பகல் நீளம்",rahuStart:"சூரியோதயத்திற்குப் பின் ராகு காலம்",goodDay:"பகல் சுப சௌகடியா",moon:"சந்திர ஒளி",tithiEnd:"திதி முடிவு",nakEnd:"நட்சத்திர முடிவு",fpTitle:city=>`${city} இன்றைய பஞ்சாங்கச் சுயவிவரம்`,timingTitle:"இன்றைய உள்ளூர் நேர அமைப்பு",lunarTitle:"இன்றைய திதி மற்றும் நட்சத்திர மாற்றங்கள்",rahuOffset:"ராகு காலம் தொடக்கம்",rahuDuration:"ராகு கால நீளம்",rahuOverlap:"சுப சௌகடியாவுடன் ஒட்டும் நேரம்",daySegment:"சராசரி பகல் சௌகடியா",nightGood:"இரவு சுப காலங்கள்",intentAnalysisRahu:"பகல் நேரத்தில் ராகு காலத்தின் இடம்",intentRelationRahu:"ராகு காலமும் சௌகடியாவும் சேர்த்து படிக்கவும்",intentAnalysisChoghadiya:"இன்றைய சௌகடியா அமைப்பு",intentRelationChoghadiya:"ராகு காலத்துடன் தொடர்பு"},
  malayalam:{daySpan:"പകൽ ദൈർഘ്യം",rahuStart:"സൂര്യോദയത്തിന് ശേഷം രാഹുകാലം",goodDay:"പകൽ ശുഭ ചൗഘടിയ",moon:"ചന്ദ്രപ്രകാശ ശതമാനം",tithiEnd:"തിഥി അവസാനം",nakEnd:"നക്ഷത്ര അവസാനം",fpTitle:city=>`${city} ഇന്നത്തെ പഞ്ചാംഗ സ്വഭാവം`,timingTitle:"ഇന്നത്തെ പ്രാദേശിക സമയഘടന",lunarTitle:"ഇന്നത്തെ തിഥി-നക്ഷത്ര മാറ്റങ്ങൾ",rahuOffset:"രാഹുകാലം ആരംഭം",rahuDuration:"രാഹുകാല ദൈർഘ്യം",rahuOverlap:"ശുഭ ചൗഘടിയയുമായുള്ള മിശ്രണം",daySegment:"ശരാശരി പകൽ ചൗഘടിയ",nightGood:"രാത്രിയിലെ ശുഭ ഘട്ടങ്ങൾ",intentAnalysisRahu:"പകൽ സമയത്തിലെ രാഹുകാലത്തിന്റെ സ്ഥാനം",intentRelationRahu:"രാഹുകാലവും ചൗഘടിയയും ഒരുമിച്ച് വായിക്കുക",intentAnalysisChoghadiya:"ഇന്നത്തെ ചൗഘടിയ ക്രമം",intentRelationChoghadiya:"രാഹുകാലവുമായി ബന്ധം"},
  gujarati:{daySpan:"દિવસનો સમયગાળો",rahuStart:"સૂર્યોદય પછી રાહુકાળ",goodDay:"દિવસના શુભ ચોઘડિયા",moon:"ચંદ્ર પ્રકાશ",tithiEnd:"તિથિ પૂર્ણ",nakEnd:"નક્ષત્ર પૂર્ણ",fpTitle:city=>`${city} આજના પંચાંગની વિશેષ રચના`,timingTitle:"આજની સ્થાનિક સમયરચના",lunarTitle:"આજની તિથિ અને નક્ષત્ર બદલાવ",rahuOffset:"રાહુકાળ શરૂઆત",rahuDuration:"રાહુકાળ સમયગાળો",rahuOverlap:"શુભ ચોઘડિયા સાથે ઓવરલેપ",daySegment:"સરેરાશ દિવસ ચોઘડિયું",nightGood:"રાત્રિના શુભ ચોઘડિયા",intentAnalysisRahu:"દિવસમાં રાહુકાળ ક્યાં આવે છે",intentRelationRahu:"રાહુકાળ અને ચોઘડિયું સાથે વાંચો",intentAnalysisChoghadiya:"આજના ચોઘડિયાની રચના",intentRelationChoghadiya:"રાહુકાળ સાથેનો સંબંધ"},
  marathi:{daySpan:"दिवसाचा कालावधी",rahuStart:"सूर्योदयानंतर राहुकाल",goodDay:"दिवसातील शुभ चौघडिया",moon:"चंद्रप्रकाश",tithiEnd:"तिथी समाप्त",nakEnd:"नक्षत्र समाप्त",fpTitle:city=>`${city} आजच्या पंचांगाची वैशिष्ट्यरचना`,timingTitle:"आजची स्थानिक वेळरचना",lunarTitle:"आजचे तिथी व नक्षत्र बदल",rahuOffset:"राहुकाल सुरू",rahuDuration:"राहुकाल कालावधी",rahuOverlap:"शुभ चौघडियाशी ओव्हरलॅप",daySegment:"सरासरी दिवस चौघडिया",nightGood:"रात्रीचे शुभ कालखंड",intentAnalysisRahu:"दिवसभरात राहुकाल कुठे येतो",intentRelationRahu:"राहुकाल आणि चौघडिया एकत्र वाचा",intentAnalysisChoghadiya:"आजच्या चौघडियाची रचना",intentRelationChoghadiya:"राहुकालाशी संबंध"},
};

function dailyBodies(language:RegionalLanguageSlug,args:{city:string;tithi:string;paksha:string;nak:string;sunrise:string;sunset:string;rahu:string;daylight:number;good:number;firstGood:string;lastGood:string;tithiEnd:string;nakEnd:string;month:string;moon:number}){
  const a=args;
  switch(language){
    case "bengali":return {
      direct:`আজ ${a.city}-এ ${a.tithi} তিথি (${a.paksha}), ${a.nak} নক্ষত্র; সূর্যোদয় ${a.sunrise}, সূর্যাস্ত ${a.sunset} এবং রাহুকাল ${a.rahu}।`,
      fingerprint:`${a.city}-এর আজকের ${a.daylight} মিনিটের সৌর দিনে ${a.good}টি শুভ চৌঘড়িয়া রয়েছে। প্রথম শুভ পর্ব ${a.firstGood}, শেষ শুভ পর্ব ${a.lastGood}; তাই আজকের সময়রেখা শুধু তিথি-নক্ষত্র নয়, স্থানীয় সূর্যোদয়-সূর্যাস্তের সঙ্গেও আলাদা।`,
      timing:`সূর্যোদয় ${a.sunrise} থেকে সূর্যাস্ত ${a.sunset} পর্যন্ত ${a.daylight} মিনিট। রাহুকাল ${a.rahu}; শুভ চৌঘড়িয়ার সংখ্যা ${a.good}। এই ঘড়ির সময়গুলো ${a.city}-এর আজকের সৌরদিন থেকেই তৈরি।`,
      lunar:`${a.tithi} তিথি শেষ ${a.tithiEnd}; ${a.nak} নক্ষত্র শেষ ${a.nakEnd}। আজকের আঞ্চলিক মাস ${a.month}, আর চাঁদের আলোকিত অংশ প্রায় ${a.moon}%।`
    };
    case "tamil":return {
      direct:`இன்று ${a.city}-ல் ${a.tithi} திதி (${a.paksha}), ${a.nak} நட்சத்திரம்; சூரியோதயம் ${a.sunrise}, சூரியாஸ்தமனம் ${a.sunset}, ராகு காலம் ${a.rahu}.`,
      fingerprint:`${a.city}-இன் ${a.daylight} நிமிட உள்ளூர் பகலில் ${a.good} சுப சௌகடியா காலங்கள் உள்ளன. முதல் சுப காலம் ${a.firstGood}, கடைசி சுப காலம் ${a.lastGood}; இதனால் இன்றைய நேர அமைப்பு நகரத்தின் சூரியோதயம்-சூரியாஸ்தமனத்துடன் நேரடியாக இணைகிறது.`,
      timing:`${a.sunrise} முதல் ${a.sunset} வரை ${a.daylight} நிமிடங்கள். ராகு காலம் ${a.rahu}; சுப பகல் சௌகடியா எண்ணிக்கை ${a.good}. இவை அனைத்தும் ${a.city}-இன் இன்றைய உள்ளூர் சூரிய நாளிலிருந்து கணக்கிடப்படுகின்றன.`,
      lunar:`${a.tithi} திதி ${a.tithiEnd} வரை; ${a.nak} நட்சத்திரம் ${a.nakEnd} வரை. இன்றைய பிராந்திய மாதம் ${a.month}; சந்திர ஒளி சுமார் ${a.moon}%.`
    };
    case "malayalam":return {
      direct:`ഇന്ന് ${a.city}-യിൽ ${a.tithi} തിഥി (${a.paksha}), ${a.nak} നക്ഷത്രം; സൂര്യോദയം ${a.sunrise}, സൂര്യാസ്തമയം ${a.sunset}, രാഹുകാലം ${a.rahu}.`,
      fingerprint:`${a.city}-യിലെ ${a.daylight} മിനിറ്റ് പ്രാദേശിക പകൽ സമയത്ത് ${a.good} ശുഭ ചൗഘടിയ ഘട്ടങ്ങളുണ്ട്. ആദ്യ ശുഭ ഘട്ടം ${a.firstGood}, അവസാനത്തെത് ${a.lastGood}; ഇന്നത്തെ സമയരൂപം പ്രാദേശിക സൂര്യോദയം-സൂര്യാസ്തമയവുമായി ബന്ധപ്പെട്ടു മാറുന്നു.`,
      timing:`${a.sunrise} മുതൽ ${a.sunset} വരെ ${a.daylight} മിനിറ്റ്. രാഹുകാലം ${a.rahu}; ശുഭ പകൽ ഘട്ടങ്ങൾ ${a.good}. സമയപരിധികൾ ${a.city}-യുടെ ഇന്നത്തെ സൂര്യദിനത്തിൽ നിന്നാണ് കണക്കാക്കുന്നത്.`,
      lunar:`${a.tithi} തിഥി ${a.tithiEnd} വരെ; ${a.nak} നക്ഷത്രം ${a.nakEnd} വരെ. ഇന്നത്തെ പ്രാദേശിക മാസം ${a.month}; ചന്ദ്രപ്രകാശം ഏകദേശം ${a.moon}%.`
    };
    case "gujarati":return {
      direct:`આજે ${a.city}માં ${a.tithi} તિથિ (${a.paksha}), ${a.nak} નક્ષત્ર; સૂર્યોદય ${a.sunrise}, સૂર્યાસ્ત ${a.sunset} અને રાહુકાળ ${a.rahu}.`,
      fingerprint:`${a.city}ના ${a.daylight} મિનિટના સ્થાનિક દિવસે ${a.good} શુભ ચોઘડિયા છે. પ્રથમ શુભ સમય ${a.firstGood} અને છેલ્લો શુભ સમય ${a.lastGood}; એટલે આજની સમયરચના સ્થાનિક સૂર્યોદય-સૂર્યાસ્ત સાથે ખરેખર બદલાય છે.`,
      timing:`સૂર્યોદય ${a.sunrise}થી સૂર્યાસ્ત ${a.sunset} સુધી ${a.daylight} મિનિટ. રાહુકાળ ${a.rahu}; શુભ દિવસ ચોઘડિયાની સંખ્યા ${a.good}. આ ઘડિયાળના સમય ${a.city}ના આજના સૂર્યદિવસ પરથી બને છે.`,
      lunar:`${a.tithi} તિથિ ${a.tithiEnd} સુધી; ${a.nak} નક્ષત્ર ${a.nakEnd} સુધી. આજનો પ્રાદેશિક મહિનો ${a.month}; ચંદ્ર પ્રકાશ લગભગ ${a.moon}%.`
    };
    case "marathi":return {
      direct:`आज ${a.city}मध्ये ${a.tithi} तिथी (${a.paksha}), ${a.nak} नक्षत्र; सूर्योदय ${a.sunrise}, सूर्यास्त ${a.sunset} आणि राहुकाल ${a.rahu}.`,
      fingerprint:`${a.city}च्या ${a.daylight} मिनिटांच्या स्थानिक दिवसात ${a.good} शुभ चौघडिया कालखंड आहेत. पहिला शुभ काल ${a.firstGood}, शेवटचा शुभ काल ${a.lastGood}; त्यामुळे आजची वेळरचना स्थानिक सूर्योदय-सूर्यास्तानुसार प्रत्यक्ष बदलते.`,
      timing:`सूर्योदय ${a.sunrise} ते सूर्यास्त ${a.sunset}: ${a.daylight} मिनिटे. राहुकाल ${a.rahu}; शुभ दिवस चौघडिया ${a.good}. हे सर्व वेळखंड ${a.city}च्या आजच्या सौरदिवसावरून मोजलेले आहेत.`,
      lunar:`${a.tithi} तिथी ${a.tithiEnd} पर्यंत; ${a.nak} नक्षत्र ${a.nakEnd} पर्यंत. आजचा प्रादेशिक महिना ${a.month}; चंद्रप्रकाश सुमारे ${a.moon}%.`
    };
  }
}

function intentBodies(language:RegionalLanguageSlug,intent:RegionalIntentSlug,args:{city:string;rahu:string;sunrise:string;sunset:string;offset:number;duration:number;overlapGood:number;daylight:number;dayGood:number;nightGood:number;avgDay:number;firstGood:string;lastGood:string;daySequence:string;nightSequence:string}){
  const a=args;
  if(intent==="rahu-kalam"){
    switch(language){
      case "bengali":return {direct:`আজ ${a.city}-এর রাহুকাল ${a.rahu}; সূর্যোদয় ${a.sunrise} এবং সূর্যাস্ত ${a.sunset}।`,analysis:`রাহুকাল সূর্যোদয়ের ${a.offset} মিনিট পরে শুরু হয় এবং ${a.duration} মিনিট স্থায়ী হয়। আজকের ${a.daylight} মিনিটের দিনের মধ্যে এটি শহরভিত্তিক সূর্যোদয়-সূর্যাস্ত থেকে নির্ধারিত।`,relation:`আজ রাহুকাল ${a.overlapGood} মিনিট এমন চৌঘড়িয়া পর্বের সঙ্গে মিলে যায় যেগুলো আলাদাভাবে শুভ নামে চিহ্নিত। তাই রাহুকাল ও চৌঘড়িয়া একসঙ্গে দেখলে সময়ের সংঘাত স্পষ্ট হয়।`};
      case "tamil":return {direct:`இன்று ${a.city}-இன் ராகு காலம் ${a.rahu}; சூரியோதயம் ${a.sunrise}, சூரியாஸ்தமனம் ${a.sunset}.`,analysis:`ராகு காலம் சூரியோதயத்திற்குப் பிறகு ${a.offset} நிமிடத்தில் தொடங்கி ${a.duration} நிமிடங்கள் நீள்கிறது. இன்றைய ${a.daylight} நிமிட உள்ளூர் பகலிலிருந்து இந்த நேரம் பெறப்படுகிறது.`,relation:`இன்று ராகு காலம், தனியாக சுபமாக குறிக்கப்பட்ட சௌகடியா பகுதிகளுடன் ${a.overlapGood} நிமிடங்கள் ஒட்டுகிறது. அதனால் இரு அட்டவணைகளையும் சேர்த்து வாசிப்பது நேர மோதலை தெளிவாக்கும்.`};
      case "malayalam":return {direct:`ഇന്ന് ${a.city}-യിലെ രാഹുകാലം ${a.rahu}; സൂര്യോദയം ${a.sunrise}, സൂര്യാസ്തമയം ${a.sunset}.`,analysis:`രാഹുകാലം സൂര്യോദയത്തിന് ${a.offset} മിനിറ്റ് ശേഷം തുടങ്ങി ${a.duration} മിനിറ്റ് നീളുന്നു. ഇന്നത്തെ ${a.daylight} മിനിറ്റ് പ്രാദേശിക പകൽ സമയത്തിൽ നിന്നാണ് ഈ പരിധി കണക്കാക്കുന്നത്.`,relation:`ഇന്ന് രാഹുകാലം ശുഭമായി അടയാളപ്പെടുത്തിയ ചൗഘടിയ ഘട്ടങ്ങളുമായി ${a.overlapGood} മിനിറ്റ് ഒത്തുചേരുന്നു. അതിനാൽ രണ്ടു സമയപ്പട്ടികകളും ഒരുമിച്ച് വായിക്കുമ്പോൾ യഥാർത്ഥ സമയസംഘർഷം വ്യക്തമാകും.`};
      case "gujarati":return {direct:`આજે ${a.city}નો રાહુકાળ ${a.rahu}; સૂર્યોદય ${a.sunrise} અને સૂર્યાસ્ત ${a.sunset}.`,analysis:`રાહુકાળ સૂર્યોદય પછી ${a.offset} મિનિટે શરૂ થાય છે અને ${a.duration} મિનિટ ચાલે છે. આજના ${a.daylight} મિનિટના સ્થાનિક દિવસ પરથી આ સમયગાળો બને છે.`,relation:`આજે રાહુકાળ ${a.overlapGood} મિનિટ એવા ચોઘડિયા સાથે મળે છે જે અલગથી શુભ ગણાય છે. તેથી રાહુકાળ અને ચોઘડિયું સાથે જોવાથી સમયનો વાસ્તવિક અથડામણ ભાગ સ્પષ્ટ થાય છે.`};
      case "marathi":return {direct:`आज ${a.city}चा राहुकाल ${a.rahu}; सूर्योदय ${a.sunrise} आणि सूर्यास्त ${a.sunset}.`,analysis:`राहुकाल सूर्योदयानंतर ${a.offset} मिनिटांनी सुरू होतो आणि ${a.duration} मिनिटे चालतो. आजच्या ${a.daylight} मिनिटांच्या स्थानिक दिवसावरून ही वेळ ठरते.`,relation:`आज राहुकाल ${a.overlapGood} मिनिटे अशा चौघडिया कालखंडांशी जुळतो जे स्वतंत्रपणे शुभ म्हणून दाखवले आहेत. म्हणून दोन्ही वेळापत्रके एकत्र पाहणे महत्त्वाचे आहे.`};
    }
  }
  switch(language){
    case "bengali":return {direct:`আজ ${a.city}-এ দিনের ${a.dayGood}টি ও রাতের ${a.nightGood}টি শুভ চৌঘড়িয়া রয়েছে। প্রথম দিনের শুভ পর্ব ${a.firstGood}; শেষটি ${a.lastGood}।`,analysis:`আজ দিনের প্রতিটি চৌঘড়িয়া গড়ে প্রায় ${a.avgDay} মিনিট। দিনের সম্পূর্ণ ক্রম: ${a.daySequence}। এই ক্রমের নাম বারভিত্তিক হলেও ঘড়ির সীমানা ${a.sunrise} সূর্যোদয় ও ${a.sunset} সূর্যাস্ত থেকে তৈরি।`,relation:`রাহুকাল ${a.rahu} এবং শুভ-চিহ্নিত চৌঘড়িয়ার সঙ্গে ওভারল্যাপ ${a.overlapGood} মিনিট। রাতের ক্রম: ${a.nightSequence}।`};
    case "tamil":return {direct:`இன்று ${a.city}-ல் பகலில் ${a.dayGood} மற்றும் இரவில் ${a.nightGood} சுப சௌகடியா காலங்கள் உள்ளன. முதல் பகல் சுப காலம் ${a.firstGood}; கடைசியாக ${a.lastGood}.`,analysis:`இன்றைய ஒவ்வொரு பகல் சௌகடியாவும் சராசரியாக ${a.avgDay} நிமிடங்கள். முழு பகல் வரிசை: ${a.daySequence}. பெயர்வரிசை வாரநாளை சார்ந்தது; நேர எல்லைகள் ${a.sunrise} சூரியோதயம் மற்றும் ${a.sunset} சூரியாஸ்தமனத்திலிருந்து உருவாகின்றன.`,relation:`ராகு காலம் ${a.rahu}; சுபமாக குறிக்கப்பட்ட சௌகடியாவுடன் ${a.overlapGood} நிமிடங்கள் ஒட்டுகிறது. இரவு வரிசை: ${a.nightSequence}.`};
    case "malayalam":return {direct:`ഇന്ന് ${a.city}-യിൽ പകൽ ${a.dayGood}യും രാത്രി ${a.nightGood}യും ശുഭ ചൗഘടിയ ഘട്ടങ്ങളുണ്ട്. ആദ്യ പകൽ ശുഭഘട്ടം ${a.firstGood}; അവസാനത്തേത് ${a.lastGood}.`,analysis:`ഇന്നത്തെ ഓരോ പകൽ ചൗഘടിയയും ശരാശരി ${a.avgDay} മിനിറ്റ്. പൂർണ്ണ പകൽ ക്രമം: ${a.daySequence}. പേരുകളുടെ ക്രമം ആഴ്ചാദിനത്തെ ആശ്രയിച്ചാലും സമയപരിധികൾ ${a.sunrise} സൂര്യോദയവും ${a.sunset} സൂര്യാസ്തമയവും അടിസ്ഥാനമാക്കുന്നു.`,relation:`രാഹുകാലം ${a.rahu}; ശുഭമായി അടയാളപ്പെടുത്തിയ ചൗഘടിയയുമായി ${a.overlapGood} മിനിറ്റ് ഒത്തുചേരുന്നു. രാത്രി ക്രമം: ${a.nightSequence}.`};
    case "gujarati":return {direct:`આજે ${a.city}માં દિવસના ${a.dayGood} અને રાત્રિના ${a.nightGood} શુભ ચોઘડિયા છે. પ્રથમ દિવસનો શુભ સમય ${a.firstGood}; છેલ્લો ${a.lastGood}.`,analysis:`આજે દરેક દિવસ ચોઘડિયું સરેરાશ લગભગ ${a.avgDay} મિનિટનું છે. સંપૂર્ણ દિવસક્રમ: ${a.daySequence}. નામક્રમ વાર પ્રમાણે રહે છે, પરંતુ ઘડિયાળની સીમાઓ ${a.sunrise} સૂર્યોદય અને ${a.sunset} સૂર્યાસ્ત પરથી બને છે.`,relation:`રાહુકાળ ${a.rahu}; શુભ ગણાતા ચોઘડિયા સાથે ${a.overlapGood} મિનિટનો ઓવરલેપ છે. રાત્રિ ક્રમ: ${a.nightSequence}.`};
    case "marathi":return {direct:`आज ${a.city}मध्ये दिवसाचे ${a.dayGood} आणि रात्रीचे ${a.nightGood} शुभ चौघडिया कालखंड आहेत. पहिला दिवसाचा शुभ काल ${a.firstGood}; शेवटचा ${a.lastGood}.`,analysis:`आज प्रत्येक दिवस चौघडिया सरासरी सुमारे ${a.avgDay} मिनिटांचा आहे. पूर्ण दिवसक्रम: ${a.daySequence}. नावांचा क्रम वारावर आधारित असतो, पण घड्याळाच्या सीमा ${a.sunrise} सूर्योदय व ${a.sunset} सूर्यास्तावरून तयार होतात.`,relation:`राहुकाल ${a.rahu}; शुभ चौघडियाशी ${a.overlapGood} मिनिटांचा ओव्हरलॅप आहे. रात्रीचा क्रम: ${a.nightSequence}.`};
  }
}

export function buildRegionalPanchangQualityContent(language:RegionalLanguageSlug,city:City,data:Panchang,displayMonth:string):RegionalPanchangQualityContent{
  const cityName=nativeCityName(language,city);
  const tithi=localizeTithi(language,data.tithi);
  const paksha=localizePaksha(language,data.paksha);
  const nak=localizeNakshatra(language,data.nakshatra);
  const dayMinutes=span(data.sunrise,data.sunset);
  const good=data.dayChoghadiya.filter(p=>p.effect==="good");
  const names=choghadiyaNativeNames[language];
  const firstGood=good[0]?`${names[good[0].name]??good[0].name} ${good[0].start}–${good[0].end}`:"—";
  const lastGood=good.length?`${names[good[good.length-1].name]??good[good.length-1].name} ${good[good.length-1].start}–${good[good.length-1].end}`:"—";
  const tithiEnd=`${data.tithiEnd}${nextDateNote(language,data.tithiEndDate,data.date)?` · ${nextDateNote(language,data.tithiEndDate,data.date)}`:""}`;
  const nakEnd=`${data.nakshatraEnd}${nextDateNote(language,data.nakshatraEndDate,data.date)?` · ${nextDateNote(language,data.nakshatraEndDate,data.date)}`:""}`;
  const rahuOffset=Math.max(0,clockMinutes(data.rahu.start)-clockMinutes(data.sunrise));
  const body=dailyBodies(language,{city:cityName,tithi,paksha,nak,sunrise:data.sunrise,sunset:data.sunset,rahu:`${data.rahu.start}–${data.rahu.end}`,daylight:dayMinutes,good:good.length,firstGood,lastGood,tithiEnd,nakEnd,month:displayMonth,moon:data.moonIllumination});
  const l=labels[language];
  return {
    directAnswer:body.direct,
    facts:[
      {label:l.daySpan,value:`${dayMinutes} min`,note:`${data.sunrise}–${data.sunset}`},
      {label:l.rahuStart,value:`${rahuOffset} min`,note:`${data.rahu.start}–${data.rahu.end}`},
      {label:l.goodDay,value:String(good.length),note:firstGood},
      {label:l.moon,value:`${data.moonIllumination}%`},
      {label:l.tithiEnd,value:tithiEnd,note:tithi},
      {label:l.nakEnd,value:nakEnd,note:nak},
    ],
    fingerprintTitle:l.fpTitle(cityName),fingerprintBody:body.fingerprint,
    timingTitle:l.timingTitle,timingBody:body.timing,
    lunarTitle:l.lunarTitle,lunarBody:body.lunar,
  };
}

export function buildRegionalIntentQualityContent(language:RegionalLanguageSlug,city:City,intent:RegionalIntentSlug,data:Panchang):RegionalIntentQualityContent{
  const cityName=nativeCityName(language,city);
  const names=choghadiyaNativeNames[language];
  const dayGood=data.dayChoghadiya.filter(p=>p.effect==="good");
  const nightGood=data.nightChoghadiya.filter(p=>p.effect==="good");
  const dayMinutes=span(data.sunrise,data.sunset);
  const avgDay=data.dayChoghadiya.length?Math.round(dayMinutes/data.dayChoghadiya.length):0;
  const firstGood=dayGood[0]?`${names[dayGood[0].name]??dayGood[0].name} ${dayGood[0].start}–${dayGood[0].end}`:"—";
  const lastGood=dayGood.length?`${names[dayGood[dayGood.length-1].name]??dayGood[dayGood.length-1].name} ${dayGood[dayGood.length-1].start}–${dayGood[dayGood.length-1].end}`:"—";
  const rahuOffset=Math.max(0,clockMinutes(data.rahu.start)-clockMinutes(data.sunrise));
  const rahuDuration=windowMinutes(data.rahu);
  const overlapGood=dayGood.reduce((sum,p)=>sum+overlap(data.rahu,{start:p.start,end:p.end}),0);
  const body=intentBodies(language,intent,{city:cityName,rahu:`${data.rahu.start}–${data.rahu.end}`,sunrise:data.sunrise,sunset:data.sunset,offset:rahuOffset,duration:rahuDuration,overlapGood,daylight:dayMinutes,dayGood:dayGood.length,nightGood:nightGood.length,avgDay,firstGood,lastGood,daySequence:nativeSequence(language,data),nightSequence:nativeSequence(language,data,true)});
  const l=labels[language];
  return {
    directAnswer:body.direct,
    facts:intent==="rahu-kalam"?[
      {label:l.rahuOffset,value:`${rahuOffset} min`,note:data.sunrise},
      {label:l.rahuDuration,value:`${rahuDuration} min`,note:`${data.rahu.start}–${data.rahu.end}`},
      {label:l.rahuOverlap,value:`${overlapGood} min`},
      {label:l.daySpan,value:`${dayMinutes} min`,note:`${data.sunrise}–${data.sunset}`},
    ]:[
      {label:l.goodDay,value:String(dayGood.length),note:firstGood},
      {label:l.nightGood,value:String(nightGood.length)},
      {label:l.daySegment,value:`~${avgDay} min`},
      {label:l.rahuOverlap,value:`${overlapGood} min`,note:`${data.rahu.start}–${data.rahu.end}`},
    ],
    analysisTitle:intent==="rahu-kalam"?l.intentAnalysisRahu:l.intentAnalysisChoghadiya,
    analysisBody:body.analysis,
    relationTitle:intent==="rahu-kalam"?l.intentRelationRahu:l.intentRelationChoghadiya,
    relationBody:body.relation,
  };
}
