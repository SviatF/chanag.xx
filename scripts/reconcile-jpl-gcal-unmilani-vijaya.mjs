/**
 * Pin original GCal XML vs physical JPL DE440s at the SAME original GCal clock.
 * Source GCal states/labels are evidence only; never inputs into classifiers.
 * Supported cases: 11 2027-03-04 Unmilani, 3 2027-09-12 Vijaya.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
const args=Object.fromEntries(process.argv.slice(2).map(x=>{
 const match=x.match(/^--([a-z-]+)=(.+)$/);if(!match)throw Error("Bad source proof arg "+x);return [match[1],match[2]];
}));
const required=["gcal","jpl","sidereal","residual","output"];
for(const x of required)if(!args[x])throw Error("Missing original-source research --"+x);
const load=x=>JSON.parse(readFileSync(args[x],"utf8"));
const gcal=load("gcal"),jpl=load("jpl"),sidereal=load("sidereal"),residual=load("residual");
const check=(v,m)=>{if(!v)throw Error("Original clock / JPL proof: "+m)};
check(gcal.status==="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"&&
 gcal.originalExeGitBlob==="1d20f6e0caf29b6293157d258d02287e4edf0481"&&
 gcal.independentlyCertified===false&&gcal.publicRitualApproval===false,
 "original GCal reference changed");
check(jpl.ephemeris==="JPL DE440s"&&
 jpl.kernelSha256==="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"&&
 jpl.halfTithiBoundaryCount===4512&&jpl.canaryOnly===true&&jpl.ritualSelectionCertified===false,
 "non-pinned JPL 6-degree reference");
check(sidereal.status==="research-only"&&sidereal.wave==="3AO"&&
 sidereal.solarLunarKernelSha256===jpl.kernelSha256&&
 sidereal.fullIndependentAyanamsaApproved===false&&
 sidereal.ritualSelectionCertified===false,"JPL sidereal source or Lahiri independence misrepresented");
check(residual.status==="JPL_TITHI_RESIDUAL_AND_PARANA_FULL_454_RESEARCH_COMPLETE"&&
 residual.independentlyCertified===false&&residual.publicRitualApproval===false,
 "residual reference unverified");
const entries=new Map(gcal.dailySourceEvidence.map(x=>[x.city+"/"+x.date,x]));
const boundaries=jpl.halfTithiTransitions,roots=boundaries.map(x=>x[0]);
const nak=sidereal.events.nakshatra,nakTimes=nak.map(x=>x[0]);
const last=(times,at)=>{let lo=0,hi=times.length;while(lo<hi){const mid=(lo+hi)>>>1;if(times[mid]<=at)lo=mid+1;else hi=mid;}return lo-1;};
const utcClock=(date,xml,tag)=>{
 const m=xml?.match(new RegExp("^<"+tag+"\\b[^>]*\\btime=\"(\\d\\d):(\\d\\d):(\\d\\d)\""));
 if(!m)throw Error("No original GCal clock "+date+"/"+tag);
 const t=Date.parse(date+"T00:00:00Z")+((+m[1]*60+ +m[2])*60+ +m[3])*1000-330*60000;
 check(Number.isSafeInteger(t),"invalid independent original clock");
 return t;
};
const jplPhaseAt=ms=>{const i=last(roots,ms);check(i>=0,"root time before coverage");return Math.floor(boundaries[i][1]/2);};
const nearest=(times,at)=>{
 const i=last(times,at),a=times[i],b=times[i+1];
 return [a,b].filter(Number.isFinite).sort((x,y)=>Math.abs(x-at)-Math.abs(y-at))[0];
};
const unix=ms=>new Date(ms).toISOString();
const unmilani=[];
for(const c of residual.nakshatraTraditionReview.unmilani20270304){
 const src=entries.get(c.city+"/2027-03-03");check(!!src,"missing prior GCal Arunodaya "+c.city);
 const at=utcClock("2027-03-03",src.arunodayaXml,"arunodaya");
 check(/<tithi name="Dasami"/.test(src.arunodayaXml),"original GCal 11 didn't record Dashami "+c.city);
 const physical=jplPhaseAt(at),edge=nearest(roots,at);
 const stateAtIndependentDawn=c.physicalWindow[0].jplArunodayaTithi;
 check(physical===24||physical===25,"Original clock not at Dasami/Ekadashi boundary "+c.city);
 check(stateAtIndependentDawn===25,"Research JPL didn't observe clean Ekadashi at independent dawn "+c.city);
 unmilani.push({city:c.city,gcalOriginalDate:"2027-03-03",
  originalArunodayaXml:src.arunodayaXml,originalArunodayaUtc:unix(at),
  originalGcalTithiAtArunodaya:"Dasami",
  jplTithiAtOriginalGcalArunodaya:physical===24?"Dasami":"Ekadashi",
  pinnedJplTransitionUtc:unix(edge),
  secondsFromJplTransitionAtOriginalGcalClock:+((at-edge)/1000).toFixed(3),
  jplTithiAtOwnSwissArunodaya:"Ekadashi",
  caseExplainedByExactDawnBoundaryRisk:true,traditionCertified:false});
}
const vijaya=[];
for(const c of residual.nakshatraTraditionReview.vijaya20270912){
 const src=entries.get(c.city+"/2027-09-13");check(!!src,"missing next-day GCal Śravaṇa evidence");
 const at=utcClock("2027-09-13",src.sunriseXml,"sunrise");
 check(/<naksatra name="Dhanista"/.test(src.sunriseXml),
  "Original GCal next-day Nakshatra was not Dhanishtha "+c.city);
 const k=last(nakTimes,at),index=nak[k][1];
 const crossing=nak[k][0];
 check(index===22&&c.physicalWindow[2].swissNakshatraIndex===21,
  "JPL/Swiss/GCal original Nakshatra comparison changed "+c.city);
 vijaya.push({city:c.city,originalGcalNextSunriseXml:src.sunriseXml,
  gcalNextSunriseUtc:unix(at),
  originalGcalNextSunriseNakshatra:"Dhanishtha",
  independentSwissNextSunriseNakshatra:"Shravana",
  pinnedJplNextSunriseNakshatra:"Dhanishtha",
  jplShravanaToDhanishthaRootUtc:unix(crossing),
  originalGcalSunriseSecondsAfterRoot:+((at-crossing)/1000).toFixed(3),
  requiresIndependentLahiriSourceAndTraditionCheck:true,traditionCertified:false});
}
check(unmilani.length===11&&vijaya.length===3&&
 unmilani.filter(x=>x.jplTithiAtOriginalGcalArunodaya==="Dasami").length===1&&
 unmilani.filter(x=>x.jplTithiAtOriginalGcalArunodaya==="Ekadashi").length===10,
 "11 Unmilani source/JPL clock disagreements not fully explained");
const report={status:"GCAL_11_JPL_EXACT_CLOCK_UNMILANI_VIJAYA_EVIDENCE_RESEARCH_ONLY",
 originalGcalGitBlob:gcal.originalExeGitBlob,jplKernelSha256:jpl.kernelSha256,
 methodology:"Original XML clock converted IST->UTC before independent pinned JPL event index lookup; no GCal labels passed into either JPL research classifier.",
 summary:{unmilaniOriginalSourceArunodayaDashami:11,
  unmilaniJplAtOriginalSourceArunodayaEkadashi:10,
  unmilaniJplAtOriginalSourceArunodayaDashami:1,
  vijayaGcalAndJplAgreeDhanishthaButSwissSaysShravana:3},
 unmilani,vijaya,fullyIndependentLahiriApproved:false,independentlyCertified:false,
 publicRitualApproval:false,autoPublicationBlocked:true};
mkdirSync(dirname(args.output),{recursive:true});writeFileSync(args.output,JSON.stringify(report,null,2)+"\n");
console.log("[Original GCal precise source clock 11 Unmilani / 3 Vijaya]",JSON.stringify(report.summary));
