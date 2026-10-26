/**
 * CT2: audit the actual indexed Muhurat SSR for the distinction between
 * mathematical candidate screening and independently approved ceremony dates.
 * This checks presentation, NOT the correctness of source/ritual decisions.
 */
const MONTH=/^\/muhurat\/[^/]+\/\d{4}\/\d{2}(?:\/[^/]+)?$/;
const YEAR=/^\/muhurat\/[^/]+\/\d{4}$/;
export function inspectRenderedMuhuratTrust(pathname,html){
  if(!MONTH.test(pathname)&&!YEAR.test(pathname))return null;
  const main=html.match(/<main\b([^>]*)>([\s\S]*?)<\/main>/i);
  if(!main)return {pathname,category:"unreadable",issues:["missing-main"],riskFlags:["ritual-unverified"]};
  const markup=main[2];
  const plain=markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  const reviewedClosure=/data-ritual-status=["\x27]source-reviewed-closure["\x27]/i.test(main[1])&&/\bReviewed convention\b/i.test(plain);
  const issues=[];
  const jsonScripts=[...markup.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if(!jsonScripts.length)issues.push("no-jsonld");
  for(const match of jsonScripts){
    try{
      const data=JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
      const nodes=data["@graph"]??[data];
      for(const node of nodes)if(node["@type"]==="ItemList"&&JSON.stringify(node).match(/Planning Score|Muhurat score|ceremony approved/i))issues.push("unverified-list-score-schema");
    }catch{issues.push("invalid-jsonld");}
  }
  if(reviewedClosure){
    if(!/\bnot a (?:blanket|universal)\b/i.test(plain))issues.push("missing-region-scope");
    return {pathname,category:"reviewed-regional-closure",issues,riskFlags:["other-traditions-unreviewed"]};
  }
  if(MONTH.test(pathname)){
    if(!/data-ritual-status=["']candidate-only["']/i.test(main[1]))issues.push("missing-candidate-only-marker");
    if(!/Astronomical candidates/i.test(plain)||!/NOT verified ceremony dates/i.test(plain))issues.push("missing-prominent-ritual-uncertainty");
    if(!/clock-window availability|0[–-]100 score measures window availability/i.test(plain))issues.push("missing-score-context");
  }else if(!/Candidate-only evidence/i.test(plain)){
    issues.push("missing-year-candidate-only-evidence");
  }
  return {pathname,category:MONTH.test(pathname)?"monthly-candidate":"yearly-candidate",issues,riskFlags:["full-ceremony-eligibility-unverified"]};
}
export function summarizeMuhuratTrust(records){
  const reviewed=records.filter(Boolean),failures=reviewed.filter(r=>r.issues.length);
  const byCategory={};
  for(const record of reviewed)byCategory[record.category]=(byCategory[record.category]??0)+1;
  return {inspected:reviewed.length,failures,byCategory,independentCeremonyCertification:false,
    meaning:"Presentation-only audit. A score or zero HTML errors does not certify Hindu ceremony eligibility; no automatic noindex."};
}
