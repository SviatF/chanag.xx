import type {NakshatraNaming} from "./baby-names";

export type NamingFact={label:string;value:string;note?:string};
export type PadaGuide={pada:number;sound:string;title:string;body:string};
export type NamingFaq={question:string;answer:string};

export type NakshatraNamingQuality={
  directAnswer:string;
  facts:NamingFact[];
  padaGuides:PadaGuide[];
  transliterationTitle:string;
  transliterationBody:string;
  examplesTitle:string;
  examplesBody:string;
  workflowTitle:string;
  workflowBody:string;
  sequenceTitle:string;
  sequenceBody:string;
  faqs:NamingFaq[];
};

const vowel=/^[aeiou]/i;
const longVowel=/(aa|ee|oo|ii|uu)/i;
const clean=(value:string)=>value.toLowerCase().replace(/[^a-z]/g,"");
const collapseLongVowels=(value:string)=>clean(value).replace(/aa/g,"a").replace(/ee/g,"e").replace(/oo/g,"o").replace(/ii/g,"i").replace(/uu/g,"u");

function soundShape(sound:string){
  const compact=clean(sound);
  if(vowel.test(compact))return "vowel-led";
  if(longVowel.test(compact))return "consonant-led with an explicitly long vowel";
  if(compact.length<=2)return "short consonant-vowel";
  return "multi-letter consonant-vowel";
}

function prefixExamples(item:NakshatraNaming,sound:string){
  const normalized=collapseLongVowels(sound);
  return item.names.filter(name=>collapseLongVowels(name).startsWith(normalized));
}

const guideOpeners=[
  "Treat this as the first sound checkpoint, not as a spelling template.",
  "Use the spoken opening sound as the reference before comparing Roman spellings.",
  "Read the syllable aloud first; English-letter spelling can vary across families and languages.",
  "Keep the Pada sound fixed while allowing normal transliteration differences in the written name."
];

const guideClosers=[
  "A name does not need to copy the displayed letters mechanically; the opening pronunciation is the useful comparison.",
  "When two spellings look different, compare their first pronounced syllable rather than character count alone.",
  "If the family uses a regional script, confirm the opening sound in that script before choosing a Roman transliteration.",
  "For exact Janma Nakshatra naming, verify the birth-time Pada first and use this sound only after that step."
];

export function buildNakshatraNamingQuality(item:NakshatraNaming,all:NakshatraNaming[]):NakshatraNamingQuality{
  const index=Math.max(0,all.findIndex(entry=>entry.slug===item.slug));
  const ordinal=index+1;
  const previous=all[(index-1+all.length)%all.length];
  const next=all[(index+1)%all.length];
  const soundShapes=item.sounds.map(soundShape);
  const longCount=item.sounds.filter(sound=>longVowel.test(sound)).length;
  const vowelLed=item.sounds.filter(sound=>vowel.test(clean(sound))).length;
  const uniqueInitials=new Set(item.sounds.map(sound=>clean(sound).slice(0,1).toUpperCase())).size;
  const shortest=[...item.names].sort((a,b)=>a.length-b.length||a.localeCompare(b))[0]??"—";
  const longest=[...item.names].sort((a,b)=>b.length-a.length||a.localeCompare(b))[0]??"—";

  const padaGuides=item.sounds.map((sound,i)=>{
    const examples=prefixExamples(item,sound);
    const exampleLine=examples.length
      ?` In this page's maintained reference list, ${examples.join(", ")} ${examples.length===1?"is":"are"} the clean Roman-prefix example${examples.length===1?"":"s"} for the ${sound} opening family.`
      :` The current maintained example list does not contain a clean Roman-prefix match for ${sound}, so the sound card should be used as the primary reference rather than forcing an example into this Pada.`;
    return {
      pada:i+1,
      sound,
      title:`Pada ${i+1}: ${sound} opening sound`,
      body:`${guideOpeners[(index+i)%guideOpeners.length]} ${sound} is a ${soundShapes[i]} reference in the four-part ${item.name} sequence.${exampleLine} ${guideClosers[(index*2+i)%guideClosers.length]}`
    };
  });

  const soundSequence=item.sounds.join(" → ");
  const nameSequence=item.names.join(", ");
  const romanProfile=longCount===0
    ?`None of the four stored sounds uses a doubled long-vowel spelling, so the main transliteration issue on this page is preserving the opening consonant/vowel relationship rather than reproducing a doubled vowel.`
    :`${longCount} of the four stored sounds use an explicit doubled-vowel form. A family may write that long sound differently in English letters, so pronunciation should be checked before rejecting a spelling that does not visually match the card.`;
  const vowelProfile=vowelLed
    ?`${vowelLed} Pada sound${vowelLed===1?" is":"s are"} vowel-led, while the remaining sounds begin with consonant material.`
    :`All four stored Pada sounds begin with consonant material, giving this page a consonant-led sound profile.`;

  return {
    directAnswer:`${item.name} is entry ${ordinal} in Panchvani's 27-Nakshatra naming reference. Its four stored Pada sounds are ${item.sounds.join(", ")}. If a family follows Janma Nakshatra naming, the birth-time Moon position determines which one of these four sounds is relevant; the name examples below are a browsing aid, not a substitute for calculating the exact Pada.`,
    facts:[
      {label:"Nakshatra position",value:`${ordinal} of ${all.length}`,note:`Between ${previous.name} and ${next.name} in this reference sequence`},
      {label:"Pada sound path",value:soundSequence,note:"Four ordered naming sounds"},
      {label:"Example names",value:String(item.names.length),note:`Current reference set; shortest ${shortest}, longest ${longest}`},
      {label:"Roman sound profile",value:`${uniqueInitials} opening letter group${uniqueInitials===1?"":"s"}`,note:`${longCount} explicit long-vowel form${longCount===1?"":"s"}`}
    ],
    padaGuides,
    transliterationTitle:`How to read ${item.name} sounds in Roman spelling`,
    transliterationBody:`The stored ${item.name} sequence is ${soundSequence}. ${romanProfile} ${vowelProfile} Roman transliteration is therefore a pronunciation aid, not a rule that every accepted name must reproduce the exact same number of letters. If the family normally writes names in an Indian script, confirm the spoken first syllable there and use the English spelling only as a secondary representation. This is especially important when long vowels or consonant clusters are simplified in everyday Roman text.`,
    examplesTitle:`How to use the ${item.name} example list`,
    examplesBody:`The maintained example set on this page contains ${item.names.length} names: ${nameSequence}. It is intentionally shown separately from the four Pada cards because a browsing list and an exact birth-Pada recommendation are different tasks. Use the list to explore familiar spellings and opening families, then compare the preferred name with the relevant Pada sound. The shortest spelling in the current set is ${shortest}; the longest is ${longest}. Those differences illustrate why character length is not a useful test for Nakshatra naming—the opening sound is the part that matters for this convention.`,
    workflowTitle:`A safer ${item.name} naming workflow`,
    workflowBody:`Start with the birth information, not with the name list. A date-only Nakshatra estimate can narrow the search, but the Moon can change Nakshatra or Pada within a civil day. If the family wants to follow the convention precisely, use birth date, exact birth time and birthplace to establish the Janma Nakshatra and Pada. Once ${item.name} and a Pada are confirmed, return to the corresponding ${item.sounds[0]}, ${item.sounds[1]}, ${item.sounds[2]} or ${item.sounds[3]} card, shortlist names by their spoken opening syllable, and only then compare regional spellings or family-preferred transliterations. If exact birth-time information is unavailable, this page should be treated as a naming reference rather than a definitive natal recommendation.`,
    sequenceTitle:`Where ${item.name} sits in the 27-Nakshatra reference`,
    sequenceBody:`In Panchvani's maintained sequence, ${item.name} is number ${ordinal}. The preceding reference page is ${previous.name}, whose stored sounds are ${previous.sounds.join(", ")}; the next is ${next.name}, with ${next.sounds.join(", ")}. This matters when a date-only estimate falls near a Nakshatra boundary: a nearby page can have a completely different four-sound set even though the civil date is the same. Do not blend adjacent sound lists. Confirm the calculated Nakshatra first, then use only that page's Pada sequence.`,
    faqs:[
      {question:`What are the four ${item.name} Pada sounds?`,answer:`The maintained ${item.name} naming reference uses ${item.sounds.join(", ")}, in Pada order from one through four.`},
      {question:`Can I choose any ${item.name} sound without the birth time?`,answer:`You can browse all four sounds, but an exact Janma Nakshatra naming choice depends on the Moon's birth-time Pada. A date-only result cannot always identify that quarter precisely.`},
      {question:`Why can a ${item.name} name be spelled differently from the sound card?`,answer:`Roman transliteration varies. Compare the spoken opening syllable first, especially where long vowels or consonant clusters are written differently across languages and family conventions.`},
      {question:`What should I check after this ${item.name} page?`,answer:`If the Nakshatra is not yet confirmed, use the Nakshatra finder as an estimate and verify exact birth time and birthplace for a natal calculation before treating one Pada sound as definitive.`}
    ]
  };
}
