import type {City} from "./cities";

export type CityContentProfile={
  geoContext:string;
  latitudeContext:string;
  solarClockContext:string;
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
  return {
    geoContext,
    latitudeContext:latContext,
    solarClockContext:solarContext,
    signature:`${geoContext} · ${latContext} · ${solarContext}`
  };
}
