import type {OpportunityLifecycleRecord} from "@/lib/opportunity-lifecycle";
import {buildSeoLearningLibrary,type SeoPatternSignal} from "@/lib/seo-learning";

type Props={records:Record<string,OpportunityLifecycleRecord>};

function signalClass(signal:SeoPatternSignal){
  if(signal==="PROVEN"||signal==="PROMISING")return "active";
  if(signal==="NEGATIVE")return "hold";
  return "watch";
}
function pct(value:number|null){return value===null?"—":`${value>0?"+":""}${value.toFixed(1)}%`;}
function pp(value:number){return `${value>0?"+":""}${value.toFixed(2)} pp`;}
function pos(value:number|null){return value===null?"—":`${value>0?"+":""}${value.toFixed(1)}`;}

export default function SeoLearningPanel({records}:Props){
  const library=buildSeoLearningLibrary(records);
  const proven=library.patterns.filter(item=>item.signal==="PROVEN").length;
  const promising=library.patterns.filter(item=>item.signal==="PROMISING").length;
  const negative=library.patterns.filter(item=>item.signal==="NEGATIVE").length;

  return <section className="admin-panel">
    <div className="admin-panel-head"><div><small>SEO LEARNING SYSTEM · ATTRIBUTED OUTCOMES ONLY</small><h2>Winning pattern library</h2></div><span>{library.patterns.length} observed patterns</span></div>
    <p className="admin-muted">The library learns only from frozen implementation evidence tied to exact 14/28/56-day GSC outcomes. Each implementation contributes one latest checkpoint per pattern, so older checkpoints do not double-count the same launch. Priority feedback starts only after at least three sufficiently mature samples.</p>
    <section className="admin-kpis">
      <div className="admin-kpi"><small>Attributed launches</small><strong>{library.attributedImplementations}</strong><span>Frozen implementation evidence</span></div>
      <div className="admin-kpi"><small>Measured launches</small><strong>{library.measuredImplementations}</strong><span>Has attributed outcome checkpoint</span></div>
      <div className="admin-kpi"><small>Proven / promising</small><strong>{proven+promising}</strong><span>{proven} proven · {promising} promising</span></div>
      <div className="admin-kpi"><small>Negative patterns</small><strong>{negative}</strong><span>Conservative priority penalty only</span></div>
    </section>
    {library.patterns.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pattern</th><th>Signal</th><th>Evidence</th><th>Outcome</th><th>SEO movement</th></tr></thead><tbody>
      {library.patterns.map(item=><tr key={item.pattern}>
        <td><strong>{item.pattern.replaceAll("_"," ")}</strong><small>{item.samples} measured implementation{item.samples===1?"":"s"} · avg {item.avgCheckpointDays.toFixed(0)}d horizon</small></td>
        <td><span className={`admin-badge ${signalClass(item.signal)}`}>{item.signal}</span><small>confidence {item.confidence}%</small></td>
        <td><b>{Math.round(item.winRate*100)}% win rate</b><small>{item.wins} WON · {item.iterations} ITERATE · {item.regressions} REGRESSED</small><small>landing alignment {Math.round(item.landingAlignmentRate*100)}%</small></td>
        <td><b>{item.avgOutcomeScore.toFixed(0)}/100 avg score</b><small>Clicks {pct(item.avgClicksChangePct)} · Impr. {pct(item.avgImpressionsChangePct)}</small></td>
        <td><b>Position {pos(item.avgPositionImprovement)}</b><small>CTR {pp(item.avgCtrDeltaPoints)}</small></td>
      </tr>)}
    </tbody></table></div>:<p className="admin-muted">No attributed measured implementations yet. The library will populate automatically as shipped implementations reach their first exact GSC checkpoint.</p>}
  </section>;
}
