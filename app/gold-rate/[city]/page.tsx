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
  const frequency=dataset?.updateFrequency??"source schedule";
  return {
    title:`Gold Rate Today in ${city.name} — 22K & 24K Price`,
    description:`Check today's gold rate in ${city.name} for 22K and 24K gold, updated on the ${frequency}. See per-gram price, 7/30-day trend, nearby city comparison and source methodology.`,
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
    [`What is the 22K gold rate today in ${city.name}?`,market?`The current Panchvani source feed lists 22K gold in ${city.name} at ${formatGoldRate(market.rates["22k"])} per gram. The timestamp and source are shown on this page because individual jeweller quotes can update at a different time.`:`Panchvani is not displaying a 22K rate for ${city.name} until the source feed completes validation. We do not substitute an estimated city price.`],
    [`What is the 24K gold rate today in ${city.name}?`,market?`The current Panchvani source feed lists 24K gold in ${city.name} at ${formatGoldRate(market.rates["24k"])} per gram. This is a market reference, not a final jewellery invoice or guaranteed buy/sell quote.`:`The 24K reference for ${city.name} is withheld until a validated source observation is available.`],
    [`Why can gold prices differ between ${city.name} and other cities?`,`Differences can come from local supply, logistics, dealer premiums, demand and update timing. GST rules are national, but a jeweller's making charges, wastage, premiums and buy/sell spread can differ from another seller or city.`],
    ["What is the difference between 22K and 24K gold?","24K is a higher-purity gold reference. 22K contains a smaller proportion of gold and is widely used for jewellery because other metals improve durability. Panchvani keeps separate source values for each purity instead of treating one as a sales quote for the other."],
    ["How is the gold value calculated?","Multiply the source rate per gram for the selected purity by the gold weight. That gives a raw reference value only. GST, making charges, wastage, design charges, premiums and dealer spreads may change the final amount paid or received."],
  ] as const;
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":`Gold Rate Today in ${city.name} — 22K & 24K Price`,"url":`https://panchvani.com/gold-rate/${city.slug}`,"description":`Current gold-rate reference for ${city.name}, ${city.state}, with 24K, 22K and 18K prices, trend history and city comparisons.`,"inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Gold Rate","item":"https://panchvani.com/gold-rate"},{"@type":"ListItem","position":3,"name":city.name,"item":`https://panchvani.com/gold-rate/${city.slug}`}]},
    {"@type":"FAQPage","mainEntity":faq.map(([question,answer])=>({"@type":"Question","name":question,"acceptedAnswer":{"@type":"Answer","text":answer}}))}
  ]};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/gold-rate">Gold Rate</Link> / {city.name}</div>
    <p className="page-kicker">GOLD RATE · {city.state.toUpperCase()}</p>
    <h1 className="page-title">Gold Rate Today in {city.name}<br/>22K &amp; 24K Price</h1>
    {market&&dataset?<p className="page-subtitle">Today, 24K gold rate in {city.name} is {formatGoldRate(market.rates["24k"])} per gram and 22K is {formatGoldRate(market.rates["22k"])} per gram. The 18K reference is {formatGoldRate(market.rates["18k"])} per gram. Rates were last received {formatGoldUpdatedAt(dataset.updatedAt)}. Local jeweller quotes may differ because of premiums, making charges and timing.</p>:<p className="page-subtitle">Panchvani is validating the source feed for {city.name}. We intentionally show no estimated market price until a complete city observation is available.</p>}

    {!isGoldRateCityIndexable(city.slug,dataset)?<div className={styles.notice}><strong>Pre-index validation mode</strong><p>{market?`This ${city.name} page has source data, but it remains noindex until the cluster completes the ${gate.minValidationDays}-day validation gate and the city is explicitly demand-approved.`:"This city has no validated source observation yet, so the page is excluded from indexing and the gold-rate sitemap."}</p></div>:null}

    <div className={styles.heroGrid}><div className={styles.rateCard}><small>24K · 1 gram</small><strong>{market?formatGoldRate(market.rates["24k"]):"—"}</strong><span>{city.name}</span></div><div className={styles.rateCard}><small>22K · 1 gram</small><strong>{market?formatGoldRate(market.rates["22k"]):"—"}</strong><span>{city.name}</span></div><div className={styles.rateCard}><small>18K · 1 gram</small><strong>{market?formatGoldRate(market.rates["18k"]):"—"}</strong><span>{city.name}</span></div></div>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold price in {city.name} by weight</h2><p className="page-subtitle">1g, 8g, 10g and 100g reference values for 24K, 22K and 18K gold.</p><GoldRateTable rates={market?.rates??null} label={`Gold rate in ${city.name} by weight`}/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>7/30-day gold rate trend in {city.name}</h2><p className="page-subtitle">The chart is paired with a text summary so the rate movement remains understandable without relying on a visual alone.</p><GoldTrendChart history={market?.history??[]} label={city.name}/></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Compare nearby gold rates</h2><p className="page-subtitle">Use nearby and major-city pages for context rather than treating one city quote as a national price.</p><div className={styles.cityGrid}>{comparisons.map(other=>{const rate=dataset?.cities[other.slug];return <Link className={styles.cityCard} href={`/gold-rate/${other.slug}`} key={other.slug}><strong>{other.name}</strong><small>{other.state}</small><span>{rate?`${formatGoldRate(rate.rates["24k"])}/g · 24K`:"Rate validation pending"}</span></Link>;})}</div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>Planning a gold purchase in {city.name}?</h2><p>Price and auspicious timing are separate questions. If you also want Panchvani's Panchang-based planning screen, check the <Link href={muhuratHref}>gold purchase Muhurat candidates for {city.name}</Link>. It is a contextual timing reference, not a recommendation to buy gold.</p><div className={styles.inlineLinks}><Link href="/tools/gold-value-calculator">Calculate a gold value</Link><Link href="/gold-rate">Compare India gold rates</Link></div></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Gold rate FAQ for {city.name}</h2><div className={styles.faq}>{faq.map(([question,answer])=><div className={styles.faqItem} key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><small>DATA METHODOLOGY · {city.name.toUpperCase()}</small><h2>Source, freshness and limitations</h2><p>Panchvani publishes city rates only when the configured feed contains explicit 24K, 22K and 18K observations. We do not manufacture a city premium from a national spot price. Trend history is built from the same source so comparisons remain internally consistent.</p><p className={styles.sourceBox}><strong>Source:</strong> {dataset?.source.url?<a href={dataset.source.url} rel="noreferrer">{dataset.source.name}</a>:dataset?.source.name??"Not connected"} · <strong>Update schedule:</strong> {dataset?.updateFrequency??"Not available"}{dataset?` · Last received: ${formatGoldUpdatedAt(dataset.updatedAt)}`:""}.</p></div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
