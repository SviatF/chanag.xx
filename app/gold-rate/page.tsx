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
  ["Why does gold rate differ by city in India?","Retail reference rates can vary because of local supply, logistics, jeweller premiums, demand and the exact time a source updates its market. GST rules are national, while making charges and dealer spreads can still differ by seller."],
  ["What is the difference between 22K and 24K gold?","24K is a higher-purity gold reference, while 22K contains a smaller proportion of gold and is commonly used for jewellery because added metals improve durability. Panchvani displays each purity separately rather than treating them as the same price."],
  ["Is the displayed gold rate a final jewellery price?","No. Panchvani shows a market reference rate per gram. A final jewellery invoice can also include GST, making charges, wastage, design charges, premiums and the seller's buy/sell spread."],
  ["How often is Panchvani's gold rate updated?","The page shows the update frequency supplied by the configured source and the exact last-updated time. Panchvani does not publish estimated prices when the validated feed is unavailable or stale."],
] as const;

export default async function GoldRateHub(){
  const dataset=await getGoldRateDataset();
  const gate=goldRateGate(dataset);
  const market=dataset?.national??null;
  const cityList=goldRateHubCities(dataset);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":"Gold Rate Today in India — 22K & 24K Price","url":"https://panchvani.com/gold-rate","description":"India gold-rate reference hub with 22K, 24K and 18K per-gram prices, city comparisons and transparent source methodology.","inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Gold Rate","item":"https://panchvani.com/gold-rate"}]},
    {"@type":"FAQPage","mainEntity":faq.map(([question,answer])=>({"@type":"Question","name":question,"acceptedAnswer":{"@type":"Answer","text":answer}}))}
  ]};

  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Gold Rate</div>
    <p className="page-kicker">GOLD RATE · INDIA</p>
    <h1 className="page-title">Gold Rate Today in India<br/>22K &amp; 24K Price</h1>
    {market&&dataset?<p className="page-subtitle">Today, the India reference feed reports 24K gold at {formatGoldRate(market.rates["24k"])} per gram and 22K at {formatGoldRate(market.rates["22k"])} per gram. The 18K reference is {formatGoldRate(market.rates["18k"])} per gram. Rates were last received {formatGoldUpdatedAt(dataset.updatedAt)} and can differ from individual jeweller quotes.</p>:<p className="page-subtitle">Panchvani is preparing a source-verified India gold-rate feed for 24K, 22K and 18K gold. Prices are intentionally not estimated while the source validation gate is incomplete.</p>}

    {!gate.ready?<div className={styles.notice}><strong>Accuracy gate is intentionally closed</strong><p>{dataset?`The source feed is connected, but Panchvani requires at least ${gate.minValidationDays} days of consistent validation plus demand-approved city coverage before this cluster enters the sitemap.`:"The live gold-rate source is not connected yet. Panchvani will not fabricate market prices or submit these pages for indexing until the feed is verified."}</p></div>:null}

    <div className={styles.heroGrid}><div className={styles.rateCard}><small>24K gold · per gram</small><strong>{market?formatGoldRate(market.rates["24k"]):"—"}</strong><span>India reference</span></div><div className={styles.rateCard}><small>22K gold · per gram</small><strong>{market?formatGoldRate(market.rates["22k"]):"—"}</strong><span>India reference</span></div><div className={styles.rateCard}><small>18K gold · per gram</small><strong>{market?formatGoldRate(market.rates["18k"]):"—"}</strong><span>India reference</span></div></div>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold price by weight</h2><p className="page-subtitle">Reference value before jeweller-specific making charges, GST, wastage, premiums or buy/sell spread.</p><GoldRateTable rates={market?.rates??null} label="India gold rate by weight"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate trend</h2><p className="page-subtitle">Up to 30 validated daily observations from the same source, with a text summary beneath the chart.</p><GoldTrendChart history={market?.history??[]} label="India"/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate today by city</h2><p className="page-subtitle">City pages are demand-gated. Panchvani does not create hundreds of thin city URLs simply because a location exists in the Panchang database.</p>{cityList.length?<div className={styles.cityGrid}>{cityList.map(city=>{const row=dataset?.cities[city.slug];return <Link className={styles.cityCard} href={`/gold-rate/${city.slug}`} key={city.slug}><strong>Gold Rate in {city.name}</strong><small>{city.state}</small><span>{row?`${formatGoldRate(row.rates["24k"])}/g · 24K`:"Validation preview"}</span></Link>;})}</div>:<div className={styles.notice}><strong>City feed validation pending</strong><p>City URLs remain outside the index until demand-approved markets have complete rates and trend history.</p></div>}</section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Calculate a gold value</h2><p className="page-subtitle">Use the free calculator for a weight-and-purity estimate based on the same validated reference feed.</p><div className={styles.inlineLinks}><Link className={styles.goldLink} href="/tools/gold-value-calculator">Gold Value Calculator →</Link></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate questions</h2><div className={styles.faq}>{faq.map(([question,answer])=><div className={styles.faqItem} key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><small>DATA METHODOLOGY</small><h2>How Panchvani publishes gold rates</h2><p>Panchvani separates market-reference data from editorial or religious content. Rates are published only from a configured source feed, with a visible last-updated timestamp. The cluster stays out of the gold-rate sitemap until the source has completed the configured validation period and every demand-approved launch city has current rates plus trend history.</p><p className={styles.sourceBox}><strong>Source:</strong> {dataset?.source.url?<a href={dataset.source.url} rel="noreferrer">{dataset.source.name}</a>:dataset?.source.name??"Not connected"} · <strong>Update schedule:</strong> {dataset?.updateFrequency??"Not available"}{dataset?` · Last received: ${formatGoldUpdatedAt(dataset.updatedAt)}`:""}.</p></div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
