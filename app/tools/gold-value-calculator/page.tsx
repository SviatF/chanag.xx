import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GoldValueCalculator from "@/components/GoldValueCalculator";
import {cities} from "@/lib/cities";
import {getGoldRateDataset,goldRateHubCities,isGoldRateHubIndexable} from "@/lib/gold-rate";
import {robotsFor} from "@/lib/seo-policy";
import styles from "@/components/GoldRate.module.css";

export const revalidate=3600;

export async function generateMetadata():Promise<Metadata>{
  const dataset=await getGoldRateDataset();
  return {
    title:"Gold Value Calculator — 22K, 24K & 18K Gold Price",
    description:"Calculate the reference value of gold by weight and purity using Panchvani's validated 24K, 22K and 18K India rate feed. No sales CTA or affiliate links.",
    alternates:{canonical:"/tools/gold-value-calculator"},
    robots:robotsFor(isGoldRateHubIndexable(dataset)),
  };
}

export default async function GoldValueCalculatorPage(){
  const dataset=await getGoldRateDataset();
  const rates=dataset?.national.rates??null;
  const citiesList=goldRateHubCities(dataset).slice(0,8);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":"Gold Value Calculator — 22K, 24K & 18K Gold Price","url":"https://panchvani.com/tools/gold-value-calculator","description":"Reference gold value calculator using the same validated source feed as Panchvani's gold-rate pages.","inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Tools","item":"https://panchvani.com/tools"},{"@type":"ListItem","position":3,"name":"Gold Value Calculator","item":"https://panchvani.com/tools/gold-value-calculator"}]}
  ]};
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Gold Value Calculator</div>
    <p className="page-kicker">FREE GOLD TOOL · INDIA</p>
    <h1 className="page-title">Gold Value Calculator<br/>22K, 24K &amp; 18K</h1>
    <p className="page-subtitle">Enter a weight and purity to estimate the raw reference value using the same source feed as Panchvani's gold-rate cluster. This is not a jeweller quote, buy/sell offer or investment recommendation.</p>

    {!rates?<div className={styles.notice}><strong>Validated rate feed required</strong><p>The calculator is intentionally disabled until Panchvani has a live source observation. We do not use placeholder prices for financial utility pages.</p></div>:null}

    <section className="wide-panel"><GoldValueCalculator rates={rates} label="India reference"/></section>

    <section className="wide-panel"><div className="seo-copy"><h2>What this calculator includes</h2><p>The calculation is simple: selected purity rate per gram × entered gold weight. It does not add GST, making charges, wastage, design charges, insurance, delivery, local premiums or a dealer's buy/sell spread. Those can materially change a real transaction.</p></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Check city gold rates</h2><div className={styles.cityGrid}>{citiesList.map(city=><Link className={styles.cityCard} href={`/gold-rate/${city.slug}`} key={city.slug}><strong>{city.name}</strong><small>{city.state}</small><span>Today's 22K &amp; 24K rate →</span></Link>)}</div><div className={styles.inlineLinks}><Link className={styles.goldLink} href="/gold-rate">India Gold Rate Today →</Link></div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
