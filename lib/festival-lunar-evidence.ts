import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";
import {formatPanchangTime} from "./panchang";

/**
 * This is an evidence annotation of the actual sunrise Tithi/its first transition,
 * NOT a ritual-date selection engine. A complete observance can require a
 * different time boundary, regional tradition, or more than one Tithi change.
 */
export type FestivalTithiEvidence={
  key:"active-at-sunrise"|"begins-on-date"|"begins-on-later-date"|"not-in-first-transition"|"not-applicable";
  target:string|null;
  label:string|null;
  value:string|null;
  explanation:string|null;
};
type LunarState={paksha:Panchang["paksha"];tithi:string};
const tithiCycle=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi"] as const;
const targetByFestival:Record<string,LunarState>={
  "maha-shivaratri":{paksha:"Krishna",tithi:"Chaturdashi"},
  "chaitra-navratri":{paksha:"Shukla",tithi:"Pratipada"},
  "rama-navami":{paksha:"Shukla",tithi:"Navami"},
  "hanuman-jayanti":{paksha:"Shukla",tithi:"Purnima"},
  "akshaya-tritiya":{paksha:"Shukla",tithi:"Tritiya"},
  "guru-purnima":{paksha:"Shukla",tithi:"Purnima"},
  "raksha-bandhan":{paksha:"Shukla",tithi:"Purnima"},
  "janmashtami":{paksha:"Krishna",tithi:"Ashtami"},
  "ganesh-chaturthi":{paksha:"Shukla",tithi:"Chaturthi"},
  "shardiya-navratri":{paksha:"Shukla",tithi:"Pratipada"},
  "dussehra":{paksha:"Shukla",tithi:"Dashami"},
  "karwa-chauth":{paksha:"Krishna",tithi:"Chaturthi"},
  "dhanteras":{paksha:"Krishna",tithi:"Trayodashi"},
  "diwali":{paksha:"Krishna",tithi:"Amavasya"},
  "govardhan-puja":{paksha:"Shukla",tithi:"Pratipada"},
  "bhai-dooj":{paksha:"Shukla",tithi:"Dvitiya"},
  "chhath-puja":{paksha:"Shukla",tithi:"Shashthi"},
};
export function nextTithiState(state:LunarState):LunarState|null{
  const index=tithiCycle.indexOf(state.tithi as typeof tithiCycle[number]);
  if(index<0){
    if(state.paksha==="Shukla"&&state.tithi==="Purnima")return {paksha:"Krishna",tithi:"Pratipada"};
    if(state.paksha==="Krishna"&&state.tithi==="Amavasya")return {paksha:"Shukla",tithi:"Pratipada"};
    return null;
  }
  if(index===tithiCycle.length-1)return {paksha:state.paksha,tithi:state.paksha==="Shukla"?"Purnima":"Amavasya"};
  return {paksha:state.paksha,tithi:tithiCycle[index+1]};
}
function same(a:LunarState,b:LunarState){return a.paksha===b.paksha&&a.tithi===b.tithi;}
export function getFestivalTithiEvidence(festival:Festival,data:Panchang):FestivalTithiEvidence{
  const target=targetByFestival[festival.slug];
  if(!target)return {key:"not-applicable",target:null,label:null,value:null,explanation:null};
  const targetName=`${target.paksha} ${target.tithi}`;
  const sunriseState:LunarState={paksha:data.paksha,tithi:data.tithi};
  const end=formatPanchangTime(data.tithiEnd,data.tithiEndDate,data.date);
  if(same(sunriseState,target)){
    return {
      key:"active-at-sunrise",target:targetName,
      label:"Festival Tithi at sunrise",value:`${targetName} · until ${end}`,
      explanation:`At local sunrise (${data.sunrise}), ${targetName} is already active and its next calculated transition is ${end}.`
    };
  }
  const next=nextTithiState(sunriseState);
  if(next&&same(next,target)&&data.tithiEnd!=="—"&&data.tithiEndDate){
    const sameDay=data.tithiEndDate===data.date;
    return {
      key:sameDay?"begins-on-date":"begins-on-later-date",target:targetName,
      label:"Festival Tithi begins",value:`${targetName} · ${end}`,
      explanation:`At local sunrise (${data.sunrise}) the Tithi is ${data.paksha} ${data.tithi}. The next transition at ${end} begins ${targetName}${sameDay?" on this festival date":" on the stated later local date"}.`
    };
  }
  return {
    key:"not-in-first-transition",target:targetName,
    label:null,value:null,
    explanation:`At local sunrise (${data.sunrise}) the calculated state is ${data.paksha} ${data.tithi}; the first transition is at ${end}. The ${targetName} marker is not identified in this first transition.`
  };
}
