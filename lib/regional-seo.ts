import type {City} from "./cities";
import {supportedCities} from "./cities";
import {isRegionalIndexable} from "./seo-policy";

export const regionalLanguageSlugs=["bengali","tamil","malayalam","gujarati","marathi"] as const;
export type RegionalLanguageSlug=typeof regionalLanguageSlugs[number];
export const regionalIntentSlugs=["rahu-kalam","choghadiya"] as const;
export type RegionalIntentSlug=typeof regionalIntentSlugs[number];

export type RegionalSearchIntent="panchang"|RegionalIntentSlug;

export const regionalLanguageSeo:Record<RegionalLanguageSlug,{
  code:string;
  hreflang:string;
  native:string;
  label:string;
  panchangSignals:string[];
}>={
  bengali:{code:"bn",hreflang:"bn-IN",native:"বাংলা",label:"Bengali Panjika",panchangSignals:["bengali panjika","bangla panjika","বাংলা পঞ্জিকা","আজকের পঞ্জিকা"]},
  tamil:{code:"ta",hreflang:"ta-IN",native:"தமிழ்",label:"Tamil Panchangam",panchangSignals:["tamil panchangam","tamil panchang","தமிழ் பஞ்சாங்கம்","இன்றைய பஞ்சாங்கம்"]},
  malayalam:{code:"ml",hreflang:"ml-IN",native:"മലയാളം",label:"Malayalam Panchangam",panchangSignals:["malayalam panchangam","malayalam panchang","മലയാളം പഞ്ചാംഗം","ഇന്നത്തെ പഞ്ചാംഗം"]},
  gujarati:{code:"gu",hreflang:"gu-IN",native:"ગુજરાતી",label:"Gujarati Panchang",panchangSignals:["gujarati panchang","ગુજરાતી પંચાંગ","આજનું પંચાંગ"]},
  marathi:{code:"mr",hreflang:"mr-IN",native:"मराठी",label:"Marathi Panchang",panchangSignals:["marathi panchang","मराठी पंचांग","आजचे पंचांग"]},
};

export const regionalIntentSeo:Record<RegionalIntentSlug,{
  label:string;
  supportedLanguages:RegionalLanguageSlug[];
  nativeLabels:Partial<Record<RegionalLanguageSlug,string>>;
  querySignals:Partial<Record<RegionalLanguageSlug,string[]>>;
}>={
  "rahu-kalam":{
    label:"Rahu Kalam",
    supportedLanguages:["bengali","tamil","malayalam","gujarati","marathi"],
    nativeLabels:{
      bengali:"আজকের রাহুকাল",tamil:"இன்றைய ராகு காலம்",malayalam:"ഇന്നത്തെ രാഹുകാലം",gujarati:"આજનો રાહુકાળ",marathi:"आजचा राहुकाल"
    },
    querySignals:{
      bengali:["রাহুকাল","bengali rahu kalam","bangla rahu kalam"],
      tamil:["ராகு காலம்","tamil rahu kalam","tamil rahu kaal"],
      malayalam:["രാഹുകാലം","malayalam rahu kalam","malayalam rahu kaal"],
      gujarati:["રાહુકાળ","gujarati rahu kalam","gujarati rahu kaal"],
      marathi:["राहुकाल","राहुकाळ","marathi rahu kalam","marathi rahu kaal"]
    }
  },
  choghadiya:{
    label:"Choghadiya",
    supportedLanguages:["gujarati","marathi"],
    nativeLabels:{gujarati:"આજનું ચોઘડિયું",marathi:"आजचा चौघडिया"},
    querySignals:{
      gujarati:["ચોઘડિયા","ચોઘડિયું","gujarati choghadiya","gujarati chogadia"],
      marathi:["चौघडिया","marathi choghadiya","marathi chogadia"]
    }
  }
};

const baselineRegionalIntentKeys=[
  "bengali:kolkata:rahu-kalam",
  "tamil:chennai:rahu-kalam",
  "gujarati:ahmedabad:rahu-kalam","gujarati:ahmedabad:choghadiya",
  "gujarati:surat:rahu-kalam","gujarati:surat:choghadiya",
  "gujarati:vadodara:rahu-kalam","gujarati:vadodara:choghadiya",
  "marathi:mumbai:rahu-kalam","marathi:mumbai:choghadiya",
  "marathi:pune:rahu-kalam","marathi:pune:choghadiya",
  "marathi:nagpur:rahu-kalam","marathi:nagpur:choghadiya",
  "marathi:thane:rahu-kalam","marathi:thane:choghadiya"
] as const;
const baselineRegionalIntentSet=new Set<string>(baselineRegionalIntentKeys);
const supportedCityMap=new Map(supportedCities.map(city=>[city.slug,city]));

export function isRegionalLanguageSlug(value:string):value is RegionalLanguageSlug{
  return regionalLanguageSlugs.includes(value as RegionalLanguageSlug);
}

export function isRegionalIntentSlug(value:string):value is RegionalIntentSlug{
  return regionalIntentSlugs.includes(value as RegionalIntentSlug);
}

export function regionalLanguageSupportsIntent(language:string,intent:string){
  if(!isRegionalLanguageSlug(language)||!isRegionalIntentSlug(intent))return false;
  return regionalIntentSeo[intent].supportedLanguages.includes(language);
}

export function regionalLanguageHubPath(language:RegionalLanguageSlug){return `/regional/${language}`;}
export function regionalCityHubPath(language:RegionalLanguageSlug,city:City){return `/regional/${language}/${city.slug}`;}
export function regionalIntentPath(language:RegionalLanguageSlug,city:City,intent:RegionalIntentSlug){return `/regional/${language}/${city.slug}/${intent}`;}

function configuredExtraRegionalIntentKeys(){
  const raw=process.env.SEO_EXTRA_REGIONAL_INTENTS??"";
  const values=raw.split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
  const valid:string[]=[];
  for(const value of values){
    const [language,citySlug,intent,...rest]=value.split(":");
    if(rest.length||!isRegionalLanguageSlug(language)||!isRegionalIntentSlug(intent)||!regionalLanguageSupportsIntent(language,intent))continue;
    const city=supportedCityMap.get(citySlug);if(!city||!isRegionalIndexable(language,city))continue;
    const key=`${language}:${city.slug}:${intent}`;
    if(!baselineRegionalIntentSet.has(key))valid.push(key);
  }
  return [...new Set(valid)];
}

export function isRegionalIntentIndexable(language:string,city:City,intent:string){
  if(!isRegionalLanguageSlug(language)||!isRegionalIntentSlug(intent))return false;
  if(!regionalLanguageSupportsIntent(language,intent)||!isRegionalIndexable(language,city))return false;
  const key=`${language}:${city.slug}:${intent}`;
  return baselineRegionalIntentSet.has(key)||configuredExtraRegionalIntentKeys().includes(key);
}

export function regionalIntentActivationSnapshot(){
  const extra=configuredExtraRegionalIntentKeys();
  return {baseline:[...baselineRegionalIntentKeys],extra,active:[...baselineRegionalIntentKeys,...extra]};
}

export function regionalCitiesForLanguage(language:string){
  if(!isRegionalLanguageSlug(language))return [];
  return supportedCities.filter(city=>isRegionalIndexable(language,city));
}

export function regionalIntentLinksForCity(language:string,city:City){
  if(!isRegionalLanguageSlug(language))return [];
  return regionalIntentSlugs
    .filter(intent=>isRegionalIntentIndexable(language,city,intent))
    .map(intent=>({intent,href:regionalIntentPath(language,city,intent),label:regionalIntentSeo[intent].nativeLabels[language]??regionalIntentSeo[intent].label}));
}

export function regionalAlternates(city:City,intent?:RegionalIntentSlug){
  const english=intent==="choghadiya"?`/tools/choghadiya/${city.slug}`:`/panchang/${city.slug}`;
  const languages:Record<string,string>={"en-IN":english,"x-default":english};
  for(const language of regionalLanguageSlugs){
    if(intent){
      if(isRegionalIntentIndexable(language,city,intent))languages[regionalLanguageSeo[language].hreflang]=regionalIntentPath(language,city,intent);
    }else if(isRegionalIndexable(language,city)){
      languages[regionalLanguageSeo[language].hreflang]=regionalCityHubPath(language,city);
    }
  }
  return languages;
}

function normalized(value:string){return ` ${value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{M}\p{N}]+/gu," ").trim()} `;}
function includesSignal(query:string,signals:string[]){return signals.some(signal=>query.includes(normalized(signal)));}

export function detectRegionalSearchQuery(rawQuery:string):{language:RegionalLanguageSlug;intent:RegionalSearchIntent}|null{
  const query=normalized(rawQuery);
  for(const language of regionalLanguageSlugs){
    for(const intent of regionalIntentSlugs){
      const signals=regionalIntentSeo[intent].querySignals[language]??[];
      if(regionalLanguageSupportsIntent(language,intent)&&includesSignal(query,signals))return {language,intent};
    }
    if(includesSignal(query,regionalLanguageSeo[language].panchangSignals))return {language,intent:"panchang"};
  }
  return null;
}

export function regionalIntentNativeLabel(language:RegionalLanguageSlug,intent:RegionalIntentSlug){
  return regionalIntentSeo[intent].nativeLabels[language]??regionalIntentSeo[intent].label;
}
