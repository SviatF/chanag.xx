import SeoCommandCenterClient from "@/components/SeoCommandCenterClient";

export const dynamic="force-dynamic";

export default function SeoGrowthCommandCenter(){
  return <div className="admin-page">
    <header className="admin-page-head" style={{marginBottom:18}}>
      <div style={{maxWidth:880}}><p className="admin-eyebrow">SEO / DECISION SYSTEM</p><h1 style={{fontSize:"clamp(34px,3.3vw,52px)",lineHeight:1,letterSpacing:"-.045em",marginBottom:10}}>SEO Командний центр</h1><p style={{maxWidth:760,color:"#818a99",lineHeight:1.55}}>Пріоритети з GSC перетворені на конкретні рішення: що робити зараз, який evidence це підтверджує і коли сторінку потрібно залишити в observation.</p></div>
    </header>
    <SeoCommandCenterClient/>
  </div>;
}
