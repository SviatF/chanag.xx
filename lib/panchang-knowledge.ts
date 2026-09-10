import type {TopicalGraphLink} from "./topical-types";

export type KnowledgeTopicSlug="panchang"|"tithi"|"nakshatra"|"yoga"|"karana"|"paksha"|"hindu-months";

export type KnowledgeFact={label:string;value:string;note:string};
export type KnowledgeSection={title:string;paragraphs:string[];items?:string[]};
export type KnowledgeFaq={q:string;a:string};
export type KnowledgeTopic={
  slug:KnowledgeTopicSlug;
  label:string;
  title:string;
  metaTitle:string;
  description:string;
  kicker:string;
  intro:string;
  formula:string;
  engineNote:string;
  facts:KnowledgeFact[];
  sections:KnowledgeSection[];
  faq:KnowledgeFaq[];
  related:KnowledgeTopicSlug[];
};

export const knowledgeTopicSlugs:KnowledgeTopicSlug[]=["panchang","tithi","nakshatra","yoga","karana","paksha","hindu-months"];

export const knowledgeTopics:Record<KnowledgeTopicSlug,KnowledgeTopic>={
  panchang:{
    slug:"panchang",label:"What is Panchang?",title:"What is Panchang? The five limbs explained",metaTitle:"What Is Panchang? Tithi, Nakshatra, Yoga, Karana & Vara Explained",description:"Learn what a Hindu Panchang is, the five traditional limbs it combines, how Panchvani calculates them, and how daily Panchang differs from personalized astrology.",kicker:"PANCHANG BASICS",intro:"A Panchang is a Hindu calendrical framework used to describe the astronomical and calendar context of a day. The classical five limbs are Tithi, Vara, Nakshatra, Yoga and Karana. Panchvani calculates those factors together with sunrise, sunset, lunar position and practical time windows for a selected city.",formula:"Five limbs: Tithi + Vara + Nakshatra + Yoga + Karana.",engineNote:"Panchvani derives the lunar factors from Sun and Moon positions and calculates sunrise-dependent timings from the selected city coordinates. The result is a reproducible daily reference, not a personalized birth-chart reading.",facts:[
      {label:"Core limbs",value:"5",note:"Tithi, Vara, Nakshatra, Yoga and Karana"},
      {label:"Location matters",value:"Yes",note:"Sunrise, sunset and solar-day timing windows change by city"},
      {label:"Birth chart required",value:"No",note:"A daily Panchang is a date-and-location reference"},
      {label:"Panchvani engine",value:"Deterministic",note:"Same date, city and rules produce the same result"}
    ],
    sections:[
      {title:"The five limbs of Panchang",paragraphs:["Tithi describes the Moon-Sun angular separation in the lunar day cycle. Vara is the weekday. Nakshatra describes the Moon's position in one of 27 sidereal sectors. Yoga uses the combined sidereal longitude of the Sun and Moon. Karana is a half-Tithi division.","Modern Panchang pages often show more than the classical five limbs. Panchvani also surfaces sunrise, sunset, moonrise, moonset, Hindu month, Paksha, Samvat labels, Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya where those values are supported by the current engine."]},
      {title:"Why the city changes the answer",paragraphs:["Lunar longitude-based labels can remain the same across nearby cities at a given instant, but the Panchang day is commonly read relative to local sunrise. Sunrise and sunset also directly control Rahu Kalam, Yamaganda, Gulika, Abhijit and Choghadiya divisions. That is why Panchvani stores the selected city as part of the calculation context."]},
      {title:"Panchang versus personalized astrology",paragraphs:["A city-and-date Panchang does not contain a person's Lagna, houses, birth-specific planetary relationships or compatibility factors. It is therefore useful as a shared calendar and timing reference, while birth-chart questions require exact birth data and a different calculation layer."]},
      {title:"How Panchvani uses Panchang data",paragraphs:["Daily pages expose the raw calendar factors. Monthly calendars connect dates into a navigable year structure. Vrat and festival pages use maintained date datasets or sunrise-based rules. Muhurat pages first apply event-specific Tithi and Nakshatra eligibility and then rank already-qualified dates by clean local timing availability."],items:["Daily Panchang for city + date","Monthly and yearly Hindu calendars","Vrat and festival context","Muhurat planning windows","Evergreen calculators and knowledge guides"]}
    ],
    faq:[
      {q:"What are the five parts of Panchang?",a:"The five classical limbs are Tithi, Vara, Nakshatra, Yoga and Karana."},
      {q:"Does Panchang change by city?",a:"Location-sensitive values such as sunrise, sunset and derived timing windows change by city, and sunrise can also affect which lunar factor is reported for the day."},
      {q:"Is a Panchang the same as a horoscope?",a:"No. A daily Panchang describes a date and location; a horoscope is individualized from birth data and additional astrological calculations."}
    ],related:["tithi","nakshatra","yoga","karana","paksha","hindu-months"]
  },
  tithi:{
    slug:"tithi",label:"Tithi",title:"What is Tithi? Lunar day calculation explained",metaTitle:"What Is Tithi? Hindu Lunar Day Meaning, 30 Tithis & Calculation",description:"Understand Tithi in the Hindu calendar: 12-degree Moon-Sun separation, Shukla and Krishna Paksha, Purnima, Amavasya and how Panchvani calculates Tithi end time.",kicker:"LUNAR DAY",intro:"Tithi is the Hindu lunar-day division based on the angular separation between the Moon and the Sun. A full 360-degree Moon-Sun elongation cycle is divided into 30 Tithis, each spanning 12 degrees.",formula:"Tithi index = floor(normalized Moon − Sun elongation ÷ 12°).",engineNote:"Panchvani evaluates the active Tithi at local sunrise and searches forward from sunrise to refine the next Tithi transition. Displayed transition times are rounded to the nearest minute.",facts:[
      {label:"Tithis per cycle",value:"30",note:"15 in Shukla Paksha + 15 in Krishna Paksha"},
      {label:"Angular span",value:"12°",note:"Each Tithi covers 12 degrees of Moon-Sun elongation"},
      {label:"Waxing full-moon boundary",value:"Purnima",note:"The 15th Shukla Tithi"},
      {label:"Waning new-moon boundary",value:"Amavasya",note:"The 15th Krishna Tithi"}
    ],
    sections:[
      {title:"How Tithi is calculated",paragraphs:["The apparent angular distance from the Sun to the Moon is normalized to a 0–360 degree cycle. Dividing that cycle into 12-degree segments produces 30 lunar-day positions. Panchvani uses tropical Sun and Moon longitudes for the elongation calculation and assigns the segment active at local sunrise.","Because the Moon does not move at a perfectly constant angular speed relative to the Sun, a Tithi is not a fixed 24-hour civil day. Its transition can occur at any clock time."]},
      {title:"The 15 Tithi names",paragraphs:["The names repeat across the waxing and waning halves: Pratipada, Dvitiya, Tritiya, Chaturthi, Panchami, Shashthi, Saptami, Ashtami, Navami, Dashami, Ekadashi, Dwadashi, Trayodashi and Chaturdashi. The fifteenth position is Purnima in Shukla Paksha and Amavasya in Krishna Paksha."]},
      {title:"Why Tithi matters in Panchang",paragraphs:["Tithi is used as a calendar marker for fasting observances, festivals and many Muhurat rule sets. Panchvani's Vrat layer uses sunrise-based date logic for selected observances, while Muhurat rules treat Tithi as one eligibility signal rather than a complete personalized recommendation."]},
      {title:"Common mistake: treating Tithi as a date label",paragraphs:["A Gregorian date can contain a Tithi transition, so saying that one Tithi simply equals one calendar date can be misleading. Panchvani shows both the Tithi active at sunrise and its calculated end time so the daily page retains the transition context."]}
    ],
    faq:[
      {q:"How many Tithis are there?",a:"There are 30 Tithi positions in a lunar cycle: 15 in Shukla Paksha and 15 in Krishna Paksha."},
      {q:"How long is one Tithi?",a:"A Tithi spans 12 degrees of Moon-Sun angular separation, so its clock duration varies rather than staying exactly 24 hours."},
      {q:"Why can Tithi change during the same day?",a:"The Moon-Sun angular separation crosses a 12-degree boundary at a specific time, which can fall anywhere within the civil day."}
    ],related:["paksha","karana","panchang","hindu-months"]
  },
  nakshatra:{
    slug:"nakshatra",label:"Nakshatra",title:"What is Nakshatra? 27 lunar mansions and Pada",metaTitle:"What Is Nakshatra? 27 Lunar Mansions, Pada & Calculation Explained",description:"Learn how Nakshatra is calculated from sidereal lunar longitude, why there are 27 Nakshatras and four Padas, and how daily Nakshatra differs from birth Nakshatra.",kicker:"LUNAR MANSION",intro:"Nakshatra describes the Moon's position within 27 equal sectors of the sidereal zodiac. Each sector spans 13°20′ and is divided into four equal Padas.",formula:"Nakshatra index = floor(Lahiri sidereal Moon longitude ÷ 13°20′).",engineNote:"Panchvani uses Lahiri sidereal mode for lunar longitude, derives the active Nakshatra and Pada at local sunrise, and numerically refines the next Nakshatra transition.",facts:[
      {label:"Nakshatras",value:"27",note:"Equal sectors around 360°"},
      {label:"Span each",value:"13°20′",note:"360 degrees divided by 27"},
      {label:"Padas each",value:"4",note:"Each Pada spans 3°20′"},
      {label:"Sidereal mode",value:"Lahiri",note:"Used by Panchvani's current calculation engine"}
    ],
    sections:[
      {title:"How Nakshatra is calculated",paragraphs:["The Moon's sidereal longitude is normalized around 360 degrees and divided into 27 equal sectors. The active sector provides the Nakshatra name. Panchvani then divides that sector into four equal parts to derive Pada 1–4.","Unlike a static date table, the Nakshatra can change during the day. Panchvani therefore reports the value at local sunrise together with a calculated transition time."]},
      {title:"The 27 Nakshatras",paragraphs:["The sequence used by Panchvani is Ashwini, Bharani, Krittika, Rohini, Mrigashirsha, Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta, Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha, Shravana, Dhanishta, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada and Revati."]},
      {title:"Daily Nakshatra versus birth Nakshatra",paragraphs:["The Nakshatra on a daily Panchang page is a day-and-location calendar value evaluated around local sunrise. A birth Nakshatra should be calculated for the exact birth instant and place. Panchvani's date-only birth tools are therefore presented as estimates when exact birth time is unavailable."]},
      {title:"How Nakshatra is used",paragraphs:["Nakshatra appears in daily Panchang, naming traditions, festival interpretation and many Muhurat systems. Panchvani uses selected Nakshatra lists as one explicit eligibility layer in its general Muhurat shortlists, while leaving personalized compatibility outside the generic route."]}
    ],
    faq:[
      {q:"How many Nakshatras are there?",a:"Panchvani uses the standard 27-Nakshatra division of the sidereal zodiac."},
      {q:"What is a Nakshatra Pada?",a:"Each Nakshatra is divided into four equal quarters called Padas, each spanning 3°20′."},
      {q:"Is today's Nakshatra my birth Nakshatra?",a:"Not necessarily. A birth Nakshatra is calculated for the exact birth instant, while a daily Panchang reports the lunar sector active for that day's calendar context."}
    ],related:["panchang","tithi","yoga","hindu-months"]
  },
  yoga:{
    slug:"yoga",label:"Panchang Yoga",title:"What is Yoga in Panchang? 27 Nitya Yogas explained",metaTitle:"What Is Yoga in Panchang? 27 Nitya Yogas & Calculation Explained",description:"Understand Nitya Yoga in Panchang, how the 27 Yogas are derived from the sidereal Sun and Moon longitudes, and how Panchvani calculates the daily Yoga value.",kicker:"NITYA YOGA",intro:"Yoga in a Panchang is a calendrical factor derived from the combined sidereal longitudes of the Sun and Moon. It is different from the physical or meditative practice commonly called yoga.",formula:"Yoga index = floor(normalized sidereal Sun + Moon longitude ÷ 13°20′).",engineNote:"Panchvani calculates Lahiri sidereal Sun and Moon longitudes, normalizes their sum to 360 degrees and maps the result into one of 27 Yoga sectors.",facts:[
      {label:"Nitya Yogas",value:"27",note:"Equal 13°20′ sectors"},
      {label:"Inputs",value:"Sun + Moon",note:"Sidereal longitudes are added and normalized"},
      {label:"Sector size",value:"13°20′",note:"360 degrees divided by 27"},
      {label:"Purpose here",value:"Calendar factor",note:"Not a personalized yoga practice or natal score"}
    ],
    sections:[
      {title:"How Panchang Yoga is calculated",paragraphs:["Panchvani adds the Lahiri sidereal longitude of the Sun to the Lahiri sidereal longitude of the Moon, normalizes the result to a single 360-degree circle and divides it into 27 equal sectors. The sector active at local sunrise supplies the daily Yoga name."]},
      {title:"The 27 Yoga names",paragraphs:["The engine sequence is Vishkambha, Priti, Ayushman, Saubhagya, Shobhana, Atiganda, Sukarma, Dhriti, Shula, Ganda, Vriddhi, Dhruva, Vyaghata, Harshana, Vajra, Siddhi, Vyatipata, Variyana, Parigha, Shiva, Siddha, Sadhya, Shubha, Shukla, Brahma, Indra and Vaidhriti."]},
      {title:"What the daily Yoga value does and does not mean",paragraphs:["Yoga is one limb of Panchang and can be interpreted differently across traditions. Panchvani exposes the calculated name as transparent calendar data. It does not convert the Yoga into a universal personal fortune score."]},
      {title:"Relation to the other limbs",paragraphs:["Tithi is based on Moon-Sun separation, Nakshatra on lunar sidereal longitude, Yoga on the combined sidereal Sun-Moon longitude and Karana on half-Tithi segments. Seeing the formulas separately helps explain why those values can change on different schedules."]}
    ],
    faq:[
      {q:"Is Panchang Yoga the same as yoga exercise?",a:"No. Nitya Yoga is a calendrical factor derived from the Sun and Moon longitudes."},
      {q:"How many Nitya Yogas are there?",a:"There are 27 sectors in the Panchang Yoga cycle used by Panchvani."},
      {q:"How does Panchvani calculate Yoga?",a:"It normalizes the sum of Lahiri sidereal Sun and Moon longitude and divides the circle into 27 equal sectors."}
    ],related:["panchang","tithi","nakshatra","karana"]
  },
  karana:{
    slug:"karana",label:"Karana",title:"What is Karana in Panchang? Half-Tithi explained",metaTitle:"What Is Karana in Panchang? Half-Tithi Meaning & Calculation Explained",description:"Learn what Karana means in Panchang, why each Karana spans 6 degrees of Moon-Sun elongation, and how the repeating and fixed Karana sequence works.",kicker:"HALF-TITHI",intro:"Karana is the half-Tithi division of the lunar elongation cycle. Because one Tithi spans 12 degrees of Moon-Sun separation, one Karana spans 6 degrees.",formula:"Karana segment = floor(normalized Moon − Sun elongation ÷ 6°).",engineNote:"Panchvani maps the sunrise elongation segment to the seven repeating Karanas plus the four fixed Karanas used at specific points of the 60-segment lunar cycle.",facts:[
      {label:"Angular span",value:"6°",note:"Half of a 12-degree Tithi"},
      {label:"Segments per cycle",value:"60",note:"Two Karana segments for each of 30 Tithis"},
      {label:"Repeating names",value:"7",note:"Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti"},
      {label:"Fixed names",value:"4",note:"Kimstughna, Shakuni, Chatushpada and Naga"}
    ],
    sections:[
      {title:"How Karana relates to Tithi",paragraphs:["Tithi and Karana use the same Moon-Sun elongation, but at different resolution. Tithi divides the circle into 30 segments of 12 degrees. Karana divides it into 60 segments of 6 degrees. This means the Karana can change roughly twice as often as the Tithi, although exact clock duration varies with lunar motion."]},
      {title:"Repeating and fixed Karanas",paragraphs:["Most of the cycle repeats Bava, Balava, Kaulava, Taitila, Garaja, Vanija and Vishti. Four Karanas occupy fixed positions in the cycle: Kimstughna at the opening segment and Shakuni, Chatushpada and Naga near the end."]},
      {title:"How Panchvani displays Karana",paragraphs:["The daily page shows the Karana active at local sunrise. The current public UI does not claim a universal good/bad rating for each Karana because interpretive rules vary and should not be collapsed into a single unsupported score."]},
      {title:"Why Karana is useful",paragraphs:["Karana is one of the five classical Panchang limbs. It supplies a finer-grained lunar-day context than Tithi alone and is useful when comparing traditional calendar references or understanding how a Panchang is assembled."]}
    ],
    faq:[
      {q:"Is Karana half of a Tithi?",a:"Yes. A Tithi spans 12 degrees of Moon-Sun elongation, while a Karana segment spans 6 degrees."},
      {q:"How many Karana segments are in a lunar cycle?",a:"There are 60 half-Tithi segments across the 30-Tithi lunar cycle."},
      {q:"Why are there 11 Karana names but 60 segments?",a:"Seven names repeat through most of the cycle, while four Karanas occupy fixed positions."}
    ],related:["tithi","paksha","panchang","yoga"]
  },
  paksha:{
    slug:"paksha",label:"Paksha",title:"What is Paksha? Shukla and Krishna Paksha explained",metaTitle:"What Is Paksha? Shukla Paksha vs Krishna Paksha Explained",description:"Understand Paksha in the Hindu lunar calendar: Shukla waxing fortnight, Krishna waning fortnight, their relation to Tithi, Purnima and Amavasya, and Panchvani's sunrise convention.",kicker:"LUNAR FORTNIGHT",intro:"Paksha divides the lunar month into two halves. Shukla Paksha is the waxing half that develops toward Purnima, while Krishna Paksha is the waning half that develops toward Amavasya.",formula:"Panchvani assigns Tithi positions 1–15 to Shukla Paksha and positions 16–30 to Krishna Paksha at local sunrise.",engineNote:"Paksha is derived directly from the same Moon-Sun elongation used for Tithi. It is therefore a lunar-cycle label rather than an independent astronomical calculation.",facts:[
      {label:"Pakshas per lunar month",value:"2",note:"Shukla and Krishna"},
      {label:"Tithis per Paksha",value:"15",note:"Each half contains fifteen Tithi positions"},
      {label:"Shukla boundary",value:"Purnima",note:"Waxing half reaches the full-moon Tithi"},
      {label:"Krishna boundary",value:"Amavasya",note:"Waning half reaches the new-moon Tithi"}
    ],
    sections:[
      {title:"Shukla Paksha",paragraphs:["Shukla Paksha follows the new-moon boundary and represents the waxing half of the lunar cycle. The illuminated fraction of the Moon generally increases as the sequence moves from Pratipada toward Purnima."]},
      {title:"Krishna Paksha",paragraphs:["Krishna Paksha follows the full-moon boundary and represents the waning half. The sequence progresses through the same numbered Tithi names toward Amavasya."]},
      {title:"Paksha and Tithi are inseparable",paragraphs:["Names such as Ekadashi or Chaturdashi occur in both halves of the month, so the Paksha distinguishes which occurrence is meant. A full description such as Shukla Ekadashi or Krishna Ekadashi is therefore more precise than the Tithi name alone."]},
      {title:"How Panchvani uses Paksha",paragraphs:["The daily Panchang displays Paksha next to Tithi. Vrat, festival and month interpretation can use the waxing/waning context, while the core engine derives it from the Tithi segment active at local sunrise."]}
    ],
    faq:[
      {q:"What is the difference between Shukla and Krishna Paksha?",a:"Shukla Paksha is the waxing half of the lunar month toward Purnima; Krishna Paksha is the waning half toward Amavasya."},
      {q:"How many Tithis are in one Paksha?",a:"Each Paksha contains fifteen Tithi positions."},
      {q:"Can the same Tithi name occur in both Pakshas?",a:"Yes. Most Tithi names repeat once in Shukla Paksha and once in Krishna Paksha."}
    ],related:["tithi","hindu-months","panchang","karana"]
  },
  "hindu-months":{
    slug:"hindu-months",label:"Hindu Months",title:"Hindu calendar months: Chaitra to Phalguna",metaTitle:"Hindu Calendar Months Explained — Chaitra to Phalguna & Amanta System",description:"Explore the 12 Hindu lunar month names, how the Amanta month system changes around new moon, and why Hindu month labels can differ by regional calendar convention.",kicker:"LUNAR MONTHS",intro:"Hindu calendars use lunar month names such as Chaitra, Vaishakha and Kartika, but month-boundary conventions are not uniform across India. Panchvani's core engine currently uses an Amanta model, where the lunar month turns around the new-moon boundary.",formula:"Panchvani's Amanta label is derived from the sidereal solar sign around the previous new moon.",engineNote:"The core month calculation uses the previous new moon and Lahiri sidereal solar position. Regional calendar pages can apply their own maintained naming layer instead of pretending every Indian calendar uses one identical convention.",facts:[
      {label:"Core lunar months",value:"12",note:"Chaitra through Phalguna"},
      {label:"Panchvani core model",value:"Amanta",note:"Month boundary follows the new-moon cycle"},
      {label:"Regional variation",value:"Expected",note:"Purnimanta and regional naming conventions can differ"},
      {label:"Year alignment",value:"Lunisolar",note:"Lunar months are interpreted within a solar/lunisolar calendar framework"}
    ],
    sections:[
      {title:"The 12 month names",paragraphs:["A common sequence is Chaitra, Vaishakha, Jyeshtha, Ashadha, Shravana, Bhadrapada, Ashwin, Kartika, Margashirsha, Pausha, Magha and Phalguna. Transliteration and regional spellings vary, but those labels form the core sequence used by Panchvani's Amanta layer."]},
      {title:"What Amanta means",paragraphs:["In an Amanta calendar the lunar month ends at the new-moon boundary. Panchvani searches backward for the previous new moon, evaluates the sidereal solar sign around that transition and maps it to the corresponding month label."]},
      {title:"Why another calendar may show a different month",paragraphs:["Some traditions use Purnimanta month boundaries or regional solar/lunisolar systems. A different month label does not automatically mean one source is wrong; the first question is which calendar convention the source follows. Panchvani documents the Amanta convention so the result is auditable."]},
      {title:"Months, Paksha and festivals",paragraphs:["Each lunar month contains Shukla and Krishna Paksha, and many festival rules are described using a month + Paksha + Tithi combination. That is why month naming conventions matter when comparing observance dates across regional traditions."]}
    ],
    faq:[
      {q:"What are the 12 Hindu months?",a:"The common lunar sequence is Chaitra, Vaishakha, Jyeshtha, Ashadha, Shravana, Bhadrapada, Ashwin, Kartika, Margashirsha, Pausha, Magha and Phalguna."},
      {q:"What is an Amanta month?",a:"In the Amanta convention, the lunar month ends around the new-moon boundary."},
      {q:"Why do Hindu month names differ between calendars?",a:"Different regions and traditions can use Amanta, Purnimanta or other regional calendar conventions, so month boundaries and labels may differ."}
    ],related:["paksha","tithi","panchang","nakshatra"]
  }
};

export function knowledgeTopicBySlug(slug:string){return knowledgeTopics[slug as KnowledgeTopicSlug]??null;}
export function knowledgePagePath(slug:KnowledgeTopicSlug){return `/knowledge/${slug}`;}
export function knowledgeGraphLinks(slugs:KnowledgeTopicSlug[]=knowledgeTopicSlugs):TopicalGraphLink[]{return slugs.map(slug=>({href:knowledgePagePath(slug),label:knowledgeTopics[slug].label,note:knowledgeTopics[slug].description}));}

function normalizeQuery(value:string){return ` ${value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{M}\p{N}]+/gu," ").trim()} `;}
const liveIntent=/\b(today|tomorrow|yesterday|aaj|kal|tonight|now|20\d{2})\b| आज | कल /u;
const knowledgeCue=/\b(what is|meaning|means|explained|explain|definition|how is|how does|how to calculate|calculation|difference|vs|list|names)\b| क्या है | मतलब | अर्थ /u;

export function detectKnowledgeQuery(raw:string):KnowledgeTopic|null{
  const q=normalizeQuery(raw);
  if(liveIntent.test(q))return null;

  if(/ (hindu months|hindu month names|hindu calendar months|amanta month|amanta calendar|हिंदू महीने|हिन्दू महीने|हिंदू माह) /u.test(q))return knowledgeTopics["hindu-months"];
  if(/ (shukla paksha|krishna paksha|paksha|पक्ष) /u.test(q)&&knowledgeCue.test(q))return knowledgeTopics.paksha;
  if(/ (tithi|thithi|तिथि) /u.test(q)&&knowledgeCue.test(q))return knowledgeTopics.tithi;
  if(/ (nakshatra|nakshatram|नक्षत्र) /u.test(q)&&knowledgeCue.test(q))return knowledgeTopics.nakshatra;
  if(/ (karana|karanam|करण) /u.test(q)&&(/ (panchang|पंचांग) /u.test(q)||knowledgeCue.test(q)))return knowledgeTopics.karana;
  if(/ (nitya yoga|panchang yoga|yoga in panchang|yog in panchang|योग पंचांग|पंचांग योग) /u.test(q))return knowledgeTopics.yoga;
  if(/ (panchang|panchangam|panjika|पंचांग) /u.test(q)&&knowledgeCue.test(q))return knowledgeTopics.panchang;
  return null;
}
