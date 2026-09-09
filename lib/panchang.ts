import { City } from "./cities";

export type TimeWindow = { start:string; end:string };
export type Panchang = {
  date:string;
  weekday:string;
  tithi:string;
  paksha:"Shukla"|"Krishna";
  nakshatra:string;
  yoga:string;
  karana:string;
  sunrise:string;
  sunset:string;
  moonrise:string;
  moonset:string;
  rahu:TimeWindow;
  yamaganda:TimeWindow;
  gulika:TimeWindow;
  abhijit:TimeWindow;
  hinduMonth:string;
  vikramSamvat:number;
  shakaSamvat:number;
  dayLord:string;
  engine:"Swiss Ephemeris"|"Astronomical fallback";
};

const nakshatras=["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const yogas=["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
const tithis=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
const karanas=["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"];
const lords=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const hinduMonths=["Pausha","Magha","Phalguna","Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha"];

const norm=(x:number)=>((x%360)+360)%360;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;
const pad=(n:number)=>String(n).padStart(2,"0");
const time=(minutes:number)=>{
  const m=((Math.round(minutes)%1440)+1440)%1440;
  return `${pad(Math.floor(m/60))}:${pad(m%60)}`;
};

function julian(date:Date){
  return date.getTime()/86400000+2440587.5;
}

function approximateLongitudes(date:Date){
  const d=julian(date)-2451545.0;
  const sunMean=norm(280.460+0.9856474*d);
  const g=norm(357.528+0.9856003*d);
  const sun=norm(sunMean+1.915*Math.sin(rad(g))+0.020*Math.sin(rad(2*g)));
  const L0=norm(218.316+13.176396*d);
  const Mm=norm(134.963+13.064993*d);
  const D=norm(297.850+12.190749*d);
  const moon=norm(L0+6.289*Math.sin(rad(Mm))+1.274*Math.sin(rad(2*D-Mm))+0.658*Math.sin(rad(2*D))+0.214*Math.sin(rad(2*Mm))-0.186*Math.sin(rad(g)));
  return {sun,moon,engine:"Astronomical fallback" as const};
}

async function swissLongitudes(date:Date){
  try{
    const mod:any=await import("sweph-wasm");
    const SwissEPH=mod.default;
    const swe=await SwissEPH.init();
    const jd=swe.swe_julday(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),12,1);
    const flags=2|256;
    const sunResult=swe.swe_calc_ut(jd,0,flags);
    const moonResult=swe.swe_calc_ut(jd,1,flags);
    const sun=Array.isArray(sunResult)?sunResult[0]:(sunResult?.data?.[0] ?? sunResult?.longitude);
    const moon=Array.isArray(moonResult)?moonResult[0]:(moonResult?.data?.[0] ?? moonResult?.longitude);
    if(Number.isFinite(sun)&&Number.isFinite(moon)) return {sun:Number(sun),moon:Number(moon),engine:"Swiss Ephemeris" as const};
  }catch{}
  return approximateLongitudes(date);
}

function solarTimes(date:Date,city:City){
  const start=new Date(Date.UTC(date.getUTCFullYear(),0,0));
  const day=Math.floor((date.getTime()-start.getTime())/86400000);
  const gamma=2*Math.PI/365*(day-1);
  const eq=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
  const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)-0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)-0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma);
  const zen=rad(90.833);
  const lat=rad(city.lat);
  const ha=Math.acos((Math.cos(zen)/(Math.cos(lat)*Math.cos(decl)))-Math.tan(lat)*Math.tan(decl));
  const haDeg=deg(ha);
  const tz=330;
  const noon=720-4*city.lng-eq+tz;
  return {sunrise:noon-4*haDeg,sunset:noon+4*haDeg};
}

function segmentWindow(sunrise:number,sunset:number,index:number):TimeWindow{
  const seg=(sunset-sunrise)/8;
  return {start:time(sunrise+seg*index),end:time(sunrise+seg*(index+1))};
}

export async function getPanchang(date:Date,city:City):Promise<Panchang>{
  const {sun,moon,engine}=await swissLongitudes(date);
  const ayanamsha=24.2;
  const elong=norm(moon-sun);
  const tithiNo=Math.floor(elong/12)+1;
  const paksha=tithiNo<=15?"Shukla":"Krishna";
  const tithiBase=(tithiNo-1)%15;
  const tithi=tithiBase===14?(paksha==="Shukla"?"Purnima":"Amavasya"):tithis[tithiBase];
  const moonSid=norm(moon-ayanamsha);
  const sunSid=norm(sun-ayanamsha);
  const nakshatra=nakshatras[Math.floor(moonSid/(360/27))];
  const yoga=yogas[Math.floor(norm(moonSid+sunSid)/(360/27))];
  const karana=karanas[Math.floor(elong/6)%7];
  const {sunrise,sunset}=solarTimes(date,city);
  const dow=date.getUTCDay();
  const rahuIdx=[7,1,6,4,5,3,2][dow];
  const yamaIdx=[4,3,2,1,0,6,5][dow];
  const gulikaIdx=[6,5,4,3,2,1,0][dow];
  const muhurta=(sunset-sunrise)/15;
  const abhijit={start:time(sunrise+muhurta*7),end:time(sunrise+muhurta*8)};
  const moonShift=50.5;
  return {
    date:date.toISOString().slice(0,10),
    weekday:new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(date),
    tithi,paksha,nakshatra,yoga,karana,
    sunrise:time(sunrise),sunset:time(sunset),
    moonrise:time(sunrise+moonShift*((date.getUTCDate()%28))),
    moonset:time(sunset+moonShift*((date.getUTCDate()%28))),
    rahu:segmentWindow(sunrise,sunset,rahuIdx),
    yamaganda:segmentWindow(sunrise,sunset,yamaIdx),
    gulika:segmentWindow(sunrise,sunset,gulikaIdx),
    abhijit,
    hinduMonth:hinduMonths[date.getUTCMonth()],
    vikramSamvat:date.getUTCFullYear()+57,
    shakaSamvat:date.getUTCFullYear()-78,
    dayLord:lords[dow],
    engine
  };
}

export const formatWindow=(w:TimeWindow)=>`${w.start} — ${w.end}`;
