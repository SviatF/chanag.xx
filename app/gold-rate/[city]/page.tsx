import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import GoldRateTable from "@/components/GoldRateTable";
import GoldTrendChart from "@/components/GoldTrendChart";
import {findCityBySlug} from "@/lib/cities";
import {todayInIndia} from "@/lib/dates";
import {formatGoldRate,formatGoldUpdatedAt,getGoldRateDataset,goldRateComparisonCities,goldRateGate,isGoldRateCandidateCity,isGoldRateCityIndexable} from "@/lib/gold-rate";
import {robotsFor} from "@/lib/seo-policy";
import styles from "@/components/GoldRate.module.css";

export const revalidate=3600;

export async function generateMetadata({params}:{params:Promise<{city:string}>}):Promise<Metadata>{
  const {city:slug}=await params;
  const city=findCityBySlug(slug);
  const dataset=await getGoldRateDataset();
  if(!city||(!isGoldRateCandidateCity(city.slug)&&!dataset?.cities[city.slug]))notFound();
  return {
    title:`Gold Rate Today in ${city.name} — 22K & 24K Price`,
    description:`Check today's calculated gold rate in ${city.name} for 22K and 24K gold. See per-gram price, 7/30-day trend, nearby city comparison and transparent source methodology.`,
    alternates:{canonical:`/gold-rate/${city.slug}`},
    robots:robotsFor(isGoldRateCityIndexable(city.slug,dataset)),
  };
}

export default async function GoldRateCityPage({params}:{params:Promise<{city:string}>}){
  const {city:slug}=await params;
  const city=findCityBySlug(slug);
  const dataset=await getGoldRateDataset();
  if(!city||(!isGoldRateCandidateCity(city.slug)&&!dataset?.cities[city.slug]))notFound();
  const market=dataset?.cities[city.slug]??null;
  const gate=goldRateGate(dataset);
  const comparisons=goldRateComparisonCities(city,dataset,5);
  const now=todayInIndia();
  const year=now.getUTCFullYear(),month=String(now.getUTCMonth()+1).padStart(2,"0");
  const muhuratHref=`/muhurat/gold-purchase/${year}/${month}/${city.slug}`;
  const faq=[
    [`What is the 22K gold rate today in ${city.name}?`,market?`The current Panchvani calculated estimate for 22K gold in ${city.name} is ${formatGoldRate(market.rates["22k"])} per gram. It is derived from international gold spot, USD/INR, configured India duties and GST, plus a documented city-premium model.`:`Panchvani is waiting for a valid 22K source observation for ${city.name}; the page stays blank until the pipeline has one.`],
    [`What is the 24K gold rate today in ${city.name}?`,market?`The current Panchvani calculated estimate for 24K gold in ${city.name} is ${formatGoldRate(market.rates["24k"])} per gram. IBJA is used as a benchmark-validation layer while production pricing comes from the documented spot and FX inputs.`:`The 24K value for ${city.name} appears after the source pipeline records a valid observation.`],
    [`Why can the calculated gold rate differ between ${city.name} and other cities?`,`Panchvani applies a small, documented city-premium factor based on general regional market patterns. Local demand, logistics, seller premiums, update timing, making charges, wastage and buy/sell spreads can move a shop quote away from the model value.`],
    ["What is the difference between 22K and 24K gold?","24K is a higher-purity gold reference. 22K contains a smaller proportion of gold and is widely used for jewellery because other metals improve durability. Panchvani derives each purity consistently from the same calculated 24K base."],
    ["How is the gold value calculated?","Multiply the calculated rate per gram for the selected purity by the gold weight. Making charges, wastage, design charges, seller premiums and dealer spreads are separate transaction components."],
  ] as const;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`Gold Rate Today in ${city.name} — 22K & 24K Price`,"url":`https://panchvani.com/gold-rate/${city.slug}`,"description":`Calculated gold-rate estimate for ${city.name}, ${city.state}, with 24K, 22K and 18K prices, trend history and city comparisons.`,"inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Gold Rate","item":"https://panchvani.com/gold-rate"},{"@type":"ListItem","position":3,"name":city.name,"item":`https://panchvani.com/gold-rate/${city.slug}`}]},
    {"@type":"FAQPage","mainEntity":faq.map(([question,answer])=>({"@type":"Question","name":question,"acceptedAnswer":{"@type":"Answer","text":answer}}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/gold-rate">Gold Rate</Link> / {city.name}</div>
    <p className="page-kicker">GOLD RATE · {city.state.toUpperCase()}</p>
    <h1 className="page-title">Gold Rate Today in {city.name}<br/>22K &amp; 24K Price</h1>
    {market&&dataset?<p className="page-subtitle">Today, the calculated 24K gold rate in {city.name} is {formatGoldRate(market.rates["24k"])} per gram and 22K is {formatGoldRate(market.rates["22k"])} per gram. The 18K value is {formatGoldRate(market.rates["18k"])} per gram. Last updated {formatGoldUpdatedAt(dataset.updatedAt)} IST.</p>:<p className="page-subtitle">Panchvani is waiting for a valid calculated source observation for {city.name}. The page stays without a market value until the pipeline records one.</p>}

    {dataset?.status?.mode==="last-known"?<div className={styles.notice}><strong>Data temporarily unavailable</strong><p>Showing the last known valid calculated rate from {formatGoldUpdatedAt(dataset.updatedAt)} IST.</p></div>:null}

    {!isGoldRateCityIndexable(city.slug,dataset)?<div className={styles.notice}><strong>Pre-index validation mode</strong><p>{market?`This ${city.name} page has calculated data and remains outside the index until the IBJA benchmark protocol passes and ${city.name} is explicitly demand-approved. Current validation: ${gate.validationDays} day(s), ${gate.validationObservations} logged observation(s), passed: ${gate.validationPassed?"yes":"no"}.`:"This city has no valid calculated observation yet, so the page stays outside the Gold Rate sitemap."}</p></div>:null}

    <div className={styles.heroGrid}><div className={styles.rateCard}><small>24K · 1 gram</small><strong>{market?formatGoldRate(market.rates["24k"]):"—"}</strong><span>{city.name} model</span></div><div className={styles.rateCard}><small>22K · 1 gram</small><strong>{market?formatGoldRate(market.rates["22k"]):"—"}</strong><span>{city.name} model</span></div><div className={styles.rateCard}><small>18K · 1 gram</small><strong>{market?formatGoldRate(market.rates["18k"]):"—"}</strong><span>{city.name} model</span></div></div>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold price in {city.name} by weight</h2><p className="page-subtitle">1g, 8g, 10g and 100g model values for 24K, 22K and 18K gold.</p><GoldRateTable rates={market?.rates??null} label={`Gold rate in ${city.name} by weight`}/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>7/30-day gold rate trend in {city.name}</h2><p className="page-subtitle">Daily trend points are derived from stored hourly pipeline observations and paired with a text summary so the movement remains understandable without relying on the chart alone.</p><GoldTrendChart history={market?.history??[]} label={city.name}/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Compare nearby gold rates</h2><p className="page-subtitle">Each city uses the same national spot/FX inputs plus its documented city-premium factor.</p><div className={styles.cityGrid}>{comparisons.map(other=>{const rate=dataset?.cities[other.slug];return <Link className={styles.cityCard} href={`/gold-rate/${other.slug}`} key={other.slug}><strong>{other.name}</strong><small>{other.state}</small><span>{rate?`${formatGoldRate(rate.rates["24k"])}/g · 24K model`:"Rate validation pending"}</span></Link>;})}</div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>Planning a gold purchase in {city.name}?</h2><p>Price and auspicious timing are separate questions. The <Link href={muhuratHref}>gold purchase Muhurat candidates for {city.name}</Link> show the Panchang-based timing screen for the same city.</p><div className={styles.inlineLinks}><Link href="/tools/gold-value-calculator">Calculate a gold value</Link><Link href="/gold-rate">Compare India gold rates</Link></div></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate FAQ for {city.name}</h2><div className={styles.faq}>{faq.map(([question,answer])=><div className={styles.faqItem} key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><small>DATA MODEL · {city.name.toUpperCase()}</small><h2>How Panchvani calculates this gold rate</h2><p><strong>Calculation:</strong> international gold spot + USD/INR + configured India import duty + GST + a small documented city-premium factor.</p><p><strong>Production sources:</strong> gold-api.com for spot and Frankfurter/ECB for exchange rate. <strong>Last updated:</strong> {dataset?formatGoldUpdatedAt(dataset.updatedAt):"Not available"} IST.</p><p><strong>Benchmark validation:</strong> IBJA pre-GST 24K benchmark checks are stored separately from the production feed so source provenance remains explicit.</p>{dataset?.calculation?<p className={styles.sourceBox}><strong>Current model inputs:</strong> import tariff {(dataset.calculation.importDutyRate*100).toFixed(1)}% · GST {(dataset.calculation.gstRate*100).toFixed(1)}% · city premium under 1%. <strong>Validation:</strong> {dataset.validation?`${dataset.validation.observations} logged benchmark checks · average difference ${dataset.validation.averageDifferencePct===null?"pending":dataset.validation.averageDifferencePct.toFixed(2)+"%"} · maximum ${dataset.validation.maxDifferencePct===null?"pending":dataset.validation.maxDifferencePct.toFixed(2)+"%"}.`:"pending"}</p>:null}{dataset?.status?.spotSource.includes("fallback")?<p className={styles.sourceBox}><strong>Spot fallback active:</strong> {dataset.status.spotSource}.</p>:null}</div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
