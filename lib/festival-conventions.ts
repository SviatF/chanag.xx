import type {Festival} from "./festivals";

export type FestivalSemantics={
  aliases:string[];
  relatedObservances:string[];
  lunarConventionNote:string|null;
  displayShort:string;
};

const relatedBySlug:Record<string,string[]>={
  "makar-sankranti":["Pongal","Uttarayan","Magh Bihu"],
  "holi":["Dol Jatra"],
  "shardiya-navratri":["Durga Puja"],
  "diwali":["Lakshmi Puja"],
};

const conventionNoteBySlug:Record<string,string>={
  "maha-shivaratri":"The observance day is the same in both major lunar-month schools, but the month name differs: Magha Krishna Chaturdashi in Amanta reckoning and Phalguna Krishna Chaturdashi in Purnimanta reckoning.",
  "janmashtami":"The same Krishna Paksha Ashtami can carry different month names by convention: Shravana in Amanta reckoning and Bhadrapada in Purnimanta reckoning.",
  "karwa-chauth":"Karwa Chauth falls on Krishna Paksha Chaturthi. The month is Ashwin in Amanta reckoning and Kartika in Purnimanta reckoning.",
  "dhanteras":"Dhanteras is Krishna Trayodashi before Diwali. The same fortnight is labelled Ashwin in Amanta reckoning and Kartika in Purnimanta reckoning.",
  "diwali":"Diwali Amavasya belongs to Ashwin in Amanta reckoning and Kartika in Purnimanta reckoning. The observance date is not changed by this naming difference.",
};

const shortOverrideBySlug:Record<string,string>={
  "maha-shivaratri":"Krishna Paksha Chaturdashi night observance dedicated to Shiva; the lunar-month name differs by Amanta/Purnimanta convention.",
  "janmashtami":"Krishna Paksha Ashtami observance celebrating Krishna's birth, with Nishita and tradition-specific Rohini rules.",
  "karwa-chauth":"Krishna Paksha Chaturthi fast observed from sunrise until local moonrise; the lunar-month name differs by convention.",
  "dhanteras":"Krishna Trayodashi observance before Diwali, associated with Dhanvantari, prosperity and auspicious purchases.",
  "diwali":"Amavasya festival of lights with Lakshmi Puja commonly centered on local Pradosh Kaal; exact Muhurat needs additional rule checks.",
};

export function getFestivalSemantics(festival:Festival):FestivalSemantics{
  const related=relatedBySlug[festival.slug]??[];
  const relatedSet=new Set(related);
  return {
    aliases:festival.regionalNames.filter(name=>!relatedSet.has(name)),
    relatedObservances:related,
    lunarConventionNote:conventionNoteBySlug[festival.slug]??null,
    displayShort:shortOverrideBySlug[festival.slug]??festival.short,
  };
}
