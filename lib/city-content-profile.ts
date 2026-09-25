import type {City} from "./cities";

export type CityContentProfile={
  geoContext:string;
  latitudeContext:string;
  solarClockContext:string;
  dailyContext:string;
  signature:string;
};

const geoContextBySlug:Record<string,string>={
  "mumbai":"the Arabian Sea-facing Konkan coast of Maharashtra",
  "delhi":"the Yamuna-side northern plains of the National Capital Territory",
  "bengaluru":"the elevated southern Deccan plateau of Karnataka",
  "hyderabad":"the Musi corridor on the Telangana Deccan plateau",
  "ahmedabad":"the Sabarmati corridor of north-central Gujarat",
  "chennai":"the Coromandel Coast of Tamil Nadu",
  "kolkata":"the lower Hooghly corridor of the Bengal delta",
  "surat":"the lower Tapi basin near the Gulf of Khambhat",
  "pune":"the western Deccan plateau east of the Sahyadri range",
  "jaipur":"the Jaipur basin on the eastern side of Rajasthan's Aravalli region",
  "lucknow":"the Awadh sector of the central Gangetic plain",
  "kanpur":"the Ganga corridor of central Uttar Pradesh",
  "nagpur":"the Vidarbha plateau of central India",
  "indore":"the Malwa plateau of western Madhya Pradesh",
  "thane":"the north-eastern Mumbai metropolitan sector of the Konkan belt",
  "bhopal":"the lake-and-plateau landscape of central Madhya Pradesh",
  "visakhapatnam":"the Bay of Bengal coast at the eastern edge of the Eastern Ghats",
  "pimpri-chinchwad":"the upper Bhima-basin side of the Pune metropolitan region",
  "patna":"the south-bank Ganges plain of Bihar",
  "vadodara":"the Vishwamitri basin of central Gujarat",
  "ghaziabad":"the upper Ganga-Yamuna plain immediately east of Delhi",
  "ludhiana":"the central Punjab alluvial plain",
  "agra":"the Yamuna corridor of western Uttar Pradesh",
  "nashik":"the upper Godavari basin of northern Maharashtra",
  "faridabad":"the southern Delhi-NCR sector of Haryana's Yamuna plain",
  "meerut":"the upper Ganga-Yamuna Doab of western Uttar Pradesh",
  "rajkot":"the inland Saurashtra peninsula of western Gujarat",
  "kalyan-dombivli":"the Ulhas-basin side of the eastern Mumbai metropolitan region",
  "vasai-virar":"the northern Konkan coastal belt beyond Mumbai",
  "varanasi":"the middle Ganges corridor of eastern Uttar Pradesh",
  "srinagar":"the Jhelum basin of the Kashmir Valley",
  "aurangabad":"the Marathwada sector of the Deccan plateau",
  "dhanbad":"the Damodar valley belt of Jharkhand",
  "amritsar":"the north-western Punjab plain",
  "navi-mumbai":"the eastern Mumbai Harbour side of the Konkan coast",
  "allahabad":"the Ganga-Yamuna confluence zone of Prayagraj",
  "ranchi":"the Chota Nagpur plateau of Jharkhand",
  "howrah":"the west-bank Hooghly side of the lower Bengal delta",
  "coimbatore":"the Noyyal basin of western Tamil Nadu near the Western Ghats",
  "jabalpur":"the Narmada valley of central Madhya Pradesh",
  "gwalior":"the Gird plain of northern Madhya Pradesh",
  "vijayawada":"the Krishna River corridor at the inland edge of the delta plain",
  "jodhpur":"the eastern margin of the Thar Desert in western Rajasthan",
  "madurai":"the Vaigai plain of southern Tamil Nadu",
  "raipur":"the central Chhattisgarh plain",
  "kota":"the Chambal corridor of south-eastern Rajasthan",
  "chandigarh":"the planned Shivalik-foothill plain of the Chandigarh region",
  "guwahati":"the Brahmaputra valley of Assam",
  "solapur":"the south-eastern Maharashtra sector of the Deccan plateau",
  "hubballi-dharwad":"the north-Karnataka sector of the Deccan plateau"
};

const dailyContextBySlug:Record<string,string>={
  "mumbai":"A west-coast civil clock is the useful local lens here: sunrise-based Panchang boundaries appear relatively later by IST than in eastern India, while the coastal Konkan setting distinguishes this timetable from inland Maharashtra.",
  "delhi":"This is a northern inland-plains calculation, so the day should be read through Delhi's own Yamuna-side sunrise rather than through a western or coastal clock. Seasonal daylight variation is also more pronounced than in lower-latitude peninsular cities.",
  "bengaluru":"Bengaluru combines southern latitude with an elevated inland plateau position. Its local sunrise clock is neither a west-coast nor an east-coast proxy, making the city's Deccan plateau timing frame the correct reference for daily transitions.",
  "hyderabad":"Hyderabad's daily frame belongs to the interior Telangana plateau. The city sits east of many western Deccan centres but remains inland, so its sunrise-derived intervals form a distinct middle-Deccan clock pattern rather than a coastal one.",
  "ahmedabad":"Ahmedabad is a strongly western Indian clock location on the Sabarmati corridor. Its longitude places sunrise-based periods noticeably later by IST than eastern cities, while its north-central Gujarat latitude gives a different seasonal daylight pattern from Surat or Mumbai.",
  "chennai":"Chennai's Coromandel Coast position creates an east-coast timing frame at a low peninsular latitude. Sunrise-derived periods therefore sit earlier on the IST clock than in western India, with comparatively modest seasonal daylight swings.",
  "kolkata":"Kolkata is an eastern Indian timing location on the lower Hooghly. Its solar day arrives substantially earlier by IST than western metros, so Panchang boundaries tied to sunrise and sunset occupy a distinctly east-shifted civil-clock frame.",
  "surat":"Surat uses a western Gujarat coastal-basin clock distinct from Ahmedabad's more northerly inland profile. Its Tapi-side latitude and longitude keep sunrise-derived periods west-shifted by IST while producing their own local daylight span.",
  "pune":"Pune is an inland western-Deccan calculation rather than a Mumbai-coast substitute. The Sahyadri-adjacent plateau position keeps the city on a west-shifted IST solar clock, but its elevation and inland setting give it a separate local sunrise timetable.",
  "jaipur":"Jaipur's Panchang clock belongs to the eastern Rajasthan interior near the Aravalli region. Its northern latitude and western longitude combine a later IST solar timing profile with stronger seasonal day-length movement than southern cities.",
  "lucknow":"Lucknow is read from the central Gangetic plain in Awadh. It lies much closer to India's standard-meridian solar clock than western metros, so its sunrise-based periods occupy a more central civil-time position with a northern-plains seasonal pattern.",
  "kanpur":"Kanpur's reference is the central Uttar Pradesh Ganga corridor. Although geographically close to Lucknow, its own longitude and local sunrise keep the Panchang clock separate, especially when a Tithi or Nakshatra boundary falls near sunrise.",
  "nagpur":"Nagpur sits near the geographic centre of India in the Vidarbha plateau. That makes its local solar clock comparatively close to the national meridian, while its central-Deccan latitude gives the daily page a distinct balance between northern and southern daylight patterns.",
  "indore":"Indore belongs to the Malwa plateau of western Madhya Pradesh. Its clock is west-shifted from the standard meridian but less coastal than Gujarat or Mumbai, producing a characteristic inland-western timing frame for sunrise-derived Panchang periods.",
  "thane":"Thane shares the wider Mumbai metropolitan region but not an identical local coordinate. Its north-eastern Konkan position gives a slightly different sunrise and sunset clock from Mumbai, which matters when lunar transitions sit close to local day boundaries.",
  "bhopal":"Bhopal's lake-and-plateau setting in central Madhya Pradesh places it between western and standard-meridian timing patterns. The city therefore provides a central-inland Panchang reference with its own seasonal daylight and sunrise boundary behaviour.",
  "visakhapatnam":"Visakhapatnam is an east-coast city where the Eastern Ghats meet the Bay of Bengal. Its longitude shifts sunrise-derived periods earlier by IST, while its lower latitude keeps the annual daylight range different from Kolkata or the northern plains.",
  "patna":"Patna sits on the south bank of the Ganges in Bihar, east of the standard meridian. Its local solar day therefore appears earlier on the IST clock than central and western cities, within a north-eastern Gangetic seasonal daylight regime.",
  "vadodara":"Vadodara's central Gujarat position is inland between Ahmedabad and Surat in both geography and solar timing. Its Vishwamitri-basin longitude keeps the Panchang clock distinctly western while preserving a separate local sunrise from either neighbouring city.",
  "varanasi":"Varanasi lies on the middle Ganges in eastern Uttar Pradesh close to the standard-meridian side of India's clock geography. Its sunrise-derived intervals occur earlier than western cities and reflect an eastern Gangetic, northern-latitude daylight cycle.",
  "pimpri-chinchwad":"Pimpri-Chinchwad uses the Pune metropolitan plateau clock but its own coordinate and upper Bhima-basin setting. It should not inherit Pune's exact sunrise boundaries when a local Tithi or Nakshatra transition is close to dawn.",
  "ghaziabad":"Ghaziabad is an upper Ganga-Yamuna plains location immediately east of Delhi. Its local sunrise is slightly east-shifted from the capital, giving nearby but not interchangeable daily Panchang boundaries.",
  "ludhiana":"Ludhiana represents the central Punjab alluvial plain at a far-northern latitude. Its strong seasonal daylight swing and western longitude make its local Panchang clock different from both Delhi and the Himalayan-facing cities.",
  "agra":"Agra's local day is tied to the Yamuna corridor of western Uttar Pradesh. The city combines northern-plains seasonality with a longitude east of Jaipur but west of the standard meridian, forming its own sunrise timing frame.",
  "nashik":"Nashik sits in the upper Godavari basin of northern Maharashtra. It is an inland western clock with a latitude north of Pune and Mumbai, so daily solar timing and seasonal daylight should be read from Nashik itself.",
  "faridabad":"Faridabad occupies the southern Delhi-NCR edge of Haryana's Yamuna plain. Its clock resembles but does not exactly match Delhi, and its own sunrise coordinate is retained for boundary-sensitive Panchang states.",
  "meerut":"Meerut is an upper Doab location north-east of Delhi. Its local solar timing shifts slightly eastward from the capital while keeping a northern-plains seasonal pattern, creating a distinct dawn checkpoint for lunar states.",
  "rajkot":"Rajkot is an inland Saurashtra city with one of the more strongly western solar clocks in this network. Sunrise-derived periods occur relatively late by IST, and its peninsula-interior setting differs from Gulf-facing Surat or mainland Ahmedabad.",
  "kalyan-dombivli":"Kalyan-Dombivli sits inland on the Ulhas side of the Mumbai metropolitan region. Its local sunrise is close to but not identical with Mumbai or Thane, which is enough to change boundary-sensitive daily states on some dates.",
  "vasai-virar":"Vasai-Virar is a northern Konkan coastal location beyond Mumbai. The city remains strongly west-shifted by IST, while its more northerly coastal coordinate gives it a distinct local solar-day frame from the central Mumbai area.",
  "srinagar":"Srinagar's Jhelum-basin position in the Kashmir Valley creates the strongest high-latitude seasonal daylight signature among the listed cities. Its local sunrise and sunset pattern should be treated independently from the northern plains.",
  "aurangabad":"Aurangabad represents the Marathwada Deccan interior. It is west of the standard meridian but inland and east of Pune, giving its Panchang clock a separate plateau timing profile.",
  "dhanbad":"Dhanbad lies in the Damodar valley of Jharkhand, east of India's standard meridian. Its local solar day is early by IST compared with western cities and belongs to a plateau-valley rather than coastal timing context.",
  "amritsar":"Amritsar is a far-western Punjab plains location at northern latitude. Its sunrise-derived periods appear relatively late by IST and its seasonal daylight spread is stronger than in the Deccan or southern peninsula.",
  "navi-mumbai":"Navi Mumbai uses the eastern Mumbai Harbour side of the Konkan coast. Its clock is close to Mumbai but geographically displaced eastward, so the local sunrise checkpoint remains distinct for boundary-sensitive Panchang labels.",
  "allahabad":"Prayagraj's Ganga-Yamuna confluence gives this page an eastern Uttar Pradesh river-plain frame. Its longitude places the solar clock near the national-meridian side, distinct from both Varanasi farther east and Kanpur farther west.",
  "ranchi":"Ranchi sits on the Chota Nagpur plateau. Its east-of-meridian longitude shifts sunrise-derived intervals earlier on the IST clock while its plateau latitude separates it from the Bengal delta and coastal Odisha-Andhra timing patterns.",
  "howrah":"Howrah shares the lower Hooghly region with Kolkata but sits on the west bank. The coordinates are close enough for similar clocks yet still retained independently so sunrise-boundary lunar states are not copied across the river.",
  "coimbatore":"Coimbatore lies in the Noyyal basin near the Western Ghats at southern latitude. Its inland Tamil Nadu clock is west-shifted relative to Chennai, making the two cities poor substitutes for one another in sunrise-based Panchang timing.",
  "jabalpur":"Jabalpur is a central Narmada-valley location east of Bhopal. Its solar clock sits nearer the standard-meridian side and its central latitude gives a distinct annual daylight pattern from both the Gangetic plain and southern Deccan.",
  "gwalior":"Gwalior's Gird plain position in northern Madhya Pradesh combines northern seasonality with a moderately western solar clock. Its daily sunrise frame is distinct from Jaipur to the west and Agra to the north-east.",
  "vijayawada":"Vijayawada sits on the Krishna River near the inland edge of the delta. Its east-coast longitude brings sunrise-derived intervals earlier by IST, while its tropical latitude keeps daylight seasonality milder than northern India.",
  "jodhpur":"Jodhpur is a strongly western, northern-latitude clock on the eastern edge of the Thar. Sunrise-derived periods appear late by IST and seasonal daylight changes are substantial, making its daily frame unlike coastal or central-meridian cities.",
  "madurai":"Madurai's Vaigai-plain location is deep in southern Tamil Nadu. Its low latitude limits annual daylight variation, while its longitude places the local solar clock west of Chennai and east of many Deccan cities.",
  "raipur":"Raipur lies on the central Chhattisgarh plain close to India's standard-meridian zone. That gives it a comparatively central civil-time solar profile at a mid-Deccan latitude.",
  "kota":"Kota's Chambal-side position in south-eastern Rajasthan combines a western solar clock with a latitude south of Jaipur. Its local sunrise should therefore be read separately from both Jaipur and central Madhya Pradesh.",
  "chandigarh":"Chandigarh sits on the Shivalik-foothill plain at northern latitude. Strong seasonal day-length changes combine with a moderately western solar clock, creating a distinct northern planning frame.",
  "guwahati":"Guwahati is one of the most strongly east-shifted solar-clock locations in the network. Its Brahmaputra-valley sunrise occurs much earlier by IST than western India, so daily Panchang boundaries occupy a very different civil-time frame.",
  "solapur":"Solapur is a south-eastern Maharashtra Deccan city east of Pune and Mumbai. Its local solar clock is less west-shifted than those metros while preserving an inland plateau daylight profile.",
  "hubballi-dharwad":"Hubballi-Dharwad belongs to the north-Karnataka Deccan plateau. Its southern latitude and western longitude combine a mild seasonal daylight range with a west-shifted IST solar clock distinct from Bengaluru or Pune."
};

function latitudeContext(lat:number){
  if(lat<12)return "deep-southern tropical latitude";
  if(lat<15)return "southern peninsular latitude";
  if(lat<18)return "lower-Deccan latitude";
  if(lat<21)return "mid-Deccan latitude";
  if(lat<24)return "central-India latitude";
  if(lat<27)return "north-central plains latitude";
  if(lat<30)return "northern plains latitude";
  return "far-northern Indian latitude";
}

function solarClockContext(lng:number){
  const offset=(lng-82.5)*4;
  if(offset<=-35)return "strongly west-shifted from India's standard meridian";
  if(offset<=-22)return "clearly west-shifted from India's standard meridian";
  if(offset<=-10)return "moderately west-shifted from India's standard meridian";
  if(offset<6)return "close to India's standard-meridian solar clock";
  if(offset<18)return "moderately east-shifted from India's standard meridian";
  if(offset<30)return "clearly east-shifted from India's standard meridian";
  return "strongly east-shifted from India's standard meridian";
}

export function buildCityContentProfile(city:City):CityContentProfile{
  const geoContext=geoContextBySlug[city.slug]??`${city.state}'s ${latitudeContext(city.lat)} zone`;
  const latContext=latitudeContext(city.lat);
  const solarContext=solarClockContext(city.lng);
  const dailyContext=dailyContextBySlug[city.slug]??`This city's own latitude and longitude are retained for sunrise-based Panchang boundaries rather than substituted with a neighbouring timetable.`;
  return {
    geoContext,
    latitudeContext:latContext,
    solarClockContext:solarContext,
    dailyContext,
    signature:`${geoContext} · ${latContext} · ${solarContext}`
  };
}
