import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Festival} from "./festivals";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};

export type FestivalCityHighSimilarityContext={
  title:string;
  localityBody:string;
  timingTitle:string;
  timingBody:string;
  facts:Fact[];
};

const festivalCityLocalityBySlug:Record<string,string>={
  mumbai:`Mumbai approaches a festival date from the harbour-side Konkan clock: an Arabian Sea-facing metropolitan setting where the useful comparison is not another generic Maharashtra page but the nearby Thane coordinate and the inland Pune plateau. The local reading starts with Mumbai's own dawn and evening boundaries, then checks whether a lunar transition sits close enough to either boundary to matter. That coast-to-plateau contrast is the practical reason the Mumbai festival timetable is retained independently even when the civil festival date matches the rest of western India.`,
  delhi:`Delhi's festival clock belongs to the Yamuna-side northern plains. A useful geographic ladder runs from Jaipur's more western inland clock through Delhi and onward toward the central Gangetic cities, so the capital is neither a Rajasthan proxy nor an eastern Uttar Pradesh proxy. On a shared festival date, Delhi's stronger northern seasonal daylight swing changes the solar frame in which sunrise, midday, sunset and exclusion periods are read. The city page therefore treats the capital's local day as its own northern-plains observance reference.`,
  bengaluru:`Bengaluru reads a festival from an elevated southern-Deccan interior rather than from either coast. Chennai provides an east-coast comparison, while Hyderabad supplies a more northerly Deccan reference; the Bengaluru coordinate sits in a different solar and latitude combination from both. That three-way distinction is useful on festival days because the same Tithi can be present while dawn, daylight midpoint, sunset and locally derived periods occupy a different civil-clock frame. The Bengaluru page therefore preserves the plateau sequence instead of borrowing a coastal or Hyderabad timetable.`,
  hyderabad:`Hyderabad's festival-day reference is the Musi corridor on the Telangana Deccan. Bengaluru lies farther south-west on another plateau frame, Nagpur supplies a central-India comparison to the north, and Visakhapatnam supplies a Bay-of-Bengal reference to the east. Those directions make Hyderabad a distinct inland timing node rather than a generic Deccan page. For a shared festival date, the useful local question is how the city's own sunrise-to-sunset span carries the lunar transitions and exclusion periods across that interior Telangana clock.`,
  ahmedabad:`Ahmedabad places a festival on the Sabarmati corridor of north-central Gujarat, with a strongly western IST solar frame and a more northerly seasonal profile than Surat. Vadodara is the closest south-eastern Gujarat comparison, Surat supplies the lower-latitude reference, and Indore provides the Malwa contrast beyond the state. That geometry matters because a common festival date does not make those local dawn and evening checkpoints interchangeable. Ahmedabad's festival page therefore reads the observance through the Sabarmati-side solar day before applying the date's lunar and timing signals.`,
  chennai:`Chennai's festival timetable belongs to the Coromandel Coast at low peninsular latitude. Its civil-clock solar day is distinctly east-coast in character: Bengaluru is the inland plateau comparison, Hyderabad is the more northerly interior reference, and Visakhapatnam extends the Bay-of-Bengal comparison northward. The festival date may be shared, but those reference points do not share Chennai's exact dawn, daylight span or sunset. The city page therefore keeps the Coromandel solar axis visible when interpreting Tithi transitions and locally derived observance periods.`,
  kolkata:`Kolkata reads festival timing from the lower Hooghly corridor and Bengal-delta clock, one of the eastern timing frames in the active city set. Patna and Varanasi provide upstream Gangetic comparisons, while the delta setting keeps Kolkata geographically and chronologically distinct from both. The practical local signature is an earlier IST solar day combined with northern-enough latitude for visible seasonal daylight movement. On a shared festival date, that combination determines the dawn and evening checkpoints against which lunar transitions and observance signals are interpreted.`,
  surat:`Surat's festival day is anchored in the lower Tapi basin near the Gulf of Khambhat. It shares western India's late civil-clock solar character without becoming an Ahmedabad or Vadodara substitute: Ahmedabad is more northerly, Vadodara is the closer inland central-Gujarat reference, and Thane supplies a Konkan metropolitan contrast. This southern-Gujarat position gives the festival page its own dawn-to-sunset sequence. The local interpretation therefore starts from the Tapi-side solar clock and only then reads the shared festival's lunar and exclusion-period structure.`,
  pune:`Pune places festival timing on the western-Deccan plateau east of the Sahyadri range. Mumbai and Thane are the obvious Konkan comparisons, but Pune is inland rather than harbour-side, while Surat provides a farther north-western Gujarat reference. The shared western-India clock direction does not erase those geographic differences. On a festival date, Pune's own sunrise, daylight span and evening boundary remain the base against which the Tithi/Nakshatra sequence and locally calculated periods are read, keeping the plateau timetable separate from the coast.`,
  jaipur:`Jaipur's festival reference comes from the Aravalli-side basin of eastern Rajasthan, combining northern seasonality with a distinctly western solar clock. Delhi is the closest northern-plains comparison, Bhopal offers a central-plateau reference to the south-east, and Kanpur moves the comparison farther into the Gangetic plain. The same festival date therefore crosses different local solar frames along that arc. Jaipur's page keeps the Rajasthan inland day intact, using its own dawn, daylight geometry and sunset before interpreting the date's lunar transitions and observance-specific signals.`,
  lucknow:`Lucknow's festival day belongs to the Awadh sector of the central Gangetic plain. The most useful comparison is an east-west river-plain ladder: Kanpur sits immediately to the west, Varanasi moves the clock markedly farther east, and Delhi is a more distant western-plains reference. Lucknow occupies the middle of that sequence rather than serving as a generic Uttar Pradesh timetable. For each festival, the Awadh dawn and sunset establish the local frame in which lunar turnover, Rahu placement and any observance-focused period should be read.`,
  kanpur:`Kanpur interprets a festival from the Ganga corridor of central Uttar Pradesh. Its nearby comparison with Lucknow is deliberately retained because close geography can still place sunrise-sensitive lunar boundaries on different sides of a local checkpoint; Varanasi extends the Gangetic comparison eastward, while Delhi provides the farther western-plains contrast. Kanpur's role in that sequence is a central river-corridor clock. The festival page therefore uses its own local dawn-to-evening span instead of inheriting a neighbouring city schedule when the maintained festival date is shared.`,
  nagpur:`Nagpur's festival clock comes from the Vidarbha plateau near the geographic centre of India. Its solar frame is comparatively close to the national standard-meridian side, unlike the more western Malwa profile of Indore; Bhopal supplies a central-plateau comparison and Hyderabad a southern-Deccan one. This central position gives Nagpur a different city signature from both western and southern reference points. On festival days, the page preserves that Vidarbha dawn, daylight span and sunset as the frame for lunar transitions and locally derived periods.`,
  indore:`Indore reads festival timing from the Malwa plateau of western Madhya Pradesh. Bhopal is the nearest central-plateau comparison, Vadodara supplies a central-Gujarat clock to the west, and Ahmedabad extends that Gujarat comparison farther north-west. Indore is therefore an inland Malwa reference, not a Gujarat proxy and not a Bhopal duplicate. The festival date is interpreted through this west-central plateau day first, so sunrise, daylight midpoint, sunset and transition placement remain tied to the Indore solar frame.`,
  thane:`Thane's festival calculation belongs to the north-eastern Mumbai metropolitan sector of the Konkan belt. Mumbai is the immediate harbour-side comparison, Pune moves inland across the Sahyadri-side plateau, and Surat provides a southern-Gujarat reference farther north. Although Mumbai and Thane can have very similar clocks, the local coordinate is intentionally preserved because a lunar boundary near dawn or sunset can make a nearby timetable an unsafe substitute. The Thane festival page therefore retains its own metropolitan-Konkan sequence rather than copying Mumbai's.`,
  bhopal:`Bhopal places a festival in the lake-and-plateau landscape of central Madhya Pradesh. Its clock sits geographically between Indore's more western Malwa frame and Nagpur's near-meridian Vidarbha reference, with Jaipur adding a northern inland comparison. That intermediate location is Bhopal's useful identity: it is neither the western edge nor the central-meridian edge of the comparison set. On a festival date, Bhopal's own solar-day span becomes the reference for transition order, Rahu position and observance-specific timing.`,
  visakhapatnam:`Visakhapatnam's festival page uses an Eastern-Ghats and Bay-of-Bengal coastal reference. Hyderabad is the primary inland Deccan comparison, Nagpur supplies a central-plateau contrast, and Chennai provides a lower-latitude east-coast comparison farther south. Visakhapatnam's eastern longitude moves the civil-clock solar day earlier than the interior western cities while its coastal Andhra setting remains distinct from Chennai. The festival therefore keeps a local Andhra coastal dawn-to-sunset axis before the shared lunar date and observance rules are interpreted.`,
  patna:`Patna reads a festival from the south-bank Ganges plain of Bihar. Varanasi is the upstream eastern-Uttar-Pradesh comparison, Lucknow moves farther west along the Gangetic system, and Kolkata shifts the reference into the lower delta. Patna occupies a distinct eastern Gangetic clock between those contexts, with an earlier IST solar day than the central and western northern cities. The festival page keeps that Bihar river-plain frame visible so local dawn, evening and lunar-transition placement are not replaced by a Varanasi or Kolkata schedule.`,
  vadodara:`Vadodara's festival timetable belongs to the Vishwamitri basin of central Gujarat. Its geographic value lies precisely in the space between Ahmedabad to the north and Surat to the south, while Indore supplies the Malwa-plateau comparison to the east. The city's latitude and longitude therefore create a western solar clock that resembles its Gujarat neighbours without being identical to either. On a shared festival date, Vadodara's own sunrise-to-sunset sequence remains the frame for lunar hand-offs, exclusion periods and observance-focused timing.`,
  varanasi:`Varanasi interprets festival timing from the middle Ganges corridor of eastern Uttar Pradesh. Lucknow and Kanpur form the western Gangetic comparisons, while Patna continues the river-plain clock downstream to the east. This places Varanasi much closer to the standard-meridian side than the western Uttar Pradesh and Rajasthan references and distinctly east of Awadh. The festival page therefore begins with Varanasi's own dawn and evening boundaries, using that eastern-Gangetic solar day to position lunar transitions and observance-specific periods rather than borrowing Lucknow's clock.`
};

function clockMinutes(value:string){
  const [h,m]=value.split(":").map(Number);
  return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;
}
function dayOffset(date:string|null,base:string){
  if(!date||date===base)return 0;
  const a=Date.parse(`${base}T06:00:00Z`),b=Date.parse(`${date}T06:00:00Z`);
  return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000):0;
}
function datedMinutes(value:string,date:string|null,base:string){return clockMinutes(value)+dayOffset(date,base)*1440;}
function daylightMinutes(data:Panchang){
  const rise=clockMinutes(data.sunrise),set=clockMinutes(data.sunset);
  return set>=rise?set-rise:set+1440-rise;
}
function daylightBand(minutes:number){
  if(minutes<700)return "compact daylight frame";
  if(minutes<730)return "short-balanced daylight frame";
  if(minutes<760)return "balanced daylight frame";
  if(minutes<790)return "long-balanced daylight frame";
  return "extended daylight frame";
}
function sunriseBand(value:string){
  const minutes=clockMinutes(value);
  if(minutes<345)return "very-early dawn band";
  if(minutes<365)return "early dawn band";
  if(minutes<385)return "near-six dawn band";
  if(minutes<405)return "post-six dawn band";
  return "late dawn band";
}
function dayPart(offset:number,daylight:number){
  const ratio=daylight?offset/daylight:0;
  if(ratio<0.2)return "opening daylight";
  if(ratio<0.4)return "morning";
  if(ratio<0.6)return "midday";
  if(ratio<0.8)return "afternoon";
  return "late daylight";
}
function illuminationBand(value:number){
  if(value<20)return "dark-moon side";
  if(value<45)return "low-illumination side";
  if(value<70)return "middle-illumination side";
  if(value<90)return "bright-moon side";
  return "near-full-moon side";
}
function observanceFrame(rule:Festival["pujaRule"]){
  if(rule==="night")return "night-centered observance";
  if(rule==="sunset")return "sunset-centered observance";
  if(rule==="midday")return "midday-centered observance";
  if(rule==="sunrise")return "sunrise-centered observance";
  return "day-structure observance";
}

export function buildFestivalCityHighSimilarityContext(festival:Festival,city:City,data:Panchang):FestivalCityHighSimilarityContext{
  const profile=buildCityContentProfile(city);
  const daylight=daylightMinutes(data);
  const rise=clockMinutes(data.sunrise);
  const tithiEnd=datedMinutes(data.tithiEnd,data.tithiEndDate,data.date);
  const nakshatraEnd=datedMinutes(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const tithiPart=dayPart(Math.max(0,tithiEnd-rise),daylight);
  const nakshatraPart=dayPart(Math.max(0,nakshatraEnd-rise),daylight);
  const transitionOrder=Math.abs(tithiEnd-nakshatraEnd)<30
    ? "near-synchronous lunar hand-off"
    : tithiEnd<nakshatraEnd
      ? "Tithi-first lunar hand-off"
      : "Nakshatra-first lunar hand-off";
  const rahuOffset=Math.max(0,clockMinutes(data.rahu.start)-rise);
  const rahuPart=dayPart(rahuOffset,daylight);
  const frame=observanceFrame(festival.pujaRule);
  const locality=festivalCityLocalityBySlug[city.slug]??`${profile.dailyContext} This festival page retains ${profile.geoContext} as its local comparison frame instead of substituting a nearby city's timetable.`;
  const abhijit=data.abhijit?`${data.abhijit.start}–${data.abhijit.end}`:"not retained on this date";

  const timingBody=`For ${festival.name}, this ${frame} opens in a ${sunriseBand(data.sunrise)} and spans a ${daylightBand(daylight)} before local sunset at ${data.sunset}. The ${data.tithi} transition falls in ${tithiPart}, while ${data.nakshatra} turns in ${nakshatraPart}, producing a ${transitionOrder}. Rahu begins in ${rahuPart}; Abhijit is ${abhijit}. Moon illumination sits on the ${illuminationBand(data.moonIllumination)} of the cycle. These are calculated festival-day signals from ${city.name}'s Panchang, so the comparison lens changes with the local clock rather than with a city token alone.`;

  return {
    title:`${festival.name} city-comparison lens for ${city.name}`,
    localityBody:`${locality} For this ${frame}, the city-level geographic frame is combined with the actual festival-day solar and lunar checkpoints rather than presented as generic regional background.`,
    timingTitle:`How ${festival.name} sits on the local day`,
    timingBody,
    facts:[
      {label:"Locality corridor",value:profile.geoContext,note:profile.dailyContext},
      {label:"Observance frame",value:frame,note:`Stored festival rule: ${festival.pujaRule}`},
      {label:"Dawn profile",value:sunriseBand(data.sunrise),note:`Sunrise ${data.sunrise}`},
      {label:"Daylight profile",value:daylightBand(daylight),note:`Sunset ${data.sunset}`},
      {label:"Lunar hand-off",value:transitionOrder,note:`${data.tithi} in ${tithiPart}; ${data.nakshatra} in ${nakshatraPart}`},
      {label:"Rahu daylight position",value:rahuPart,note:`${data.rahu.start}–${data.rahu.end}`},
      {label:"Abhijit state",value:data.abhijit?"retained":"absent",note:abhijit},
      {label:"Moon-light profile",value:illuminationBand(data.moonIllumination),note:`${data.paksha} Paksha`}
    ]
  };
}
