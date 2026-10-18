/**
 * Reader-visible evidence status for algorithmically screened Muhurat routes.
 *
 * DO NOT map a timing grade or a lunar-screened candidate to a religious
 * eligibility verdict. A reviewed closure uses VerifiedMuhuratClosurePage
 * instead. There is currently no certified per-row ritual approval dataset.
 */
import type {City} from "./cities";
import {getVerifiedMuhuratClosure} from "./verified-muhurat-closures";

export type MuhuratVerificationNotice={
  status:"astronomical-candidate-only"|"reviewed-closed-calendar";
  headline:string;
  explanation:string;
};

const eventCautions:Readonly<Record<string,string>>={
  wedding:"marriage-season restrictions, Guru/Shukra Tara Asta, Lagna and community-specific Vivaha Shuddhi",
  "griha-pravesh":"approved house-entry months, Guru/Shukra Tara Asta, Lagna and local Griha Pravesh Shuddhi",
  "vehicle-purchase":"purchase-specific Panchang rules, event-level Yoga/Karana restrictions and local ceremony conventions",
  "naming-ceremony":"Namakarana-specific timing, family customs and the child's birth circumstances",
  "business-opening":"business-initiation rules, event-level Yoga/Karana restrictions and local tradition",
  "gold-purchase":"purchase-specific Yoga/Karana suitability and community practices"
};

export function getMuhuratVerificationNotice(
  event:string,year:number,month:number|null,city:Pick<City,"slug"|"name"|"state">
):MuhuratVerificationNotice{
  const closure=month===null?null:getVerifiedMuhuratClosure(event,year,month,city);
  if(closure)return{
    status:"reviewed-closed-calendar",
    headline:"Source-reviewed customary calendar: no recommended dates",
    explanation:`The ${closure.convention} excludes ${closure.cityName} in this specific month. This is not a universal prohibition for all local communities.`
  };
  const period=month===null?String(year):new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(year,month-1,1)));
  return{
    status:"astronomical-candidate-only",
    headline:"Astronomical candidates · NOT verified ceremony dates",
    explanation:`These ${city.name} ${period} dates pass only the sunrise lunar and retained daytime-window screen. The 0–100 score measures window availability, not ceremony eligibility. Full ${eventCautions[event]??"ceremony-specific planetary, regional and family rules"} have NOT been independently verified for every listed date. Consult local Panchang and religious guidance before using them for a ceremony.`
  };
}
