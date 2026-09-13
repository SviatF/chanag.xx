"use client";

import {useMemo,useState} from "react";
import type {GoldPurity,GoldRates} from "@/lib/gold-rate";
import styles from "./GoldRate.module.css";

const format=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);

export default function GoldValueCalculator({rates,label}:{rates:GoldRates|null;label:string}){
  const [grams,setGrams]=useState("10");
  const [purity,setPurity]=useState<GoldPurity>("22k");
  const weight=Math.max(0,Number(grams)||0);
  const value=useMemo(()=>rates?rates[purity]*weight:null,[rates,purity,weight]);
  return <div className={styles.calc}>
    <div className={styles.calcField}><label htmlFor="gold-weight">Weight in grams</label><input id="gold-weight" type="number" min="0" step="0.01" inputMode="decimal" value={grams} onChange={event=>setGrams(event.target.value)}/></div>
    <div className={styles.calcField}><label htmlFor="gold-purity">Gold purity</label><select id="gold-purity" value={purity} onChange={event=>setPurity(event.target.value as GoldPurity)}><option value="24k">24K</option><option value="22k">22K</option><option value="18k">18K</option></select></div>
    <div className={styles.calcResult}><small>Estimated raw gold value · {label}</small><strong>{value===null?"Rate unavailable":format(value)}</strong><p>{rates?`${weight||0}g × ${format(rates[purity])}/g (${purity.toUpperCase()}).`:"Panchvani is withholding calculations until the validated rate feed is available."} This is a reference value, not a jeweller quote. GST, making charges, wastage, local premiums and buy/sell spreads can change the final transaction price.</p></div>
  </div>;
}
