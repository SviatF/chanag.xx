import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {MuhuratRow} from "./muhurat";

type Fact={label:string;value:string;note?:string};

export type MuhuratCitySimilarityContext={
  title:string;
  localityBody:string;
  decisionTitle:string;
  decisionBody:string;
  facts:Fact[];
};

const localityLens:Record<string,string>={
  mumbai:`This shortlist is read through an Arabian-Sea Konkan frame: a humid harbour metropolis on the western edge of the Deccan, with a late civil-time solar profile and strong coastal continuity. The useful local question is not whether another west-Indian city shares the same Tithi, but how the retained windows survive on this maritime clock after exclusions are applied.`,
  delhi:`The local frame is the Yamuna-side northern plain, where continental seasonality and a comparatively high latitude produce a different daylight rhythm from peninsular India. The planning page therefore treats the capital-region clock as its own inland northern sequence and keeps its surviving windows attached to that seasonal solar geometry.`,
  bengaluru:`The decision frame comes from the elevated southern-Deccan plateau: inland, low-latitude and moderated by altitude rather than by a sea-facing clock. A candidate that looks similar on the lunar layer can resolve differently once favorable periods are screened against this plateau timing structure, so the local result is preserved as a distinct calculation surface.`,
  hyderabad:`The shortlist belongs to the Telangana Deccan around the Musi corridor, an inland mid-peninsular setting with its own east-west solar placement. The practical identity of the page comes from how lunar-qualified dates interact with this Deccan exclusion clock, not from reusing a generic southern-city schedule.`,
  ahmedabad:`The locality lens is the Sabarmati corridor of north-central Gujarat: dry inland western India, north of the Gulf-facing southern Gujarat belt and firmly west of the national standard-meridian frame. That combination gives the shortlist a north-Gujarat timing identity, so retained windows are interpreted through this specific inland-western clock.`,
  chennai:`The local decision frame is the Coromandel Coast on the Bay of Bengal: low-latitude, sea-facing and substantially east of the western-India solar clock. The month is therefore read as an east-coast timing sequence, where locally screened windows can enter and close on a different civil-time pattern from inland Deccan pages.`,
  kolkata:`The shortlist is anchored in the lower Hooghly and Bengal-delta setting, with an eastern-India civil-time solar profile and a humid alluvial geography. Its local identity comes from that delta-side clock: exclusions and retained favorable periods are evaluated in an eastern frame rather than treated as interchangeable with central or western northern India.`,
  surat:`The planning lens is the lower Tapi basin near the Gulf of Khambhat, a southern-Gujarat setting with coastal influence but a distinct urban-river geography. The local solar clock is western, yet the latitude and basin position differ from north-central Gujarat, so the retained-window pattern is interpreted as its own southern-Gujarat sequence.`,
  pune:`The shortlist is read from the western-Deccan plateau east of the Sahyadri escarpment. It shares western-India civil time without sharing the harbour-side geography of the Konkan coast, so its usable-window structure is an inland plateau result: local exclusions, clean blocks and fallbacks are evaluated on that elevated clock.`,
  jaipur:`The locality frame is the Aravalli-side basin of eastern Rajasthan, a dry north-western inland environment with strong seasonal daylight movement. This produces a planning context unlike the lower-latitude Deccan or eastern Gangetic plain, and the shortlist keeps its favorable-window decisions tied to that north-western solar geometry.`,
  lucknow:`The local frame is Awadh in the central Gangetic plain, an alluvial northern setting east of the western Hindi-belt solar clock. The page therefore reads candidate spacing and retained windows through a central-Gangetic timing sequence, keeping the exclusion pattern tied to local dawn-derived calculations rather than to a broad north-India proxy.`,
  kanpur:`The shortlist belongs to the central Ganga corridor, an industrial alluvial-plain setting close to the standard-meridian side of north India. Its identity is deliberately local: even small clock differences matter when favorable blocks touch exclusion boundaries, so candidate continuity is evaluated against this central-river timing frame.`,
  nagpur:`The decision lens is the Vidarbha plateau near geographic central India, where the civil solar clock lies comparatively close to the national standard-meridian frame. This central positioning gives the shortlist a balanced inland timing identity and makes its retained-window topology different from both the far-western coast and the eastern Gangetic belt.`,
  indore:`The local frame is the Malwa plateau of western Madhya Pradesh: elevated, inland and west of the national meridian, with a seasonal profile distinct from the deeper Deccan. Candidate quality is therefore interpreted through a Malwa timing structure, especially where exclusion intervals split or shorten otherwise favorable daytime blocks.`,
  thane:`The planning surface sits in the north-eastern Mumbai metropolitan sector of the Konkan belt, close to the coast but not collapsed into a harbour-city proxy. The calculation keeps its own coordinate-level exclusion boundaries, which matters precisely for close metropolitan clocks where a retained interval can be shortened or removed by only a small local shift.`,
  bhopal:`The locality lens comes from the lake-and-plateau landscape of central Madhya Pradesh, positioned between the more western Malwa clock and the near-meridian central-India frame. That intermediate geography gives the shortlist its own exclusion and continuity pattern, so the page is read as a central-plateau result rather than a generic Madhya Pradesh schedule.`,
  visakhapatnam:`The shortlist is anchored on the Bay-of-Bengal side of the Eastern Ghats, an Andhra coastal setting with an earlier eastern civil-time solar profile. Its candidate windows therefore belong to a coast-facing eastern sequence, and clean-time supply is judged after local exclusions rather than imported from the Deccan interior.`,
  patna:`The local frame is the south bank of the Ganges in Bihar, an eastern Gangetic alluvial setting with a civil solar clock earlier than most central and western northern metros. The shortlist keeps that downstream-river timing identity visible when candidate dates are ranked by surviving local windows.`,
  vadodara:`The decision lens is the Vishwamitri basin of central Gujarat, geographically between the Sabarmati zone to the north and lower-Gulf Gujarat to the south. That middle-Gujarat position creates a separate western solar-clock profile, so the page evaluates continuity and exclusions on its own central-Gujarat timing grid.`,
  varanasi:`The shortlist is read through the middle-Ganges corridor of eastern Uttar Pradesh, a riverine northern setting close to the standard-meridian side and east of the central Gangetic urban belt. The local result therefore reflects an eastern-Gangetic exclusion clock and keeps its surviving favorable blocks tied to that dawn-based geometry.`
};

function monthLabel(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}
function weekday(date:string){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(`${date}T06:00:00Z`));}
function leader(values:string[]){
  const counts=new Map<string,number>();
  for(const value of values)counts.set(value,(counts.get(value)??0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;
}
function median(values:number[]){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2);}
function gapClass(rows:readonly MuhuratRow[]){
  if(rows.length<2)return rows.length?"single-candidate":"no-candidate";
  const gap=rows[0].planning.score-rows[1].planning.score;
  if(gap<=2)return "near-tied leaders";
  if(gap<=7)return "narrow leader gap";
  return "clear leader gap";
}
function supplyClass(minutes:number){if(minutes<60)return "thin clean-time supply";if(minutes<150)return "moderate clean-time supply";return "deep clean-time supply";}
function diversityClass(count:number){if(count<=1)return "single-pattern lunar field";if(count<=3)return "compact lunar mix";return "broad lunar mix";}

export function buildMuhuratCitySimilarityContext(city:City,rows:readonly MuhuratRow[],eventTitle:string,year:number,month:number):MuhuratCitySimilarityContext{
  const profile=buildCityContentProfile(city),label=monthLabel(year,month);
  const localityBody=localityLens[city.slug]??`${profile.dailyContext} The ${eventTitle.toLowerCase()} shortlist remains attached to ${profile.geoContext}, a ${profile.latitudeContext} with a solar clock ${profile.solarClockContext}.`;
  if(!rows.length){
    return {
      title:`${city.name} locality decision lens`,
      localityBody,
      decisionTitle:`${label} shortlist topology`,
      decisionBody:`The lunar gate returns no candidate row for this event-month combination. The useful local signal is therefore the zero-result itself: the page does not substitute a neighbouring city's dates, manufacture a fallback window or recycle a national shortlist. The empty field remains attached to this locality and can change independently in another month when the accepted Tithi and Nakshatra combinations are screened again.`,
      facts:[
        {label:"Geographic decision frame",value:profile.geoContext,note:profile.solarClockContext},
        {label:"Shortlist topology",value:"zero-result local field"},
        {label:"Fallback policy",value:"no borrowed dates"}
      ]
    };
  }

  const weekdayLead=leader(rows.map(row=>weekday(row.date)));
  const tithiLead=leader(rows.map(row=>row.data.tithi));
  const nakshatraLead=leader(rows.map(row=>row.data.nakshatra));
  const lunarPairs=new Set(rows.map(row=>`${row.data.tithi}|${row.data.nakshatra}`)).size;
  const sourceSets=rows.map(row=>new Set(row.recommendedWindows.flatMap(window=>window.sources)).size);
  const cleanMedian=median(rows.map(row=>row.planning.totalCleanMinutes));
  const continuityMedian=median(rows.map(row=>row.planning.longestWindowMinutes));
  const emptyWindows=rows.filter(row=>row.recommendedWindows.length===0).length;
  const abhijitRows=rows.filter(row=>row.planning.hasAbhijit).length;
  const openingWeekday=weekday(rows.map(row=>row.date).sort()[0]);
  const closingWeekday=weekday(rows.map(row=>row.date).sort().at(-1)!);
  const gradeLead=leader(rows.map(row=>row.planning.grade));
  const topology=gapClass(rows);
  const lunarDiversity=diversityClass(lunarPairs);
  const cleanSupply=supplyClass(cleanMedian);
  const sourceMedian=median(sourceSets);

  return {
    title:`${city.name} locality decision lens`,
    localityBody,
    decisionTitle:`${label} shortlist topology`,
    decisionBody:`The candidate field opens on a ${openingWeekday} and closes on a ${closingWeekday}; ${weekdayLead?.[0]??"no weekday"} is the most frequent candidate weekday. Its ranking shape is a ${topology}, while the lunar composition is a ${lunarDiversity}: ${tithiLead?.[0]??"no Tithi"} leads the Tithi count and ${nakshatraLead?.[0]??"no Nakshatra"} leads the Nakshatra count. The median row carries ${cleanSupply}, with a ${continuityMedian}-minute median longest uninterrupted block and ${cleanMedian} median clean minutes. A typical row retains ${sourceMedian} distinct favorable timing sources; ${abhijitRows} rows preserve Abhijit after exclusions, while ${emptyWindows} rows lose every favorable daytime window. Together these signals describe the local decision surface rather than repeating the same city-agnostic ranking paragraph.`,
    facts:[
      {label:"Locality frame",value:profile.geoContext,note:`${profile.latitudeContext} · ${profile.solarClockContext}`},
      {label:"Candidate weekday arc",value:`${openingWeekday} → ${closingWeekday}`,note:`Leader: ${weekdayLead?.[0]??"none"}`},
      {label:"Ranking topology",value:topology,note:`${rows.length} lunar-qualified rows`},
      {label:"Lunar diversity",value:lunarDiversity,note:`${lunarPairs} distinct Tithi + Nakshatra pairs`},
      {label:"Dominant lunar pair components",value:`${tithiLead?.[0]??"none"} · ${nakshatraLead?.[0]??"none"}`,note:"Most frequent Tithi and Nakshatra in the local shortlist"},
      {label:"Median continuity",value:`${continuityMedian} min`,note:cleanSupply},
      {label:"Typical source diversity",value:`${sourceMedian} sources`,note:`Abhijit retained on ${abhijitRows} rows`},
      {label:"Dominant grade",value:gradeLead?.[0]??"none",note:`Rows with no retained favorable window: ${emptyWindows}`}
    ]
  };
}
