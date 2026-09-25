import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};

export type DailyCityContext={
  title:string;
  body:string;
  secondaryBody:string;
  facts:Fact[];
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function daylight(data:Panchang){const start=clockMinutes(data.sunrise),end=clockMinutes(data.sunset);return end>=start?end-start:end+1440-start;}
function phase(minutes:number){if(minutes<360)return "pre-six sunrise";if(minutes<390)return "early sunrise";if(minutes<420)return "mid-morning-edge sunrise";return "late sunrise";}
function transitionBand(time:string,sunrise:string,sunset:string){const t=clockMinutes(time),rise=clockMinutes(sunrise),set=clockMinutes(sunset),span=Math.max(1,set-rise),share=(t-rise)/span;if(share<0.2)return "opening daylight";if(share<0.4)return "morning";if(share<0.6)return "midday";if(share<0.8)return "afternoon";return "late-day or post-sunset";}
function hash(slug:string){let value=41;for(let i=0;i<slug.length;i++)value=(value*149+slug.charCodeAt(i)*(i+5))%99991;return value;}
function wordsMinutes(minutes:number){if(minutes<710)return "compact";if(minutes<735)return "moderate-short";if(minutes<755)return "balanced";if(minutes<780)return "moderate-long";return "extended";}

export function buildDailyCityContext(city:City,data:Panchang):DailyCityContext{
  const profile=buildCityContentProfile(city);
  const key=hash(city.slug);
  const dayMinutes=daylight(data);
  const tithiBand=transitionBand(data.tithiEnd,data.sunrise,data.sunset);
  const nakshatraBand=transitionBand(data.nakshatraEnd,data.sunrise,data.sunset);
  const good=data.dayChoghadiya.filter(item=>item.effect==="good");
  const firstGood=good[0];
  const lastGood=good[good.length-1];
  const moonState=data.moonIllumination<25?"low-illumination":data.moonIllumination<55?"mid-illumination":data.moonIllumination<80?"brightening":"high-illumination";
  const sunrisePhase=phase(clockMinutes(data.sunrise));
  const dayShape=wordsMinutes(dayMinutes);
  const rahuOffset=Math.max(0,clockMinutes(data.rahu.start)-clockMinutes(data.sunrise));
  const bodyVariant=key%8;
  const secondVariant=Math.floor(key/8)%8;

  const bodies=[
    `For ${city.name}, the useful local reading starts with ${profile.geoContext}. This is not just a label on a national table: ${profile.solarClockContext}, and that changes where sunrise-derived intervals sit on the IST clock. Today's ${sunrisePhase} opens a ${dayShape} daylight span. The Tithi boundary falls in the ${tithiBand} band, while the Nakshatra boundary falls in the ${nakshatraBand} band, so the two lunar clocks occupy different parts of the local day.`,
    `${profile.geoContext} gives ${city.name} its own daily timing frame. The city is ${profile.solarClockContext}, so sunrise, Rahu Kalam and Choghadiya must be read from the local solar day rather than borrowed from another metro. Today's daylight profile is ${dayShape}; the Tithi changes around the ${tithiBand} portion of that span and the Nakshatra changes around ${nakshatraBand}. Together those transitions define the page's local chronology.`,
    `The daily calculation is anchored to ${city.name}'s position in ${profile.geoContext}. Its ${profile.latitudeContext} and ${profile.solarClockContext} produce a civil-time pattern that can differ materially from western, eastern or coastal alternatives. Today begins with a ${sunrisePhase}, develops into a ${dayShape} solar day, and then carries the Tithi and Nakshatra hand-offs through the ${tithiBand} and ${nakshatraBand} parts of daylight respectively.`,
    `Read ${city.name} as a local solar location first: ${profile.geoContext}, ${profile.latitudeContext}, and ${profile.solarClockContext}. That geography determines where sunrise-based Panchang periods land on the clock. On this date the day is ${dayShape}; its lunar structure is split because the Tithi transition belongs to ${tithiBand}, whereas the Nakshatra transition belongs to ${nakshatraBand}. This is the main reason a nearby city's timetable is not interchangeable.`,
    `${city.name}'s Panchang sits inside the timing geometry of ${profile.geoContext}. The solar clock is ${profile.solarClockContext}, while the latitude profile is ${profile.latitudeContext}. Today's local day is ${dayShape}, beginning in a ${sunrisePhase} pattern. Instead of one static lunar label for the full civil date, the Tithi changes in ${tithiBand} and the Nakshatra changes in ${nakshatraBand}, producing a two-step sequence after sunrise.`,
    `The city-specific signal here comes from ${profile.geoContext}. ${city.name} is ${profile.solarClockContext}; therefore the clock placement of Rahu, Choghadiya and lunar transitions is evaluated from this city's own sunrise. The current day has a ${dayShape} daylight span. Tithi turnover sits in ${tithiBand}, Nakshatra turnover in ${nakshatraBand}, which gives the date a local order that cannot be reproduced by changing only the city name.`,
    `Today's page uses ${city.name}'s real geographic frame: ${profile.geoContext}. Because it is ${profile.solarClockContext}, the same weekday can map to visibly different clock times than in another part of India. This date produces a ${dayShape} daylight shape with a ${sunrisePhase}; the Tithi boundary occupies ${tithiBand} while the Nakshatra boundary occupies ${nakshatraBand}. Those two positions are the core local fingerprint for the civil day.`,
    `In ${city.name}, Panchang timing is read through ${profile.geoContext} and a ${profile.latitudeContext}. The city's solar clock is ${profile.solarClockContext}, so locally derived intervals remain tied to its own sunrise and sunset. Today the solar span is ${dayShape}. The Tithi exits during ${tithiBand}; the Nakshatra exits during ${nakshatraBand}. That separation turns the page from a static daily label set into a location-specific timeline.`
  ];

  const secondary=[
    `Rahu begins ${rahuOffset} minutes after sunrise. The daytime Choghadiya sequence contains ${good.length} favorable-labelled periods${firstGood&&lastGood?`, opening with ${firstGood.name} and closing with ${lastGood.name}`:""}. The Moon is in a ${moonState} state at ${data.moonIllumination}% illumination, with ${data.rashi} as lunar Rashi and ${data.solarRashi} as solar Rashi. These layers describe different parts of the day: exclusion timing, favorable-period structure and lunar background should be read together rather than collapsed into one score.`,
    `The intraday pattern adds another layer: Rahu starts ${rahuOffset} minutes after local sunrise, while ${good.length} daytime Choghadiya periods carry favorable labels${firstGood?`; the first is ${firstGood.name}`:""}. Moon illumination is ${data.moonIllumination}%, placing the date in a ${moonState} phase with the Moon in ${data.rashi}. This combination explains why the same Tithi can still produce a different practical day structure when the city, sunrise and weekday grid change.`,
    `Local timing is not represented by the lunar labels alone. Rahu enters ${rahuOffset} minutes after sunrise; the Choghadiya table contributes ${good.length} favorable-labelled windows${lastGood?`, ending with ${lastGood.name}`:""}. At the same time the Moon carries ${data.moonIllumination}% illumination in ${data.rashi}, against a solar Rashi of ${data.solarRashi}. The result is a three-layer local profile: lunar state, solar-day exclusions and weekday-derived favorable periods.`,
    `After sunrise, Rahu arrives with a ${rahuOffset}-minute offset from dawn. The daytime grid has ${good.length} favorable Choghadiya segments${firstGood&&lastGood?`, spanning from ${firstGood.name} to ${lastGood.name}`:""}. The Moon's ${data.moonIllumination}% illumination places the date in the ${moonState} class. That makes today's page locally useful in two ways: it shows when the city's exclusion clock acts and how the lunar backdrop develops through the same civil day.`,
    `Today's solar-day structure puts Rahu ${rahuOffset} minutes after sunrise. Separately, the Choghadiya sequence has ${good.length} good-labelled daytime periods${firstGood?`, beginning with ${firstGood.name}`:""}. The lunar backdrop is ${moonState}: ${data.moonIllumination}% illumination, Moon in ${data.rashi}, Sun in ${data.solarRashi}. None of those signals replaces the others; together they explain the city's practical timing shape for this date.`,
    `The city's own sunrise creates the local reference for Rahu, which begins ${rahuOffset} minutes later. The weekday sequence yields ${good.length} favorable Choghadiya periods${lastGood?`, with ${lastGood.name} as the last favorable label` :""}. Meanwhile the Moon is ${data.moonIllumination}% illuminated in ${data.rashi}. Reading these together preserves the distinction between lunar astronomy, sunrise-derived exclusions and weekday timing labels.`,
    `Rahu's local position is ${rahuOffset} minutes after sunrise. Favorable Choghadiya appears ${good.length} times in the daytime sequence${firstGood&&lastGood?`, from ${firstGood.name} through ${lastGood.name}`:""}. Moon illumination is ${data.moonIllumination}%, a ${moonState} background with ${data.rashi} lunar Rashi. This makes the daily signature more than a list of times: it describes how several independent timing systems intersect in this city's local day.`,
    `The practical clock layer starts with Rahu at a ${rahuOffset}-minute offset from sunrise. Choghadiya contributes ${good.length} favorable-labelled periods${firstGood?`, starting with ${firstGood.name}`:""}, while the Moon sits at ${data.moonIllumination}% illumination in ${data.rashi}. Taken together with ${data.solarRashi} solar Rashi, these values form the date's local timing texture without treating any single indicator as the whole Panchang.`
  ];

  return {
    title:`${city.name} local-day interpretation`,
    body:bodies[bodyVariant],
    secondaryBody:secondary[secondVariant],
    facts:[
      {label:"Geographic frame",value:profile.geoContext,note:profile.latitudeContext},
      {label:"Solar-clock relation",value:profile.solarClockContext,note:sunrisePhase},
      {label:"Daylight shape",value:dayShape,note:`${dayMinutes} minutes`},
      {label:"Tithi transition band",value:tithiBand,note:data.tithiEnd},
      {label:"Nakshatra transition band",value:nakshatraBand,note:data.nakshatraEnd},
      {label:"Moon-light state",value:moonState,note:`${data.moonIllumination}% illumination`},
    ]
  };
}
