import {latestOutcomeCheckpoint} from "./outcome-intelligence";
import type {OpportunityLifecycleRecord,OpportunityOutcomeCheckpoint} from "./opportunity-lifecycle";
import type {SearchOpportunity,SearchOpportunityStatus} from "./search-opportunities";

export type SeoActionPriority="P0"|"P1"|"P2"|"P3";
export type SeoActionArea="LANDING"|"TITLE_H1"|"CONTENT"|"INTERNAL_LINKS"|"STRUCTURED_DATA"|"INDEXING"|"MEASUREMENT";
export type SeoActionStep={
  area:SeoActionArea;
  action:string;
  evidence:string;
};
export type SeoActionPlan={
  priority:SeoActionPriority;
  mode:"DISCOVERY"|"OUTCOME"|"MONITOR";
  headline:string;
  diagnosis:string;
  targetPath:string|null;
  currentPath:string|null;
  steps:SeoActionStep[];
  successCriteria:string[];
  guardrail:string;
};

type BuildInput={
  opportunity:SearchOpportunity|null;
  record:OpportunityLifecycleRecord;
};

function pathOnly(raw:string|null|undefined){
  if(!raw)return null;
  try{return new URL(raw).pathname.replace(/\/$/,"")||"/";}
  catch{return raw.split("?")[0].replace(/^https?:\/\/[^/]+/,"").replace(/\/$/,"")||"/";}
}

function fmtPct(value:number){return `${(value*100).toFixed(2)}%`;}
function fmtSigned(value:number,suffix=""){return `${value>0?"+":""}${value.toFixed(1)}${suffix}`;}

function priorityFor(status:SearchOpportunityStatus|undefined,outcome:OpportunityOutcomeCheckpoint|null):SeoActionPriority{
  if(outcome?.recommendation==="REGRESSED")return "P0";
  if(outcome?.recommendation==="ITERATE")return "P1";
  if(status==="WRONG_LANDING")return "P0";
  if(status==="NEW_CLUSTER"||status==="STRIKING_DISTANCE")return "P1";
  if(status==="LOW_CTR"||status==="NO_CLEAR_LANDING")return "P2";
  return "P3";
}

function baseEvidence(item:SearchOpportunity){
  return `${Math.round(item.impressions).toLocaleString("en-IN")} impressions · position ${item.position.toFixed(1)} · CTR ${fmtPct(item.ctr)} · opportunity ${item.score}/100.`;
}

function discoverySteps(item:SearchOpportunity):SeoActionStep[]{
  const target=item.recommendedPath;
  const current=pathOnly(item.currentLanding);
  const demand=baseEvidence(item);

  if(item.status==="NEW_CLUSTER")return [
    {area:"LANDING",action:`Build the approved ${item.template} at ${target}; make this URL the single canonical owner of “${item.topQuery}” intent.`,evidence:`GSC demand exists but Panchvani has no matching exposed page family. ${demand}`},
    {area:"TITLE_H1",action:`Write a unique title and H1 around the exact user intent, city/date modifiers and page purpose; do not repeat the query mechanically.`,evidence:`The detected top query is “${item.topQuery}”, so the new page must answer that intent immediately.`},
    {area:"CONTENT",action:"Populate the page with first-party calculated or curated data from the relevant Panchvani engine, then add concise explanatory copy and useful alternatives. Avoid creating a thin city/date shell.",evidence:`The recommendation is a new ${item.template}; quality must come from page-specific data, not templated filler.`},
    {area:"INTERNAL_LINKS",action:"Link the new URL from the nearest existing topical hubs and reciprocal related pages; keep anchors descriptive and context-specific.",evidence:"A new page family needs crawl paths and topical reinforcement before relying on sitemap discovery alone."},
    {area:"STRUCTURED_DATA",action:"Reuse only the structured-data pattern already valid for this page family and visible content; do not add unsupported schema solely for ranking.",evidence:"This is a new route/template, so schema should follow the actual rendered page rather than inventing a rich-result type."},
    {area:"INDEXING",action:"Keep the route out of indexable expansion until content, canonical, internal links and route validity pass review; then add it through the normal SEO policy/sitemap path.",evidence:"Autopilot detects demand but intentionally does not approve or publish pages automatically."},
  ];

  if(item.status==="WRONG_LANDING")return [
    {area:"LANDING",action:`Make ${target} the strongest and clearest owner of “${item.topQuery}”; verify it is indexable, self-canonical and returns 200.`,evidence:`Google currently sends the query to ${current??"another/unknown URL"}, not the recommended target. ${demand}`},
    {area:"TITLE_H1",action:`Align ${target}'s title/H1 with the specific intent and modifiers Google is already showing demand for.`,evidence:`The top query is “${item.topQuery}” but another URL currently wins the query-to-page association.`},
    {area:"CONTENT",action:`Add the missing intent-specific answer to ${target} near the top of the page; remove or soften overlapping exact-intent copy on ${current??"the competing landing"} if it causes cannibalization.`,evidence:"Wrong-landing behavior usually means Google sees stronger relevance signals on the competing URL."},
    {area:"INTERNAL_LINKS",action:`Point contextual internal links for this intent toward ${target}; avoid using the same intent-rich anchors toward ${current??"the competing page"}.`,evidence:"Internal anchor distribution should reinforce one canonical intent owner."},
    {area:"MEASUREMENT",action:"After shipping, keep the lifecycle in measurement until GSC query×page data shows the recommended landing taking ownership.",evidence:"Landing alignment is an explicit Outcome Intelligence signal and must be verified after implementation."},
  ];

  if(item.status==="STRIKING_DISTANCE")return [
    {area:"CONTENT",action:`Strengthen ${target} with the missing sub-intents implied by “${item.topQuery}”, prioritizing useful calculated facts, comparisons and concise answers above generic prose.`,evidence:`The correct landing is already around position ${item.position.toFixed(1)}, so improving the existing page is preferable to creating another URL.`},
    {area:"TITLE_H1",action:"Check that title/H1 match the dominant query intent while preserving natural language and existing high-performing terms.",evidence:`Position ${item.position.toFixed(1)} indicates relevance is already recognized; the goal is refinement, not a full intent reset.`},
    {area:"INTERNAL_LINKS",action:`Add contextual links to ${target} from the strongest closely related Panchvani pages, especially pages already receiving impressions for adjacent intents.`,evidence:"The URL is within striking distance and can benefit from stronger topical/PageRank support."},
    {area:"STRUCTURED_DATA",action:"Validate that existing structured data matches visible content and has no errors; do not introduce unrelated schema as a ranking tactic.",evidence:"This is an existing ranking page; schema work should be corrective, not speculative."},
    {area:"MEASUREMENT",action:"Ship one coherent iteration, record the baseline, then evaluate position/click/CTR movement at the normal checkpoints.",evidence:`Current opportunity score is ${item.score}/100 with ${Math.round(item.impressions)} impressions.`},
  ];

  if(item.status==="LOW_CTR")return [
    {area:"TITLE_H1",action:`Rewrite the title/snippet proposition for “${item.topQuery}” around the exact date/city/tool value visible on the page; keep H1 aligned but avoid clickbait.`,evidence:`The correct landing ranks at ${item.position.toFixed(1)} but CTR is ${fmtPct(item.ctr)}, below the internal benchmark for that position.`},
    {area:"CONTENT",action:"Make the first visible answer match the search promise so the improved snippet is supported by on-page content.",evidence:"Snippet changes should not promise information the landing does not immediately provide."},
    {area:"STRUCTURED_DATA",action:"Validate existing eligible structured data and visible fields for consistency; fix errors only where markup genuinely represents page content.",evidence:"CTR work may benefit from clean search presentation, but unsupported markup must not be added."},
    {area:"MEASUREMENT",action:"Measure CTR change separately from ranking change; do not call a snippet test a win if CTR rises only because average position changed materially.",evidence:`Baseline position ${item.position.toFixed(1)} and CTR ${fmtPct(item.ctr)} must be interpreted together.`},
  ];

  if(item.status==="NO_CLEAR_LANDING")return [
    {area:"LANDING",action:"Inspect GSC query×page rows and URL indexing/canonical state before creating a new page. Decide which existing URL, if any, should own the intent.",evidence:`GSC shows demand for “${item.topQuery}” but no clear landing association in the current snapshot. ${demand}`},
    {area:"CONTENT",action:"Compare the query against existing Panchvani page purposes and only extend a page when the intent is genuinely compatible.",evidence:"No clear landing is an ambiguity signal, not proof that a new URL is needed."},
    {area:"INDEXING",action:"Check canonical/noindex/redirect status for likely target pages before changing content architecture.",evidence:"Technical indexing ambiguity can produce missing or unstable query-to-page associations."},
    {area:"MEASUREMENT",action:"Re-check query×page data after diagnosis; move to BUILD or ALIGN only when there is evidence for the correct target.",evidence:"The lifecycle should preserve human review for ambiguous demand."},
  ];

  return [
    {area:"MEASUREMENT",action:"Keep monitoring this intent; do not change a correctly aligned page without a new negative signal.",evidence:`The current landing matches intent. ${demand}`},
  ];
}

function outcomeSteps(record:OpportunityLifecycleRecord,outcome:OpportunityOutcomeCheckpoint):SeoActionStep[]{
  const target=record.context?.recommendedPath??"the recommended landing";
  const postLanding=pathOnly(outcome.post.topLanding);
  const metricEvidence=`${outcome.days}d outcome ${outcome.score}/100 · clicks ${outcome.clicksChangePct===null?"new":fmtSigned(outcome.clicksChangePct,"%")} · impressions ${outcome.impressionsChangePct===null?"new":fmtSigned(outcome.impressionsChangePct,"%")} · CTR ${fmtSigned(outcome.ctrDeltaPoints," pp")} · position ${outcome.positionImprovement===null?"n/a":fmtSigned(outcome.positionImprovement)}.`;

  if(outcome.recommendation==="REGRESSED")return [
    {area:"LANDING",action:`Audit ${target} against the shipped version and verify canonical/indexability/intent ownership before making another content change.`,evidence:`Outcome Intelligence marked the implementation REGRESSED. ${metricEvidence}`},
    {area:"CONTENT",action:"Identify what materially changed at launch and revert or revise the weakest assumption first; avoid stacking multiple unmeasured fixes at once.",evidence:"A regression after launch calls for diagnosis against the shipped baseline, not another broad rewrite."},
    {area:"INTERNAL_LINKS",action:"Check whether internal links or anchors were removed, diluted or redirected away from the target during implementation.",evidence:"Loss of internal support can compound ranking/landing regressions."},
    {area:"MEASUREMENT",action:"Move back to BUILD only after the regression hypothesis is explicit; ship one corrective iteration and start a fresh measurement cycle.",evidence:outcome.reason},
  ];

  if(outcome.recommendation==="ITERATE"){
    const landingStep:SeoActionStep=outcome.landingAligned
      ?{area:"CONTENT",action:`Keep ${target} as the intent owner but improve the weakest remaining on-page signal: answer completeness, query modifiers, comparison depth or freshness.`,evidence:`Landing is aligned, but the ${outcome.days}d horizon was not strong enough. ${metricEvidence}`}
      :{area:"LANDING",action:`Fix query-to-page ownership first: Google currently prefers ${postLanding??"another/unknown URL"} instead of ${target}.`,evidence:`The latest checkpoint is landing-misaligned. ${metricEvidence}`};
    return [
      landingStep,
      {area:"TITLE_H1",action:"Re-check title/H1 against the exact top query and the visible first answer; change them only if the intent promise is incomplete or mismatched.",evidence:outcome.reason},
      {area:"INTERNAL_LINKS",action:`Concentrate relevant contextual internal links on ${target} and remove conflicting intent-rich anchors toward competing pages.`,evidence:"A completed measurement horizon without a decisive win justifies another controlled relevance/PageRank iteration."},
      {area:"MEASUREMENT",action:"Document the single iteration hypothesis, move lifecycle back to BUILD, then capture a new SHIPPED baseline for the next cycle.",evidence:"Outcome Intelligence recommends ITERATE rather than passive waiting."},
    ];
  }

  if(outcome.recommendation==="WON")return [
    {area:"MEASUREMENT",action:"Preserve the winning implementation and confirm the lifecycle as WON after human review; avoid unnecessary title/content churn.",evidence:`The latest ${outcome.days}d checkpoint recommends WON at ${outcome.score}/100. ${metricEvidence}`},
    {area:"INTERNAL_LINKS",action:"Use this winning page as a proven internal-link destination for closely related intents without creating cannibalizing duplicates.",evidence:"A validated intent owner can reinforce adjacent topical pages while preserving query ownership."},
  ];

  return [
    {area:"MEASUREMENT",action:`Keep the current implementation stable until the next checkpoint; do not iterate before the ${outcome.days}d signal matures unless a clear technical error appears.`,evidence:`Outcome recommendation is KEEP MEASURING. ${metricEvidence}`},
  ];
}

export function buildSeoActionPlan({opportunity,record}:BuildInput):SeoActionPlan{
  const outcome=latestOutcomeCheckpoint(record);
  const status=opportunity?.status;
  const priority=priorityFor(status,outcome);
  const target=opportunity?.recommendedPath??record.context?.recommendedPath??null;
  const current=pathOnly(opportunity?.currentLanding??outcome?.post.topLanding??null);

  if(outcome&&(outcome.recommendation==="REGRESSED"||outcome.recommendation==="ITERATE"||outcome.recommendation==="WON")){
    const label=outcome.recommendation.replaceAll("_"," ");
    return {
      priority,
      mode:"OUTCOME",
      headline:outcome.recommendation==="WON"?"Preserve the validated winner":outcome.recommendation==="REGRESSED"?"Diagnose and correct the regression":"Run a controlled second iteration",
      diagnosis:`${outcome.days}-day Outcome Intelligence recommends ${label}. ${outcome.reason}`,
      targetPath:target,
      currentPath:current,
      steps:outcomeSteps(record,outcome),
      successCriteria:outcome.recommendation==="WON"
        ?["Recommended landing continues to own the query.","No material reversal in clicks, impressions, CTR or position at the next review."]
        :["Recommended landing owns the top query after the next launch.","Next equal-length GSC checkpoint improves the combined outcome score without a material regression."],
      guardrail:"One hypothesis per iteration. Do not create a second competing URL for an intent that already has a designated target.",
    };
  }

  if(opportunity){
    const headline:Record<SearchOpportunityStatus,string>={
      NEW_CLUSTER:"Build the missing intent owner",
      WRONG_LANDING:"Fix query-to-page ownership",
      STRIKING_DISTANCE:"Push the existing page toward page one",
      LOW_CTR:"Improve search-result appeal without changing intent",
      NO_CLEAR_LANDING:"Diagnose landing ambiguity before building",
      COVERED:"Preserve the correctly aligned page",
    };
    return {
      priority,
      mode:opportunity.status==="COVERED"?"MONITOR":"DISCOVERY",
      headline:headline[opportunity.status],
      diagnosis:opportunity.reason,
      targetPath:target,
      currentPath:current,
      steps:discoverySteps(opportunity),
      successCriteria:opportunity.status==="LOW_CTR"
        ?["CTR improves at a comparable average position.","The recommended landing remains the query owner."]
        :opportunity.status==="WRONG_LANDING"
          ?["GSC query×page data moves the top query to the recommended landing.","The competing landing stops dominating the same exact intent."]
          :opportunity.status==="NEW_CLUSTER"
            ?["The approved page is crawlable, indexable and internally linked after quality review.","GSC begins associating the target URL with the detected query cluster."]
            :["The recommended landing remains aligned.","Clicks/position improve at the next comparable GSC measurement window."],
      guardrail:"Treat this as an evidence-backed recommendation, not an automatic publish instruction. Approval, implementation and index activation remain human-controlled.",
    };
  }

  return {
    priority:"P3",
    mode:"MONITOR",
    headline:"Await fresh demand evidence",
    diagnosis:"This persisted lifecycle item is outside the current GSC discovery window and has no decisive stored outcome yet.",
    targetPath:target,
    currentPath:current,
    steps:[{area:"MEASUREMENT",action:"Keep the lifecycle record and wait for fresh GSC demand or the next due outcome checkpoint before changing implementation.",evidence:"No current SearchOpportunity row is available for a grounded discovery recommendation."}],
    successCriteria:["Fresh GSC or checkpoint evidence becomes available before another implementation decision."],
    guardrail:"Do not infer a new SEO action from stale context alone.",
  };
}
