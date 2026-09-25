import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type FestivalSummary=Pick<Festival,"name"|"slug"|"date">;
type Fact={label:string;value:string;note?:string};

export type CalendarYearSimilarityContext={
  title:string;
  localityBody:string;
  chronologyTitle:string;
  chronologyBody:string;
  festivalTitle:string;
  festivalBody:string;
  facts:Fact[];
};

const annualLensBySlug:Record<string,string>={
  mumbai:"Mumbai's annual Panchang should be read as a western-coast sequence. The Konkan setting keeps the civil-time solar clock noticeably west of India's standard meridian, while the city's tropical latitude compresses the yearly daylight swing. Across twelve month openings, that combination makes clock placement more distinctive than raw month names: seasonal movement is present, but it is expressed inside a relatively compact daylight envelope.",
  delhi:"Delhi's yearly sequence belongs to the northern plains and therefore carries a much stronger seasonal daylight arc than peninsular calendars. Its solar clock is west of the national standard meridian, so winter and summer sunrise shifts appear on a comparatively late IST frame. The annual interpretation is therefore driven by the combination of northern seasonality, Yamuna-plain geography and a western civil-clock offset.",
  bengaluru:"Bengaluru combines an elevated southern-Deccan setting with low-latitude seasonality. Its yearly pattern is not a northern-style winter-versus-summer swing; instead, the month-start sequence stays comparatively compact while the western solar-clock offset keeps sunrise-derived periods later on IST than east-coast cities at similar latitude. The plateau location is the central annual lens for this calendar.",
  hyderabad:"Hyderabad's annual calendar is a Deccan-plateau chronology centered on the Musi corridor. Mid-Deccan latitude gives more seasonal movement than the deep south without approaching the amplitude of Delhi or Jaipur, and the city remains west-shifted from the standard meridian. The result is a middle-band yearly profile: moderate daylight change carried on a later IST solar clock.",
  ahmedabad:"Ahmedabad's year is anchored to the Sabarmati corridor in western India. Its north-central latitude produces a visible seasonal daylight cycle, while the strongly western longitude pushes sunrise-derived timing later on IST. The yearly calendar therefore combines western clock placement with greater seasonal amplitude than coastal Mumbai or southern Deccan cities, giving its twelve month starts a distinctly Gujarat inland profile.",
  chennai:"Chennai's annual pattern is an east-coast tropical sequence on the Coromandel Coast. Low latitude keeps daylight variation relatively restrained, while the city's longitude shifts the solar clock earlier on IST than most western and Deccan metros. The twelve month openings should therefore be read as a mild-seasonality calendar whose timing boundaries occur on an earlier civil-time frame.",
  kolkata:"Kolkata's yearly Panchang is shaped by the lower Hooghly corridor of the Bengal delta. Its eastern longitude places sunrise-derived intervals early on the IST clock, while north-central latitude creates more annual daylight movement than Chennai or Bengaluru. The defining yearly contrast is therefore an eastern civil-time frame combined with a meaningful but not extreme seasonal solar arc.",
  surat:"Surat's annual calendar belongs to the lower Tapi basin near the Gulf of Khambhat. The city is strongly west-shifted from the standard meridian, yet it sits farther south than Ahmedabad, so its seasonal daylight range is comparatively softer. That pairing creates a Gujarat profile with late IST solar timing but a less northern annual swing than the Sabarmati corridor.",
  pune:"Pune's twelve-month sequence is a western-Deccan calendar east of the Sahyadri range. Its plateau latitude keeps the annual daylight swing moderate, while western longitude delays sunrise-derived periods on IST relative to central-meridian cities. The useful yearly lens is therefore inland plateau seasonality on a distinctly western solar clock, rather than the maritime pattern of Mumbai.",
  jaipur:"Jaipur's calendar reflects the Aravalli-side basin of Rajasthan at northern latitude. Strong seasonal daylight movement is paired with a substantially western solar clock, producing pronounced winter-summer changes on a later IST frame. Among the core cities, the annual sequence is best understood as a north-western combination of large seasonal amplitude and late civil-time solar placement.",
  lucknow:"Lucknow's yearly series sits in the Awadh sector of the central Gangetic plain. Its longitude lies relatively near India's standard-meridian zone compared with Delhi or Ahmedabad, while northern-plain latitude still produces a substantial seasonal daylight cycle. The annual profile is therefore dominated more by north-Indian seasonality than by an extreme east-west clock offset.",
  kanpur:"Kanpur's annual Panchang belongs to the central Uttar Pradesh Ganga corridor. The city is close enough to the national solar-time axis that the yearly distinction comes primarily from northern-plain daylight seasonality and the exact local month-start states, not from a large civil-clock displacement. Its twelve-month arc is a near-meridian Gangetic pattern with strong seasonal structure.",
  nagpur:"Nagpur forms a central-India annual reference from the Vidarbha plateau. Its longitude lies close to the standard-meridian side of the country, reducing the east-west civil-time distortion seen in Gujarat or Assam, while mid-Deccan latitude keeps seasonality moderate. The yearly calendar is therefore a comparatively central solar-clock sequence with a balanced seasonal daylight arc.",
  indore:"Indore's annual pattern is rooted in the Malwa plateau of western Madhya Pradesh. It sits west of the standard meridian and north of the deeper Deccan cities, so the calendar combines a moderately late IST solar clock with a stronger seasonal daylight cycle than Hyderabad or Bengaluru. This west-central plateau mix defines the yearly timing signature.",
  thane:"Thane shares the Konkan climatic latitude band with Mumbai but occupies the north-eastern side of the metropolitan region rather than the open Arabian Sea-facing core. Its annual sequence remains western and relatively low-latitude, yet its own coordinates preserve separate month-start sunrise states. The yearly lens is a metropolitan-Konkan clock with compact seasonality, not a copied Mumbai calendar.",
  bhopal:"Bhopal's yearly calendar belongs to the lake-and-plateau landscape of central Madhya Pradesh. Its longitude is closer to the national meridian than Indore's, while its central latitude creates a moderate seasonal daylight range. The annual profile therefore sits between western Malwa timing and the near-meridian central-India pattern, with neither extreme western delay nor deep-southern compression.",
  visakhapatnam:"Visakhapatnam's annual Panchang is an east-coast sequence where the Bay of Bengal meets the Eastern Ghats. Its eastern longitude moves sunrise-derived intervals earlier on IST, and its peninsular latitude keeps the yearly daylight swing milder than the northern plains. The calendar's defining annual character is early civil-time solar placement combined with a restrained coastal seasonal arc.",
  patna:"Patna's yearly sequence follows the south-bank Ganges plain of Bihar. The city sits east of most north-Indian core metros, so sunrise-derived timing is earlier on IST, while its northern-plain latitude still gives the year a pronounced seasonal daylight cycle. The annual fingerprint combines eastern Gangetic clock placement with substantial winter-summer solar movement.",
  vadodara:"Vadodara's annual calendar is centered on the Vishwamitri basin of central Gujarat. Like Ahmedabad and Surat it is west-shifted from the standard meridian, but its intermediate latitude gives it a distinct seasonal balance between the more northerly Sabarmati corridor and the lower Tapi basin. The yearly signal is a central-Gujarat combination of late IST timing and moderate-to-strong seasonality.",
  varanasi:"Varanasi's annual Panchang belongs to the middle Ganges corridor of eastern Uttar Pradesh. Its longitude is close to, and slightly east of, the national standard-meridian zone, so local solar time sits earlier than Lucknow or Delhi while northern latitude preserves a strong seasonal daylight cycle. The yearly lens is an eastern Gangetic sequence with near-meridian clock behavior and pronounced seasonality."
};

const annualDiscriminatorBySlug:Record<string,string>={
  mumbai:"Annual discriminator: harbour-facing Konkan timing, maritime-western clock placement, compact tropical daylight seasonality.",
  delhi:"Annual discriminator: Yamuna-plain northern seasonality, pronounced solstitial contrast, later western-IST sunrise placement.",
  bengaluru:"Annual discriminator: elevated plateau low-latitude stability, mild solstitial spread, west-shifted inland southern clock.",
  hyderabad:"Annual discriminator: Musi-Deccan middle-band seasonality, inland plateau timing, moderate western civil-clock delay.",
  ahmedabad:"Annual discriminator: Sabarmati inland Gujarat profile, north-central seasonal expansion, strongly delayed western solar clock.",
  chennai:"Annual discriminator: Coromandel tropical coast, restrained daylight oscillation, earlier east-coast civil-time sunrise pattern.",
  kolkata:"Annual discriminator: Hooghly-delta eastern clock, Bengal lowland month starts, north-central seasonal daylight movement.",
  surat:"Annual discriminator: lower-Tapi gulf-side setting, southern-Gujarat daylight moderation, late western solar-clock placement.",
  pune:"Annual discriminator: Sahyadri-leeward Deccan plateau, inland western timing, moderate annual daylight expansion and contraction.",
  jaipur:"Annual discriminator: Aravalli-basin north-western frame, large solstitial daylight swing, distinctly late western-India clock.",
  lucknow:"Annual discriminator: Awadh central-Gangetic frame, strong northern seasonality, comparatively near-meridian civil solar timing.",
  kanpur:"Annual discriminator: central Ganga corridor, near-standard-meridian solar clock, Doab-style northern seasonal month-start arc.",
  nagpur:"Annual discriminator: Vidarbha central-India plateau, balanced mid-Deccan seasonality, near-axis civil-time solar placement.",
  indore:"Annual discriminator: Malwa west-central plateau, stronger seasonal swing than Deccan south, moderately delayed solar clock.",
  thane:"Annual discriminator: north-eastern metropolitan Konkan coordinates, compact coastal seasonality, separate Ulhas-side month-start timing.",
  bhopal:"Annual discriminator: central lake-plateau geography, intermediate meridian position, moderate seasonality between Malwa and Vidarbha profiles.",
  visakhapatnam:"Annual discriminator: Eastern-Ghats coastal edge, early Bay-of-Bengal civil clock, mild peninsular seasonal daylight cycle.",
  patna:"Annual discriminator: Bihar south-bank Ganges setting, eastern IST sunrise placement, strong northern-plain seasonal amplitude.",
  vadodara:"Annual discriminator: Vishwamitri central-Gujarat position, intermediate Gujarat latitude, late western clock with mid-level seasonality.",
  varanasi:"Annual discriminator: eastern Uttar Pradesh Ganges corridor, slightly eastward near-meridian timing, pronounced northern seasonal cycle."
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylight(entry:Panchang){const rise=clockMinutes(entry.sunrise),set=clockMinutes(entry.sunset);return set>=rise?set-rise:set+1440-rise;}
function monthName(month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)));}
function weekday(year:number,month:number,day=1){return new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,day,6)));}
function yearFrame(year:number){
  const leap=new Date(Date.UTC(year,1,29)).getUTCMonth()===1;
  const open=weekday(year,1,1),close=weekday(year,12,31);
  return {key:`${leap?"leap":"common"}-${open.toLowerCase()}`,label:`${leap?"leap":"common"} Gregorian year opening on ${open}`,open,close,leap};
}
function sunriseClass(value:string){const min=clockMinutes(value);if(min<350)return "very-early";if(min<365)return "early";if(min<380)return "near-six";if(min<395)return "post-six";return "late";}
function daylightClass(value:number){if(value<700)return "compact";if(value<730)return "short-balanced";if(value<760)return "balanced";if(value<790)return "long-balanced";return "extended";}
function monthArc(snapshots:readonly Panchang[]){return snapshots.map((item,index)=>`${monthName(index+1)} ${item.paksha} ${item.tithi} / ${item.nakshatra} / ${sunriseClass(item.sunrise)} sunrise`).join(" · ");}
function seasonalArc(snapshots:readonly Panchang[]){return snapshots.map((item,index)=>`${monthName(index+1)} ${daylightClass(daylight(item))}`).join(" · ");}
function festivalMap(festivals:readonly FestivalSummary[],year:number){
  if(!festivals.length)return "No maintained festival entries are attached to this year.";
  const byMonth=new Map<number,FestivalSummary[]>();
  for(const item of festivals){const m=Number(item.date.slice(5,7));byMonth.set(m,[...(byMonth.get(m)??[]),item]);}
  return [...byMonth.entries()].sort((a,b)=>a[0]-b[0]).map(([month,items])=>`${monthName(month)}: ${items.map(item=>`${item.name} on ${weekday(year,month,Number(item.date.slice(8,10)))}`).join(", ")}`).join(" · ");
}
function quarterFingerprint(snapshots:readonly Panchang[]){const picks=[0,3,6,9].filter(index=>snapshots[index]);return picks.map(index=>{const item=snapshots[index];return `${monthName(index+1)} opens with ${item.paksha} ${item.tithi}, ${item.nakshatra}, Moon in ${item.rashi}`;}).join(" · ");}
function dominantMonthStartWeekday(year:number){
  const counts=new Map<string,number>();
  for(let month=1;month<=12;month++){const w=weekday(year,month,1);counts.set(w,(counts.get(w)??0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]??["—",0] as [string,number];
}
function cityVariant(slug:string){let h=19;for(let i=0;i<slug.length;i++)h=(h*151+slug.charCodeAt(i)*(i+7))%104729;return h%6;}

export function buildCalendarYearSimilarityContext(city:City,year:number,snapshots:readonly Panchang[],festivals:readonly FestivalSummary[]):CalendarYearSimilarityContext{
  const profile=buildCityContentProfile(city),frame=yearFrame(year),variant=cityVariant(city.slug),monthStart=dominantMonthStartWeekday(year);
  const annualLens=annualLensBySlug[city.slug]??`${profile.dailyContext} The annual sequence keeps ${profile.geoContext} as its locality frame, with ${profile.latitudeContext} and ${profile.solarClockContext}.`;
  const discriminator=annualDiscriminatorBySlug[city.slug]??`Annual discriminator: ${profile.geoContext}, ${profile.latitudeContext}, ${profile.solarClockContext}.`;
  if(!snapshots.length){
    return {
      title:`${city.name} ${year} locality lens`,
      localityBody:`${annualLens} ${discriminator} No month-start Panchang snapshots are available, so the yearly route preserves the city frame without inventing an annual lunar sequence.`,
      chronologyTitle:`${frame.label}`,
      chronologyBody:`The civil year opens on ${frame.open} and closes on ${frame.close}; no month-start Panchang snapshots are currently available to build a twelve-step chronology.`,
      festivalTitle:"Festival footprint",
      festivalBody:"No maintained festival entries are attached to the empty yearly snapshot state.",
      facts:[{label:"Year frame",value:frame.key},{label:"Geographic frame",value:profile.geoContext},{label:"Solar clock",value:profile.solarClockContext}]
    };
  }

  const first=snapshots[0],last=snapshots[snapshots.length-1];
  const daylightValues=snapshots.map(daylight);
  const minDay=Math.min(...daylightValues),maxDay=Math.max(...daylightValues);
  const shortestIndex=daylightValues.indexOf(minDay),longestIndex=daylightValues.indexOf(maxDay);
  const firstQuarter=quarterFingerprint(snapshots);
  const arc=monthArc(snapshots),solarArc=seasonalArc(snapshots),festMap=festivalMap(festivals,year);
  const distinctWeekdays=new Set(Array.from({length:12},(_,i)=>weekday(year,i+1,1))).size;
  const sunriseClasses=[...new Set(snapshots.map(item=>sunriseClass(item.sunrise)))];
  const daylightClasses=[...new Set(daylightValues.map(daylightClass))];
  const lunarPairs=[...new Set(snapshots.map(item=>`${item.paksha} ${item.tithi}`))];
  const nakshatras=[...new Set(snapshots.map(item=>item.nakshatra))];
  const lunarRashis=[...new Set(snapshots.map(item=>item.rashi))];

  const localityBody=variant===0
    ? `${annualLens} ${discriminator} Across the full ${year} calendar, the city-specific clock is sampled at twelve month starts. The sequence remains tied to ${profile.geoContext}; the observed annual sunrise and daylight pattern should therefore be read inside that locality rather than against a national fixed timetable.`
    : variant===1
      ? `${annualLens} ${discriminator} The twelve first-of-month checkpoints turn that geographic frame into an annual series. Rather than treating the route as a renamed national calendar, each lunar state and solar boundary stays attached to the city's own coordinates.`
      : variant===2
        ? `${annualLens} ${discriminator} The year-level chronology preserves those local coordinates at every month opening. Seasonal daylight change and civil-clock placement are therefore interpreted together instead of reducing the page to a generic list of twelve months.`
        : variant===3
          ? `${annualLens} ${discriminator} That city frame is carried through twelve local month-start Panchang calculations. The result is an annual series in which solar timing, lunar state and festival placement remain tied to one locality.`
          : variant===4
            ? `${annualLens} ${discriminator} The yearly route keeps this local solar frame intact at every first-of-month checkpoint, so nearby cities are not used as substitutes even when their civil dates or festival lists overlap.`
            : `${annualLens} ${discriminator} Twelve monthly checkpoints preserve the same city-specific frame across the year. The annual timing signature therefore comes from local coordinates plus the changing lunar state, not from a generic yearly shell.`;

  const chronologyBody=variant%3===0
    ? `${frame.label}. Month-start weekdays span ${distinctWeekdays} weekday labels, led by ${monthStart[0]} on ${monthStart[1]} month openings. The quarter checkpoints are ${firstQuarter}. The full lunar/sunrise arc is ${arc}.`
    : variant%3===1
      ? `The civil-year frame is ${frame.key}: January opens on ${frame.open} and December closes on ${frame.close}. Among first-of-month dates, ${monthStart[0]} is the most frequent opening weekday. Quarter anchors read ${firstQuarter}. Across all twelve snapshots, the sunrise-state chronology is ${arc}.`
      : `Calendar geometry and Panchang geometry intersect here. ${frame.leap?"A leap-year frame adds the extra February day":"A common-year frame keeps February at its ordinary length"}, while first-of-month weekdays cover ${distinctWeekdays} distinct labels. The quarter-start lunar checkpoints are ${firstQuarter}; the twelve-step sequence is ${arc}.`;

  const festivalBody=festivals.length
    ? `Festival placement is mapped onto this city's yearly route as follows: ${festMap}. The same annual series carries ${lunarPairs.length} distinct Paksha/Tithi month-start states, ${nakshatras.length} Nakshatras and ${lunarRashis.length} Moon-sign states. Solar-day classes across the year are ${solarArc}.`
    : `There is no maintained festival entry for ${year}, so this yearly route is differentiated by its local annual Panchang chronology instead: ${lunarPairs.length} Paksha/Tithi month-start states, ${nakshatras.length} Nakshatras, ${lunarRashis.length} Moon signs and the solar-day sequence ${solarArc}.`;

  return {
    title:`${city.name} ${year} annual locality lens · ${frame.key}`,
    localityBody,
    chronologyTitle:`Civil-year + month-start chronology · ${frame.open} opening`,
    chronologyBody,
    festivalTitle:`Annual festival and solar-day map`,
    festivalBody,
    facts:[
      {label:"Annual locality discriminator",value:discriminator,note:profile.dailyContext},
      {label:"Civil-year frame",value:frame.key,note:`${frame.open} → ${frame.close}`},
      {label:"Most common month-start weekday",value:monthStart[0],note:`${monthStart[1]} month openings`},
      {label:"Geographic frame",value:profile.geoContext,note:profile.latitudeContext},
      {label:"Solar-clock relation",value:profile.solarClockContext},
      {label:"Shortest sampled daylight",value:daylightClass(minDay),note:monthName(shortestIndex+1)},
      {label:"Longest sampled daylight",value:daylightClass(maxDay),note:monthName(longestIndex+1)},
      {label:"Sunrise-class variety",value:sunriseClasses.join(" · ")},
      {label:"Daylight-class variety",value:daylightClasses.join(" · ")},
      {label:"Lunar-state variety",value:`${lunarPairs.length} Paksha/Tithi · ${nakshatras.length} Nakshatras`,note:`${lunarRashis.length} Moon signs`},
      {label:"Year endpoints",value:`${first.paksha} ${first.tithi} → ${last.paksha} ${last.tithi}`,note:`${first.nakshatra} → ${last.nakshatra}`},
    ]
  };
}
