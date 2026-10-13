import {type MuhuratRow} from "./muhurat";
/**
 * Transparent decomposition of the site-owned, non-probabilistic 0–100
 * daytime-window availability score. It is NOT a religious suitability index:
 * only sunrise Tithi + Nakshatra eligibility is stored in the V2 snapshots.
 */
export type MuhuratScoreEvidence={
  continuity:number;
  availability:number;
  sourceDiversity:number;
  abhijit:number;
  score:number;
  summary:string;
};
export function getMuhuratScoreEvidence(row:MuhuratRow):MuhuratScoreEvidence{
  const p=row.planning,ideal=p.idealContinuousMinutes;
  if(!Number.isFinite(ideal)||ideal<=0)throw new Error("Invalid Muhurat target length");
  const continuity=Math.min(40,Math.round(p.longestWindowMinutes/ideal*40));
  const availability=Math.min(25,Math.round(p.totalCleanMinutes/(ideal*2.5)*25));
  const sourceDiversity=Math.min(20,p.sourceCount*5);
  const abhijit=p.hasAbhijit?15:0;
  const score=Math.min(100,continuity+availability+sourceDiversity+abhijit);
  if(score!==p.score)throw new Error(`Muhurat score mismatch for ${row.date}: ${score} != ${p.score}`);
  const summary=`${row.date}: ${score}/100 window-availability score = ${continuity}/40 continuity (${p.longestWindowMinutes} min longest vs ${ideal}-minute target) + ${availability}/25 clean-time supply (${p.totalCleanMinutes} unique minutes) + ${sourceDiversity}/20 favorable timing label count (${p.sourceCount}) + ${abhijit}/15 Abhijit contribution.`;
  return {continuity,availability,sourceDiversity,abhijit,score,summary};
}
