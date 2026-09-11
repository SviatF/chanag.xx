import type {Festival} from "./festivals";

export type FestivalSemantics={
  aliases:string[];
  relatedObservances:string[];
  lunarConventionNote:string|null;
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

export function getFestivalSemantics(festival:Festival):FestivalSemantics{
  const related=relatedBySlug[festival.slug]??[];
  const relatedSet=new Set(related);
  return {
    aliases:festival.regionalNames.filter(name=>!relatedSet.has(name)),
    relatedObservances:related,
    lunarConventionNote:conventionNoteBySlug[festival.slug]??null,
  };
}
