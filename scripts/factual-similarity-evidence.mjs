/**
 * Similar words are not always identical content: location-specific time tables
 * can share explanation templates. Do NOT ignore severe text similarity.
 * Reclassify only moderate (0.72-0.86) pairs whose dated observation sets
 * exhibit substantial independent clock differences. The pair remains in the
 * artifact for editorial review, not an automatic Google quality endorsement.
 */
export function evidenceDistinctSimilarityPair(left,right,score){
  if(score>=0.86)return false;
  const a=left?.factualEvidence,b=right?.factualEvidence;
  const leftClocks=new Set(a?.clockValues??[]),rightClocks=new Set(b?.clockValues??[]);
  if(leftClocks.size<12||rightClocks.size<12)return false;
  if((a?.distinctIsoDates??0)<3||(b?.distinctIsoDates??0)<3)return false;
  let shared=0;
  for(const clock of leftClocks)if(rightClocks.has(clock))shared++;
  const union=leftClocks.size+rightClocks.size-shared;
  return union>0&&shared/union<=0.55&&
    leftClocks.size-shared>=8&&rightClocks.size-shared>=8;
}
