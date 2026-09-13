import {formatGoldRate,rateForWeight,type GoldRates} from "@/lib/gold-rate";
import styles from "./GoldRate.module.css";

const weights=[1,8,10,100] as const;

export default function GoldRateTable({rates,label}:{rates:GoldRates|null;label:string}){
  return <div className={styles.tableWrap}><table className={styles.rateTable}>
    <caption>{label}</caption>
    <thead><tr><th>Weight</th><th>24K</th><th>22K</th><th>18K</th></tr></thead>
    <tbody>{weights.map(grams=><tr key={grams}><td><strong>{grams}g</strong></td><td>{rates?formatGoldRate(rateForWeight(rates["24k"],grams)):"—"}</td><td>{rates?formatGoldRate(rateForWeight(rates["22k"],grams)):"—"}</td><td>{rates?formatGoldRate(rateForWeight(rates["18k"],grams)):"—"}</td></tr>)}</tbody>
  </table></div>;
}
