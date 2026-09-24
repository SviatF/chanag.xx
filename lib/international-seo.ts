import type {Metadata} from "next";
import type {City} from "./cities";
import {regionalLanguageSeo,regionalLanguageSlugs,type RegionalLanguageSlug} from "./regional-seo";

export const SITE_ORIGIN="https://panchvani.com";
export const DEFAULT_HREFLANG="en-IN";
export const X_DEFAULT_HREFLANG="x-default";

function normalizePath(path:string){
  if(!path.startsWith("/"))return `/${path}`;
  return path;
}

export function absolutePanchvaniUrl(path:string){return `${SITE_ORIGIN}${normalizePath(path)}`;}

export function multilingualAlternates({
  canonical,
  english,
  localized,
}:{
  canonical:string;
  english?:string;
  localized?:Partial<Record<RegionalLanguageSlug,string>>;
}):NonNullable<Metadata["alternates"]>{
  const canonicalPath=normalizePath(canonical);
  const englishPath=normalizePath(english??canonicalPath);
  const languages:Record<string,string>={
    [DEFAULT_HREFLANG]:englishPath,
    [X_DEFAULT_HREFLANG]:englishPath,
  };
  for(const language of regionalLanguageSlugs){
    const path=localized?.[language];
    if(path)languages[regionalLanguageSeo[language].hreflang]=normalizePath(path);
  }
  return {canonical:canonicalPath,languages};
}

export function regionalCityAlternates(city:City,englishPath:string,localizedPaths:Partial<Record<RegionalLanguageSlug,string>>){
  return multilingualAlternates({canonical:englishPath,english:englishPath,localized:localizedPaths});
}

export function localizedPageAlternates({
  language,
  canonical,
  english,
  localized,
}:{
  language:RegionalLanguageSlug;
  canonical:string;
  english:string;
  localized:Partial<Record<RegionalLanguageSlug,string>>;
}){
  return multilingualAlternates({canonical,english,localized:{...localized,[language]:canonical}});
}
