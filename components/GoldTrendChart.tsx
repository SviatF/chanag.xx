import {formatGoldRate,type GoldRateHistoryPoint,type GoldPurity} from "@/lib/gold-rate";
import styles from "./GoldRate.module.css";

function pct(current:number,previous:number){return previous>0?((current-previous)/previous)*100:null;}

export default function GoldTrendChart({history,purity="24k",label}:{history:GoldRateHistoryPoint[];purity?:GoldPurity;label:string}){
  const points=history.slice(-30);
  if(points.length<2)return <div className={styles.notice}><strong>Trend history is still building</strong><p>Panchvani will show the 7/30-day trend after enough validated daily observations are available from the same source.</p></div>;

  const values=points.map(point=>point.rates[purity]);
  const min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);
  const width=900,height=260,padX=28,padY=24;
  const coords=values.map((value,index)=>{
    const x=padX+(index/(values.length-1))*(width-padX*2);
    const y=padY+((max-value)/range)*(height-padY*2);
    return [x,y] as const;
  });
  const polyline=coords.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area=`M ${coords[0][0]} ${height-padY} L ${coords.map(([x,y])=>`${x} ${y}`).join(" L ")} L ${coords[coords.length-1][0]} ${height-padY} Z`;
  const latest=values[values.length-1];
  const sevenBase=values[Math.max(0,values.length-8)];
  const change7=pct(latest,sevenBase),changeWindow=pct(latest,values[0]);
  const sign=(value:number|null)=>value===null?"—":`${value>=0?"+":""}${value.toFixed(1)}%`;

  return <div className={styles.trendShell}>
    <svg className={styles.trendSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${purity.toUpperCase()} gold rate trend for ${label}`}>
      {[.25,.5,.75].map(step=><line key={step} className={styles.trendGrid} x1={padX} x2={width-padX} y1={padY+(height-padY*2)*step} y2={padY+(height-padY*2)*step}/>) }
      <path className={styles.trendArea} d={area}/>
      <polyline className={styles.trendLine} points={polyline}/>
    </svg>
    <div className={styles.trendMeta}><span>{points[0].date} → {points[points.length-1].date}</span><span>Latest {formatGoldRate(latest)}/g · 7d {sign(change7)} · period {sign(changeWindow)}</span></div>
    <p className={styles.trendSummary}>Across the {points.length}-day validated series, {purity.toUpperCase()} gold in {label} moved from {formatGoldRate(values[0])} per gram to {formatGoldRate(latest)} per gram. The chart uses the same source and purity definition as the price table above.</p>
  </div>;
}
