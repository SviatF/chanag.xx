import type {City} from "./cities";
import type {ChoghadiyaPeriod,Panchang,TimeWindow} from "./panchang";
import {choghadiyaNativeNames,nativeCityName} from "./regional-i18n";
import type {RegionalIntentSlug,RegionalLanguageSlug} from "./regional-seo";

type Fact={label:string;value:string;note?:string};

export type RegionalIntentCityContext={
  title:string;
  body:string;
  solarTitle:string;
  solarBody:string;
  structureTitle:string;
  structureBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function span(start:string,end:string){
  const a=clockMinutes(start),b=clockMinutes(end);
  return b>=a?b-a:b+1440-a;
}
function periodMinutes(period:ChoghadiyaPeriod){
  const start=clockMinutes(period.start)+period.startDayOffset*1440;
  const end=clockMinutes(period.end)+period.endDayOffset*1440;
  return Math.max(0,end-start);
}
function overlapMinutes(window:TimeWindow,period:ChoghadiyaPeriod){
  const a={start:clockMinutes(window.start),end:clockMinutes(window.end)};
  const b={start:clockMinutes(period.start)+period.startDayOffset*1440,end:clockMinutes(period.end)+period.endDayOffset*1440};
  return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));
}
function goodPeriods(periods:readonly ChoghadiyaPeriod[]){return periods.filter(period=>period.effect==="good");}
function goodSlots(periods:readonly ChoghadiyaPeriod[]){return periods.map((period,index)=>period.effect==="good"?index+1:0).filter(Boolean);}
function spread(periods:readonly ChoghadiyaPeriod[]){
  const values=periods.map(periodMinutes).filter(value=>value>0);
  if(!values.length)return {min:0,max:0,avg:0};
  return {min:Math.min(...values),max:Math.max(...values),avg:Math.round(values.reduce((a,b)=>a+b,0)/values.length)};
}
function meridianShift(lng:number){return Math.round((lng-82.5)*4);}
function rahuShare(data:Panchang){
  const day=span(data.sunrise,data.sunset);
  if(!day)return 0;
  return ((clockMinutes(data.rahu.start)-clockMinutes(data.sunrise)+1440)%1440)/day;
}

const geo:Partial<Record<RegionalLanguageSlug,Record<string,string>>>={
  bengali:{
    kolkata:"নিম্ন হুগলি নদী ও গাঙ্গেয় বদ্বীপের সমতল ভূপ্রকৃতিতে কলকাতার সূর্যোদয়-সূর্যাস্তের ঘড়ি পূর্ব ভারতের অবস্থানকে অনুসরণ করে। নদী ও বদ্বীপঘেঁষা এই ভৌগোলিক অবস্থান শহরটির দৈনিক সৌর-সীমাকে পশ্চিম ভারতের শহরগুলোর তুলনায় আলাদা করে।"
  },
  tamil:{
    chennai:"கொரோமண்டல் கடற்கரையில் வங்காள விரிகுடாவை ஒட்டிய சென்னை, தென் இந்தியாவின் கிழக்குப் பக்க சூரிய நேர அமைப்பைக் கொண்டுள்ளது. கடற்கரைத் தாழ்வுநிலமும் கிழக்கு நீளவெளியும் இங்குள்ள சூரியோதய-சூரியாஸ்தமன எல்லைகளை உள்வாரி நகரங்களிலிருந்து வேறுபடுத்துகின்றன."
  },
  gujarati:{
    ahmedabad:"સાબરમતી નદીકાંઠાના પશ્ચિમ ભારતના આંતરિક સમતલ વિસ્તારમાં આવેલ અમદાવાદનો સ્થાનિક સૂર્યઘડિયાળ દરિયાકાંઠાના દક્ષિણ ગુજરાતથી અલગ સ્વરૂપ ધરાવે છે. શહેરનો પશ્ચિમ લૉન્ગિટ્યુડ સૂર્યોદય અને સૂર્યાસ્તની ઘડિયાળને ભારતીય માનક મધ્યરેખાથી સ્પષ્ટ રીતે પાછળ રાખે છે.",
    surat:"તાપી નદીના નીચલા પ્રવાહ અને અરબી સમુદ્રની નજીક આવેલ સુરત દક્ષિણ ગુજરાતના કિનારાસમીપના સૂર્યપ્રોફાઇલને અનુસરે છે. અમદાવાદ કરતાં વધુ દક્ષિણ અને સમુદ્રની નજીક હોવાના કારણે દિવસ-રાતના વિભાગોની સ્થાનિક ઘડિયાળ અલગ રીતે બેસે છે.",
    vadodara:"મધ્ય ગુજરાતના વિશ્વામિત્રી ખીણ વિસ્તારમાં આવેલ વડોદરા અમદાવાદના આંતરિક મેદાન અને સુરતના દરિયાકાંઠા વચ્ચેનો અલગ ભૂગોળીય પટ્ટો દર્શાવે છે. તેનો થોડો વધુ પૂર્વીય લૉન્ગિટ્યુડ સ્થાનિક સૂર્યસમયને પશ્ચિમ ગુજરાતના શહેરોથી અલગ કરે છે."
  },
  marathi:{
    mumbai:"अरबी समुद्रालगतच्या कोकण किनारपट्टीवरील बेटसमूहातून विकसित झालेल्या मुंबईत सौर दिवसाची घड्याळी सीमा समुद्री पश्चिम किनाऱ्याच्या स्थानाशी जोडलेली असते. भारताच्या मानक रेखांशापासून बरेच पश्चिमेला असल्यामुळे सूर्योदय-सूर्यास्ताची स्थानिक वेळ मध्य व पूर्व भारतापेक्षा उशिरा दिसते.",
    pune:"सह्याद्रीच्या पूर्वेकडील उंच दख्खन पठारावर असलेले पुणे मुंबईच्या समुद्री किनारी पट्ट्यापेक्षा अंतर्गत आणि अधिक उंच भौगोलिक चौकट ठेवते. पठारी स्थान, पश्चिम रेखांश आणि स्थानिक सूर्योदय-सूर्यास्त मिळून दिवसाच्या चौघडिया विभागांची स्वतंत्र घड्याळी रचना तयार करतात.",
    nagpur:"विदर्भातील अंतर्गत मध्य भारतीय पठारी भागात असलेले नागपूर महाराष्ट्रातील पश्चिमेकडील शहरांपेक्षा लक्षणीय पूर्वेला आहे. म्हणून मानक रेखांशाशी त्याचे नाते मुंबई-पुण्यापेक्षा वेगळे असून स्थानिक सौर सीमा दिवसाच्या विभागांना अधिक पूर्वेकडील घड्याळी चौकट देतात.",
    thane:"मुंबई महानगराच्या ईशान्येकडील खाडी, उपसागर आणि कोकण पट्ट्यात असलेले ठाणे समुद्री-पश्चिम स्थान राखते, पण मुंबईच्या बेटकेंद्रित भूगोलापेक्षा वेगळी खाडीआधारित रचना ठेवते. त्यामुळे जवळ असूनही स्थानिक सूर्योदय-सूर्यास्त आणि विभागांच्या सीमांना स्वतंत्र शहराधारित गणना लागते."
  }
};

const copy:Record<RegionalLanguageSlug,{
  title:(city:string)=>string;
  solarTitle:string;
  structureTitleRahu:string;
  structureTitleChoghadiya:string;
  west:(minutes:number)=>string;
  east:(minutes:number)=>string;
  near:string;
  latLow:string;latMid:string;latHigh:string;
  dayShort:string;dayMid:string;dayLong:string;
  rahuEarly:string;rahuMid:string;rahuLate:string;
  solar:(args:{city:string;sunrise:string;sunset:string;day:number;lat:string;meridian:string})=>string;
  rahu:(args:{city:string;start:string;end:string;phase:string;overlap:number;good:number})=>string;
  choghadiya:(args:{city:string;dayGood:string;nightGood:string;daySpread:string;nightSpread:string;sequence:string})=>string;
  labels:{geo:string;meridian:string;latitude:string;daylight:string;rahu:string;goodDay:string;goodNight:string;spread:string};
}>={
  bengali:{
    title:city=>`${city}-এর স্থানীয় সময়-প্রোফাইল`,solarTitle:"স্থানীয় সৌরঘড়ি ও দিনের আকৃতি",structureTitleRahu:"রাহুকালের স্থানীয় অবস্থান",structureTitleChoghadiya:"চৌঘড়িয়ার স্থানীয় বিন্যাস",
    west:m=>`ভারতীয় মান সময়ের মানক মধ্যরেখার পশ্চিমে প্রায় ${m} সৌর-মিনিট`,east:m=>`ভারতীয় মান সময়ের মানক মধ্যরেখার পূর্বে প্রায় ${m} সৌর-মিনিট`,near:"মানক মধ্যরেখার খুব কাছাকাছি",latLow:"দক্ষিণ অক্ষাংশ-বেল্ট",latMid:"মধ্য ভারতীয় অক্ষাংশ-বেল্ট",latHigh:"উত্তর অক্ষাংশ-বেল্ট",dayShort:"তুলনামূলক সংক্ষিপ্ত দিন",dayMid:"মধ্যম দৈর্ঘ্যের দিন",dayLong:"দীর্ঘতর দিন",rahuEarly:"দিনের শুরুর ভাগ",rahuMid:"দিনের মধ্যভাগ",rahuLate:"দিনের শেষ ভাগ",
    solar:a=>`${a.city}-এ আজ সূর্যোদয় ${a.sunrise} এবং সূর্যাস্ত ${a.sunset}; মোট দিনের দৈর্ঘ্য ${a.day} মিনিট। এই দিনটি ${a.lat} এবং ${a.meridian}—এই দুই স্থানীয় সংকেতের সমন্বয়ে গঠিত। তাই একই বার হলেও অন্য শহরের ঘড়ির সময় সরাসরি কপি করা যায় না।`,
    rahu:a=>`${a.city}-এর রাহুকাল ${a.start}–${a.end}, যা আজকের সৌর দিনের ${a.phase}-এ পড়ছে। শুভ-চিহ্নিত দিনের চৌঘড়িয়ার সঙ্গে মোট ${a.overlap} মিনিট ছেদ আছে এবং দিনের ${a.good}টি পর্ব শুভ হিসেবে চিহ্নিত। এই সম্পর্ক শহরভেদে সময়ের ব্যবহারিক পার্থক্য দেখায়।`,
    choghadiya:a=>`${a.city}-এর দিনের শুভ পর্ব ${a.dayGood}; রাতের শুভ পর্ব ${a.nightGood}। দিনের আট ভাগের দৈর্ঘ্য ${a.daySpread} এবং রাতের ভাগ ${a.nightSpread}। আজকের স্থানীয় ক্রম: ${a.sequence}। এই ক্রম বার-নির্ভর, কিন্তু প্রতিটি সীমার ঘড়ির সময় শহরের সূর্যোদয়-সূর্যাস্ত থেকে তৈরি হয়।`,
    labels:{geo:"ভৌগোলিক প্রোফাইল",meridian:"মানক মধ্যরেখার সম্পর্ক",latitude:"অক্ষাংশ অঞ্চল",daylight:"দিনের দৈর্ঘ্য",rahu:"রাহুকাল অবস্থান",goodDay:"দিনের শুভ পর্ব",goodNight:"রাতের শুভ পর্ব",spread:"বিভাগের দৈর্ঘ্য"}
  },
  tamil:{
    title:city=>`${city} உள்ளூர் நேர அடையாளம்`,solarTitle:"உள்ளூர் சூரிய நேரமும் பகல் வடிவமும்",structureTitleRahu:"ராகு காலத்தின் உள்ளூர் நிலை",structureTitleChoghadiya:"சௌகடியாவின் உள்ளூர் அமைப்பு",
    west:m=>`இந்திய நிலையான தீர்க்கரேகைக்கு மேற்கே சுமார் ${m} சூரிய நிமிடங்கள்`,east:m=>`இந்திய நிலையான தீர்க்கரேகைக்கு கிழக்கே சுமார் ${m} சூரிய நிமிடங்கள்`,near:"இந்திய நிலையான தீர்க்கரேகைக்கு மிக அருகில்",latLow:"தெற்கு அகலாங்கு வளையம்",latMid:"மத்திய இந்திய அகலாங்கு வளையம்",latHigh:"வடக்கு அகலாங்கு வளையம்",dayShort:"ஒப்பீட்டளவில் குறுகிய பகல்",dayMid:"மிதமான நீளமுள்ள பகல்",dayLong:"நீளமான பகல்",rahuEarly:"பகலின் தொடக்க பகுதி",rahuMid:"பகலின் நடுப்பகுதி",rahuLate:"பகலின் இறுதி பகுதி",
    solar:a=>`${a.city} இன்று ${a.sunrise} மணிக்கு சூரியோதயமும் ${a.sunset} மணிக்கு சூரியாஸ்தமனமும் பெறுகிறது; பகல் நீளம் ${a.day} நிமிடங்கள். இது ${a.lat} மற்றும் ${a.meridian} என்ற இரண்டு உள்ளூர் அடையாளங்களால் வடிவமைக்கப்படுகிறது. அதனால் அதே கிழமையிலிருந்தாலும் மற்றொரு நகரத்தின் நேர எல்லைகளை அப்படியே பயன்படுத்த முடியாது.`,
    rahu:a=>`${a.city}-இல் ராகு காலம் ${a.start}–${a.end}; இது இன்றைய சூரிய பகலின் ${a.phase}-இல் வருகிறது. சுபமாகக் குறிக்கப்பட்ட பகல் சௌகடியாவுடன் ${a.overlap} நிமிடங்கள் ஒட்டுகிறது; மொத்தம் ${a.good} பகல் பகுதிகள் சுபமாக உள்ளன.`,
    choghadiya:a=>`${a.city}-இல் பகலின் சுப பகுதிகள் ${a.dayGood}; இரவின் சுப பகுதிகள் ${a.nightGood}. பகல் எட்டு பகுதிகளின் நீளம் ${a.daySpread}, இரவின் பகுதி நீளம் ${a.nightSpread}. இன்றைய உள்ளூர் வரிசை: ${a.sequence}. பெயர் வரிசை கிழமையைப் பின்பற்றினாலும் நேர எல்லைகள் உள்ளூர் சூரியோதயமும் சூரியாஸ்தமனமும் சார்ந்தவை.`,
    labels:{geo:"புவியியல் அடையாளம்",meridian:"நிலையான தீர்க்கரேகை உறவு",latitude:"அகலாங்கு வளையம்",daylight:"பகல் நீளம்",rahu:"ராகு கால நிலை",goodDay:"பகல் சுப பகுதிகள்",goodNight:"இரவு சுப பகுதிகள்",spread:"பகுதி நீளம்"}
  },
  malayalam:{
    title:city=>`${city} പ്രാദേശിക സമയ സ്വഭാവം`,solarTitle:"പ്രാദേശിക സൗരസമയംയും പകൽ രൂപവും",structureTitleRahu:"രാഹുകാലത്തിന്റെ പ്രാദേശിക സ്ഥാനം",structureTitleChoghadiya:"ചൗഘടിയയുടെ പ്രാദേശിക ഘടന",
    west:m=>`ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് രേഖാംശത്തിന്റെ പടിഞ്ഞാറ് ഏകദേശം ${m} സൗര മിനിറ്റ്`,east:m=>`ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് രേഖാംശത്തിന്റെ കിഴക്ക് ഏകദേശം ${m} സൗര മിനിറ്റ്`,near:"സ്റ്റാൻഡേർഡ് രേഖാംശത്തിന് വളരെ സമീപം",latLow:"തെക്കൻ അക്ഷാംശ മേഖല",latMid:"മധ്യ ഇന്ത്യൻ അക്ഷാംശ മേഖല",latHigh:"വടക്കൻ അക്ഷാംശ മേഖല",dayShort:"താരതമ്യേന ചുരുങ്ങിയ പകൽ",dayMid:"മിതമായ ദൈർഘ്യമുള്ള പകൽ",dayLong:"കൂടുതൽ ദൈർഘ്യമുള്ള പകൽ",rahuEarly:"പകൽ ആരംഭ ഭാഗം",rahuMid:"പകൽ മധ്യ ഭാഗം",rahuLate:"പകൽ അവസാന ഭാഗം",
    solar:a=>`${a.city} ഇന്ന് ${a.sunrise}-ന് സൂര്യോദയവും ${a.sunset}-ന് സൂര്യാസ്തമയവും കാണുന്നു; പകൽ ദൈർഘ്യം ${a.day} മിനിറ്റ്. ${a.lat}, ${a.meridian} എന്നീ പ്രാദേശിക ഘടകങ്ങൾ സമയപരിധികളെ നിർണ്ണയിക്കുന്നു.`,
    rahu:a=>`${a.city}-യിലെ രാഹുകാലം ${a.start}–${a.end}; ഇത് ഇന്നത്തെ സൗരപകലിന്റെ ${a.phase}-ലാണ്. ശുഭമായി അടയാളപ്പെടുത്തിയ പകൽ ചൗഘടിയയുമായി ${a.overlap} മിനിറ്റ് മിശ്രണം ഉണ്ടാകുന്നു; പകൽ ${a.good} ശുഭ ഘട്ടങ്ങളുണ്ട്.`,
    choghadiya:a=>`${a.city}-യിലെ പകൽ ശുഭ ഘട്ടങ്ങൾ ${a.dayGood}; രാത്രി ശുഭ ഘട്ടങ്ങൾ ${a.nightGood}. പകൽ ഘട്ടങ്ങളുടെ ദൈർഘ്യം ${a.daySpread}, രാത്രിയുടേത് ${a.nightSpread}. ഇന്നത്തെ ക്രമം: ${a.sequence}.`,
    labels:{geo:"ഭൗഗോള സ്വഭാവം",meridian:"സ്റ്റാൻഡേർഡ് രേഖാംശ ബന്ധം",latitude:"അക്ഷാംശ മേഖല",daylight:"പകൽ ദൈർഘ്യം",rahu:"രാഹുകാല സ്ഥാനം",goodDay:"പകൽ ശുഭ ഘട്ടങ്ങൾ",goodNight:"രാത്രി ശുഭ ഘട്ടങ്ങൾ",spread:"ഘട്ട ദൈർഘ്യം"}
  },
  gujarati:{
    title:city=>`${city} માટે સ્થાનિક સમય-નકશો`,solarTitle:"સ્થાનિક સૂર્યઘડિયાળ અને દિવસનો આકાર",structureTitleRahu:"રાહુકાળનું સ્થાનિક સ્થાન",structureTitleChoghadiya:"ચોઘડિયાની સ્થાનિક રચના",
    west:m=>`ભારતીય માનક મધ્યરેખાથી પશ્ચિમે આશરે ${m} સૂર્ય-મિનિટ`,east:m=>`ભારતીય માનક મધ્યરેખાથી પૂર્વે આશરે ${m} સૂર્ય-મિનિટ`,near:"ભારતીય માનક મધ્યરેખાની ખૂબ નજીક",latLow:"દક્ષિણ અક્ષાંશ પટ્ટો",latMid:"મધ્ય ભારતીય અક્ષાંશ પટ્ટો",latHigh:"ઉત્તર અક્ષાંશ પટ્ટો",dayShort:"તુલનાત્મક ટૂંકો દિવસ",dayMid:"મધ્યમ લંબાઈનો દિવસ",dayLong:"લાંબો દિવસ",rahuEarly:"દિવસનો શરૂઆતનો ભાગ",rahuMid:"દિવસનો મધ્ય ભાગ",rahuLate:"દિવસનો અંતિમ ભાગ",
    solar:a=>`${a.city}માં આજે સૂર્યોદય ${a.sunrise} અને સૂર્યાસ્ત ${a.sunset} છે; કુલ દિવસ ${a.day} મિનિટનો છે. આ સમયરચનામાં ${a.lat} અને ${a.meridian} બંને અસર કરે છે. તેથી એક જ વારના ચોઘડિયા હોવા છતાં બીજા શહેરની ઘડિયાળની સીમાઓ અહીં સીધી લાગુ પડતી નથી.`,
    rahu:a=>`${a.city}નો રાહુકાળ ${a.start}–${a.end} છે અને તે આજના સૂર્યદિવસના ${a.phase}માં આવે છે. શુભ ચોઘડિયા સાથે ${a.overlap} મિનિટનો કુલ ઓવરલેપ છે, જ્યારે દિવસના ${a.good} વિભાગ શુભ ચિહ્નિત છે. આ સંબંધ સ્થાનિક સમય વાંચવામાં મહત્વનો છે.`,
    choghadiya:a=>`${a.city}માં દિવસના શુભ વિભાગ ${a.dayGood}; રાત્રિના શુભ વિભાગ ${a.nightGood}. દિવસના આઠ વિભાગોની લંબાઈ ${a.daySpread} અને રાત્રિના વિભાગોની લંબાઈ ${a.nightSpread} છે. આજનો સ્થાનિક ક્રમ: ${a.sequence}. નામનો ક્રમ વારથી નક્કી થાય છે, પરંતુ દરેક વિભાગની ઘડિયાળ સ્થાનિક સૂર્યોદય અને સૂર્યાસ્તથી બને છે.`,
    labels:{geo:"ભૌગોલિક પ્રોફાઇલ",meridian:"માનક મધ્યરેખા સંબંધ",latitude:"અક્ષાંશ પટ્ટો",daylight:"દિવસની લંબાઈ",rahu:"રાહુકાળ સ્થાન",goodDay:"દિવસના શુભ વિભાગ",goodNight:"રાત્રિના શુભ વિભાગ",spread:"વિભાગ લંબાઈ"}
  },
  marathi:{
    title:city=>`${city} स्थानिक वेळ-स्वाक्षरी`,solarTitle:"स्थानिक सौरघड्याळ आणि दिवसाची रचना",structureTitleRahu:"राहुकालाचे स्थानिक स्थान",structureTitleChoghadiya:"चौघडियाची स्थानिक रचना",
    west:m=>`भारतीय मानक रेखांशापासून पश्चिमेला सुमारे ${m} सौर-मिनिटे`,east:m=>`भारतीय मानक रेखांशापासून पूर्वेला सुमारे ${m} सौर-मिनिटे`,near:"भारतीय मानक रेखांशाच्या अगदी जवळ",latLow:"दक्षिण अक्षांश पट्टा",latMid:"मध्य भारतीय अक्षांश पट्टा",latHigh:"उत्तर अक्षांश पट्टा",dayShort:"तुलनेने लहान दिवस",dayMid:"मध्यम लांबीचा दिवस",dayLong:"लांब दिवस",rahuEarly:"दिवसाचा सुरुवातीचा भाग",rahuMid:"दिवसाचा मधला भाग",rahuLate:"दिवसाचा शेवटचा भाग",
    solar:a=>`${a.city} येथे आज सूर्योदय ${a.sunrise} आणि सूर्यास्त ${a.sunset}; एकूण दिवस ${a.day} मिनिटांचा आहे. ${a.lat} आणि ${a.meridian} या दोन स्थानिक घटकांमुळे घड्याळी सीमा तयार होतात. म्हणून समान वार असला तरी दुसऱ्या शहरातील वेळा येथे तशाच लागू होत नाहीत.`,
    rahu:a=>`${a.city}चा राहुकाल ${a.start}–${a.end} असून तो आजच्या सौर दिवसाच्या ${a.phase}मध्ये येतो. शुभ चौघडिया कालखंडांशी एकूण ${a.overlap} मिनिटे छेद होतो आणि दिवसात ${a.good} शुभ विभाग आहेत.`,
    choghadiya:a=>`${a.city}मध्ये दिवसातील शुभ विभाग ${a.dayGood}; रात्रीतील शुभ विभाग ${a.nightGood}. दिवसाच्या आठ विभागांची लांबी ${a.daySpread}, तर रात्रीची ${a.nightSpread}. आजचा स्थानिक क्रम: ${a.sequence}. नावांचा क्रम वारावर ठरतो; प्रत्येक विभागाची घड्याळी सीमा मात्र स्थानिक सूर्योदय-सूर्यास्तावर ठरते.`,
    labels:{geo:"भौगोलिक प्रोफाइल",meridian:"मानक रेखांश संबंध",latitude:"अक्षांश पट्टा",daylight:"दिवसाची लांबी",rahu:"राहुकाल स्थान",goodDay:"दिवसातील शुभ विभाग",goodNight:"रात्रीतील शुभ विभाग",spread:"विभाग लांबी"}
  }
};

function latitudeBand(language:RegionalLanguageSlug,lat:number){
  const c=copy[language];
  if(lat<16)return c.latLow;
  if(lat<25)return c.latMid;
  return c.latHigh;
}
function daylightBand(language:RegionalLanguageSlug,minutes:number){
  const c=copy[language];
  if(minutes<715)return c.dayShort;
  if(minutes<755)return c.dayMid;
  return c.dayLong;
}
function rahuBand(language:RegionalLanguageSlug,share:number){
  const c=copy[language];
  if(share<0.34)return c.rahuEarly;
  if(share<0.67)return c.rahuMid;
  return c.rahuLate;
}
function meridianText(language:RegionalLanguageSlug,shift:number){
  const c=copy[language];
  if(Math.abs(shift)<5)return c.near;
  return shift<0?c.west(Math.abs(shift)):c.east(Math.abs(shift));
}
function localGeo(language:RegionalLanguageSlug,city:City){
  return geo[language]?.[city.slug]??`${nativeCityName(language,city)} માટે સ્થાનિક સૂર્યસમય શહેરના અક્ષાંશ અને રેખાંશ પરથી ગણાય છે.`;
}
function slotText(values:number[]){return values.length?values.join(" · "):"—";}
function nativeSequence(language:RegionalLanguageSlug,periods:readonly ChoghadiyaPeriod[]){
  const names=choghadiyaNativeNames[language];
  return periods.map(period=>names[period.name]??period.name).join(" → ");
}

export function buildRegionalIntentCityContext(language:RegionalLanguageSlug,city:City,intent:RegionalIntentSlug,data:Panchang):RegionalIntentCityContext{
  const c=copy[language];
  const cityName=nativeCityName(language,city);
  const dayMinutes=span(data.sunrise,data.sunset);
  const shift=meridianShift(city.lng);
  const lat=latitudeBand(language,city.lat);
  const meridian=meridianText(language,shift);
  const dayClass=daylightBand(language,dayMinutes);
  const phase=rahuBand(language,rahuShare(data));
  const dayGood=goodPeriods(data.dayChoghadiya);
  const nightGood=goodPeriods(data.nightChoghadiya);
  const daySlots=goodSlots(data.dayChoghadiya);
  const nightSlots=goodSlots(data.nightChoghadiya);
  const rahuOverlap=dayGood.reduce((sum,period)=>sum+overlapMinutes(data.rahu,period),0);
  const daySpread=spread(data.dayChoghadiya),nightSpread=spread(data.nightChoghadiya);
  const sequence=nativeSequence(language,data.dayChoghadiya);

  return {
    title:c.title(cityName),
    body:localGeo(language,city),
    solarTitle:c.solarTitle,
    solarBody:c.solar({city:cityName,sunrise:data.sunrise,sunset:data.sunset,day:dayMinutes,lat,meridian}),
    structureTitle:intent==="rahu-kalam"?c.structureTitleRahu:c.structureTitleChoghadiya,
    structureBody:intent==="rahu-kalam"
      ?c.rahu({city:cityName,start:data.rahu.start,end:data.rahu.end,phase,overlap:rahuOverlap,good:dayGood.length})
      :c.choghadiya({city:cityName,dayGood:slotText(daySlots),nightGood:slotText(nightSlots),daySpread:`${daySpread.min}–${daySpread.max} મિનિટ`,nightSpread:`${nightSpread.min}–${nightSpread.max} મિનિટ`,sequence}),
    facts:[
      {label:c.labels.geo,value:cityName,note:localGeo(language,city)},
      {label:c.labels.meridian,value:meridian,note:`${city.lng.toFixed(2)}°E`},
      {label:c.labels.latitude,value:lat,note:`${city.lat.toFixed(2)}°N`},
      {label:c.labels.daylight,value:`${dayMinutes} min`,note:dayClass},
      {label:c.labels.rahu,value:phase,note:`${data.rahu.start}–${data.rahu.end}`},
      {label:c.labels.goodDay,value:slotText(daySlots),note:`${dayGood.length} local slots`},
      {label:c.labels.goodNight,value:slotText(nightSlots),note:`${nightGood.length} local slots`},
      {label:c.labels.spread,value:`${daySpread.min}–${daySpread.max} / ${nightSpread.min}–${nightSpread.max} min`,note:"day / night"},
    ]
  };
}
