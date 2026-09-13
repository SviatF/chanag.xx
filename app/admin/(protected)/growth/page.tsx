import SeoCommandCenterClient from "@/components/SeoCommandCenterClient";

export const dynamic="force-dynamic";

export default function SeoGrowthCommandCenter(){
  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEO / COMMAND CENTER</p><h1>SEO Командний центр</h1><p>Що робити прямо зараз: сторінка, query, причина, конкретна дія і 10-денний observation lock після реалізації.</p></div>
    </header>
    <SeoCommandCenterClient/>
  </div>;
}
