import type { City } from "./cities";
import type { Panchang } from "./panchang";

type GuidanceItem={
  title:string;
  detail:string;
};

export type DailyGuidance={
  summary:string;
  auspicious:GuidanceItem[];
  avoid:GuidanceItem[];
};

const tithiSignals:Record<string,string[]>={
  Pratipada:["planning","fresh-starts"],
  Dvitiya:["partnerships","family"],
  Tritiya:["creative-work","purchases"],
  Chaturthi:["problem-solving","maintenance"],
  Panchami:["learning","travel"],
  Shashthi:["discipline","health-routines"],
  Saptami:["leadership","visibility"],
  Ashtami:["reflection","focused-work"],
  Navami:["spiritual-practice","service"],
  Dashami:["career","administration"],
  Ekadashi:["reflection","spiritual-practice"],
  Dwadashi:["family","charity"],
  Trayodashi:["purchases","practical-work"],
  Chaturdashi:["closure","reflection"],
  Purnima:["community","reflection"],
  Amavasya:["reflection","planning"],
};

const nakshatraSignals:Record<string,string[]>={
  Ashwini:["travel","fresh-starts"],
  Bharani:["discipline","closure"],
  Krittika:["decisions","focused-work"],
  Rohini:["family","purchases"],
  Mrigashirsha:["learning","travel"],
  Ardra:["research","problem-solving"],
  Punarvasu:["family","fresh-starts"],
  Pushya:["planning","spiritual-practice"],
  Ashlesha:["research","reflection"],
  Magha:["leadership","family"],
  "Purva Phalguni":["creative-work","relationships"],
  "Uttara Phalguni":["partnerships","agreements"],
  Hasta:["craft","practical-work"],
  Chitra:["creative-work","design"],
  Swati:["trade","travel"],
  Vishakha:["focused-work","career"],
  Anuradha:["partnerships","spiritual-practice"],
  Jyeshtha:["leadership","problem-solving"],
  Mula:["research","closure"],
  "Purva Ashadha":["visibility","learning"],
  "Uttara Ashadha":["career","agreements"],
  Shravana:["learning","communication"],
  Dhanishta:["community","purchases"],
  Shatabhisha:["research","reflection"],
  "Purva Bhadrapada":["reflection","planning"],
  "Uttara Bhadrapada":["family","spiritual-practice"],
  Revati:["travel","closure"],
};

const activityCopy:Record<string,{title:string;detail:string}>={
  "planning":{title:"Planning & preparation",detail:"Good for structuring the next steps before committing resources."},
  "fresh-starts":{title:"Fresh starts",detail:"Supportive for beginning a modest new task during a favorable local window."},
  "partnerships":{title:"Partnership conversations",detail:"Useful for cooperation, introductions and clarifying shared expectations."},
  "family":{title:"Family matters",detail:"A steady choice for household planning and time with close family."},
  "creative-work":{title:"Creative work",detail:"Use the day for design, writing, making and other constructive creative tasks."},
  "purchases":{title:"Practical purchases",detail:"Prefer the strongest Choghadiya window and avoid Rahu Kalam for important purchases."},
  "problem-solving":{title:"Problem solving",detail:"Well suited to resolving pending issues and completing practical corrections."},
  "maintenance":{title:"Maintenance",detail:"Favors repair, cleanup and improving what already exists."},
  "learning":{title:"Learning & study",detail:"A useful day for study, research and skill development."},
  "travel":{title:"Travel planning",detail:"If following Panchang timing, begin journeys outside the inauspicious periods shown below."},
  "discipline":{title:"Disciplined work",detail:"Best used for routine, consistency and finishing clearly defined tasks."},
  "health-routines":{title:"Daily routines",detail:"Supportive for maintaining ordinary wellness and self-care routines."},
  "leadership":{title:"Leadership tasks",detail:"Suitable for taking responsibility and moving organized work forward."},
  "visibility":{title:"Visibility & outreach",detail:"Useful for presentations, outreach and communicating work publicly."},
  "reflection":{title:"Reflection",detail:"Leave room for review, quiet planning and reconsidering priorities."},
  "focused-work":{title:"Focused work",detail:"Strong for concentrated individual work with a clearly defined outcome."},
  "spiritual-practice":{title:"Spiritual practice",detail:"Traditionally suited to prayer, contemplation and devotional routines."},
  "service":{title:"Service & support",detail:"A constructive day for helping others and completing service-oriented tasks."},
  "career":{title:"Career planning",detail:"Useful for professional organization, applications and structured career decisions."},
  "administration":{title:"Administration",detail:"Good for documentation, scheduling and routine official work."},
  "charity":{title:"Giving & support",detail:"Traditionally favorable for generosity and community support."},
  "closure":{title:"Completion",detail:"Better for closing loops and finishing existing commitments than forcing expansion."},
  "decisions":{title:"Clear decisions",detail:"Good for decisions that are already well researched and do not require haste."},
  "research":{title:"Research",detail:"Favors investigation, analysis and looking beneath surface-level information."},
  "relationships":{title:"Relationships",detail:"Useful for warm social time and thoughtful relationship conversations."},
  "agreements":{title:"Agreements",detail:"Prefer a favorable local window for formalizing plans or commitments."},
  "craft":{title:"Hands-on work",detail:"Good for careful making, repair and skill-based practical work."},
  "design":{title:"Design & aesthetics",detail:"A supportive signal for visual, architectural and aesthetic work."},
  "trade":{title:"Trade & negotiation",detail:"Useful for commercial conversations when the timing window is favorable."},
  "communication":{title:"Communication",detail:"Good for writing, teaching, listening and information exchange."},
  "community":{title:"Community activity",detail:"Favors gatherings, collaboration and constructive group activity."},
};

function unique<T>(items:T[]){
  return [...new Set(items)];
}

export function getDailyGuidance(data:Panchang,city:City):DailyGuidance{
  const tithi=tithiSignals[data.tithi]??["planning"];
  const nakshatra=nakshatraSignals[data.nakshatra]??["focused-work"];
  const goodChoghadiya=data.dayChoghadiya
    .filter(period=>period.effect==="good")
    .slice(0,2)
    .map(period=>period.name);

  const activityKeys=unique([...nakshatra,...tithi]).slice(0,3);
  const auspicious=activityKeys.map(key=>activityCopy[key]??activityCopy["planning"]);

  if(goodChoghadiya.length){
    auspicious[0]={
      ...auspicious[0],
      detail:`${auspicious[0].detail} Today's early favorable Choghadiya includes ${goodChoghadiya.join(" and ")}.`,
    };
  }

  const avoid:GuidanceItem[]=[
    {
      title:`Major starts during Rahu Kalam`,
      detail:`If you follow traditional Panchang timing, avoid initiating important work in ${city.name} from ${data.rahu.start} to ${data.rahu.end}.`,
    },
    {
      title:"Time-sensitive beginnings during Yamaganda",
      detail:`Yamaganda runs from ${data.yamaganda.start} to ${data.yamaganda.end}; use another local window for a significant beginning.`,
    },
  ];

  if(!data.abhijit){
    avoid.push({
      title:"Do not assume an Abhijit window",
      detail:`Abhijit Muhurat is not available for this ${data.weekday}; use the calculated Choghadiya periods instead.`,
    });
  }else{
    avoid.push({
      title:"Do not ignore local timing",
      detail:`Even with Abhijit available at ${data.abhijit.start}–${data.abhijit.end}, compare it with the inauspicious periods before choosing a start time.`,
    });
  }

  return {
    summary:`${data.weekday} in ${city.name} combines ${data.tithi} Tithi in ${data.paksha} Paksha with ${data.nakshatra} Nakshatra. The practical recommendations below are generated from these daily factors and the city's local solar timings.`,
    auspicious,
    avoid,
  };
}
