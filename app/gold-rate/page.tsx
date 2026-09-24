import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GoldRateTable from "@/components/GoldRateTable";
import GoldTrendChart from "@/components/GoldTrendChart";
import {cities} from "@/lib/cities";
import {formatGoldRate,formatGoldUpdatedAt,getGoldRateDataset,goldRateGate,goldRateHubCities,isGoldRateHubIndexable} from "@/lib/gold-rate";
import {robotsFor} from "@/lib/seo-policy";
import styles from "@/components/GoldRate.module.css";

export const revalidate=3600;

export async function generateMetadata():Promise<Metadata>{
  const dataset=await getGoldRateDataset();
  return {
    title:"Gold Rate Today in India — 22K & 24K Price",
    description:"Check today's gold rate in India for 22K, 24K and 18K gold. See per-gram prices, city comparisons, trend history and a transparent data methodology.",
    alternates:{canonical:"/gold-rate"},
    robots:robotsFor(isGoldRateHubIndexable(dataset)),
  };
}

const faq=[
  ["Why does gold rate differ by city in India?","Panchvani applies a small documented city-premium factor to the national model. Local demand, logistics, seller premiums, update timing, making charges, wastage and dealer spreads can move retail prices away from that model value."],
  ["What is the difference between 22K and 24K gold?","24K is a higher-purity gold reference, while 22K contains a smaller proportion of gold and is commonly used for jewellery because added metals improve durability. Panchvani derives each purity from the same calculated 24K base."],
  ["Where does Panchvani's gold value come from?","The production model combines international gold spot, USD/INR, configured India duty and GST, then applies the documented city-premium model. IBJA is used as a separate benchmark-validation layer."],
  ["How often is Panchvani's gold rate updated?","The pipeline refreshes spot and exchange-rate inputs on a controlled schedule, stores hourly observations and exposes the last successful update time. If an upstream source fails, the last valid observation remains visible with its timestamp."],
] as const;

export default async function GoldRateHub(){
  const dataset=await getGoldRateDataset();
  const gate=goldRateGate(dataset);
  const market=dataset?.national??null;
  const cityList=goldRateHubCities(dataset);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":"Gold Rate Today in India — 22K & 24K Price","url":"https://panchvani.com/gold-rate","description":"India gold-rate model with 22K, 24K and 18K per-gram prices, city comparisons and transparent source methodology.","inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Gold Rate","item":"https://panchvani.com/gold-rate"}]},
    {"@type":"FAQPage","mainEntity":faq.map(([question,answer])=>({"@type":"Question","name":question,"acceptedAnswer":{"@type":"Answer","text":answer}}))}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Gold Rate</div>
    <p className="page-kicker">GOLD RATE · INDIA</p>
    <h1 className="page-title">Gold Rate Today in India<br/>22K &amp; 24K Price</h1>
    {market&&dataset?<p className="page-subtitle">Today, the Panchvani model for 24K gold in India is {formatGoldRate(market.rates["24k"])} per gram and 22K is {formatGoldRate(market.rates["22k"])} per gram. The 18K value is {formatGoldRate(market.rates["18k"])} per gram. Last updated {formatGoldUpdatedAt(dataset.updatedAt)} IST.</p>:<p className="page-subtitle">Panchvani is waiting for a valid source observation before publishing the India gold model values.</p>}

    {dataset?.status?.mode==="last-known"?<div className={styles.notice}><strong>Data temporarily unavailable</strong><p>Showing the last known valid model value from {formatGoldUpdatedAt(dataset.updatedAt)} IST.</p></div>:null}

    {!gate.ready?<div className={styles.notice}><strong>Accuracy gate is closed</strong><p>{dataset?`The calculated feed is available, while indexing remains disabled until the benchmark protocol passes: at least ${gate.minValidationDays} days, enough manual observations, average difference at or below 2%, and no validation day above 5%. Current validation: ${gate.validationDays} day(s), ${gate.validationObservations} logged observation(s), passed: ${gate.validationPassed?"yes":"no"}.`:"The Gold Rate pipeline has not produced a valid observation yet."}</p></div>:null}

    <div className={styles.heroGrid}><div className={styles.rateCard}><small>24K gold · per gram</small><strong>{market?formatGoldRate(market.rates["24k"]):"—"}</strong><span>India model</span></div><div className={styles.rateCard}><small>22K gold · per gram</small><strong>{market?formatGoldRate(market.rates["22k"]):"—"}</strong><span>India model</span></div><div className={styles.rateCard}><small>18K gold · per gram</small><strong>{market?formatGoldRate(market.rates["18k"]):"—"}</strong><span>India model</span></div></div>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold price by weight</h2><p className="page-subtitle">Calculated weight values before shop-specific making charges, wastage, design charges, premiums and buy/sell spread.</p><GoldRateTable rates={market?.rates??null} label="India gold rate by weight"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate trend</h2><p className="page-subtitle">Up to 30 daily trend points derived from stored hourly pipeline observations, with a text summary beneath the chart.</p><GoldTrendChart history={market?.history??[]} label="India"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate today by city</h2><p className="page-subtitle">City pages open only after demand and validation gates pass.</p>{cityList.length?<div className={styles.cityGrid}>{cityList.map(city=>{const row=dataset?.cities[city.slug];return <Link className={styles.cityCard} href={`/gold-rate/${city.slug}`} key={city.slug}><strong>Gold Rate in {city.name}</strong><small>{city.state}</small><span>{row?`${formatGoldRate(row.rates["24k"])}/g · 24K model`:"Validation preview"}</span></Link>;})}</div>:<div className={styles.notice}><strong>City validation pending</strong><p>City URLs stay outside the index until demand-approved markets have complete rates and trend history.</p></div>}</section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Calculate a gold value</h2><p className="page-subtitle">Use the calculator for a weight-and-purity value based on the same model feed.</p><div className={styles.inlineLinks}><Link className={styles.goldLink} href="/tools/gold-value-calculator">Gold Value Calculator →</Link></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate questions</h2><div className={styles.faq}>{faq.map(([question,answer])=><div className={styles.faqItem} key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><small>DATA MODEL</small><h2>How Panchvani calculates this gold rate</h2><p><strong>Calculation:</strong> international gold spot + USD/INR + configured India import duty + GST + documented city-premium model.</p><p><strong>Production sources:</strong> gold-api.com for spot and Frankfurter/ECB for exchange rate. <strong>Last updated:</strong> {dataset?formatGoldUpdatedAt(dataset.updatedAt):"Not available"} IST.</p><p><strong>Benchmark validation:</strong> IBJA pre-GST 24K benchmark observations are tracked separately from the production feed.</p>{dataset?.calculation?<p className={styles.sourceBox}><strong>Current model inputs:</strong> import tariff {(dataset.calculation.importDutyRate*100).toFixed(1)}% · GST {(dataset.calculation.gstRate*100).toFixed(1)}% · city premium model: {dataset.calculation.cityPremiumModel}. <strong>Validation:</strong> {dataset.validation?`${dataset.validation.observations} logged benchmark checks · average difference ${dataset.validation.averageDifferencePct===null?"pending":dataset.validation.averageDifferencePct.toFixed(2)+"%"} · maximum ${dataset.validation.maxDifferencePct===null?"pending":dataset.validation.maxDifferencePct.toFixed(2)+"%"}.`:"pending"}</p>:null}{dataset?.status?.spotSource.includes("fallback")?<p className={styles.sourceBox}><strong>Spot fallback active:</strong> {dataset.status.spotSource}.</p>:null}</div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
