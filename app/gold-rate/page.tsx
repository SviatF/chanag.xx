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
  ["Why does gold rate differ by city in India?","Panchvani's city values are calculated estimates. A small documented city-premium factor can be applied to the national estimate to reflect general regional market patterns, while an individual jeweller's quote may differ because of making charges, premiums, demand and timing."],
  ["What is the difference between 22K and 24K gold?","24K is a higher-purity gold reference, while 22K contains a smaller proportion of gold and is commonly used for jewellery because added metals improve durability. Panchvani displays each purity separately rather than treating them as the same price."],
  ["Is the displayed gold rate an official IBJA rate or a final jewellery price?","No. Panchvani calculates a reference estimate from international gold spot, USD/INR, configured India duties and GST. It is not a live IBJA feed and a final jewellery invoice can also include making charges, wastage, design charges and seller spreads."],
  ["How often is Panchvani's gold rate updated?","The pipeline refreshes the international spot and exchange-rate inputs on a controlled schedule, stores hourly observations and shows the exact last successful update time. If upstream data fails, Panchvani labels and serves only the last known valid estimate."],
] as const;

export default async function GoldRateHub(){
  const dataset=await getGoldRateDataset();
  const gate=goldRateGate(dataset);
  const market=dataset?.national??null;
  const cityList=goldRateHubCities(dataset);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":"Gold Rate Today in India — 22K & 24K Price","url":"https://panchvani.com/gold-rate","description":"India gold-rate calculated estimate with 22K, 24K and 18K per-gram prices, city comparisons and transparent source methodology.","inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Gold Rate","item":"https://panchvani.com/gold-rate"}]},
    {"@type":"FAQPage","mainEntity":faq.map(([question,answer])=>({"@type":"Question","name":question,"acceptedAnswer":{"@type":"Answer","text":answer}}))}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Gold Rate</div>
    <p className="page-kicker">GOLD RATE · INDIA</p>
    <h1 className="page-title">Gold Rate Today in India<br/>22K &amp; 24K Price</h1>
    {market&&dataset?<p className="page-subtitle">Today, the Panchvani calculated estimate for 24K gold in India is {formatGoldRate(market.rates["24k"])} per gram and 22K is {formatGoldRate(market.rates["22k"])} per gram. The 18K estimate is {formatGoldRate(market.rates["18k"])} per gram. Last updated {formatGoldUpdatedAt(dataset.updatedAt)} IST. Confirm exact pricing with your jeweller before any purchase.</p>:<p className="page-subtitle">Panchvani is preparing a source-verified India gold-rate calculation for 24K, 22K and 18K gold. Prices are intentionally not estimated from placeholders while the data pipeline is unavailable.</p>}

    {dataset?.status?.mode==="last-known"?<div className={styles.notice}><strong>Data temporarily unavailable</strong><p>Showing the last known valid calculated rate from {formatGoldUpdatedAt(dataset.updatedAt)} IST. Panchvani does not replace failed upstream data with zeroes or invented prices.</p></div>:null}

    {!gate.ready?<div className={styles.notice}><strong>Accuracy gate is intentionally closed</strong><p>{dataset?`The calculated feed is available, but indexing remains disabled until the IBJA benchmark protocol passes: at least ${gate.minValidationDays} days, enough manual observations, average difference at or below 2%, and no validation day above 5%. Current validation: ${gate.validationDays} day(s), ${gate.validationObservations} logged observation(s), passed: ${gate.validationPassed?"yes":"no"}.`:"The Gold Rate data pipeline has not produced a valid observation yet. Panchvani will not fabricate market prices or submit these pages for indexing."}</p></div>:null}

    <div className={styles.heroGrid}><div className={styles.rateCard}><small>24K gold · per gram</small><strong>{market?formatGoldRate(market.rates["24k"]):"—"}</strong><span>Calculated India estimate</span></div><div className={styles.rateCard}><small>22K gold · per gram</small><strong>{market?formatGoldRate(market.rates["22k"]):"—"}</strong><span>Calculated India estimate</span></div><div className={styles.rateCard}><small>18K gold · per gram</small><strong>{market?formatGoldRate(market.rates["18k"]):"—"}</strong><span>Calculated India estimate</span></div></div>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold price by weight</h2><p className="page-subtitle">Calculated reference value before jeweller-specific making charges, wastage, design charges, premiums or buy/sell spread.</p><GoldRateTable rates={market?.rates??null} label="India gold rate by weight"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate trend</h2><p className="page-subtitle">Up to 30 daily trend points derived from stored hourly pipeline observations, with a text summary beneath the chart.</p><GoldTrendChart history={market?.history??[]} label="India"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate today by city</h2><p className="page-subtitle">City pages are demand-gated. Panchvani does not create hundreds of indexable city URLs simply because a location exists in the Panchang database.</p>{cityList.length?<div className={styles.cityGrid}>{cityList.map(city=>{const row=dataset?.cities[city.slug];return <Link className={styles.cityCard} href={`/gold-rate/${city.slug}`} key={city.slug}><strong>Gold Rate in {city.name}</strong><small>{city.state}</small><span>{row?`${formatGoldRate(row.rates["24k"])}/g · 24K estimate`:"Validation preview"}</span></Link>;})}</div>:<div className={styles.notice}><strong>City estimate validation pending</strong><p>City URLs remain outside the index until demand-approved markets have complete rates and trend history.</p></div>}</section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Calculate a gold value</h2><p className="page-subtitle">Use the free calculator for a weight-and-purity estimate based on the same calculated reference feed.</p><div className={styles.inlineLinks}><Link className={styles.goldLink} href="/tools/gold-value-calculator">Gold Value Calculator →</Link></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate questions</h2><div className={styles.faq}>{faq.map(([question,answer])=><div className={styles.faqItem} key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><small>DATA METHODOLOGY</small><h2>How Panchvani calculates this gold rate</h2><p><strong>How this rate is calculated:</strong> We calculate this rate from the live international gold spot price and the USD/INR exchange rate, then adjust for import duty and GST to reflect India's domestic pricing structure. A small city premium (typically under 1%) is applied based on general regional market patterns. This is a calculated estimate, periodically checked against the IBJA benchmark — it is not a direct live feed from IBJA or any single jeweller.</p><p><strong>Data sources:</strong> gold-api.com (spot price), Frankfurter/ECB (exchange rate). <strong>Last updated:</strong> {dataset?formatGoldUpdatedAt(dataset.updatedAt):"Not available"} IST. Rates are for reference only — confirm exact pricing with your jeweller before any purchase.</p><p>IBJA validation compares the pre-GST calculated 24K benchmark because IBJA publishes benchmark rates exclusive of GST. IBJA is used only for manual accuracy checks; Panchvani does not scrape IBJA as the production data feed.</p>{dataset?.calculation?<p className={styles.sourceBox}><strong>Current model inputs:</strong> import tariff {(dataset.calculation.importDutyRate*100).toFixed(1)}% · GST {(dataset.calculation.gstRate*100).toFixed(1)}% · city premium model: {dataset.calculation.cityPremiumModel}. <strong>Validation:</strong> {dataset.validation?`${dataset.validation.observations} logged benchmark checks · average difference ${dataset.validation.averageDifferencePct===null?"pending":dataset.validation.averageDifferencePct.toFixed(2)+"%"} · maximum ${dataset.validation.maxDifferencePct===null?"pending":dataset.validation.maxDifferencePct.toFixed(2)+"%"}.`:"pending"}</p>:null}{dataset?.status?.spotSource.includes("fallback")?<p className={styles.sourceBox}><strong>Spot fallback active:</strong> {dataset.status.spotSource}. The page remains labelled as a calculated estimate.</p>:null}</div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
