import { festivalsForYear } from "@/lib/festivals";

export default function FestivalsManager(){
  const rows=[2026,2027].flatMap(year=>festivalsForYear(year));
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="admin-eyebrow">FESTIVALS DB</p><h1>Festival records</h1><p>{rows.length} curated records across 2026–2027.</p></div></header>
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Festival</th><th>Date</th><th>Year</th><th>Puja rule</th><th>Regional names</th><th>Related Muhurat</th></tr></thead><tbody>
      {rows.map(row=><tr key={row.year+"-"+row.slug}>
        <td><strong>{row.name}</strong><small>{row.slug}</small></td>
        <td>{row.date}</td><td>{row.year}</td><td>{row.pujaRule}</td>
        <td>{row.regionalNames.join(" · ")}</td><td>{row.relatedMuhurat??"—"}</td>
      </tr>)}
    </tbody></table></div></section>
  </div>;
}
