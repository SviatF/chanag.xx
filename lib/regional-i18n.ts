import type {City} from "./cities";
import type {RegionalLanguageSlug,RegionalIntentSlug} from "./regional-seo";

export type RegionalLocale={
  hreflang:string;
  nativeLanguage:string;
  panchangName:string;
  cityPanchangTitle:(city:string)=>string;
  cityMetaTitle:(city:string)=>string;
  cityMetaDescription:(city:string)=>string;
  hubTitle:string;
  hubDescription:string;
  citiesTitle:string;
  citiesIntro:string;
  methodologyTitle:string;
  methodologyText:string;
  noCoverageTitle:string;
  noCoverageText:string;
  allLanguages:string;
  allCities:string;
  localTiming:string;
  localCalculation:string;
  until:string;
  pada:string;
  paksha:string;
  solarRashi:string;
  vikramSamvat:string;
  shakaSamvat:string;
  gujaratiSamvat:string;
  yearBegins:string;
  solarTransitionTitle:string;
  solarTransitionText:(from:string,to:string,time:string)=>string;
  calendarExplanationTitle:string;
  afterMidnightNote:string;
  dayChoghadiya:string;
  nightChoghadiya:string;
  sunriseToSunset:string;
  sunsetToNextSunrise:string;
  goodPeriods:string;
  neutralPeriod:string;
  difficultPeriods:string;
  fullPanchang:string;
  monthlyCalendar:string;
  regionalContext:string;
  calculationContext:string;
  intentTitle:(intent:RegionalIntentSlug,city:string)=>string;
  intentMetaTitle:(intent:RegionalIntentSlug,city:string)=>string;
  intentMetaDescription:(intent:RegionalIntentSlug,city:string)=>string;
  rahuExplanation:(city:string)=>string;
  choghadiyaExplanation:(city:string)=>string;
};

const locales:Record<RegionalLanguageSlug,RegionalLocale>={
  bengali:{
    hreflang:"bn-IN",nativeLanguage:"বাংলা",panchangName:"বাংলা পঞ্জিকা",
    cityPanchangTitle:city=>`আজকের পঞ্জিকা · ${city}`,
    cityMetaTitle:city=>`${city} আজকের বাংলা পঞ্জিকা — তিথি, নক্ষত্র ও রাহুকাল`,
    cityMetaDescription:city=>`${city}-এর আজকের বাংলা পঞ্জিকা: তিথি, নক্ষত্র, সূর্যোদয়, সূর্যাস্ত, রাহুকাল, বাংলা মাস ও স্থানীয় সময়।`,
    hubTitle:"বাংলা পঞ্জিকা — শহর অনুযায়ী",hubDescription:"নিজের শহর বেছে আজকের তিথি, নক্ষত্র, বাংলা মাস, সূর্যোদয়-সূর্যাস্ত ও রাহুকাল দেখুন।",
    citiesTitle:"বাংলা পঞ্জিকার শহর",citiesIntro:"নিচের প্রতিটি পঞ্জিকা শহরের নিজস্ব অক্ষাংশ-দ্রাঘিমা ও স্থানীয় সূর্যোদয়-সূর্যাস্ত অনুযায়ী গণনা করা হয়।",
    methodologyTitle:"বাংলা পঞ্জিকা কীভাবে দেখানো হয়",methodologyText:"Panchvani একই জ্যোতির্বৈজ্ঞানিক গণনার উপর বাংলা সৌর মাস, বাংলা পরিভাষা এবং শহরভিত্তিক সময় দেখায়। বাংলা মাস নির্ধারণে সংশ্লিষ্ট সৌর সংক্রান্তির civil-day নিয়ম ব্যবহার করা হয়।",
    noCoverageTitle:"শহরভিত্তিক বাংলা পঞ্জিকা শীঘ্রই",noCoverageText:"এই ভাষার জন্য উপযুক্ত শহর সক্রিয় না হওয়া পর্যন্ত পাতাটি সার্চ ইঞ্জিনে পাঠানো হয় না।",
    allLanguages:"সব আঞ্চলিক ভাষা",allCities:"সব বাংলা পঞ্জিকার শহর",localTiming:"স্থানীয় সময়",localCalculation:"শহরভিত্তিক গণনা",until:"পর্যন্ত",pada:"পদ",paksha:"পক্ষ",solarRashi:"সূর্য রাশি",vikramSamvat:"বিক্রম সংবৎ",shakaSamvat:"শক সংবৎ",gujaratiSamvat:"গুজরাটি সংবৎ",yearBegins:"বর্ষ শুরু",solarTransitionTitle:"এই দিনে সৌর সংক্রান্তি",solarTransitionText:(from,to,time)=>`${from} থেকে ${to} রাশিতে প্রবেশ ${time} IST-এ। আঞ্চলিক মাসটি কেবল সূর্যোদয়ের রাশি দেখে নয়, বাংলা civil-day নিয়ম অনুযায়ী নির্ধারিত।`,calendarExplanationTitle:"বাংলা ক্যালেন্ডার ও স্থানীয় গণনা",afterMidnightNote:"মধ্যরাতের পরে শেষ হওয়া তিথি বা নক্ষত্রে পরের civil date-ও দেখানো হয়, যাতে সময় নিয়ে বিভ্রান্তি না থাকে।",dayChoghadiya:"দিনের চৌঘড়িয়া",nightChoghadiya:"রাত্রির চৌঘড়িয়া",sunriseToSunset:"সূর্যোদয় → সূর্যাস্ত",sunsetToNextSunrise:"সূর্যাস্ত → পরের সূর্যোদয়",goodPeriods:"শুভ / লাভ / অমৃত",neutralPeriod:"চর",difficultPeriods:"রোগ / কাল / উদ্বেগ",fullPanchang:"সম্পূর্ণ পঞ্জিকা",monthlyCalendar:"মাসিক ক্যালেন্ডার",regionalContext:"বাংলা পঞ্জিকা",calculationContext:"সম্পূর্ণ গণনা",
    intentTitle:(intent,city)=>intent==="rahu-kalam"?`আজকের রাহুকাল · ${city}`:`আজকের চৌঘড়িয়া · ${city}`,
    intentMetaTitle:(intent,city)=>intent==="rahu-kalam"?`${city} আজকের রাহুকাল — বাংলা পঞ্জিকা`:`${city} আজকের চৌঘড়িয়া — বাংলা পঞ্জিকা`,
    intentMetaDescription:(intent,city)=>intent==="rahu-kalam"?`${city}-এর আজকের রাহুকাল, স্থানীয় সূর্যোদয় ও সূর্যাস্ত থেকে গণনা করা বাংলা পঞ্জিকা সময়।`:`${city}-এর আজকের দিন ও রাতের চৌঘড়িয়া, স্থানীয় সূর্যোদয় ও সূর্যাস্ত থেকে গণনা করা।`,
    rahuExplanation:city=>`রাহুকাল স্থানীয় দিনের আলোকে আট ভাগে ভাগ করে বার অনুযায়ী নির্দিষ্ট অংশ থেকে গণনা করা হয়। তাই ${city}-এর সময় অন্য শহরের থেকে আলাদা হতে পারে।`,
    choghadiyaExplanation:city=>`${city}-এর চৌঘড়িয়া জাতীয় কোনো স্থির টেবিল থেকে কপি করা নয়; স্থানীয় সূর্যোদয়, সূর্যাস্ত এবং পরের সূর্যোদয় থেকে দিন ও রাতের ভাগ গণনা করা হয়।`
  },
  tamil:{
    hreflang:"ta-IN",nativeLanguage:"தமிழ்",panchangName:"தமிழ் பஞ்சாங்கம்",
    cityPanchangTitle:city=>`இன்றைய பஞ்சாங்கம் · ${city}`,
    cityMetaTitle:city=>`${city} இன்றைய தமிழ் பஞ்சாங்கம் — திதி, நட்சத்திரம், ராகு காலம்`,
    cityMetaDescription:city=>`${city}-க்கான இன்றைய தமிழ் பஞ்சாங்கம்: திதி, நட்சத்திரம், தமிழ் மாதம், சூரியோதயம், சூரியாஸ்தமனம் மற்றும் ராகு காலம்.`,
    hubTitle:"தமிழ் பஞ்சாங்கம் — நகர வாரியாக",hubDescription:"உங்கள் நகரத்தைத் தேர்ந்தெடுத்து இன்றைய திதி, நட்சத்திரம், தமிழ் மாதம், சூரியோதயம், சூரியாஸ்தமனம் மற்றும் ராகு காலத்தைப் பாருங்கள்.",
    citiesTitle:"தமிழ் பஞ்சாங்க நகரங்கள்",citiesIntro:"ஒவ்வொரு நகரப் பக்கமும் அந்த நகரத்தின் நிலைக்கோடுகள் மற்றும் உள்ளூர் சூரியோதயம்-சூரியாஸ்தமனத்தை வைத்து கணக்கிடப்படுகிறது.",
    methodologyTitle:"தமிழ் பஞ்சாங்க கணக்கீடு",methodologyText:"Panchvani ஒரே இடவசதி சார்ந்த வானியல் கணக்கீட்டின் மீது தமிழ் மாதப் பெயர்கள், நட்சத்திரப் பெயர்கள் மற்றும் தமிழ் காலண்டர் விதிகளைப் பயன்படுத்துகிறது. சங்கராந்தி நேரம் தமிழ் மாதத்தின் civil day-ஐ தீர்மானிக்கிறது.",
    noCoverageTitle:"நகர வாரியான தமிழ் பஞ்சாங்கம் விரைவில்",noCoverageText:"இந்த மொழிக்கான பொருத்தமான நகரங்கள் செயலில் வந்த பிறகே இந்தப் பக்கம் தேடல் குறியீட்டிற்கு திறக்கப்படும்.",
    allLanguages:"அனைத்து பிராந்திய மொழிகள்",allCities:"அனைத்து தமிழ் பஞ்சாங்க நகரங்கள்",localTiming:"உள்ளூர் நேரம்",localCalculation:"நகர வாரியான கணக்கீடு",until:"வரை",pada:"பாதம்",paksha:"பக்ஷம்",solarRashi:"சூரிய ராசி",vikramSamvat:"விக்ரம் ஆண்டு",shakaSamvat:"சக ஆண்டு",gujaratiSamvat:"குஜராத்தி ஆண்டு",yearBegins:"ஆண்டு தொடக்கம்",solarTransitionTitle:"இந்த நாளின் சூரிய சங்கராந்தி",solarTransitionText:(from,to,time)=>`${from} ராசியிலிருந்து ${to} ராசிக்கான சூரியப் பெயர்ச்சி ${time} IST-க்கு நிகழ்கிறது. தமிழ் மாதம் sunrise-only விதியால் அல்ல, சங்கராந்தி நேரம் மற்றும் தமிழ் civil-day விதியால் நிர்ணயிக்கப்படுகிறது.`,calendarExplanationTitle:"தமிழ் காலண்டர் மற்றும் உள்ளூர் கணக்கீடு",afterMidnightNote:"நள்ளிரவுக்குப் பிறகு முடியும் திதி அல்லது நட்சத்திரத்திற்கு அடுத்த civil date-யும் காட்டப்படுகிறது; இதனால் நேரம் தெளிவாக இருக்கும்.",dayChoghadiya:"பகல் சௌகடியா",nightChoghadiya:"இரவு சௌகடியா",sunriseToSunset:"சூரியோதயம் → சூரியாஸ்தமனம்",sunsetToNextSunrise:"சூரியாஸ்தமனம் → அடுத்த சூரியோதயம்",goodPeriods:"சுப / லாப / அமிர்த",neutralPeriod:"சர",difficultPeriods:"ரோக் / கால / உத்வேக்",fullPanchang:"முழு பஞ்சாங்கம்",monthlyCalendar:"மாத காலண்டர்",regionalContext:"தமிழ் பஞ்சாங்கம்",calculationContext:"முழு கணக்கீடு",
    intentTitle:(intent,city)=>intent==="rahu-kalam"?`இன்றைய ராகு காலம் · ${city}`:`இன்றைய சௌகடியா · ${city}`,
    intentMetaTitle:(intent,city)=>intent==="rahu-kalam"?`${city} இன்றைய ராகு காலம் — தமிழ் பஞ்சாங்கம்`:`${city} இன்றைய சௌகடியா — தமிழ் பஞ்சாங்கம்`,
    intentMetaDescription:(intent,city)=>intent==="rahu-kalam"?`${city}-க்கான இன்றைய ராகு காலம், உள்ளூர் சூரியோதயம் மற்றும் சூரியாஸ்தமனத்திலிருந்து கணக்கிடப்பட்டது.`:`${city}-க்கான இன்றைய பகல் மற்றும் இரவு சௌகடியா, உள்ளூர் சூரிய நேரத்தின் அடிப்படையில் கணக்கிடப்பட்டது.`,
    rahuExplanation:city=>`ராகு காலம் உள்ளூர் பகல் நேரத்தை எட்டு சமமான பகுதிகளாகப் பிரித்து, வார நாளுக்குரிய பகுதியிலிருந்து கணக்கிடப்படுகிறது. அதனால் ${city}-இன் நேரம் மற்ற நகரங்களிலிருந்து மாறலாம்.`,
    choghadiyaExplanation:city=>`${city}-க்கான சௌகடியா தேசிய அட்டவணையிலிருந்து நகலெடுக்கப்படவில்லை; உள்ளூர் சூரியோதயம், சூரியாஸ்தமனம் மற்றும் அடுத்த சூரியோதயத்தை வைத்து கணக்கிடப்படுகிறது.`
  },
  malayalam:{
    hreflang:"ml-IN",nativeLanguage:"മലയാളം",panchangName:"മലയാളം പഞ്ചാംഗം",
    cityPanchangTitle:city=>`ഇന്നത്തെ പഞ്ചാംഗം · ${city}`,
    cityMetaTitle:city=>`${city} ഇന്നത്തെ മലയാളം പഞ്ചാംഗം — തിഥി, നക്ഷത്രം, രാഹുകാലം`,
    cityMetaDescription:city=>`${city}-യുടെ ഇന്നത്തെ മലയാളം പഞ്ചാംഗം: തിഥി, നക്ഷത്രം, മലയാള മാസം, സൂര്യോദയം, സൂര്യാസ്തമയം, രാഹുകാലം.`,
    hubTitle:"മലയാളം പഞ്ചാംഗം — നഗരം അനുസരിച്ച്",hubDescription:"നിങ്ങളുടെ നഗരം തിരഞ്ഞെടുത്ത് ഇന്നത്തെ തിഥി, നക്ഷത്രം, മലയാള മാസം, സൂര്യോദയം, സൂര്യാസ്തമയം, രാഹുകാലം എന്നിവ കാണുക.",
    citiesTitle:"മലയാളം പഞ്ചാംഗ നഗരങ്ങൾ",citiesIntro:"ഓരോ നഗരപ്പേജും ആ നഗരത്തിന്റെ സ്ഥാനനിർണ്ണയവും പ്രാദേശിക സൂര്യോദയ-സൂര്യാസ്തമയവും അടിസ്ഥാനമാക്കി കണക്കാക്കുന്നു.",
    methodologyTitle:"മലയാളം പഞ്ചാംഗ കണക്കുകൂട്ടൽ",methodologyText:"Panchvani ഒരേ സ്ഥലം-സെൻസിറ്റീവ് ജ്യോതിശാസ്ത്ര കണക്കിന് മുകളിൽ മലയാള മാസം, നക്ഷത്ര നാമങ്ങൾ, കേരള സംക്രാന്തി civil-day നിയമം എന്നിവ പ്രയോഗിക്കുന്നു.",
    noCoverageTitle:"നഗര അടിസ്ഥാനത്തിലുള്ള മലയാളം പഞ്ചാംഗം ഉടൻ",noCoverageText:"ഈ ഭാഷയ്ക്ക് പ്രസക്തമായ നഗരങ്ങൾ സജീവമാകുന്നതുവരെ ഈ പേജ് search index-ലേക്ക് തുറക്കില്ല.",
    allLanguages:"എല്ലാ പ്രാദേശിക ഭാഷകളും",allCities:"എല്ലാ മലയാളം പഞ്ചാംഗ നഗരങ്ങളും",localTiming:"പ്രാദേശിക സമയം",localCalculation:"നഗര അടിസ്ഥാന കണക്കുകൂട്ടൽ",until:"വരെ",pada:"പാദം",paksha:"പക്ഷം",solarRashi:"സൂര്യ രാശി",vikramSamvat:"വിക്രം സംവത്",shakaSamvat:"ശക സംവത്",gujaratiSamvat:"ഗുജറാത്തി സംവത്",yearBegins:"വർഷാരംഭം",solarTransitionTitle:"ഈ civil date-ലെ സൂര്യ സംക്രാന്തി",solarTransitionText:(from,to,time)=>`${from} മുതൽ ${to} രാശിയിലേക്കുള്ള സൂര്യപ്രവേശം ${time} IST-ന്. മലയാള മാസം കേരളത്തിന്റെ സംക്രാന്തി civil-day നിയമം ഉപയോഗിച്ചാണ് നിശ്ചയിക്കുന്നത്.`,calendarExplanationTitle:"മലയാള കലണ്ടറും പ്രാദേശിക കണക്കും",afterMidnightNote:"അർദ്ധരാത്രിക്ക് ശേഷം അവസാനിക്കുന്ന തിഥി/നക്ഷത്രത്തിന് അടുത്ത civil date കൂടി കാണിക്കുന്നു; അതിനാൽ സമയം അസ്പഷ്ടമാകില്ല.",dayChoghadiya:"പകൽ ചൗഘടിയ",nightChoghadiya:"രാത്രി ചൗഘടിയ",sunriseToSunset:"സൂര്യോദയം → സൂര്യാസ്തമയം",sunsetToNextSunrise:"സൂര്യാസ്തമയം → അടുത്ത സൂര്യോദയം",goodPeriods:"ശുഭ / ലാഭ / അമൃത",neutralPeriod:"ചര",difficultPeriods:"രോഗ / കാല / ഉദ്വേഗ",fullPanchang:"പൂർണ്ണ പഞ്ചാംഗം",monthlyCalendar:"മാസ കലണ്ടർ",regionalContext:"മലയാളം പഞ്ചാംഗം",calculationContext:"പൂർണ്ണ കണക്കുകൂട്ടൽ",
    intentTitle:(intent,city)=>intent==="rahu-kalam"?`ഇന്നത്തെ രാഹുകാലം · ${city}`:`ഇന്നത്തെ ചൗഘടിയ · ${city}`,
    intentMetaTitle:(intent,city)=>intent==="rahu-kalam"?`${city} ഇന്നത്തെ രാഹുകാലം — മലയാളം പഞ്ചാംഗം`:`${city} ഇന്നത്തെ ചൗഘടിയ — മലയാളം പഞ്ചാംഗം`,
    intentMetaDescription:(intent,city)=>intent==="rahu-kalam"?`${city}-യുടെ ഇന്നത്തെ രാഹുകാലം, പ്രാദേശിക സൂര്യോദയവും സൂര്യാസ്തമയവും ഉപയോഗിച്ച് കണക്കാക്കിയത്.`:`${city}-യുടെ ഇന്നത്തെ പകൽ-രാത്രി ചൗഘടിയ, പ്രാദേശിക സൗരസമയത്തെ അടിസ്ഥാനമാക്കി.`,
    rahuExplanation:city=>`രാഹുകാലം പ്രാദേശിക പകൽ സമയത്തെ എട്ട് സമഭാഗങ്ങളാക്കി, ആഴ്ചാദിവസത്തിനനുസരിച്ചുള്ള ഭാഗം തെരഞ്ഞെടുത്താണ് കണക്കാക്കുന്നത്. അതിനാൽ ${city}-യിലെ സമയം മറ്റൊരു നഗരത്തിൽ നിന്ന് വ്യത്യസ്തമായിരിക്കും.`,
    choghadiyaExplanation:city=>`${city}-യിലെ ചൗഘടിയ ഒരു ദേശീയ പട്ടികയിൽ നിന്ന് പകർത്തുന്നതല്ല; പ്രാദേശിക സൂര്യോദയം, സൂര്യാസ്തമയം, അടുത്ത സൂര്യോദയം എന്നിവയിൽ നിന്നാണ് കണക്കാക്കുന്നത്.`
  },
  gujarati:{
    hreflang:"gu-IN",nativeLanguage:"ગુજરાતી",panchangName:"ગુજરાતી પંચાંગ",
    cityPanchangTitle:city=>`આજનું પંચાંગ · ${city}`,
    cityMetaTitle:city=>`${city} આજનું ગુજરાતી પંચાંગ — તિથિ, નક્ષત્ર અને રાહુકાળ`,
    cityMetaDescription:city=>`${city} માટે આજનું ગુજરાતી પંચાંગ: તિથિ, નક્ષત્ર, ગુજરાતી મહિનો, સૂર્યોદય, સૂર્યાસ્ત, રાહુકાળ અને સ્થાનિક સમય.`,
    hubTitle:"ગુજરાતી પંચાંગ — શહેર મુજબ",hubDescription:"તમારું શહેર પસંદ કરીને આજની તિથિ, નક્ષત્ર, ગુજરાતી મહિનો, સૂર્યોદય-સૂર્યાસ્ત, રાહુકાળ અને ચોઘડિયું જુઓ.",
    citiesTitle:"ગુજરાતી પંચાંગ શહેરો",citiesIntro:"દરેક શહેરનું પંચાંગ તેની સ્થાનિક ભૂસ્થિતિ અને સૂર્યોદય-સૂર્યાસ્તના સમય પરથી ગણવામાં આવે છે.",
    methodologyTitle:"ગુજરાતી પંચાંગની ગણતરી",methodologyText:"Panchvani સ્થળ-આધારિત જ્યોતિષીય/ખગોળીય ગણતરી પર ગુજરાતી અમાન્ત માસ, ગુજરાતી સંવત અને સ્થાનિક પંચાંગ પરિભાષા લાગુ કરે છે. ગુજરાતી સંવતનું વર્ષ દિવાળી પછી કારતક સુદ પડવાથી બદલાય છે.",
    noCoverageTitle:"શહેર મુજબ ગુજરાતી પંચાંગ ટૂંક સમયમાં",noCoverageText:"યોગ્ય શહેરો સક્રિય ન થાય ત્યાં સુધી આ ભાષા પાનું search index માટે ખોલવામાં આવતું નથી.",
    allLanguages:"બધી પ્રાદેશિક ભાષાઓ",allCities:"બધા ગુજરાતી પંચાંગ શહેરો",localTiming:"સ્થાનિક સમય",localCalculation:"શહેર આધારિત ગણતરી",until:"સુધી",pada:"પાદ",paksha:"પક્ષ",solarRashi:"સૂર્ય રાશિ",vikramSamvat:"વિક્રમ સંવત",shakaSamvat:"શક સંવત",gujaratiSamvat:"ગુજરાતી સંવત",yearBegins:"વર્ષ શરૂ",solarTransitionTitle:"આ civil date પર સૂર્ય સંક્રાંતિ",solarTransitionText:(from,to,time)=>`${from} થી ${to} રાશિમાં સૂર્ય પ્રવેશ ${time} IST પર થાય છે. પ્રાદેશિક મહિનો સંબંધિત calendar convention મુજબ નક્કી થાય છે.`,calendarExplanationTitle:"ગુજરાતી પંચાંગ અને સ્થાનિક ગણતરી",afterMidnightNote:"મધરાત પછી પૂર્ણ થતી તિથિ અથવા નક્ષત્ર સાથે આગળની civil date પણ બતાવવામાં આવે છે, જેથી સમય સ્પષ્ટ રહે.",dayChoghadiya:"દિવસનું ચોઘડિયું",nightChoghadiya:"રાતનું ચોઘડિયું",sunriseToSunset:"સૂર્યોદય → સૂર્યાસ્ત",sunsetToNextSunrise:"સૂર્યાસ્ત → આગામી સૂર્યોદય",goodPeriods:"શુભ / લાભ / અમૃત",neutralPeriod:"ચલ",difficultPeriods:"રોગ / કાળ / ઉદ્વેગ",fullPanchang:"સંપૂર્ણ પંચાંગ",monthlyCalendar:"માસિક કૅલેન્ડર",regionalContext:"ગુજરાતી પંચાંગ",calculationContext:"સંપૂર્ણ ગણતરી",
    intentTitle:(intent,city)=>intent==="rahu-kalam"?`આજનો રાહુકાળ · ${city}`:`આજનું ચોઘડિયું · ${city}`,
    intentMetaTitle:(intent,city)=>intent==="rahu-kalam"?`${city} આજનો રાહુકાળ — ગુજરાતી પંચાંગ`:`${city} આજનું ચોઘડિયું — ગુજરાતી પંચાંગ`,
    intentMetaDescription:(intent,city)=>intent==="rahu-kalam"?`${city} માટે આજનો રાહુકાળ, સ્થાનિક સૂર્યોદય અને સૂર્યાસ્ત પરથી ગણાયેલો.`:`${city} માટે આજનું દિવસ અને રાતનું ચોઘડિયું, સ્થાનિક સૂર્ય સમય પરથી ગણાયેલું.`,
    rahuExplanation:city=>`રાહુકાળ સ્થાનિક દિવસના પ્રકાશ સમયને આઠ સમાન ભાગમાં વહેંચીને અને વાર મુજબનો ભાગ પસંદ કરીને ગણાય છે. તેથી ${city}નો સમય બીજા શહેરથી અલગ હોઈ શકે છે.`,
    choghadiyaExplanation:city=>`${city}નું ચોઘડિયું કોઈ રાષ્ટ્રીય સ્થિર કોષ્ટકમાંથી નકલ કરેલું નથી; તે સ્થાનિક સૂર્યોદય, સૂર્યાસ્ત અને આગામી સૂર્યોદય પરથી ગણાય છે.`
  },
  marathi:{
    hreflang:"mr-IN",nativeLanguage:"मराठी",panchangName:"मराठी पंचांग",
    cityPanchangTitle:city=>`आजचे पंचांग · ${city}`,
    cityMetaTitle:city=>`${city} आजचे मराठी पंचांग — तिथी, नक्षत्र आणि राहुकाल`,
    cityMetaDescription:city=>`${city} साठी आजचे मराठी पंचांग: तिथी, नक्षत्र, मराठी महिना, सूर्योदय, सूर्यास्त, राहुकाल आणि स्थानिक वेळा.`,
    hubTitle:"मराठी पंचांग — शहरानुसार",hubDescription:"तुमचे शहर निवडा आणि आजची तिथी, नक्षत्र, मराठी महिना, सूर्योदय-सूर्यास्त, राहुकाल आणि चौघडिया पहा.",
    citiesTitle:"मराठी पंचांग शहरे",citiesIntro:"प्रत्येक शहराचे पंचांग त्या शहराच्या स्थानिक अक्षांश-रेखांश आणि सूर्योदय-सूर्यास्तावरून मोजले जाते.",
    methodologyTitle:"मराठी पंचांगाची गणना",methodologyText:"Panchvani स्थान-संवेदनशील खगोलशास्त्रीय गणनेवर अमान्त चांद्र महिना, मराठी परिभाषा आणि शहरानुसार वेळा लागू करते. अधिक मास स्वतंत्रपणे ओळखला जातो.",
    noCoverageTitle:"शहरानुसार मराठी पंचांग लवकरच",noCoverageText:"संबंधित शहरे सक्रिय होईपर्यंत हे भाषा पृष्ठ search index साठी उघडले जात नाही.",
    allLanguages:"सर्व प्रादेशिक भाषा",allCities:"सर्व मराठी पंचांग शहरे",localTiming:"स्थानिक वेळ",localCalculation:"शहरानुसार गणना",until:"पर्यंत",pada:"पाद",paksha:"पक्ष",solarRashi:"सूर्य राशी",vikramSamvat:"विक्रम संवत",shakaSamvat:"शक संवत",gujaratiSamvat:"गुजराती संवत",yearBegins:"वर्षारंभ",solarTransitionTitle:"या civil date वरील सूर्य संक्रांती",solarTransitionText:(from,to,time)=>`${from} पासून ${to} राशीत सूर्यप्रवेश ${time} IST वाजता. प्रादेशिक महिना संबंधित calendar convention नुसार ठरतो.`,calendarExplanationTitle:"मराठी पंचांग आणि स्थानिक गणना",afterMidnightNote:"मध्यरात्रीनंतर संपणाऱ्या तिथी किंवा नक्षत्रासोबत पुढील civil date देखील दाखवली जाते, त्यामुळे वेळ स्पष्ट राहते.",dayChoghadiya:"दिवसाचा चौघडिया",nightChoghadiya:"रात्रीचा चौघडिया",sunriseToSunset:"सूर्योदय → सूर्यास्त",sunsetToNextSunrise:"सूर्यास्त → पुढील सूर्योदय",goodPeriods:"शुभ / लाभ / अमृत",neutralPeriod:"चर",difficultPeriods:"रोग / काल / उद्वेग",fullPanchang:"संपूर्ण पंचांग",monthlyCalendar:"मासिक दिनदर्शिका",regionalContext:"मराठी पंचांग",calculationContext:"संपूर्ण गणना",
    intentTitle:(intent,city)=>intent==="rahu-kalam"?`आजचा राहुकाल · ${city}`:`आजचा चौघडिया · ${city}`,
    intentMetaTitle:(intent,city)=>intent==="rahu-kalam"?`${city} आजचा राहुकाल — मराठी पंचांग`:`${city} आजचा चौघडिया — मराठी पंचांग`,
    intentMetaDescription:(intent,city)=>intent==="rahu-kalam"?`${city} साठी आजचा राहुकाल, स्थानिक सूर्योदय आणि सूर्यास्तावरून मोजलेला.`:`${city} साठी आजचा दिवस-रात्र चौघडिया, स्थानिक सौर वेळांवरून मोजलेला.`,
    rahuExplanation:city=>`राहुकाल हा स्थानिक दिवसाचा प्रकाशकाल आठ समान भागांत विभागून आणि वारानुसार ठराविक भाग निवडून मोजला जातो. त्यामुळे ${city}ची वेळ दुसऱ्या शहरापेक्षा वेगळी असू शकते.`,
    choghadiyaExplanation:city=>`${city}चा चौघडिया राष्ट्रीय स्थिर तक्त्यातून कॉपी केलेला नाही; तो स्थानिक सूर्योदय, सूर्यास्त आणि पुढील सूर्योदयावरून मोजला जातो.`
  }
};

const nativeCity:Partial<Record<RegionalLanguageSlug,Record<string,string>>>={
  bengali:{kolkata:"কলকাতা",howrah:"হাওড়া"},
  tamil:{chennai:"சென்னை",coimbatore:"கோயம்புத்தூர்",madurai:"மதுரை"},
  malayalam:{kochi:"കൊച്ചി",kozhikode:"കോഴിക്കോട്",thiruvananthapuram:"തിരുവനന്തപുരം"},
  gujarati:{ahmedabad:"અમદાવાદ",surat:"સુરત",vadodara:"વડોદરા",rajkot:"રાજકોટ"},
  marathi:{mumbai:"मुंबई",pune:"पुणे",nagpur:"नागपूर",thane:"ठाणे",nashik:"नाशिक",solapur:"सोलापूर","navi-mumbai":"नवी मुंबई","pimpri-chinchwad":"पिंपरी-चिंचवड"}
};

const tithi:Partial<Record<RegionalLanguageSlug,Record<string,string>>>={
  bengali:{Pratipada:"প্রতিপদ",Dvitiya:"দ্বিতীয়া",Tritiya:"তৃতীয়া",Chaturthi:"চতুর্থী",Panchami:"পঞ্চমী",Shashthi:"ষষ্ঠী",Saptami:"সপ্তমী",Ashtami:"অষ্টমী",Navami:"নবমী",Dashami:"দশমী",Ekadashi:"একাদশী",Dwadashi:"দ্বাদশী",Trayodashi:"ত্রয়োদশী",Chaturdashi:"চতুর্দশী",Purnima:"পূর্ণিমা",Amavasya:"অমাবস্যা"},
  tamil:{Pratipada:"பிரதமை",Dvitiya:"துவிதியை",Tritiya:"திரிதியை",Chaturthi:"சதுர்த்தி",Panchami:"பஞ்சமி",Shashthi:"சஷ்டி",Saptami:"சப்தமி",Ashtami:"அஷ்டமி",Navami:"நவமி",Dashami:"தசமி",Ekadashi:"ஏகாதசி",Dwadashi:"துவாதசி",Trayodashi:"திரயோதசி",Chaturdashi:"சதுர்த்தசி",Purnima:"பௌர்ணமி",Amavasya:"அமாவாசை"},
  malayalam:{Pratipada:"പ്രതിപദ",Dvitiya:"ദ്വിതീയ",Tritiya:"തൃതീയ",Chaturthi:"ചതുർത്ഥി",Panchami:"പഞ്ചമി",Shashthi:"ഷഷ്ഠി",Saptami:"സപ്തമി",Ashtami:"അഷ്ടമി",Navami:"നവമി",Dashami:"ദശമി",Ekadashi:"ഏകാദശി",Dwadashi:"ദ്വാദശി",Trayodashi:"ത്രയോദശി",Chaturdashi:"ചതുർദശി",Purnima:"പൗർണമി",Amavasya:"അമാവാസി"},
  gujarati:{Pratipada:"પડવો",Dvitiya:"બીજ",Tritiya:"ત્રીજ",Chaturthi:"ચોથ",Panchami:"પાંચમ",Shashthi:"છઠ",Saptami:"સાતમ",Ashtami:"આઠમ",Navami:"નોમ",Dashami:"દશમ",Ekadashi:"અગિયારસ",Dwadashi:"બારસ",Trayodashi:"તેરસ",Chaturdashi:"ચૌદસ",Purnima:"પૂનમ",Amavasya:"અમાસ"},
  marathi:{Pratipada:"प्रतिपदा",Dvitiya:"द्वितीया",Tritiya:"तृतीया",Chaturthi:"चतुर्थी",Panchami:"पंचमी",Shashthi:"षष्ठी",Saptami:"सप्तमी",Ashtami:"अष्टमी",Navami:"नवमी",Dashami:"दशमी",Ekadashi:"एकादशी",Dwadashi:"द्वादशी",Trayodashi:"त्रयोदशी",Chaturdashi:"चतुर्दशी",Purnima:"पौर्णिमा",Amavasya:"अमावस्या"}
};

const paksha:Record<RegionalLanguageSlug,Record<string,string>>={
  bengali:{Shukla:"শুক্ল পক্ষ",Krishna:"কৃষ্ণ পক্ষ"},
  tamil:{Shukla:"சுக்ல பக்ஷம்",Krishna:"கிருஷ்ண பக்ஷம்"},
  malayalam:{Shukla:"ശുക്ല പക്ഷം",Krishna:"കൃഷ്ണ പക്ഷം"},
  gujarati:{Shukla:"સુદ",Krishna:"વદ"},
  marathi:{Shukla:"शुक्ल पक्ष",Krishna:"कृष्ण पक्ष"}
};

const nakshatra:Partial<Record<RegionalLanguageSlug,Record<string,string>>>={
  bengali:{Ashwini:"অশ্বিনী",Bharani:"ভরণী",Krittika:"কৃত্তিকা",Rohini:"রোহিণী",Mrigashirsha:"মৃগশিরা",Ardra:"আর্দ্রা",Punarvasu:"পুনর্বসু",Pushya:"পুষ্যা",Ashlesha:"আশ্লেষা",Magha:"মঘা","Purva Phalguni":"পূর্ব ফল্গুনী","Uttara Phalguni":"উত্তর ফল্গুনী",Hasta:"হস্তা",Chitra:"চিত্রা",Swati:"স্বাতী",Vishakha:"বিশাখা",Anuradha:"অনুরাধা",Jyeshtha:"জ্যেষ্ঠা",Mula:"মূলা","Purva Ashadha":"পূর্বাষাঢ়া","Uttara Ashadha":"উত্তরাষাঢ়া",Shravana:"শ্রবণা",Dhanishta:"ধনিষ্ঠা",Shatabhisha:"শতভিষা","Purva Bhadrapada":"পূর্বভাদ্রপদ","Uttara Bhadrapada":"উত্তরভাদ্রপদ",Revati:"রেবতী"},
  tamil:{Ashwini:"அஸ்வினி",Bharani:"பரணி",Krittika:"கார்த்திகை",Rohini:"ரோகிணி",Mrigashirsha:"மிருகசீரிடம்",Ardra:"திருவாதிரை",Punarvasu:"புனர்பூசம்",Pushya:"பூசம்",Ashlesha:"ஆயில்யம்",Magha:"மகம்","Purva Phalguni":"பூரம்","Uttara Phalguni":"உத்திரம்",Hasta:"ஹஸ்தம்",Chitra:"சித்திரை",Swati:"சுவாதி",Vishakha:"விசாகம்",Anuradha:"அனுஷம்",Jyeshtha:"கேட்டை",Mula:"மூலம்","Purva Ashadha":"பூராடம்","Uttara Ashadha":"உத்திராடம்",Shravana:"திருவோணம்",Dhanishta:"அவிட்டம்",Shatabhisha:"சதயம்","Purva Bhadrapada":"பூரட்டாதி","Uttara Bhadrapada":"உத்திரட்டாதி",Revati:"ரேவதி"},
  malayalam:{Ashwini:"അശ്വതി",Bharani:"ഭരണി",Krittika:"കാർത്തിക",Rohini:"രോഹിണി",Mrigashirsha:"മകയിരം",Ardra:"തിരുവാതിര",Punarvasu:"പുണർതം",Pushya:"പൂയം",Ashlesha:"ആയില്യം",Magha:"മകം","Purva Phalguni":"പൂരം","Uttara Phalguni":"ഉത്രം",Hasta:"അത്തം",Chitra:"ചിത്തിര",Swati:"ചോതി",Vishakha:"വിശാഖം",Anuradha:"അനിഴം",Jyeshtha:"തൃക്കേട്ട",Mula:"മൂലം","Purva Ashadha":"പൂരാടം","Uttara Ashadha":"ഉത്രാടം",Shravana:"തിരുവോണം",Dhanishta:"അവിട്ടം",Shatabhisha:"ചതയം","Purva Bhadrapada":"പൂരുരുട്ടാതി","Uttara Bhadrapada":"ഉത്രട്ടാതി",Revati:"രേവതി"},
  gujarati:{Ashwini:"અશ્વિની",Bharani:"ભરણી",Krittika:"કૃત્તિકા",Rohini:"રોહિણી",Mrigashirsha:"મૃગશીર્ષ",Ardra:"આર્દ્રા",Punarvasu:"પુનર્વસુ",Pushya:"પુષ્ય",Ashlesha:"આશ્લેષા",Magha:"મઘા","Purva Phalguni":"પૂર્વા ફાલ્ગુની","Uttara Phalguni":"ઉત્તરા ફાલ્ગુની",Hasta:"હસ્ત",Chitra:"ચિત્રા",Swati:"સ્વાતિ",Vishakha:"વિશાખા",Anuradha:"અનુરાધા",Jyeshtha:"જ્યેષ્ઠા",Mula:"મૂલ","Purva Ashadha":"પૂર્વાષાઢા","Uttara Ashadha":"ઉત્તરાષાઢા",Shravana:"શ્રવણ",Dhanishta:"ધનિષ્ઠા",Shatabhisha:"શતભિષા","Purva Bhadrapada":"પૂર્વભાદ્રપદ","Uttara Bhadrapada":"ઉત્તરભાદ્રપદ",Revati:"રેવતી"},
  marathi:{Ashwini:"अश्विनी",Bharani:"भरणी",Krittika:"कृत्तिका",Rohini:"रोहिणी",Mrigashirsha:"मृगशीर्ष",Ardra:"आर्द्रा",Punarvasu:"पुनर्वसू",Pushya:"पुष्य",Ashlesha:"आश्लेषा",Magha:"मघा","Purva Phalguni":"पूर्वा फाल्गुनी","Uttara Phalguni":"उत्तरा फाल्गुनी",Hasta:"हस्त",Chitra:"चित्रा",Swati:"स्वाती",Vishakha:"विशाखा",Anuradha:"अनुराधा",Jyeshtha:"ज्येष्ठा",Mula:"मूळ","Purva Ashadha":"पूर्वाषाढा","Uttara Ashadha":"उत्तराषाढा",Shravana:"श्रवण",Dhanishta:"धनिष्ठा",Shatabhisha:"शतभिषा","Purva Bhadrapada":"पूर्वाभाद्रपदा","Uttara Bhadrapada":"उत्तराभाद्रपदा",Revati:"रेवती"}
};

export function regionalLocale(language:RegionalLanguageSlug){return locales[language];}
export function nativeCityName(language:RegionalLanguageSlug,city:City){return nativeCity[language]?.[city.slug]??city.name;}
export function localizeTithi(language:RegionalLanguageSlug,value:string){return tithi[language]?.[value]??value;}
export function localizePaksha(language:RegionalLanguageSlug,value:string){return paksha[language]?.[value]??value;}
export function localizeNakshatra(language:RegionalLanguageSlug,value:string){return nakshatra[language]?.[value]??value;}

export const choghadiyaNativeNames:Record<RegionalLanguageSlug,Record<string,string>>={
  bengali:{Shubh:"শুভ",Labh:"লাভ",Amrit:"অমৃত",Char:"চর",Rog:"রোগ",Kaal:"কাল",Udveg:"উদ্বেগ"},
  tamil:{Shubh:"சுப",Labh:"லாப",Amrit:"அமிர்த",Char:"சர",Rog:"ரோக்",Kaal:"கால",Udveg:"உத்வேக்"},
  malayalam:{Shubh:"ശുഭ",Labh:"ലാഭ",Amrit:"അമൃത",Char:"ചര",Rog:"രോഗ",Kaal:"കാല",Udveg:"ഉദ്വേഗ"},
  gujarati:{Shubh:"શુભ",Labh:"લાભ",Amrit:"અમૃત",Char:"ચલ",Rog:"રોગ",Kaal:"કાળ",Udveg:"ઉદ્વેગ"},
  marathi:{Shubh:"शुभ",Labh:"लाभ",Amrit:"अमृत",Char:"चर",Rog:"रोग",Kaal:"काल",Udveg:"उद्वेग"}
};
