import { cityCandidates } from "./city-candidates";

export type City = {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  language: string[];
};

export const coreCities: City[] = [
  ["mumbai","Mumbai","Maharashtra",19.076,72.8777,["en","mr"]],
  ["delhi","Delhi","NCT",28.6139,77.209,["en","hi"]],
  ["bengaluru","Bengaluru","Karnataka",12.9716,77.5946,["en","kn"]],
  ["hyderabad","Hyderabad","Telangana",17.385,78.4867,["en","te"]],
  ["ahmedabad","Ahmedabad","Gujarat",23.0225,72.5714,["en","gu"]],
  ["chennai","Chennai","Tamil Nadu",13.0827,80.2707,["en","ta"]],
  ["kolkata","Kolkata","West Bengal",22.5726,88.3639,["en","bn"]],
  ["surat","Surat","Gujarat",21.1702,72.8311,["en","gu"]],
  ["pune","Pune","Maharashtra",18.5204,73.8567,["en","mr"]],
  ["jaipur","Jaipur","Rajasthan",26.9124,75.7873,["en","hi"]],
  ["lucknow","Lucknow","Uttar Pradesh",26.8467,80.9462,["en","hi"]],
  ["kanpur","Kanpur","Uttar Pradesh",26.4499,80.3319,["en","hi"]],
  ["nagpur","Nagpur","Maharashtra",21.1458,79.0882,["en","mr"]],
  ["indore","Indore","Madhya Pradesh",22.7196,75.8577,["en","hi"]],
  ["thane","Thane","Maharashtra",19.2183,72.9781,["en","mr"]],
  ["bhopal","Bhopal","Madhya Pradesh",23.2599,77.4126,["en","hi"]],
  ["visakhapatnam","Visakhapatnam","Andhra Pradesh",17.6868,83.2185,["en","te"]],
  ["pimpri-chinchwad","Pimpri-Chinchwad","Maharashtra",18.6298,73.7997,["en","mr"]],
  ["patna","Patna","Bihar",25.5941,85.1376,["en","hi"]],
  ["vadodara","Vadodara","Gujarat",22.3072,73.1812,["en","gu"]],
  ["ghaziabad","Ghaziabad","Uttar Pradesh",28.6692,77.4538,["en","hi"]],
  ["ludhiana","Ludhiana","Punjab",30.901,75.8573,["en","pa"]],
  ["agra","Agra","Uttar Pradesh",27.1767,78.0081,["en","hi"]],
  ["nashik","Nashik","Maharashtra",19.9975,73.7898,["en","mr"]],
  ["faridabad","Faridabad","Haryana",28.4089,77.3178,["en","hi"]],
  ["meerut","Meerut","Uttar Pradesh",28.9845,77.7064,["en","hi"]],
  ["rajkot","Rajkot","Gujarat",22.3039,70.8022,["en","gu"]],
  ["kalyan-dombivli","Kalyan-Dombivli","Maharashtra",19.2403,73.1305,["en","mr"]],
  ["vasai-virar","Vasai-Virar","Maharashtra",19.3919,72.8397,["en","mr"]],
  ["varanasi","Varanasi","Uttar Pradesh",25.3176,82.9739,["en","hi"]],
  ["srinagar","Srinagar","Jammu and Kashmir",34.0837,74.7973,["en","ur"]],
  ["aurangabad","Aurangabad","Maharashtra",19.8762,75.3433,["en","mr"]],
  ["dhanbad","Dhanbad","Jharkhand",23.7957,86.4304,["en","hi"]],
  ["amritsar","Amritsar","Punjab",31.634,74.8723,["en","pa"]],
  ["navi-mumbai","Navi Mumbai","Maharashtra",19.033,73.0297,["en","mr"]],
  ["allahabad","Prayagraj","Uttar Pradesh",25.4358,81.8463,["en","hi"]],
  ["ranchi","Ranchi","Jharkhand",23.3441,85.3096,["en","hi"]],
  ["howrah","Howrah","West Bengal",22.5958,88.2636,["en","bn"]],
  ["coimbatore","Coimbatore","Tamil Nadu",11.0168,76.9558,["en","ta"]],
  ["jabalpur","Jabalpur","Madhya Pradesh",23.1815,79.9864,["en","hi"]],
  ["gwalior","Gwalior","Madhya Pradesh",26.2183,78.1828,["en","hi"]],
  ["vijayawada","Vijayawada","Andhra Pradesh",16.5062,80.648,["en","te"]],
  ["jodhpur","Jodhpur","Rajasthan",26.2389,73.0243,["en","hi"]],
  ["madurai","Madurai","Tamil Nadu",9.9252,78.1198,["en","ta"]],
  ["raipur","Raipur","Chhattisgarh",21.2514,81.6296,["en","hi"]],
  ["kota","Kota","Rajasthan",25.2138,75.8648,["en","hi"]],
  ["chandigarh","Chandigarh","Chandigarh",30.7333,76.7794,["en","hi","pa"]],
  ["guwahati","Guwahati","Assam",26.1445,91.7362,["en","as"]],
  ["solapur","Solapur","Maharashtra",17.6599,75.9064,["en","mr"]],
  ["hubballi-dharwad","Hubballi-Dharwad","Karnataka",15.3647,75.124,["en","kn"]]
].map(([slug,name,state,lat,lng,language])=>({slug,name,state,lat,lng,language} as City));

const coreSlugSet=new Set(coreCities.map(city=>city.slug));

export const supportedCities:City[]=[
  ...coreCities,
  ...cityCandidates
    .filter(city=>!coreSlugSet.has(city.slug))
    .map(({slug,name,state,lat,lng,language})=>({slug,name,state,lat,lng,language}))
];

export const cities=coreCities;

const supportedCityMap=new Map(supportedCities.map(city=>[city.slug,city]));

export const findCityBySlug=(slug:string)=>supportedCityMap.get(slug);

// Use only where a Mumbai default is intentional (for example controlled internal/default selections).
// Public dynamic route params must use findCityBySlug() and return notFound() when missing.
export const cityBySlug=(slug:string)=>findCityBySlug(slug)??coreCities[0];

export const isCoreCity=(slug:string)=>coreSlugSet.has(slug);
