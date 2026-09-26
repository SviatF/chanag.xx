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
  if(longVowel.test(compact))return "long-vowel Roman form";
  if(compact.length<=2)return "compact consonant-vowel form";
  return "multi-letter consonant-vowel form";
}

function prefixExamples(item:NakshatraNaming,sound:string){
  const normalized=collapseLongVowels(sound);
  return item.names.filter(name=>collapseLongVowels(name).startsWith(normalized));
}

function relationLabel(length:number,min:number,max:number){
  if(min===max)return "same length as the other Pada sounds";
  if(length===min)return "one of the shortest sounds on this page";
  if(length===max)return "one of the longest sounds on this page";
  return "mid-length within this page's sound set";
}

export function buildNakshatraNamingQuality(item:NakshatraNaming,all:NakshatraNaming[]):NakshatraNamingQuality{
  const index=Math.max(0,all.findIndex(entry=>entry.slug===item.slug));
  const ordinal=index+1;
  const previous=all[(index-1+all.length)%all.length];
  const next=all[(index+1)%all.length];
  const lengths=item.sounds.map(sound=>clean(sound).length);
  const minLength=Math.min(...lengths);
  const maxLength=Math.max(...lengths);
  const longCount=item.sounds.filter(sound=>longVowel.test(sound)).length;
  const vowelLed=item.sounds.filter(sound=>vowel.test(clean(sound))).length;
  const initials=item.sounds.map(sound=>clean(sound).slice(0,1).toUpperCase());
  const uniqueInitials=[...new Set(initials)];
  const matches=item.sounds.map(sound=>prefixExamples(item,sound));
  const matchedPadaCount=matches.filter(group=>group.length>0).length;
  const unmatchedSounds=item.sounds.filter((_,i)=>matches[i].length===0);
  const shortest=[...item.names].sort((a,b)=>a.length-b.length||a.localeCompare(b))[0]??"—";
  const longest=[...item.names].sort((a,b)=>b.length-a.length||a.localeCompare(b))[0]??"—";
  const soundSequence=item.sounds.join(" → ");

  const padaGuides=item.sounds.map((sound,i)=>{
    const examples=matches[i];
    const prev=item.sounds[(i-1+item.sounds.length)%item.sounds.length];
    const nextSound=item.sounds[(i+1)%item.sounds.length];
    const exampleText=examples.length
      ?`${examples.join(", ")} ${examples.length===1?"is":"are"} exact Roman-prefix example${examples.length===1?"":"s"} in the maintained list.`
      :`No maintained example begins with a clean ${sound} Roman prefix, so this Pada remains sound-led rather than example-led.`;
    return {
      pada:i+1,
      sound,
      title:`Pada ${i+1}: ${sound}`,
      body:`${sound} is a ${soundShape(sound)} with ${clean(sound).length} Roman letter${clean(sound).length===1?"":"s"}; it is ${relationLabel(clean(sound).length,minLength,maxLength)}. In the ordered ${item.name} path it follows ${prev} and leads into ${nextSound}. ${exampleText}`
    };
  });

  const transliterationProfile=[
    `Sound lengths: ${lengths.join(" / ")}.`,
    `Opening initials: ${initials.join(" / ")}.`,
    `${longCount} sound${longCount===1?" uses":"s use"} an explicit doubled-vowel spelling.`,
    `${vowelLed} of the four ${vowelLed===1?"is":"are"} vowel-led.`,
    `${matchedPadaCount} Pada${matchedPadaCount===1?" has":"s have"} at least one exact Roman-prefix example in the current list.`
  ].join(" ");

  const unmatchedText=unmatchedSounds.length
    ?`The sounds without a clean stored-name prefix are ${unmatchedSounds.join(", ")}; keep those as pronunciation references instead of borrowing an example from another Pada.`
    :`Every Pada sound has at least one clean Roman-prefix example in the maintained list.`;

  return {
    directAnswer:`${item.name} is number ${ordinal} in Panchvani's 27-Nakshatra naming sequence. Its ordered Pada sounds are ${item.sounds.join(", ")}. The birth-time Moon position identifies the relevant Pada; this page then helps compare that sound with the maintained ${item.name} name examples.`,
    facts:[
      {label:"Sequence position",value:`${ordinal} of ${all.length}`,note:`Previous ${previous.name} · next ${next.name}`},
      {label:"Pada path",value:soundSequence,note:`Roman lengths ${lengths.join("/")}`},
      {label:"Prefix coverage",value:`${matchedPadaCount}/4 Padas`,note:unmatchedSounds.length?`No clean prefix: ${unmatchedSounds.join(", ")}`:"All four represented"},
      {label:"Example set",value:`${item.names.length} names`,note:`Shortest ${shortest} · longest ${longest}`}
    ],
    padaGuides,
    transliterationTitle:`${item.name} sound profile in Roman spelling`,
    transliterationBody:`${transliterationProfile} ${unmatchedText} The four sounds use ${uniqueInitials.length} distinct opening-letter group${uniqueInitials.length===1?"":"s"}: ${uniqueInitials.join(", ")}. Compare the spoken opening syllable first when regional scripts or family spellings produce a different-looking Roman form.`,
    examplesTitle:`Reading the ${item.name} example set`,
    examplesBody:`The maintained ${item.name} list contains ${item.names.length} examples: ${item.names.join(", ")}. ${shortest} is the shortest spelling in this set and ${longest} is the longest. These examples are kept separate from the Pada assignment because name length does not decide the sound group; the relevant comparison is the opening pronunciation against ${soundSequence}.`,
    workflowTitle:`Using ${item.name} for a birth-based name search`,
    workflowBody:`Use the birth date, exact birth time and birthplace to establish Janma Nakshatra and Pada. If the result is ${item.name}, choose only the confirmed ${item.sounds[0]}, ${item.sounds[1]}, ${item.sounds[2]} or ${item.sounds[3]} sound, compare candidate names by their spoken opening syllable, and then select the regional spelling the family prefers. A date-only Nakshatra finder can narrow the search before the exact Pada is known.`,
    sequenceTitle:`${previous.name} → ${item.name} → ${next.name}`,
    sequenceBody:`${item.name} sits between ${previous.name} and ${next.name} in this maintained sequence. The previous page uses ${previous.sounds.join(", ")}; the next uses ${next.sounds.join(", ")}. Keeping those neighboring sound sets visible is useful near a Nakshatra boundary because adjacent pages should not share or merge their four-Pada naming lists.`,
    faqs:[
      {question:`Which four sounds belong to ${item.name}?`,answer:`In this reference they are ${item.sounds.join(", ")}, ordered from Pada one through Pada four.`},
      {question:`How many ${item.name} Pada sounds have direct examples here?`,answer:`${matchedPadaCount} of four have at least one clean Roman-prefix match in the current example list.${unmatchedSounds.length?` The unmatched sound${unmatchedSounds.length===1?" is":"s are"} ${unmatchedSounds.join(", ")}.`:" All four are represented."}`}
    ]
  };
}
