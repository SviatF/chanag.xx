/**
 * CT3: visible indexed Daily content-claim protection.
 * This is a regression gate for known unsupported statements, not a
 * certification of JPL/Swiss astronomical truth or festival traditions.
 */
const DAILY=/^\/panchang\/[^/]+\/\d{4}-\d{2}-\d{2}$/;
export function inspectRenderedDailyTrust(pathname,html){
 if(!DAILY.test(pathname))return null;
 const main=html.match(/<main\b([^>]*)>([\s\S]*?)<\/main>/i);
 if(!main)return {pathname,issues:["missing-main"],status:"external-validation-open"};
 const markup=main[2];
 const text=markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
 const issues=[];
 if(!/data-content-trust=["']timing-observation-only["']/i.test(main[1]))issues.push("missing-evidence-status-marker");
 if(/\bTraditional favorable signals\b|\bFavorable signal\b/i.test(text))issues.push("unsupported-favorable-signal");
 if(/mid-morning-edge sunrise|pre-six sunrise/i.test(text))issues.push("invented-sunrise-category");
 if(!/Calculated interval overlaps/i.test(text))issues.push("missing-clock-overlap-evidence");
 if(!/<a\b[^>]*href=["']\/methodology["'][^>]*>/i.test(markup))issues.push("missing-methodology-link");
 if(!/<a\b[^>]*href=["']\/accuracy["'][^>]*>/i.test(markup))issues.push("missing-accuracy-link");
 return {pathname,issues,status:"external-validation-open"};
}
export function summarizeDailyTrust(records){
 const inspected=records.filter(Boolean),failures=inspected.filter(r=>r.issues.length);
 return {scope:"indexed-daily-ssr",inspected:inspected.length,failures,
   externalAstronomyCertified:false,ritualEligibilityCertified:false,
   meaning:"Checks presence of clock-window observations and absence of unsupported heuristics, NOT verified Panchang source truth."};
}
