import type { Panchang, TimeWindow } from "./panchang";

export type Festival = {
  slug:string;
  name:string;
  year:number;
  date:string;
  short:string;
  meaning:string;
  rituals:string[];
  regionalNames:string[];
  relatedMuhurat?:string;
  pujaRule:"sunrise"|"midday"|"sunset"|"night"|"day";
};

const details:Record<string,Omit<Festival,"year"|"date">>={
  "makar-sankranti":{
    slug:"makar-sankranti",name:"Makar Sankranti",
    short:"Solar transition into Makara and a major harvest observance.",
    meaning:"Makar Sankranti marks the Sun's transition into Makara and is one of the most widely observed solar festivals in India. Regional customs differ substantially, but themes of gratitude, harvest, charity and seasonal renewal recur across traditions.",
    rituals:["Sun worship","Charity and food offerings","Regional harvest customs"],
    regionalNames:["Pongal","Uttarayan","Magh Bihu"],relatedMuhurat:"gold-purchase",pujaRule:"sunrise"
  },
  "maha-shivaratri":{
    slug:"maha-shivaratri",name:"Maha Shivaratri",
    short:"A night devoted to Shiva, observed with fasting, worship and vigil.",
    meaning:"Maha Shivaratri is dedicated to Shiva and is traditionally observed through fasting, temple worship, mantra recitation and night vigil. The observance is closely tied to Krishna Paksha Chaturdashi and night-time worship.",
    rituals:["Fasting","Shiva Puja","Night vigil"],pujaRule:"night",regionalNames:["Mahashivratri"]
  },
  "holi":{
    slug:"holi",name:"Holi",
    short:"Spring festival associated with renewal, community and the victory of good over harmful forces.",
    meaning:"Holi follows Holika Dahan and is celebrated with color, community gatherings and festive food. Panchang timing is relevant to the preceding Purnima and Holika Dahan observance, while regional customs vary across North, West and East India.",
    rituals:["Holika Dahan on the preceding evening","Playing with colors","Community gatherings"],pujaRule:"day",regionalNames:["Dol Jatra","Rangwali Holi"]
  },
  "chaitra-navratri":{
    slug:"chaitra-navratri",name:"Chaitra Navratri",
    short:"Nine-night spring observance dedicated to forms of the Goddess.",
    meaning:"Chaitra Navratri begins on Shukla Pratipada of the Chaitra month and opens a nine-night period of worship. Many households observe fasting, daily puja and recitation, with Rama Navami falling near the end of the cycle.",
    rituals:["Ghatasthapana","Daily Devi Puja","Fasting"],pujaRule:"sunrise",regionalNames:["Vasant Navratri"]
  },
  "rama-navami":{
    slug:"rama-navami",name:"Rama Navami",
    short:"Festival celebrating the birth of Lord Rama.",
    meaning:"Rama Navami is observed on Chaitra Shukla Navami and celebrates the birth of Rama. Devotional readings, temple worship and midday puja are common, with timing linked to the Navami Tithi and local solar day.",
    rituals:["Rama Puja","Ramayana recitation","Temple worship"],pujaRule:"midday",regionalNames:["Sri Rama Navami"]
  },
  "hanuman-jayanti":{
    slug:"hanuman-jayanti",name:"Hanuman Jayanti",
    short:"Celebration of Hanuman with devotional worship and recitation.",
    meaning:"Hanuman Jayanti is observed with worship of Hanuman, recitation of Hanuman Chalisa and temple visits. Date conventions can vary regionally, but the Chaitra Purnima observance is widely followed in North India.",
    rituals:["Hanuman Puja","Hanuman Chalisa","Temple visit"],pujaRule:"sunrise",regionalNames:["Hanuman Janmotsava"]
  },
  "akshaya-tritiya":{
    slug:"akshaya-tritiya",name:"Akshaya Tritiya",
    short:"A highly auspicious Tritiya associated with prosperity, giving and important purchases.",
    meaning:"Akshaya Tritiya falls on Vaishakha Shukla Tritiya and is traditionally associated with enduring prosperity. It is widely used for charity, new ventures, gold purchase and ritual observance, making it an important commercial-intent festival page.",
    rituals:["Vishnu-Lakshmi worship","Charity","Auspicious purchases"],relatedMuhurat:"gold-purchase",pujaRule:"sunrise",regionalNames:["Akha Teej"]
  },
  "guru-purnima":{
    slug:"guru-purnima",name:"Guru Purnima",
    short:"Ashadha Purnima devoted to teachers, gurus and spiritual lineages.",
    meaning:"Guru Purnima is observed on Ashadha Purnima as a day of gratitude toward teachers and spiritual guides. Worship, study, offerings and reflection are common across Hindu, Buddhist and Jain traditions.",
    rituals:["Guru Puja","Study and reflection","Offerings"],pujaRule:"day",regionalNames:["Vyasa Purnima"]
  },
  "raksha-bandhan":{
    slug:"raksha-bandhan",name:"Raksha Bandhan",
    short:"Shravana Purnima observance centered on the rakhi bond.",
    meaning:"Raksha Bandhan is observed on Shravana Purnima and centers on the tying of rakhi and exchange of blessings. The timing of Bhadra is traditionally considered when selecting an appropriate rakhi window.",
    rituals:["Rakhi tying","Family blessings","Gift exchange"],pujaRule:"day",regionalNames:["Rakhi"]
  },
  "janmashtami":{
    slug:"janmashtami",name:"Krishna Janmashtami",
    short:"Celebration of Krishna's birth on Bhadrapada Krishna Ashtami.",
    meaning:"Janmashtami celebrates the birth of Krishna and is commonly observed with fasting, devotional singing, temple worship and midnight rituals. Nishita-period timing is important in many traditions.",
    rituals:["Fasting","Krishna Puja","Midnight observance"],pujaRule:"night",regionalNames:["Gokulashtami","Krishna Jayanthi"]
  },
  "ganesh-chaturthi":{
    slug:"ganesh-chaturthi",name:"Ganesh Chaturthi",
    short:"Festival celebrating Ganesha and auspicious new beginnings.",
    meaning:"Ganesh Chaturthi begins on Bhadrapada Shukla Chaturthi and celebrates Ganesha. Households and public communities install Ganesha images, perform puja and continue observances through Visarjan.",
    rituals:["Ganesha Sthapana","Madhyahna Puja","Modak offering"],pujaRule:"midday",regionalNames:["Vinayaka Chaturthi"]
  },
  "shardiya-navratri":{
    slug:"shardiya-navratri",name:"Shardiya Navratri",
    short:"Autumn nine-night Devi observance leading toward Dussehra.",
    meaning:"Shardiya Navratri begins on Ashwina Shukla Pratipada and develops through nine nights of Devi worship. Regional forms include Durga Puja, Garba and Golu traditions.",
    rituals:["Ghatasthapana","Daily Devi worship","Regional Navratri observances"],pujaRule:"sunrise",regionalNames:["Durga Puja","Navratri"]
  },
  "dussehra":{
    slug:"dussehra",name:"Dussehra",
    short:"Vijayadashami observance marking victory of dharma over adharma.",
    meaning:"Dussehra or Vijayadashami follows Navratri and is observed as a day of victory, new beginnings and ceremonial worship. Customs include Ravana Dahan, Ayudha Puja and Shami worship depending on region.",
    rituals:["Aparahna Puja","Ayudha Puja","Regional victory rituals"],relatedMuhurat:"business-opening",pujaRule:"day",regionalNames:["Vijayadashami","Dasara"]
  },
  "karwa-chauth":{
    slug:"karwa-chauth",name:"Karwa Chauth",
    short:"Kartika Krishna Chaturthi fast traditionally observed by married women.",
    meaning:"Karwa Chauth is a fasting observance associated with marital well-being. The fast is traditionally broken after moonrise, making accurate local moonrise data especially useful on the city-specific page.",
    rituals:["Day-long fast","Evening Puja","Moonrise observance"],pujaRule:"sunset",regionalNames:["Karaka Chaturthi"]
  },
  "dhanteras":{
    slug:"dhanteras",name:"Dhanteras",
    short:"Opening day of the Diwali cycle associated with prosperity and auspicious purchase.",
    meaning:"Dhanteras is observed on Kartika Krishna Trayodashi and is strongly associated with wealth, household prosperity and auspicious buying. It is especially relevant to gold, silver, utensils and business purchase intent.",
    rituals:["Lakshmi-Dhanvantari worship","Deepa lighting","Auspicious purchase"],relatedMuhurat:"gold-purchase",pujaRule:"sunset",regionalNames:["Dhanatrayodashi"]
  },
  "diwali":{
    slug:"diwali",name:"Diwali",
    short:"Festival of lights centered on Lakshmi Puja on Kartika Amavasya.",
    meaning:"Diwali is one of the most widely celebrated Hindu festivals and is associated with light, prosperity, household worship and regional narratives. Lakshmi Puja is commonly performed during the evening Pradosh period, with city-specific sunset affecting the practical local reference window.",
    rituals:["Lakshmi Puja","Deepa lighting","Family worship"],relatedMuhurat:"business-opening",pujaRule:"sunset",regionalNames:["Deepavali","Lakshmi Puja"]
  },
  "govardhan-puja":{
    slug:"govardhan-puja",name:"Govardhan Puja",
    short:"Post-Diwali observance associated with Govardhan and Annakut.",
    meaning:"Govardhan Puja is observed after Diwali and celebrates the Govardhan narrative associated with Krishna. Annakut offerings and temple worship are common, with regional calendar differences affecting observance details.",
    rituals:["Govardhan Puja","Annakut offering","Krishna worship"],pujaRule:"day",regionalNames:["Annakut"]
  },
  "bhai-dooj":{
    slug:"bhai-dooj",name:"Bhai Dooj",
    short:"Sibling observance on Kartika Shukla Dwitiya.",
    meaning:"Bhai Dooj is a family observance centered on sibling bonds and blessings. It follows the Diwali cycle and is known under several regional names across India.",
    rituals:["Tilak ceremony","Family meal","Sibling blessings"],pujaRule:"day",regionalNames:["Bhai Phota","Bhau Beej","Yama Dwitiya"]
  },
  "chhath-puja":{
    slug:"chhath-puja",name:"Chhath Puja",
    short:"Sun worship centered on sunset and sunrise arghya.",
    meaning:"Chhath Puja is especially important in Bihar, Jharkhand and eastern Uttar Pradesh. The observance includes strict ritual discipline and offerings to the setting and rising Sun, making local sunrise and sunset highly relevant.",
    rituals:["Sunset Arghya","Sunrise Arghya","Fasting and riverbank worship"],pujaRule:"sunset",regionalNames:["Surya Shashthi"]
  },
};

const dates:Record<number,Record<string,string>>={
  2026:{
    "makar-sankranti":"2026-01-14","maha-shivaratri":"2026-02-15","holi":"2026-03-04",
    "chaitra-navratri":"2026-03-19","rama-navami":"2026-03-26","hanuman-jayanti":"2026-04-02",
    "akshaya-tritiya":"2026-04-19","guru-purnima":"2026-07-29","raksha-bandhan":"2026-08-28",
    "janmashtami":"2026-09-04","ganesh-chaturthi":"2026-09-14","shardiya-navratri":"2026-10-11",
    "dussehra":"2026-10-20","karwa-chauth":"2026-10-29","dhanteras":"2026-11-06",
    "diwali":"2026-11-08","govardhan-puja":"2026-11-10","bhai-dooj":"2026-11-11","chhath-puja":"2026-11-15"
  },
  2027:{
    "makar-sankranti":"2027-01-15","maha-shivaratri":"2027-03-06","holi":"2027-03-22",
    "chaitra-navratri":"2027-04-07","rama-navami":"2027-04-15","hanuman-jayanti":"2027-04-20",
    "akshaya-tritiya":"2027-05-09","guru-purnima":"2027-07-18","raksha-bandhan":"2027-08-17",
    "janmashtami":"2027-08-25","ganesh-chaturthi":"2027-09-04","shardiya-navratri":"2027-09-30",
    "dussehra":"2027-10-09","karwa-chauth":"2027-10-18","diwali":"2027-10-29",
    "govardhan-puja":"2027-10-30","bhai-dooj":"2027-10-31"
  }
};

export const festivalsByYear:Record<number,Festival[]>=Object.fromEntries(
  Object.entries(dates).map(([year,items])=>[
    Number(year),
    Object.entries(items).map(([slug,date])=>({...details[slug],year:Number(year),date}))
  ])
);

export const festivals2026=festivalsByYear[2026];
export const festivals2027=festivalsByYear[2027];
export const allFestivals=Object.values(festivalsByYear).flat().sort((a,b)=>a.date.localeCompare(b.date));

export function festivalsForYear(year:number){
  return festivalsByYear[year]??[];
}

export function festivalBySlugYear(slug:string,year:number){
  return festivalsForYear(year).find(f=>f.slug===slug);
}

export function nextFestival(date:Date){
  const iso=date.toISOString().slice(0,10);
  return allFestivals.find(f=>f.date>=iso)??allFestivals[0];
}

const pad=(n:number)=>String(n).padStart(2,"0");
function toMinutes(time:string){
  const [h,m]=time.split(":").map(Number);
  return h*60+m;
}
function formatMinutes(value:number){
  const m=((Math.round(value)%1440)+1440)%1440;
  return `${pad(Math.floor(m/60))}:${pad(m%60)}`;
}

export function festivalPujaReference(data:Panchang,festival:Festival):TimeWindow{
  const sunrise=toMinutes(data.sunrise);
  const sunset=toMinutes(data.sunset);

  if(festival.pujaRule==="sunrise") return {start:data.sunrise,end:formatMinutes(sunrise+180)};
  if(festival.pujaRule==="sunset") return {start:formatMinutes(sunset-24),end:formatMinutes(sunset+96)};
  if(festival.pujaRule==="night") return {start:formatMinutes(sunset+180),end:formatMinutes(sunset+300)};
  if(festival.pujaRule==="midday"){
    if(data.abhijit) return data.abhijit;
    const good=data.dayChoghadiya.find(x=>x.effect==="good");
    return good?{start:good.start,end:good.end}:{start:formatMinutes((sunrise+sunset)/2-24),end:formatMinutes((sunrise+sunset)/2+24)};
  }

  const good=data.dayChoghadiya.find(x=>x.effect==="good");
  return good?{start:good.start,end:good.end}:{start:data.sunrise,end:formatMinutes(sunrise+90)};
}
