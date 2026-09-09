import { cityCandidates } from "@/lib/city-candidates";
import { coreCities, supportedCities } from "@/lib/cities";
import { phase1PriorityCities } from "@/lib/seo-policy";

export const dynamic="force-dynamic";

const prioritySet=new Set<string>(phase1PriorityCities);
const coreSet=new Set(coreCities.map(city=>city.slug));
const populationMap=new Map(cityCandidates.map(city=>[city.slug,city.population]));

export default async function CitiesManager({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}){
  const query=await searchParams;
  const q=(query.q??"").trim().toLowerCase();
  const status=query.status??"all";

  const rows=supportedCities
    .map(city=>({
      ...city,
      population:populationMap.get(city.slug)??0,
      priority:prioritySet.has(city.slug),
      core:coreSet.has(city.slug),
    }))
    .filter(row=>!q||(row.name+" "+row.state+" "+row.slug).toLowerCase().includes(q))
    .filter(row=>status==="all"||(status==="priority"&&row.priority)||(status==="core"&&row.core&&!row.priority)||(status==="candidate"&&!row.core));

  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">CITIES MANAGER</p><h1>Coverage & indexability</h1><p>{supportedCities.length} supported runtime cities · {phase1PriorityCities.length} currently priority-indexed.</p></div></header>

    <form className="admin-filters" method="get">
      <input name="q" defaultValue={query.q??""} placeholder="Search city, state or slug…"/>
      <select name="status" defaultValue={status}>
        <option value="all">All supported</option>
        <option value="priority">Priority / indexed</option>
        <option value="core">Core / noindex</option>
        <option value="candidate">Candidate pool</option>
      </select>
      <button type="submit">Filter</button>
    </form>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><small>RUNTIME COVERAGE</small><h2>{rows.length} cities</h2></div><span>Index policy is demand-controlled</span></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>City</th><th>Coverage</th><th>Index</th><th>Population</th><th>Coordinates</th><th>Languages</th></tr></thead><tbody>
        {rows.map(row=><tr key={row.slug}>
          <td><strong>{row.name}</strong><small>{row.state} · {row.slug}</small></td>
          <td><span className="admin-badge">{row.priority?"PRIORITY":row.core?"CORE":"CANDIDATE"}</span></td>
          <td><span className={row.priority?"admin-badge active":"admin-badge hold"}>{row.priority?"INDEX":"NOINDEX"}</span></td>
          <td>{row.population?row.population.toLocaleString("en-IN"):"—"}</td>
          <td>{row.lat.toFixed(3)}, {row.lng.toFixed(3)}</td>
          <td>{row.language.join(" · ")}</td>
        </tr>)}
      </tbody></table></div>
    </section>
  </div>;
}
