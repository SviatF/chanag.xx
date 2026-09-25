import type {City} from "./cities";
import type {Panchang,ChoghadiyaPeriod} from "./panchang";
import {buildRegionalIntentCityContext} from "./regional-intent-city-context";
import {choghadiyaNativeNames,localizeNakshatra,localizePaksha,localizeTithi,nativeCityName} from "./regional-i18n";
import type {RegionalLanguageSlug} from "./regional-seo";

type Fact={label:string;value:string;note?:string};

export type RegionalCityContext={
  localityTitle:string;
  localityBody:string;
  solarTitle:string;
  solarBody:string;
  lunarTitle:string;
  lunarBody:string;
  dayTitle:string;
  dayBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function span(start:string,end:string){const a=clockMinutes(start),b=clockMinutes(end);return b>=a?b-a:b+1440-a;}
function goodPeriods(periods:readonly ChoghadiyaPeriod[]){return periods.filter(period=>period.effect==="good");}
function overlapMinutes(start:string,end:string,period:ChoghadiyaPeriod){
  const a1=clockMinutes(start),a2=clockMinutes(end),b1=clockMinutes(period.start)+period.startDayOffset*1440,b2=clockMinutes(period.end)+period.endDayOffset*1440;
  return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1));
}
function endPhase(data:Panchang,end:string,endDate:string|null){
  if(endDate&&endDate>data.date)return "next-date";
  const value=clockMinutes(end),rise=clockMinutes(data.sunrise),set=clockMinutes(data.sunset);
  if(value<rise)return "before-sunrise";
  const share=(value-rise)/Math.max(1,set-rise);
  if(share<0.34)return "early-day";
  if(share<0.67)return "middle-day";
  if(share<=1)return "late-day";
  return "after-sunset";
}
function rahuPhase(data:Panchang){
  const rise=clockMinutes(data.sunrise),set=clockMinutes(data.sunset),start=clockMinutes(data.rahu.start);
  const share=(start-rise)/Math.max(1,set-rise);
  return share<0.34?"early":share<0.67?"middle":"late";
}
function moonBand(value:number){if(value<15)return "dark";if(value<40)return "low";if(value<70)return "half-lit";if(value<90)return "bright";return "near-full";}
function goodSequence(language:RegionalLanguageSlug,periods:readonly ChoghadiyaPeriod[]){
  const names=choghadiyaNativeNames[language];
  return periods.map((period,index)=>period.effect==="good"?`${index+1}:${names[period.name]??period.name}`:null).filter(Boolean).join(" · ")||"—";
}

const copy:Record<RegionalLanguageSlug,{
  lunarTitle:string;dayTitle:string;
  phase:Record<string,string>;rahu:Record<string,string>;moon:Record<string,string>;
  lunar:(a:{city:string;tithi:string;paksha:string;tithiPhase:string;nak:string;nakPhase:string;month:string;moon:string})=>string;
  day:(a:{city:string;rahu:string;overlap:number;dayGood:string;nightGood:string})=>string;
  labels:{tithi:string;nak:string;moon:string;rahu:string;dayGood:string;nightGood:string};
}>={
  bengali:{
    lunarTitle:"আজকের তিথি-নক্ষত্রের স্থানীয় গতি",dayTitle:"দিনের ব্যবহারিক সময়-গঠন",
    phase:{"next-date":"পরের তারিখে","before-sunrise":"সূর্যোদয়ের আগে","early-day":"দিনের প্রথম ভাগে","middle-day":"দিনের মাঝামাঝি","late-day":"দিনের শেষ ভাগে","after-sunset":"সূর্যাস্তের পরে"},
    rahu:{early:"দিনের প্রথম ভাগ",middle:"দিনের মাঝামাঝি",late:"দিনের শেষ ভাগ"},moon:{dark:"অতি ক্ষীণ চাঁদ",low:"কম আলোকিত চাঁদ","half-lit":"মধ্যম আলোকিত চাঁদ",bright:"উজ্জ্বল চাঁদ","near-full":"প্রায় পূর্ণ আলোকিত চাঁদ"},
    lunar:a=>`${a.city}-এর আজকের পঞ্জিকায় ${a.paksha} ${a.tithi} তিথি ${a.tithiPhase} বদলায়, আর ${a.nak} নক্ষত্রের পরিবর্তন ${a.nakPhase}। ${a.month} মাসের এই অবস্থায় চন্দ্রালোকে ${a.moon} প্রোফাইল দেখা যায়। একই দিনের তিথি ও নক্ষত্র অন্য শহরে একই ঘড়ির সময়ে শেষ নাও হতে পারে, কারণ এখানে স্থানীয় সূর্যোদয় ও ভৌগোলিক অবস্থান ব্যবহার করা হয়েছে।`,
    day:a=>`${a.city}-এ রাহুকাল আজ ${a.rahu} পড়ে। দিনের শুভ চৌঘড়িয়ার সঙ্গে এর ছেদ ${a.overlap} মিনিট। দিনের শুভ অবস্থানগুলি ${a.dayGood}; রাতের শুভ অবস্থানগুলি ${a.nightGood}। ফলে দিনের সময়-মানচিত্রটি কেবল বারভিত্তিক নামের তালিকা নয়, স্থানীয় সূর্যোদয়-সূর্যাস্তের উপর বসানো একটি শহরভিত্তিক কাঠামো।`,
    labels:{tithi:"তিথি পরিবর্তন",nak:"নক্ষত্র পরিবর্তন",moon:"চন্দ্রালোকে অবস্থা",rahu:"রাহুকালের অবস্থান",dayGood:"দিনের শুভ ভাগ",nightGood:"রাতের শুভ ভাগ"}
  },
  tamil:{
    lunarTitle:"இன்றைய திதி-நட்சத்திர உள்ளூர் நகர்வு",dayTitle:"நாளின் உள்ளூர் நேர அமைப்பு",
    phase:{"next-date":"அடுத்த தேதியில்","before-sunrise":"சூரியோதயத்திற்கு முன்","early-day":"பகலின் ஆரம்பத்தில்","middle-day":"பகலின் நடுப்பகுதியில்","late-day":"பகலின் இறுதியில்","after-sunset":"சூரியாஸ்தமனத்திற்கு பின்"},
    rahu:{early:"பகலின் ஆரம்ப பகுதி",middle:"பகலின் நடுப்பகுதி",late:"பகலின் இறுதி பகுதி"},moon:{dark:"மிகக் குறைந்த சந்திரஒளி",low:"குறைந்த சந்திரஒளி","half-lit":"நடுத்தர சந்திரஒளி",bright:"பிரகாசமான சந்திரஒளி","near-full":"முழுநிலவுக்கு அண்மையான ஒளி"},
    lunar:a=>`${a.city} இன்றைய பஞ்சாங்கத்தில் ${a.paksha} ${a.tithi} திதி ${a.tithiPhase} மாறுகிறது; ${a.nak} நட்சத்திர மாற்றம் ${a.nakPhase} வருகிறது. ${a.month} மாதத்தின் இந்த நாளில் சந்திரன் ${a.moon} நிலையில் உள்ளது. இந்த முடிவு நேரங்கள் நகரத்தின் உள்ளூர் சூரியோதயமும் வானியல் நிலையும் கொண்டு பெறப்படுவதால் வேறு நகரத்தின் நேரத்தை நேரடியாக நகலெடுக்க முடியாது.`,
    day:a=>`${a.city} இன்றைய ராகு காலம் ${a.rahu} அமைகிறது; நல்ல சௌகடியா பகுதிகளுடன் ${a.overlap} நிமிட ஒட்டுதல் உள்ளது. பகல் நல்ல இடங்கள் ${a.dayGood}; இரவு நல்ல இடங்கள் ${a.nightGood}. வாரத்தின் பெயர் வரிசை ஒரே மாதிரியாக இருந்தாலும் நேர எல்லைகள் இந்த நகரத்தின் சூரியோதயம்-சூரியாஸ்தமனத்திலிருந்து உருவாகின்றன.`,
    labels:{tithi:"திதி மாற்றம்",nak:"நட்சத்திர மாற்றம்",moon:"சந்திரஒளி நிலை",rahu:"ராகு கால நிலை",dayGood:"பகல் நல்ல பகுதிகள்",nightGood:"இரவு நல்ல பகுதிகள்"}
  },
  malayalam:{
    lunarTitle:"ഇന്നത്തെ തിഥി-നക്ഷത്ര പ്രാദേശിക ഗതി",dayTitle:"ദിവസത്തിന്റെ പ്രാദേശിക സമയഘടന",
    phase:{"next-date":"അടുത്ത തീയതിയിൽ","before-sunrise":"സൂര്യോദയത്തിന് മുമ്പ്","early-day":"പകൽ ആദ്യഭാഗത്ത്","middle-day":"പകൽ മധ്യത്തിൽ","late-day":"പകൽ അവസാനഭാഗത്ത്","after-sunset":"സൂര്യാസ്തമയത്തിന് ശേഷം"},
    rahu:{early:"പകൽ ആദ്യഭാഗം",middle:"പകൽ മധ്യഭാഗം",late:"പകൽ അവസാനഭാഗം"},moon:{dark:"വളരെ കുറഞ്ഞ ചന്ദ്രപ്രകാശം",low:"കുറഞ്ഞ ചന്ദ്രപ്രകാശം","half-lit":"മധ്യനില ചന്ദ്രപ്രകാശം",bright:"തിളക്കമുള്ള ചന്ദ്രപ്രകാശം","near-full":"പൂർണചന്ദ്രനോട് അടുക്കുന്ന പ്രകാശം"},
    lunar:a=>`${a.city} ഇന്നത്തെ പഞ്ചാംഗത്തിൽ ${a.paksha} ${a.tithi} തിഥി ${a.tithiPhase} മാറുന്നു; ${a.nak} നക്ഷത്രമാറ്റം ${a.nakPhase} വരുന്നു. ${a.month} മാസത്തിലെ ഈ ദിവസത്തിന് ${a.moon} സ്വഭാവമാണ്. അവസാനസമയങ്ങൾ നഗരത്തിന്റെ സ്വന്തം സൂര്യോദയത്തെയും ജ്യോതിശാസ്ത്രസ്ഥാനത്തെയും അടിസ്ഥാനമാക്കിയതിനാൽ മറ്റൊരു നഗരത്തിന്റെ സമയവുമായി നേരിട്ട് മാറ്റിസ്ഥാപിക്കാനാവില്ല.`,
    day:a=>`${a.city} ഇന്നത്തെ രാഹുകാലം ${a.rahu} വരുന്നു. നല്ല ചൗഘടിയ ഘട്ടങ്ങളുമായി ${a.overlap} മിനിറ്റ് മിശ്രണം ഉണ്ട്. പകൽ നല്ല സ്ഥാനങ്ങൾ ${a.dayGood}; രാത്രി നല്ല സ്ഥാനങ്ങൾ ${a.nightGood}. സമയപരിധികൾ നഗരത്തിന്റെ പ്രാദേശിക സൂര്യോദയ-സൂര്യാസ്തമയത്തിൽ നിന്നാണ് രൂപപ്പെടുന്നത്.`,
    labels:{tithi:"തിഥി മാറ്റം",nak:"നക്ഷത്ര മാറ്റം",moon:"ചന്ദ്രപ്രകാശ നില",rahu:"രാഹുകാല സ്ഥാനം",dayGood:"പകൽ നല്ല ഘട്ടങ്ങൾ",nightGood:"രാത്രി നല്ല ഘട്ടങ്ങൾ"}
  },
  gujarati:{
    lunarTitle:"આજની તિથિ-નક્ષત્રની સ્થાનિક ગતિ",dayTitle:"દિવસની સ્થાનિક સમયરચના",
    phase:{"next-date":"આગલી તારીખે","before-sunrise":"સૂર્યોદય પહેલાં","early-day":"દિવસના આરંભમાં","middle-day":"દિવસના મધ્યમાં","late-day":"દિવસના અંતિમ ભાગમાં","after-sunset":"સૂર્યાસ્ત પછી"},
    rahu:{early:"દિવસનો આરંભિક ભાગ",middle:"દિવસનો મધ્ય ભાગ",late:"દિવસનો અંતિમ ભાગ"},moon:{dark:"ખૂબ ઓછો ચંદ્રપ્રકાશ",low:"ઓછો ચંદ્રપ્રકાશ","half-lit":"મધ્યમ ચંદ્રપ્રકાશ",bright:"તેજસ્વી ચંદ્રપ્રકાશ","near-full":"પૂર્ણિમા નજીકનો ચંદ્રપ્રકાશ"},
    lunar:a=>`${a.city}ના આજના પંચાંગમાં ${a.paksha} ${a.tithi} તિથિ ${a.tithiPhase} બદલાય છે અને ${a.nak} નક્ષત્રનો ફેરફાર ${a.nakPhase} આવે છે. ${a.month} માસના આ દિવસે ચંદ્ર ${a.moon} સ્થિતિમાં છે. આ અંતસમયો શહેરના પોતાના સૂર્યોદય અને ખગોળીય સ્થિતિથી બને છે, તેથી અમદાવાદ, સુરત અને વડોદરા જેવા નજીકના બજારો માટે પણ એક જ ઘડિયાળ નકલ કરવી યોગ્ય નથી.`,
    day:a=>`${a.city}માં આજનો રાહુકાળ ${a.rahu} આવે છે અને શુભ ચોઘડિયા ભાગો સાથે કુલ ${a.overlap} મિનિટનો છેદ થાય છે. દિવસના શુભ ક્રમસ્થાનો ${a.dayGood}; રાત્રિના શુભ ક્રમસ્થાનો ${a.nightGood}. વારના નામો સમાન હોઈ શકે, પરંતુ દરેક વિભાગની વાસ્તવિક ઘડિયાળ શહેરના સ્થાનિક સૂર્યોદય-સૂર્યાસ્તથી નક્કી થાય છે.`,
    labels:{tithi:"તિથિ ફેરફાર",nak:"નક્ષત્ર ફેરફાર",moon:"ચંદ્રપ્રકાશ સ્થિતિ",rahu:"રાહુકાળ સ્થાન",dayGood:"દિવસના શુભ ભાગ",nightGood:"રાત્રિના શુભ ભાગ"}
  },
  marathi:{
    lunarTitle:"आजच्या तिथी-नक्षत्राची स्थानिक गती",dayTitle:"दिवसाची स्थानिक वेळरचना",
    phase:{"next-date":"पुढील तारखेला","before-sunrise":"सूर्योदयापूर्वी","early-day":"दिवसाच्या सुरुवातीला","middle-day":"दिवसाच्या मध्यात","late-day":"दिवसाच्या शेवटच्या भागात","after-sunset":"सूर्यास्तानंतर"},
    rahu:{early:"दिवसाचा सुरुवातीचा भाग",middle:"दिवसाचा मधला भाग",late:"दिवसाचा शेवटचा भाग"},moon:{dark:"अतिशय कमी चंद्रप्रकाश",low:"कमी चंद्रप्रकाश","half-lit":"मध्यम चंद्रप्रकाश",bright:"तेजस्वी चंद्रप्रकाश","near-full":"पौर्णिमेजवळचा चंद्रप्रकाश"},
    lunar:a=>`${a.city}च्या आजच्या पंचांगात ${a.paksha} ${a.tithi} तिथी ${a.tithiPhase} बदलते आणि ${a.nak} नक्षत्रबदल ${a.nakPhase} होतो. ${a.month} महिन्याच्या या दिवशी चंद्र ${a.moon} अवस्थेत आहे. हे संक्रमण शहराच्या स्थानिक सूर्योदयावर आधारित असल्यामुळे मुंबई, पुणे, नागपूर किंवा ठाण्याची घड्याळी सीमा एकमेकांच्या जागी वापरता येत नाही.`,
    day:a=>`${a.city}मध्ये आजचा राहुकाल ${a.rahu} येतो आणि शुभ चौघडिया भागांशी ${a.overlap} मिनिटांचा छेद होतो. दिवसातील शुभ क्रमस्थान ${a.dayGood}; रात्रीतील शुभ क्रमस्थान ${a.nightGood}. वारानुसार नावे समान असली तरी प्रत्येक कालखंडाची वास्तविक सीमा स्थानिक सूर्योदय-सूर्यास्तावर ठरते.`,
    labels:{tithi:"तिथी बदल",nak:"नक्षत्र बदल",moon:"चंद्रप्रकाश स्थिती",rahu:"राहुकाल स्थान",dayGood:"दिवसातील शुभ भाग",nightGood:"रात्रीतील शुभ भाग"}
  }
};

export function buildRegionalCityContext(language:RegionalLanguageSlug,city:City,data:Panchang,displayMonth:string):RegionalCityContext{
  const base=buildRegionalIntentCityContext(language,city,"choghadiya",data),c=copy[language],cityName=nativeCityName(language,city);
  const tithiPhase=c.phase[endPhase(data,data.tithiEnd,data.tithiEndDate)],nakPhase=c.phase[endPhase(data,data.nakshatraEnd,data.nakshatraEndDate)];
  const moon=c.moon[moonBand(data.moonIllumination)],rahu=c.rahu[rahuPhase(data)];
  const dayGood=goodPeriods(data.dayChoghadiya),nightGood=goodPeriods(data.nightChoghadiya);
  const overlap=dayGood.reduce((sum,period)=>sum+overlapMinutes(data.rahu.start,data.rahu.end,period),0);
  const dayGoodText=goodSequence(language,data.dayChoghadiya),nightGoodText=goodSequence(language,data.nightChoghadiya);
  const tithi=localizeTithi(language,data.tithi),nak=localizeNakshatra(language,data.nakshatra),paksha=localizePaksha(language,data.paksha);
  const daylight=span(data.sunrise,data.sunset);

  return {
    localityTitle:base.title,
    localityBody:base.body,
    solarTitle:base.solarTitle,
    solarBody:base.solarBody,
    lunarTitle:c.lunarTitle,
    lunarBody:c.lunar({city:cityName,tithi,paksha,tithiPhase,nak,nakPhase,month:displayMonth,moon}),
    dayTitle:c.dayTitle,
    dayBody:`${base.structureBody} ${c.day({city:cityName,rahu,overlap,dayGood:dayGoodText,nightGood:nightGoodText})}`,
    facts:[
      {label:c.labels.tithi,value:tithiPhase,note:tithi},
      {label:c.labels.nak,value:nakPhase,note:nak},
      {label:c.labels.moon,value:moon,note:`${Math.round(data.moonIllumination)}%`},
      {label:c.labels.rahu,value:rahu,note:`${data.rahu.start}–${data.rahu.end}`},
      {label:c.labels.dayGood,value:dayGoodText,note:`${dayGood.length} · ${daylight} min daylight`},
      {label:c.labels.nightGood,value:nightGoodText,note:`${nightGood.length} local periods`},
    ]
  };
}
