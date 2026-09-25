import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {VratDefinition,VratOccurrence} from "./vrat";

type Fact={label:string;value:string;note?:string};

type LocalLens={place:string;reading:string};

export type VratCitySimilarityContext={
  title:string;
  localityBody:string;
  boundaryTitle:string;
  boundaryBody:string;
  facts:Fact[];
};

const localLens:Record<string,LocalLens>={
  mumbai:{
    place:`The annual sequence belongs to an Arabian-Sea metropolitan setting on the Konkan coast. Its reference horizon is a west-facing harbour plain backed by the Sahyadri system, so the civil clock sits late within IST while the lunar test is still made at the city's own dawn. That combination matters most near a Tithi boundary: a state that survives one coastal sunrise can disappear before the next morning even when the civil date looks interchangeable with another western city.`,
    reading:`Read this locality through continuity across the coastal year. Compare the earliest-dawn part of the sequence with the later-dawn part, then check which observations carry their Tithi into the next civil date. The useful identity is not “western India” in general; it is the relationship between a harbour-side sunrise curve, repeated-at-dawn cases and the changing amount of post-sunrise Tithi time available across the retained observations.`
  },
  delhi:{
    place:`The yearly series is anchored to the Yamuna-side northern plain and a strongly continental seasonal cycle. Higher latitude gives this locality a much wider winter-to-summer daylight swing than southern peninsular cities, while its longitude keeps dawn later on IST than places nearer the national standard meridian. A sunrise-based lunar calendar here therefore has a pronounced seasonal frame: the same Tithi transition can sit on a different side of the morning checkpoint depending on where the observation falls in the year.`,
    reading:`The clearest way to read the local set is season first, recurrence second. Track whether observations are weighted toward the long-day or short-day half of the year, then inspect second-sunrise repeats and next-date Tithi endings. Weekday concentration is a separate axis rather than a substitute for the astronomical boundary. This gives the northern-plain series an annual rhythm that cannot be represented by a generic all-India list.`
  },
  bengaluru:{
    place:`This sequence comes from an elevated southern-Deccan plateau rather than a sea-level coastal clock. The low latitude keeps annual sunrise variation comparatively compact, while elevation and inland position distinguish the local dawn line from both the Coromandel Coast and the more northerly Deccan. For a sunrise-state calendar, that compact solar envelope is itself informative: local differences are often expressed through boundary persistence rather than dramatic seasonal movement in the clock.`,
    reading:`Use the plateau lens to compare stability against lunar persistence. A relatively contained dawn range does not imply identical observance rows; the important question is how long the target Tithi remains after those local sunrises and how often it reaches another dawn. The annual signature therefore emphasizes persistence classes, recurrence, and the spread of weekdays while keeping seasonal clock movement as a supporting rather than dominant signal.`
  },
  hyderabad:{
    place:`The annual reference is set on the Telangana Deccan around the Musi corridor, an inland mid-peninsular location between the western plateau and the eastern coast. Its solar placement is neither a far-western late clock nor a Bay-of-Bengal coastal clock, and its latitude gives a moderate seasonal dawn shift. Sunrise-qualified lunar states are therefore resolved on a genuinely interior Deccan checkpoint instead of being inherited from another southern metro.`,
    reading:`Interpret the year as an interior timing bridge. First examine whether sunrise states cluster in particular parts of the year; then compare post-dawn persistence with the count of transitions that cross civil midnight. A row that looks similar by Tithi name can have a different boundary profile if its end time falls on the other side of the local morning. The locality lens keeps that interior Deccan geometry visible throughout the yearly sequence.`
  },
  ahmedabad:{
    place:`The sequence is rooted in the Sabarmati corridor of north-central Gujarat, an inland western setting well to the west of the national standard meridian. Its dawn arrives relatively late on IST, while its more northerly position gives stronger seasonal movement than southern Gujarat. That pairing makes the sunrise checkpoint distinct even within the same state: the calendar is shaped by a north-Gujarat clock, not by a single Gujarat-wide civil-date assumption.`,
    reading:`Read the year through the tension between late western dawn and seasonal spread. Compare the first and second halves of the year, then identify rows whose Tithi survives deep into the day versus rows that terminate close to sunrise. Repeated-at-dawn cases deserve separate attention because they expose exactly where the local boundary carries over. The resulting annual pattern is a Sabarmati-side lunar sequence rather than a renamed state template.`
  },
  chennai:{
    place:`This annual series belongs to the Coromandel Coast on the Bay of Bengal. Low latitude compresses the seasonal range of daylight compared with northern India, while the eastern longitude moves the local solar day earlier on IST than western metros. A sunrise-state test on this coast therefore combines an early civil-time dawn with relatively restrained annual movement, creating a distinct frame for deciding whether a target Tithi is active at morning checkpoint.`,
    reading:`The east-coast lens puts boundary timing ahead of raw date count. Inspect how often the Tithi end remains on the same civil date, how often it crosses midnight, and whether the sequence produces any second-sunrise carryover. Then use weekday and month distribution to describe the calendar cadence. This ordering keeps the coastal solar placement central without confusing a compact seasonal clock with a uniform lunar pattern.`
  },
  kolkata:{
    place:`The local year is tied to the lower Hooghly and Bengal-delta environment, one of the easternmost solar-clock frames among the active cities. Dawn-derived intervals occur early on IST, yet the latitude still produces a visible monsoon-to-winter and winter-to-summer shift across the year. For a Tithi-at-sunrise calendar, the important characteristic is this combination of eastern clock position and northern seasonal movement rather than either factor alone.`,
    reading:`Follow the delta sequence from its early-clock baseline into the annual boundary pattern. Compare months in which the target Tithi persists well after dawn with those where it exits quickly, then inspect whether consecutive sunrise states occur. The month footprint and weekday leader help describe cadence, but the core locality signal is the way an eastern sunrise intersects each lunar transition through the year.`
  },
  surat:{
    place:`The annual reference comes from the lower Tapi basin near the Gulf of Khambhat. It is a western civil-time clock, but the lower latitude and southern-Gujarat basin position distinguish it from the Sabarmati corridor and from the Konkan metropolitan belt. Sunrise-based lunar states are therefore checked on a southern-Gujarat horizon whose annual solar movement is milder than farther north while remaining distinctly late relative to eastern India.`,
    reading:`Use the lower-Tapi lens to separate geographical proximity from astronomical equivalence. Compare the annual dawn range with Tithi persistence, then look for next-date endings and repeated sunrise states that show where the lunar boundary outruns the solar checkpoint. The sequence should be understood through this mix of western clock position, lower-latitude seasonality and recurrence rather than through a shared regional label.`
  },
  pune:{
    place:`This series is generated from the western-Deccan plateau east of the Sahyadri escarpment. The city shares a late IST solar frame with the nearby Konkan belt but sits in an elevated inland environment rather than on the harbour plain. That distinction is important for a sunrise-state calendar because close western clocks can still place a Tithi transition on opposite sides of local dawn, especially when the transition lies near the morning boundary.`,
    reading:`Read the plateau year by comparing continuity with proximity to the coast. The annual dawn curve may resemble nearby western cities, so the differentiating evidence comes from the actual retained rows: which Tithi endings cross into the next date, where the longest and shortest post-sunrise persistence occur, and whether a state repeats at another dawn. The locality lens therefore preserves coordinate-level boundary behavior instead of assuming metropolitan interchangeability.`
  },
  jaipur:{
    place:`The annual sequence is anchored in the Aravalli-side basin of eastern Rajasthan, a dry north-western inland setting with a relatively high latitude and a solar clock west of the standard meridian. Seasonal dawn movement is pronounced compared with low-latitude cities, while the inland horizon differs from both the Gangetic plain and the western coast. Those characteristics create a north-western sunrise frame for every retained lunar state.`,
    reading:`The most useful reading begins with annual dispersion. Identify whether the observations span the months evenly or concentrate in particular seasonal bands, then compare sunrise spread with the persistence of the target Tithi after dawn. Repeated states and next-date endings reveal where lunar transitions resist the local morning checkpoint. This makes the yearly set a north-western basin sequence rather than a generic northern calendar.`
  },
  lucknow:{
    place:`The yearly calendar belongs to Awadh in the central Gangetic plain. Its longitude lies closer to the standard-meridian side than Delhi or Jaipur, while the northern latitude retains a substantial seasonal sunrise swing. A local sunrise checkpoint here therefore combines a comparatively central civil-time solar position with the pronounced annual rhythm of the northern alluvial plain.`,
    reading:`Read the Awadh sequence through cadence across the river plain. Month coverage and weekday distribution establish the civil-calendar shape; post-sunrise Tithi duration then shows how the lunar state behaves at each local dawn. Rows ending on the following date and any repeated-at-sunrise observations are boundary markers, not exceptions to hide. Together they give the central-Gangetic year its own measurable structure.`
  },
  kanpur:{
    place:`This annual reference sits on the Ganga corridor of central Uttar Pradesh, close to the national standard-meridian side of India's solar-clock geography. Its northern latitude preserves a strong seasonal cycle, but the civil-time offset is smaller than in far-western cities. For sunrise-qualified Tithi states, that near-meridian position makes boundary precision especially visible: small time differences can decide whether a transition is before or after dawn.`,
    reading:`Use the central-corridor lens to inspect boundary sensitivity rather than dramatic clock offset. Compare the shortest and longest post-sunrise persistence, note which rows cross civil midnight, and check whether the same Tithi survives to a second sunrise. Month and weekday patterns then describe cadence around those boundaries. The result is a local Ganga-corridor sequence built from precise dawn checkpoints rather than a broad Uttar-Pradesh date list.`
  },
  nagpur:{
    place:`The local year is generated from the Vidarbha plateau near geographic central India. Longitude places its solar clock close to the national standard-meridian frame, while the mid-peninsular latitude produces a balanced annual dawn pattern between northern extremes and lower-latitude southern stability. This centrality does not make the calendar generic; it gives the sunrise test a distinctive near-meridian baseline against which lunar persistence can be measured.`,
    reading:`Interpret the Vidarbha sequence through balance. Compare first-half and second-half observations, the spread between earliest and latest dawn, and the distribution of Tithi persistence classes. Then inspect repeated sunrise states and next-date endings for genuine boundary carryover. The annual identity comes from the combination of near-meridian solar timing and the actual lunar-transition field, not from having less extreme clock values.`
  },
  indore:{
    place:`This yearly sequence belongs to the Malwa plateau of western Madhya Pradesh. It is elevated, inland and west of the standard meridian, with stronger seasonal movement than the deep southern peninsula but a different horizon from Gujarat and the Konkan coast. Each retained state is therefore tested on a Malwa sunrise whose civil-time placement and seasonal trajectory form their own western-central frame.`,
    reading:`Read the Malwa year by tracking how the lunar boundary moves against an inland plateau dawn. Month distribution shows the calendar cadence, while persistence spread reveals whether the target Tithi usually survives only briefly or remains active for much of the day. Rows that cross midnight or repeat at sunrise mark the strongest boundary cases. This combination distinguishes the western-central plateau from both coastal-western and near-meridian central calendars.`
  },
  thane:{
    place:`The annual reference is the north-eastern Mumbai metropolitan sector of the Konkan belt. It is geographically close to the harbour city but retains its own coordinate and therefore its own sunrise checkpoint. That matters most in a lunar-boundary product: two neighbouring metropolitan locations can share nearly every civil-calendar label yet still diverge when a Tithi transition falls close to dawn. The page intentionally preserves that local sensitivity.`,
    reading:`Use the metropolitan-Konkan lens to focus on small boundary shifts rather than broad regional difference. Compare the actual Tithi-end relation to sunrise, identify rows that continue to the next civil date, and note any repeated sunrise states. The earliest and latest local dawn provide the annual frame, but the decisive evidence is whether the lunar state survives those dawns. This prevents a close-city calendar from becoming a duplicate by assumption.`
  },
  bhopal:{
    place:`The sequence comes from the lake-and-plateau landscape of central Madhya Pradesh. Its longitude sits between the more western Malwa frame and the near-meridian Vidarbha frame, while its latitude produces a moderate northern-central seasonal cycle. The result is an intermediate inland solar position whose sunrise boundary should be treated on its own rather than averaged into a broad central-India schedule.`,
    reading:`Read this central plateau series as an intermediate geometry. Sunrise spread sets the annual frame; Tithi-persistence spread shows how the lunar state behaves inside it. Month footprint, weekday variety, next-date endings and repeated dawn states are separate dimensions that together reveal whether the sequence is steady or boundary-heavy. The locality identity is the balance among these signals, not an extreme value on any one of them.`
  },
  visakhapatnam:{
    place:`The local year is anchored between the Eastern Ghats and the Bay of Bengal on the Andhra coast. Eastern longitude gives an early IST solar profile, while peninsular latitude keeps seasonal dawn movement milder than the northern plains. A sunrise-state calendar here therefore belongs to an east-facing coastal clock distinct from the inland Deccan and from the farther-south Coromandel Coast.`,
    reading:`Use the Andhra-coast lens to trace how an early civil-time dawn intersects the lunar boundary. Compare same-date and next-date Tithi endings, measure the spread of post-sunrise persistence, and identify any state that survives to another morning. Month and weekday distributions then describe when those boundary cases occur. This keeps the coast-facing annual sequence separate from an inland or generic southern template.`
  },
  patna:{
    place:`This annual reference is set on the south bank of the Ganges in Bihar, an eastern Gangetic setting whose solar day arrives earlier on IST than the central and western northern metros. The latitude still supplies a pronounced seasonal dawn cycle, so the local sunrise test combines an eastern civil-time position with northern-plain seasonality. Each retained Tithi state is resolved against that downstream-river morning frame.`,
    reading:`Read the eastern-Gangetic year as a cadence of lunar boundaries along a shifting dawn. Compare the month footprint with the range of post-sunrise persistence, then separate ordinary same-date endings from transitions that continue into the next civil day. Repeated-at-dawn rows show the strongest carryover. Weekday concentration describes recurrence but does not replace the astronomical boundary that defines the local sequence.`
  },
  vadodara:{
    place:`The yearly series belongs to the Vishwamitri basin of central Gujarat, positioned between the Sabarmati corridor to the north and the lower-Gulf zone to the south. Its western solar clock is late on IST, but its latitude and longitude create a separate middle-Gujarat dawn line rather than an average of the neighbouring city frames. That local checkpoint is retained for every Tithi-at-sunrise observation.`,
    reading:`Use the central-Gujarat lens to test the idea of “between” rather than treating it as sameness. Compare annual sunrise spread, persistence classes and month distribution, then inspect next-date endings and repeated sunrise states for exact boundary behavior. The sequence can resemble adjacent western cities in broad clock position while diverging in which lunar states survive local dawn. That difference is the point of the locality layer.`
  },
  varanasi:{
    place:`This annual sequence is tied to the middle-Ganges corridor of eastern Uttar Pradesh. Longitude places the solar clock close to the standard-meridian side and east of the central Gangetic metros, while northern latitude retains a substantial seasonal cycle. The resulting sunrise boundary is an eastern-Uttar-Pradesh riverine frame that differs from both downstream Bihar and farther-western Awadh.`,
    reading:`Read the middle-Ganges year through progression along the calendar. The first and last retained months define the civil arc; sunrise spread and post-dawn persistence show how the astronomical boundary changes inside it. Rows that end on a following date or repeat at another sunrise expose the strongest carryover cases. Weekday structure then adds cadence without replacing the local dawn rule that determines inclusion.`
  }
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function durationFromSunrise(row:VratOccurrence){let end=clockMinutes(row.tithiEnd);const rise=clockMinutes(row.sunrise);if(row.tithiEndDate>row.date||end<rise)end+=1440;return Math.max(0,end-rise);}
function leader(values:string[]){const counts=new Map<string,number>();for(const value of values)counts.set(value,(counts.get(value)??0)+1);return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??null;}
function monthName(date:string){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"UTC"}).format(new Date(`${date}T12:00:00Z`));}
function persistenceBand(minutes:number){if(minutes<240)return "brief after-dawn";if(minutes<480)return "moderate after-dawn";if(minutes<720)return "extended daytime";if(minutes<960)return "late-day";return "overnight carry";}
function balanceLabel(first:number,second:number){const diff=first-second;if(Math.abs(diff)<=1)return "evenly split annual field";return diff>0?"front-half weighted field":"back-half weighted field";}

export function buildVratCitySimilarityContext(vrat:VratDefinition,year:number,city:City,rows:readonly VratOccurrence[]):VratCitySimilarityContext{
  const profile=buildCityContentProfile(city);
  const lens=localLens[city.slug]??{place:`The annual sequence remains attached to ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}.`,reading:`The locality is read through sunrise spread, Tithi persistence, next-date endings and repeated-at-dawn states rather than through a substituted national date list.`};
  if(!rows.length)return {
    title:`${city.name} annual locality lens`,
    localityBody:`${lens.place} ${lens.reading}`,
    boundaryTitle:`${vrat.name} ${year} boundary field`,
    boundaryBody:`No target Tithi state is retained at local sunrise in this annual set. The zero-result is kept as a locality result: no neighbouring city is used to fill the year, and the boundary is recalculated from this coordinate when another year is opened.`,
    facts:[{label:"Locality frame",value:profile.geoContext},{label:"Annual boundary field",value:"No retained sunrise state"}]
  };

  const sunrise=rows.map(row=>clockMinutes(row.sunrise));
  const persistence=rows.map(durationFromSunrise);
  const firstHalf=rows.filter(row=>Number(row.date.slice(5,7))<=6).length;
  const secondHalf=rows.length-firstHalf;
  const repeated=rows.filter(row=>row.repeatedAtSunrise).length;
  const nextDate=rows.filter(row=>row.tithiEndDate>row.date).length;
  const weekdayLead=leader(rows.map(row=>row.weekday));
  const persistenceLead=leader(persistence.map(persistenceBand));
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  const earliest=[...rows].sort((a,b)=>clockMinutes(a.sunrise)-clockMinutes(b.sunrise))[0];
  const latest=[...rows].sort((a,b)=>clockMinutes(b.sunrise)-clockMinutes(a.sunrise))[0];
  const longest=[...rows].map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>b.minutes-a.minutes)[0];
  const shortest=[...rows].map(row=>({row,minutes:durationFromSunrise(row)})).sort((a,b)=>a.minutes-b.minutes)[0];
  const pakshaLead=leader(rows.map(row=>row.paksha));
  const months=[...new Set(rows.map(row=>monthName(row.date)))];
  const annualBalance=balanceLabel(firstHalf,secondHalf);
  const sunriseSpread=Math.max(...sunrise)-Math.min(...sunrise);
  const persistenceSpread=Math.max(...persistence)-Math.min(...persistence);

  return {
    title:`${city.name} annual locality lens`,
    localityBody:`${lens.place} ${lens.reading}`,
    boundaryTitle:`${vrat.name} ${year} boundary field`,
    boundaryBody:`The retained field runs from ${monthName(sorted[0].date)} to ${monthName(sorted.at(-1)!.date)} across ${months.length} represented months and forms an ${annualBalance}. ${weekdayLead?.[0]??"No weekday"} is the most frequent civil weekday, while ${persistenceLead?.[0]??"no persistence class"} is the dominant post-sunrise duration class. The earliest local dawn in the set is ${earliest.sunrise} on ${earliest.date}; the latest is ${latest.sunrise} on ${latest.date}, a ${sunriseSpread}-minute spread. Tithi persistence spans ${persistenceSpread} minutes from the shortest retained case on ${shortest.row.date} to the longest on ${longest.row.date}. ${nextDate} observations end on a following civil date and ${repeated} are repeated at sunrise. ${pakshaLead?.[0]??"No Paksha"} is the leading Paksha in the retained rows. These signals are derived from the rendered annual observations rather than from city-name substitution.`,
    facts:[
      {label:"Locality frame",value:profile.geoContext,note:`${profile.latitudeContext} · ${profile.solarClockContext}`},
      {label:"Annual balance",value:annualBalance,note:`First half ${firstHalf} · second half ${secondHalf}`},
      {label:"Civil month arc",value:`${monthName(sorted[0].date)} → ${monthName(sorted.at(-1)!.date)}`,note:`${months.length} represented months`},
      {label:"Sunrise spread",value:`${sunriseSpread} min`,note:`${earliest.sunrise} → ${latest.sunrise}`},
      {label:"Persistence spread",value:`${persistenceSpread} min`,note:`${persistenceLead?.[0]??"none"} dominant`},
      {label:"Boundary carryover",value:`${nextDate} next-date endings`,note:`${repeated} repeated at sunrise`},
      {label:"Weekday leader",value:weekdayLead?.[0]??"none",note:`${weekdayLead?.[1]??0} retained observations`},
      {label:"Paksha leader",value:pakshaLead?.[0]??"none",note:`${pakshaLead?.[1]??0} retained observations`}
    ]
  };
}
