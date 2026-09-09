import { City } from "./cities";
import { getPanchang, Panchang } from "./panchang";

export type MuhuratEvent="wedding"|"griha-pravesh"|"vehicle-purchase"|"naming-ceremony"|"business-opening"|"gold-purchase";
type Rule={title:string;goodTithi:string[];goodNakshatra:string[];note:string};

export const muhuratRules:Record<string,Rule>={
  "wedding":{title:"Wedding Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Magha","Uttara Phalguni","Hasta","Swati","Anuradha","Mula","Uttara Ashadha","Uttara Bhadrapada","Revati"],note:"Candidate windows combine traditionally preferred Tithi and Nakshatra with the local inauspicious periods removed."},
  "griha-pravesh":{title:"Griha Pravesh Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Uttara Phalguni","Chitra","Anuradha","Uttara Ashadha","Dhanishta","Shatabhisha","Uttara Bhadrapada","Revati"],note:"Home-entry candidates prioritize stable Tithi and Nakshatra combinations and local daylight windows."},
  "vehicle-purchase":{title:"Vehicle Purchase Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Punarvasu","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Vehicle-purchase candidates emphasize travel-friendly Nakshatras and avoid Rahu Kalam."},
  "naming-ceremony":{title:"Naming Ceremony Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Punarvasu","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Revati"],note:"Naming candidates use traditionally favorable lunar combinations and local auspicious timing."},
  "business-opening":{title:"Business Opening Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Ashwini","Rohini","Mrigashirsha","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Business-opening candidates favor initiation-oriented combinations and exclude Rahu Kalam."},
  "gold-purchase":{title:"Gold Purchase Muhurat",goodTithi:["Dvitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],goodNakshatra:["Rohini","Mrigashirsha","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Dhanishta","Revati"],note:"Gold-purchase candidates emphasize prosperity-oriented combinations and local auspicious windows."}
};

export async function getMonthlyMuhurat(event:string,year:number,month:number,city:City){
  const rule=muhuratRules[event]??muhuratRules.wedding;
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const rows:{date:string;data:Panchang}[]=[];
  for(let d=1;d<=days;d++){
    const date=new Date(Date.UTC(year,month-1,d,6));
    const data=await getPanchang(date,city);
    if(rule.goodTithi.includes(data.tithi)&&rule.goodNakshatra.includes(data.nakshatra)) rows.push({date:data.date,data});
  }
  return {rule,rows};
}
