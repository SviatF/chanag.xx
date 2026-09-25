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

const localDecisionFocus:Record<string,string>={
  mumbai:`For the harbour-side clock, the most informative reading starts with continuity: check whether a clean block remains intact after the three exclusion periods, then compare the next-ranked date for a similarly durable fallback. Coastal western timing can preserve a broad-looking civil-day schedule while the usable segment itself is much narrower, so uninterrupted supply is kept visible rather than hidden inside the score.`,
  delhi:`For this northern-plain frame, the reading order emphasizes calendar spread before intraday supply. First inspect whether candidates cluster tightly or span the month; then compare weekday distribution, leading lunar combinations and the depth of fallback windows. That separates a seasonally broad daylight frame from the actual shortlist geometry instead of treating every northern candidate as equivalent once it passes the lunar screen.`,
  bengaluru:`For the elevated plateau frame, source composition is read alongside continuity. A date supported by several retained favorable sources is distinguished from one that reaches a similar score through a single longer block. The page therefore exposes source diversity, median clean minutes and the runner-up gap as separate signals, preserving the structure of the local result instead of compressing it into one ranking number.`,
  hyderabad:`For the inland Telangana frame, exclusion pressure is treated as an independent layer. The shortlist shows whether Rahu, Yamaganda or Gulika remove nominally favorable periods, how many rows lose all daytime supply, and whether the leading row still has a practical fallback. This makes the Deccan result legible as a screened timing field rather than merely a list of lunar-qualified civil dates.`,
  ahmedabad:`For the Sabarmati-side western clock, the useful distinction is between lunar density and timing usability. The page first identifies how many different Tithi–Nakshatra combinations survive, then measures whether their clean-time windows remain concentrated or fragmented after exclusions. A locally strong shortlist is therefore visible through diversity plus retained continuity, not through candidate count alone.`,
  chennai:`For the east-coast frame, the analysis foregrounds intraday placement. Candidate weekdays and lunar combinations establish the calendar skeleton, but the practical comparison comes from where the first retained periods sit, whether Abhijit survives, and how much uninterrupted time remains after screening. This keeps the coastal eastern clock central to the interpretation instead of presenting a generic all-India timing paragraph.`,
  kolkata:`For the delta-side eastern frame, the page reads the month as a sequence of transitions rather than a flat inventory. Opening and closing candidate weekdays, dominant lunar components and the median clean-time supply show how the shortlist changes across the month. The leading date is then tested against fallback depth so a dense cluster is not mistaken for a uniformly strong set of choices.`,
  surat:`For the lower-Tapi frame, retained-source breadth is the first diagnostic. The shortlist distinguishes rows that keep several favorable timing sources from rows that depend on one surviving interval, then compares median continuity and exclusion loss. This makes a southern-Gujarat result readable through the robustness of its clean windows rather than through a state-wide timing assumption.`,
  pune:`For the western plateau frame, the page emphasizes the relationship between uninterrupted duration and total clean-time supply. A date can have many scattered minutes without a long practical block, or a compact field with one strong continuous interval. Showing both measures beside lunar diversity and fallback depth keeps the inland-Deccan shortlist analytically separate from nearby coastal timing patterns.`,
  jaipur:`For the Aravalli-side north-western frame, the shortlist is read through dispersion and fallback resilience. Candidate-date spacing establishes whether the month offers isolated or distributed options; grade leadership and the runner-up gap then show whether one date dominates or several remain competitive. The result therefore preserves the shape of the local field instead of reducing a seasonal inland calendar to a single top date.`,
  lucknow:`For the Awadh frame, weekday structure is used as a second axis beside the lunar screen. The page identifies the dominant candidate weekday, the opening-to-closing weekday arc and the most frequent lunar components, then checks whether clean-time continuity supports that calendar pattern. This gives the central-Gangetic shortlist a readable internal structure without borrowing another city's timing narrative.`,
  kanpur:`For the central Ganga-corridor frame, small boundary effects are made explicit through exclusion loss and source retention. The page shows how many rows keep Abhijit, how many lose all favorable daytime supply and how much uninterrupted time survives on the median row. That is deliberately more granular than a headline score because near-meridian local clocks can still diverge at timing boundaries.`,
  nagpur:`For the near-central-meridian frame, the analysis uses balance rather than extremity as the key reading. Lunar-pair diversity, typical source count, median continuity and grade distribution are shown together to reveal whether the shortlist is consistently usable or driven by one exceptional row. This central-India lens makes the structure visible even when civil-time values look less extreme than on eastern or western edges.`,
  indore:`For the Malwa frame, fragmentation is the main diagnostic after lunar qualification. The page contrasts total clean minutes with the longest uninterrupted block, counts rows stripped of all favorable daytime windows and surfaces the leader gap. This distinguishes a shortlist with genuinely usable continuity from one whose nominal supply is broken into smaller pieces by local exclusions.`,
  thane:`For the metropolitan-Konkan frame, sensitivity to small local shifts is handled through fallback comparison. The leader is read beside the next-ranked row, source diversity and exclusion loss so that a narrow coordinate-level timing change does not disappear inside a rounded score. The page therefore treats close metropolitan timing as something to inspect, not as a reason to reuse a neighbouring city's content.`,
  bhopal:`For the central lake-and-plateau frame, the shortlist is interpreted through distribution across several dimensions: candidate weekdays, lunar-pair variety, clean-time depth and source breadth. No single dimension is allowed to stand in for the result. This intermediate geography is therefore represented by the balance of its local signals rather than by generic central-India wording or a borrowed rank table.`,
  visakhapatnam:`For the Eastern-Ghats coastal frame, the practical lens starts with timing-source survival on the earlier eastern clock. The page checks whether favorable Choghadiya or Abhijit periods remain after exclusions, then compares uninterrupted duration and fallback depth. This preserves a coast-facing Andhra timing identity while keeping the underlying lunar qualification visible as a separate layer.`,
  patna:`For the eastern Gangetic frame, the shortlist is read from calendar cadence into timing supply. Candidate weekday spread and dominant lunar combinations describe the date field; median clean minutes and continuity describe its usability after exclusions. The page then exposes whether the leader is decisive or only narrowly ahead, which keeps the downstream-river result from collapsing into generic north-India copy.`,
  vadodara:`For the central-Gujarat frame, the useful signal is the interaction between a middle-position western clock and the shortlist's internal diversity. The page compares distinct lunar pairs, retained-source breadth, Abhijit survival and median uninterrupted time, then checks the gap to the fallback row. This creates a decision surface specific to the central-Gujarat calculation instead of interpolating between other state cities.`,
  varanasi:`For the eastern Uttar-Pradesh river frame, the shortlist is read through cadence, lunar composition and boundary survival. Opening and closing weekdays show the month's candidate arc; leading Tithi and Nakshatra components show its lunar concentration; clean-time continuity then reveals which rows remain practical after exclusions. The result stays attached to the local middle-Ganges clock rather than to a broad Gangetic template.`
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
  const baseLocality=localityLens[city.slug]??`${profile.dailyContext} The ${eventTitle.toLowerCase()} shortlist remains attached to ${profile.geoContext}, a ${profile.latitudeContext} with a solar clock ${profile.solarClockContext}.`;
  const focus=localDecisionFocus[city.slug]??`The local decision frame keeps candidate spacing, source diversity, exclusion loss and clean-time continuity visible as separate signals instead of collapsing the result into one score.`;
  const localityBody=`${baseLocality} ${focus}`;
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
