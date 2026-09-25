import type {City} from "./cities";
import {buildCityContentProfile} from "./city-content-profile";
import type {Panchang} from "./panchang";

type Fact={label:string;value:string;note?:string};
export type CalendarMonthSimilarityContext={
  title:string;
  localityBody:string;
  solarTitle:string;
  solarBody:string;
  facts:Fact[];
};

const monthlyLocalityLensBySlug:Record<string,string>={
  mumbai:`Mumbai's monthly calendar belongs to the Arabian Sea-facing Konkan clock. The useful distinction is not only a later western-India sunrise on IST, but the maritime metropolitan setting in which Thane is the closest comparison and Pune is the nearest inland plateau reference. A month in Mumbai should therefore be read as a harbour-side solar sequence: local dawn and sunset govern the exclusion periods, while the same Gregorian dates can sit on a slightly different clock in Thane or Pune.`,
  delhi:`Delhi's monthly sequence is a Yamuna-side northern-plains calendar rather than a generic north-India timetable. Its latitude gives the month a stronger daylight expansion or contraction than southern metros, while its longitude keeps the solar day west of the national standard-meridian frame. Jaipur is the nearest western comparison, whereas Kanpur and Lucknow provide Gangetic references farther east; that three-way contrast is the useful way to interpret Delhi's local month.`,
  bengaluru:`Bengaluru's monthly calendar is an elevated southern-Deccan sequence. Low latitude keeps the daylight envelope relatively compact, but the inland plateau position separates it from Chennai's east-coast clock and from Hyderabad's more northerly Deccan frame. The month is therefore best read through Bengaluru's own dawn-to-sunset geometry: Chennai is the coastal east reference, Hyderabad the interior north reference, and neither is an interchangeable source for sunrise-derived periods.`,
  hyderabad:`Hyderabad's monthly Panchang sits on the Telangana Deccan around the Musi corridor. Its timing frame is inland and mid-latitude: Nagpur provides a central-India comparison to the north, Bengaluru a lower-latitude plateau comparison to the south-west, and Visakhapatnam an east-coast comparison. Those three directions make the month locally identifiable even when the lunar date labels match, because the solar intervals are anchored to Hyderabad's own Deccan clock rather than borrowed from a coast or another plateau city.`,
  ahmedabad:`Ahmedabad's month is a Sabarmati-corridor calendar in north-central Gujarat. It combines a strongly western IST solar clock with more northerly seasonality than Surat and a distinct inland position from Vadodara's Vishwamitri basin. For this page, Vadodara is the closest south-eastern clock comparison, Surat is the lower-latitude Gujarat reference, and Indore is the Malwa-plateau contrast to the east. That geography is what keeps Ahmedabad's monthly sunrise-derived timings from collapsing into a Gujarat-wide template.`,
  chennai:`Chennai's monthly sequence belongs to the Coromandel Coast, where the civil-time solar clock is earlier than in western India and the low peninsular latitude restrains the seasonal daylight swing. Bengaluru is the nearest inland comparison across the southern plateau, Hyderabad adds a more northerly Deccan reference, and Visakhapatnam is the farther Bay-of-Bengal comparison. The month therefore carries an east-coast timing identity that cannot be represented by a Bengaluru or Hyderabad schedule.`,
  kolkata:`Kolkata's month is a lower-Hooghly and Bengal-delta sequence with one of the eastern timing frames in the active city set. Sunrise-derived intervals arrive earlier on IST than in the Gangetic and western metros, while the latitude still produces a visible seasonal change in day length. Patna is the nearest Gangetic comparison, Varanasi provides an eastern-Uttar-Pradesh reference, and Visakhapatnam supplies an east-coast peninsular contrast; together they frame Kolkata's distinctly delta-side month.`,
  surat:`Surat's monthly calendar is rooted in the lower Tapi basin near the Gulf of Khambhat. Its western solar clock resembles Gujarat's other major cities, but the lower latitude and coastal-basin position separate it from Ahmedabad's Sabarmati frame and Vadodara's Vishwamitri setting. Vadodara is the nearest inland comparison, Ahmedabad the more northerly Gujarat reference, and Thane the Konkan metropolitan contrast. The local month therefore follows a southern-Gujarat clock rather than a state-wide proxy.`,
  pune:`Pune's monthly sequence is a western-Deccan plateau calendar east of the Sahyadri range. The city shares a late western-India solar frame with Mumbai and Thane but not their coastal Konkan geography, so the same civil date should be interpreted from Pune's own inland sunrise and sunset. Mumbai supplies the harbour-side comparison, Thane the north-eastern Konkan comparison, and Surat the Gujarat reference farther north-west; this makes the plateau character of the month explicit.`,
  jaipur:`Jaipur's monthly calendar belongs to the Aravalli-side basin of eastern Rajasthan. Northern latitude produces a larger seasonal daylight movement than the Deccan or southern peninsula, while the longitude keeps the solar clock distinctly west of the national meridian. Delhi is the closest northern-plains comparison, Bhopal provides a central-plateau reference to the south-east, and Kanpur adds a Gangetic reference farther east. The month is therefore a north-western inland sequence, not a generic Hindi-belt calendar.`,
  lucknow:`Lucknow's month is an Awadh calendar from the central Gangetic plain. Its longitude is closer to India's standard-meridian solar frame than Delhi or Jaipur, but its northern latitude still gives the month substantial seasonal daylight movement. Kanpur is the immediate Ganga-corridor comparison, Varanasi is the eastern Gangetic reference, and Delhi supplies the farther western-plains contrast. That east-west ladder is the useful locality lens for interpreting Lucknow's sunrise-derived monthly periods.`,
  kanpur:`Kanpur's monthly sequence follows the Ganga corridor of central Uttar Pradesh. The city is close to the standard-meridian side of India's clock geography, so the distinction from Lucknow is subtle but real at sunrise boundaries, while Varanasi provides an eastern Gangetic comparison and Delhi a farther western-plains one. Reading the month through those references keeps Kanpur's local dawn checkpoint visible instead of allowing nearby north-Indian cities to become timing substitutes.`,
  nagpur:`Nagpur's month is a Vidarbha-plateau sequence near the geographic centre of India. Its solar clock is comparatively close to the national meridian and its mid-Deccan latitude creates a balanced seasonal daylight profile. Bhopal is the central-Madhya-Pradesh comparison, Indore provides the more western Malwa reference, and Hyderabad supplies the southern Deccan contrast. This central positioning gives Nagpur a monthly timing identity that differs from both west-coast and Gangetic calendars.`,
  indore:`Indore's monthly calendar is anchored to the Malwa plateau of western Madhya Pradesh. It sits west of the standard meridian and north of the deeper Deccan, producing an inland-western clock with stronger seasonal movement than Hyderabad or Bengaluru. Bhopal is the nearest central-plateau comparison, Vadodara is the Gujarat reference to the west, and Ahmedabad extends that western comparison farther north. The month should therefore be read as a Malwa sequence rather than a Gujarat or central-India proxy.`,
  thane:`Thane's month belongs to the north-eastern Mumbai metropolitan sector of the Konkan belt. It is geographically close to Mumbai, but the local coordinate is retained because sunrise-sensitive lunar and exclusion boundaries can separate even neighbouring metropolitan clocks. Mumbai is the immediate harbour-side comparison, Pune is the inland Deccan reference, and Surat provides the southern-Gujarat contrast. This makes Thane's month a metropolitan-Konkan calculation in its own right rather than a Mumbai duplicate.`,
  bhopal:`Bhopal's monthly sequence comes from the lake-and-plateau landscape of central Madhya Pradesh. Its longitude sits between the more western Malwa clock of Indore and the near-meridian Vidarbha frame of Nagpur, while its central latitude keeps the seasonal daylight arc moderate. Indore is the nearest western comparison, Nagpur the eastern-central comparison, and Jaipur the northern inland reference. That intermediate position is the defining locality signal for Bhopal's month.`,
  visakhapatnam:`Visakhapatnam's monthly calendar is an Eastern-Ghats and Bay-of-Bengal coastal sequence. The eastern longitude pulls sunrise-derived periods earlier on IST, while the peninsular latitude keeps the daylight envelope milder than northern India. Hyderabad is the primary inland Deccan comparison, Nagpur is the central-plateau reference, and Chennai is the southern east-coast comparison. The month therefore has an Andhra coastal timing identity that differs from both the Deccan interior and the Coromandel Coast.`,
  patna:`Patna's monthly sequence is tied to the south bank of the Ganges in Bihar. Its longitude places the solar day earlier on IST than the central and western north-Indian cities, while the northern-plains latitude preserves a pronounced seasonal day-length cycle. Varanasi is the nearest eastern-Uttar-Pradesh comparison, Lucknow is the central-Gangetic reference farther west, and Kolkata supplies the lower-delta contrast. These references define Patna's eastern Gangetic month.`,
  vadodara:`Vadodara's month is a Vishwamitri-basin calendar in central Gujarat. Its position between Ahmedabad and Surat is useful precisely because it is not identical to either: the latitude sits between their north-south profiles and the longitude gives a separate western solar clock. Ahmedabad is the nearest north-western Gujarat comparison, Surat the lower-latitude south-western reference, and Indore the Malwa-plateau contrast to the east. The resulting month is a central-Gujarat sequence with its own sunrise checkpoints.`,
  varanasi:`Varanasi's monthly calendar belongs to the middle Ganges corridor of eastern Uttar Pradesh. Its longitude lies close to the standard-meridian side and east of Lucknow and Kanpur, while the northern latitude keeps a strong seasonal daylight rhythm. Patna is the nearest downstream Gangetic comparison, Lucknow provides the western Awadh reference, and Kanpur adds the central Ganga-corridor contrast. The month is therefore an eastern-Gangetic sequence anchored to Varanasi's own dawn boundary.`
};

function clockMinutes(value:string){const [h,m]=value.split(":").map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:0;}
function average(values:number[]){return values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;}
function range(values:number[]){return values.length?Math.max(...values)-Math.min(...values):0;}
function formatClock(total:number){const normalized=((Math.round(total)%1440)+1440)%1440;return `${String(Math.floor(normalized/60)).padStart(2,"0")}:${String(normalized%60).padStart(2,"0")}`;}
function movement(values:number[],subject:string){
  if(values.length<2)return {key:"single-point",text:`${subject} has only one retained checkpoint`,delta:0};
  const delta=values[values.length-1]-values[0];
  if(Math.abs(delta)<=2)return {key:"stable",text:`${subject} stays essentially stable from the opening date to the closing date`,delta};
  if(delta<0)return {key:"earlier",text:`${subject} moves earlier through the month`,delta};
  return {key:"later",text:`${subject} moves later through the month`,delta};
}
function amplitude(minutes:number){
  if(minutes<=5)return "compressed";
  if(minutes<=15)return "moderate";
  return "broad";
}
function monthName(year:number,month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(year,month-1,1,6)));}

type CalendarMonthSimilarityEntry=Pick<Panchang,"date"|"rahu"|"yamaganda"|"gulika"|"abhijit">;

export function buildCalendarMonthSimilarityContext(city:City,year:number,month:number,entries:readonly CalendarMonthSimilarityEntry[]):CalendarMonthSimilarityContext{
  const profile=buildCityContentProfile(city),label=monthName(year,month);
  const localityBody=monthlyLocalityLensBySlug[city.slug]??`${profile.dailyContext} For ${label}, the monthly locality lens remains ${profile.geoContext}, with a ${profile.latitudeContext} and a solar clock ${profile.solarClockContext}.`;
  if(!entries.length){
    return {
      title:`${city.name} ${label} locality lens`,
      localityBody,
      solarTitle:`${label} local exclusion-clock movement`,
      solarBody:`No retained daily rows are available for a month-level timing movement calculation, so the locality section keeps ${city.name}'s geographic and solar-clock frame without inventing interval changes.`,
      facts:[
        {label:"Locality anchor",value:profile.geoContext},
        {label:"Latitude frame",value:profile.latitudeContext},
        {label:"Solar-clock frame",value:profile.solarClockContext}
      ]
    };
  }

  const rahu=entries.map(entry=>clockMinutes(entry.rahu.start));
  const yamaganda=entries.map(entry=>clockMinutes(entry.yamaganda.start));
  const gulika=entries.map(entry=>clockMinutes(entry.gulika.start));
  const rahuMove=movement(rahu,"Rahu start"),yamagandaMove=movement(yamaganda,"Yamaganda start"),gulikaMove=movement(gulika,"Gulika start");
  const rahuAmplitude=range(rahu),yamagandaAmplitude=range(yamaganda),gulikaAmplitude=range(gulika);
  const timingCentroid=average(entries.map((_,index)=>(rahu[index]+yamaganda[index]+gulika[index])/3));
  const abhijitCoverage=entries.filter(entry=>entry.abhijit!==null).length;

  return {
    title:`${city.name} ${label} locality lens`,
    localityBody,
    solarTitle:`${label} local exclusion-clock movement`,
    solarBody:`Across ${entries.length} retained local dates, ${rahuMove.text}; ${yamagandaMove.text}; and ${gulikaMove.text}. Rahu occupies a ${amplitude(rahuAmplitude)} start-time range, Yamaganda a ${amplitude(yamagandaAmplitude)} range, and Gulika a ${amplitude(gulikaAmplitude)} range. The three-window timing centroid is about ${formatClock(timingCentroid)}, while Abhijit is retained on ${abhijitCoverage} of ${entries.length} dates. These month signals come from the same city-specific precomputed timing rows used by the public calendar, so the locality narrative stays attached to ${city.name}'s calculation set rather than to a city-name substitution.`,
    facts:[
      {label:"Locality anchor",value:profile.geoContext,note:profile.dailyContext},
      {label:"Latitude frame",value:profile.latitudeContext,note:profile.solarClockContext},
      {label:"Rahu movement",value:rahuMove.key,note:`${entries[0].rahu.start} → ${entries[entries.length-1].rahu.start} · ${rahuAmplitude} min range`},
      {label:"Yamaganda movement",value:yamagandaMove.key,note:`${entries[0].yamaganda.start} → ${entries[entries.length-1].yamaganda.start} · ${yamagandaAmplitude} min range`},
      {label:"Gulika movement",value:gulikaMove.key,note:`${entries[0].gulika.start} → ${entries[entries.length-1].gulika.start} · ${gulikaAmplitude} min range`},
      {label:"Timing centroid",value:formatClock(timingCentroid),note:"Average of the three local exclusion-window starts"},
      {label:"Abhijit coverage",value:`${abhijitCoverage}/${entries.length}`,note:"Retained local dates with an Abhijit window"}
    ]
  };
}
