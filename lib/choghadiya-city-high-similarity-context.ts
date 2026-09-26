import type {City} from "./cities";
import type {ChoghadiyaPeriod,Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};

type CityLens={
  title:string;
  locality:string;
  solar:string;
  planning:string;
  terrainLabel:string;
  clockLabel:string;
};

export type ChoghadiyaCityHighSimilarityContext={
  title:string;
  localityBody:string;
  solarTitle:string;
  solarBody:string;
  planningTitle:string;
  planningBody:string;
  facts:Fact[];
};

const cityLenses:Record<string,CityLens>={
  ahmedabad:{
    title:"North-central Gujarat inland clock",
    locality:"This route is anchored in north-central Gujarat's dry inland plain rather than a coastal or plateau timing environment. The location sits well west of India's standard-time meridian, so local solar progression trails the national clock more noticeably than it does in eastern India. That western inland position is the useful geographical identity of this Choghadiya page: the weekday name sequence may be shared elsewhere, but the boundary clock is not.",
    solar:"Use the local sunrise as the first timing anchor, then read the eight daytime divisions forward from that western-Gujarat dawn. Sunset closes an inland solar arc whose IST placement is displaced from the standard meridian. The practical signature is therefore a west-shifted sunrise-to-sunset frame, not a generic Friday or weekday template.",
    planning:"For scheduling, give priority to the actual opening and closing clock boundaries on this page. A favorable label should be interpreted inside this inland western-meridian frame, then checked against Rahu Kalam before it is treated as a usable interval. This keeps the decision tied to local solar geometry rather than to a copied all-India timetable.",
    terrainLabel:"north-central Gujarat inland plain",
    clockLabel:"western inland solar lag",
  },
  vadodara:{
    title:"East-central Gujarat transition clock",
    locality:"This page belongs to east-central Gujarat, a more south-easterly inland position than the state's north-western urban belt. Its longitude remains west of India's standard meridian, yet the solar lag is smaller than on farther-west Gujarat routes. That makes the page a transition profile: still a western-India clock, but with day boundaries pulled modestly earlier in IST than the state's more westerly locations.",
    solar:"Read the day as an east-central Gujarat transition from dawn to dusk. The sunrise boundary, eight equal-order weekday labels and evening cutoff all sit on a clock that has moved closer to the national meridian without reaching it. This intermediate longitude is the defining timing feature, especially when two Gujarat cities carry the same Choghadiya names.",
    planning:"The useful comparison is not the label order but the placement of those labels on the local clock. Check the first favorable segment, then the local Rahu interval, and finally the evening cutoff. This three-step reading emphasizes the route's east-central position and prevents a nearby Gujarat schedule from being treated as interchangeable.",
    terrainLabel:"east-central Gujarat transition plain",
    clockLabel:"moderate western solar lag",
  },
  surat:{
    title:"South Gujarat lower-Tapi coastal plain clock",
    locality:"The timing frame here is south Gujarat's lower-Tapi coastal plain, close to the Arabian Sea side of the state and distinctly south of the north-central Gujarat routes. Longitude still places the city west of the standard meridian, but the latitude and coastal-plain setting create a different daylight identity from both inland Gujarat and the elevated Deccan interior.",
    solar:"The day should be read as a south-Gujarat coastal-plain arc: local dawn opens the first slot, the eight daytime periods follow the weekday order, and sunset hands the sequence into the night grid. The key signature is the combination of a western-meridian clock with a lower-latitude coastal setting, not merely the repeated names of Shubh, Labh, Amrit or Char.",
    planning:"When selecting a usable period, start from the coastal-plain sunrise and verify where the favorable slots fall relative to Rahu Kalam. The evening handoff matters as well because the local sunset determines the final daytime boundary. That workflow is deliberately different from a plateau-city interpretation even on the same weekday.",
    terrainLabel:"south Gujarat lower-Tapi coastal plain",
    clockLabel:"coastal western-meridian clock",
  },
  indore:{
    title:"Western Malwa plateau clock",
    locality:"This Choghadiya belongs to the western Malwa plateau. Its inland plateau setting and west-of-standard-meridian longitude distinguish it from both Gujarat's lower plains and central Madhya Pradesh routes farther east. The page is therefore read through a western-Malwa solar frame: an elevated interior clock with a meaningful IST lag from the national meridian.",
    solar:"Treat sunrise and sunset as the edges of a plateau day, then distribute the weekday Choghadiya sequence across that local span. The western-Malwa longitude keeps the solar arc later against IST than in the central part of Madhya Pradesh. That longitude-plus-plateau combination is the timing fingerprint even when the weekday label order itself is identical.",
    planning:"For practical use, inspect the first favorable plateau slot, its distance from sunrise, and whether Rahu Kalam cuts through any good-labelled interval. The decision is based on the local clean-time structure, not on the existence of a favorable name alone. This makes the route a western-Malwa planning screen rather than a generic Madhya Pradesh copy.",
    terrainLabel:"western Malwa plateau",
    clockLabel:"plateau-side western solar lag",
  },
  bhopal:{
    title:"Central Madhya Pradesh upland clock",
    locality:"This route represents the central Madhya Pradesh upland rather than the western Malwa edge. Its longitude lies materially closer to India's standard meridian, so the local solar clock carries less western delay than the state's farther-west routes. The geographical identity is central-interior: an upland day frame positioned between western plateau timing and the more easterly Gangetic-facing longitudes.",
    solar:"Read the eight daytime divisions from a central-interior sunrise baseline. Because the longitude is closer to the standard meridian, the IST placement of dawn, noon-side periods and sunset shifts relative to western Malwa even when the weekday names remain in the same order. The page's distinguishing feature is this central-upland alignment of solar boundaries.",
    planning:"Planning should follow a central-upland sequence: identify the local good-labelled slots, remove any Rahu conflict, and retain the remaining clock intervals. The purpose of the page is to show where the weekday pattern lands on this specific central Madhya Pradesh day, not to reproduce a state-level schedule.",
    terrainLabel:"central Madhya Pradesh upland",
    clockLabel:"nearer-meridian interior clock",
  },
  mumbai:{
    title:"Konkan coastal edge clock",
    locality:"This Choghadiya is anchored on the Konkan coast at India's western maritime edge. The Arabian Sea side location is far west of the standard-time meridian, producing one of the stronger longitude-driven solar lags among the phase-one cities. Its timing identity is coastal and maritime-facing, not an inland Maharashtra or Deccan-plateau pattern.",
    solar:"Use the sea-edge sunrise and sunset as the hard boundaries of the daytime grid. The large westward longitude displacement pushes the solar day later against IST than it would appear at the standard meridian. That coastal late-clock geometry is the main distinction: the same weekday sequence is stretched across a specifically Konkan clock.",
    planning:"For a usable interval, read the favorable slots inside the coastal day first and then subtract Rahu overlap. Evening boundaries deserve particular attention because the last daytime period terminates on the local maritime sunset. This route therefore behaves as a western-coast timing map rather than a Maharashtra-wide template.",
    terrainLabel:"Konkan coastal edge",
    clockLabel:"strong maritime western lag",
  },
  pune:{
    title:"Western Deccan plateau clock",
    locality:"This route sits on the elevated western Deccan plateau, inland from the Konkan coast. Although it remains west of India's standard meridian, its longitude and plateau position differ from the maritime edge, giving the page a separate inland-western timing identity. The day is read as an elevated Deccan solar frame rather than as a coastal Maharashtra schedule.",
    solar:"Start with the plateau sunrise and follow the weekday sequence across the local daylight span to the inland sunset. The longitude still creates a western IST lag, but the route's defining context is the elevated interior east of the coastal strip. That distinction matters because identical Choghadiya names can occupy different clock boundaries across the coast-to-plateau transition.",
    planning:"Use the first favorable plateau period as a candidate, check Rahu Kalam against it, and compare the later good-labelled slots before choosing a window. This layered reading emphasizes inland elevation and local solar boundaries instead of borrowing the clock from the nearby coast.",
    terrainLabel:"western Deccan plateau",
    clockLabel:"elevated inland western clock",
  },
  bengaluru:{
    title:"Southern Deccan high-plateau clock",
    locality:"This page is built on the southern Deccan high plateau. Its lower latitude and elevated inland setting separate it from western coastal India, central India and the more northerly Telangana interior. Longitude remains west of the standard meridian, but the southern high-plateau daylight frame is the dominant geographical signature.",
    solar:"Read the daytime grid from a southern high-plateau sunrise through to the local sunset, then continue into the night sequence. The latitude keeps the seasonal daylight swing comparatively restrained, while the longitude still leaves the solar clock behind IST's standard-meridian reference. Together those traits define a southern interior timing profile rather than a generic Deccan page.",
    planning:"For selection, compare the opening favorable slot with later good-labelled periods and remove any portion intersecting Rahu Kalam. Because the page represents a southern high plateau, its decision frame is the local sunrise-to-sunset geometry first and the weekday name order second.",
    terrainLabel:"southern Deccan high plateau",
    clockLabel:"southern plateau solar frame",
  },
  hyderabad:{
    title:"Interior Telangana Deccan clock",
    locality:"This Choghadiya belongs to the interior Telangana side of the Deccan plateau. It lies farther north and east than the southern high-plateau baseline, bringing its longitude closer to India's standard meridian while retaining an inland Deccan setting. The resulting identity is a north-central plateau clock rather than a southern Karnataka or western-coast pattern.",
    solar:"The local sunrise opens an interior-Telangana day whose eight weekday periods progress toward a plateau sunset on a clock closer to the standard meridian than many western cities. That eastward shift changes the IST placement of every boundary even when the Choghadiya names match another Deccan route.",
    planning:"Treat the page as a delivery of local clock boundaries: locate the favorable segments, inspect Rahu conflict, then compare the remaining day and night alternatives. The north-central Deccan position is the interpretive anchor, so a same-weekday schedule from a more southerly plateau city should not be substituted.",
    terrainLabel:"interior Telangana Deccan plateau",
    clockLabel:"north-central Deccan clock",
  },
  patna:{
    title:"Middle Ganga east-meridian alluvial clock",
    locality:"This route is read from the middle Ganga alluvial plain in Bihar, south of the river and east of India's standard-time meridian. Unlike the western-city profiles, its longitude places local solar progression slightly ahead of the IST meridian reference. The useful identity is therefore a Gangetic alluvial clock with an eastward solar lead, not a generic north-Indian weekday schedule.",
    solar:"Start from the local Ganga-plain sunrise and follow the eight daytime divisions toward the eastern-plain sunset. Because the longitude lies east of the standard meridian, solar noon and the surrounding Choghadiya boundaries arrive earlier against IST than they do in western and near-meridian cities. That eastward lead is the defining clock feature of this page.",
    planning:"For practical reading, identify the first favorable alluvial-plain slot, remove any Rahu overlap, and keep the city's earlier solar placement in view when comparing with an Uttar Pradesh or western-India timetable. The route is intended to preserve Bihar's local boundary clock rather than reuse a nearby Gangetic city's schedule.",
    terrainLabel:"middle Ganga alluvial plain",
    clockLabel:"east-of-meridian Gangetic lead",
  },
  varanasi:{
    title:"Ganga riverfront near-meridian clock",
    locality:"This Choghadiya belongs to the upper-middle Ganga riverfront in eastern Uttar Pradesh. Its longitude sits very close to India's standard-time meridian, so its solar clock has only a small meridian offset compared with cities farther east or west. The route's identity is a near-meridian riverfront day, not a broad Gangetic template.",
    solar:"Read sunrise and sunset as the boundaries of a near-standard-meridian riverfront arc. The eight daytime divisions occupy a clock whose longitude is close to the IST reference, making the local placement distinct from Bihar's more easterly solar lead and from the larger delays of western India. The riverfront latitude and near-meridian longitude together form the timing fingerprint.",
    planning:"Use the local riverfront sunrise to anchor the first slot, compare favorable labels against Rahu Kalam, and retain the intervals that survive that local check. When comparing with another Ganga-basin city, the important difference is the near-meridian clock placement rather than the repeated weekday Choghadiya name order.",
    terrainLabel:"upper-middle Ganga riverfront plain",
    clockLabel:"near-meridian Gangetic clock",
  },
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function periodMinutes(period:ChoghadiyaPeriod){const start=clockMinutes(period.start)+period.startDayOffset*1440;const end=clockMinutes(period.end)+period.endDayOffset*1440;return Math.max(0,end-start);}
function firstGood(periods:readonly ChoghadiyaPeriod[]){return periods.find(item=>item.effect==="good")??null;}
function lastGood(periods:readonly ChoghadiyaPeriod[]){return [...periods].reverse().find(item=>item.effect==="good")??null;}
function slotName(periods:readonly ChoghadiyaPeriod[],period:ChoghadiyaPeriod|null){if(!period)return "no favorable slot";const index=periods.indexOf(period);return ["opening","second","third","fourth","fifth","sixth","seventh","closing"][index]??`slot ${index+1}`;}
function meridianOffset(lng:number){return Math.round((lng-82.5)*4);}
function offsetBand(minutes:number){
  if(minutes<=-35)return "strong west-of-meridian lag";
  if(minutes<=-25)return "clear west-of-meridian lag";
  if(minutes<=-15)return "moderate west-of-meridian lag";
  if(minutes<=-5)return "light west-of-meridian lag";
  if(minutes<5)return "near-standard-meridian clock";
  if(minutes<15)return "light east-of-meridian lead";
  if(minutes<25)return "moderate east-of-meridian lead";
  return "clear east-of-meridian lead";
}
function offsetRelation(minutes:number){
  if(Math.abs(minutes)<2)return "approximately aligned with the standard meridian";
  return `${Math.abs(minutes)} solar minutes ${minutes>0?"ahead of":"behind"} the standard meridian`;
}
function daylightBand(minutes:number){if(minutes<710)return "compact daylight arc";if(minutes<730)return "short-balanced daylight arc";if(minutes<750)return "balanced daylight arc";if(minutes<770)return "long-balanced daylight arc";return "extended daylight arc";}

export function buildChoghadiyaCityHighSimilarityContext(data:Panchang,city:City):ChoghadiyaCityHighSimilarityContext|null{
  const lens=cityLenses[city.slug];
  if(!lens)return null;

  const dayFirst=firstGood(data.dayChoghadiya),dayLast=lastGood(data.dayChoghadiya),nightFirst=firstGood(data.nightChoghadiya);
  const dayMinutes=Math.max(0,clockMinutes(data.sunset)-clockMinutes(data.sunrise));
  const dayAvg=data.dayChoghadiya.length?Math.round(data.dayChoghadiya.reduce((sum,item)=>sum+periodMinutes(item),0)/data.dayChoghadiya.length):0;
  const nightAvg=data.nightChoghadiya.length?Math.round(data.nightChoghadiya.reduce((sum,item)=>sum+periodMinutes(item),0)/data.nightChoghadiya.length):0;
  const offset=meridianOffset(city.lng);
  const offsetClass=offsetBand(offset);
  const relation=offsetRelation(offset);
  const dayClass=daylightBand(dayMinutes);

  const solarBody=`${lens.solar} Today's local frame runs from ${data.sunrise} sunrise to ${data.sunset} sunset, a ${dayClass}. The first favorable daytime label is ${dayFirst?`${dayFirst.name} in the ${slotName(data.dayChoghadiya,dayFirst)} slot (${dayFirst.start}–${dayFirst.end})`:"absent"}; the last is ${dayLast?`${dayLast.name} ${dayLast.start}–${dayLast.end}`:"absent"}. Average daytime slot length is ${dayAvg} minutes, while the night grid averages ${nightAvg} minutes per slot.`;
  const planningBody=`${lens.planning} On this ${data.weekday}, Rahu Kalam is ${data.rahu.start}–${data.rahu.end}. The first favorable night label is ${nightFirst?`${nightFirst.name} in the ${slotName(data.nightChoghadiya,nightFirst)} night slot`:"not present"}. The longitude-only relation to 82.5°E is ${relation}, classified here as ${offsetClass}.`;

  return {
    title:lens.title,
    localityBody:lens.locality,
    solarTitle:`Local solar geometry · ${dayClass}`,
    solarBody,
    planningTitle:`How to read this ${lens.clockLabel}`,
    planningBody,
    facts:[
      {label:"Geographic lens",value:lens.terrainLabel,note:`${city.lat.toFixed(2)}°N · ${city.lng.toFixed(2)}°E`},
      {label:"Clock identity",value:lens.clockLabel,note:`${offsetClass} vs 82.5°E`},
      {label:"Solar-day shape",value:dayClass,note:`${data.sunrise} → ${data.sunset}`},
      {label:"First favorable day slot",value:dayFirst?`${slotName(data.dayChoghadiya,dayFirst)} · ${dayFirst.name}`:"none",note:dayFirst?`${dayFirst.start}–${dayFirst.end}`:"No good-labelled daytime slot"},
      {label:"First favorable night slot",value:nightFirst?`${slotName(data.nightChoghadiya,nightFirst)} · ${nightFirst.name}`:"none",note:nightFirst?`${nightFirst.start}–${nightFirst.end}`:"No good-labelled night slot"},
      {label:"Rahu check",value:`${data.rahu.start}–${data.rahu.end}`,note:"Evaluate after local favorable slots are identified"},
    ]
  };
}
