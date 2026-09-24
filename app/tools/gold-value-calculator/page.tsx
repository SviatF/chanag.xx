import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GoldValueCalculator from "@/components/GoldValueCalculator";
import {cities} from "@/lib/cities";
import {formatGoldUpdatedAt,getGoldRateDataset,goldRateHubCities,isGoldRateHubIndexable} from "@/lib/gold-rate";
import {robotsFor} from "@/lib/seo-policy";
import styles from "@/components/GoldRate.module.css";

export const revalidate=3600;

export async function generateMetadata():Promise<Metadata>{
  const dataset=await getGoldRateDataset();
  return {
    title:"Gold Value Calculator — 22K, 24K & 18K Gold Price",
    description:"Calculate gold value by weight and purity using Panchvani's 24K, 22K and 18K India model.",
    alternates:{canonical:"/tools/gold-value-calculator"},
    robots:robotsFor(isGoldRateHubIndexable(dataset)),
  };
}

export default async function GoldValueCalculatorPage(){
  const dataset=await getGoldRateDataset();
  const rates=dataset?.national.rates??null;
  const citiesList=goldRateHubCities(dataset).slice(0,8);
  const ld={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","name":"Gold Value Calculator — 22K, 24K & 18K Gold Price","url":"https://panchvani.com/tools/gold-value-calculator","description":"Gold value calculator using the same calculated model as Panchvani's gold-rate pages.","inLanguage":"en-IN"},
    {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://panchvani.com/"},{"@type":"ListItem","position":2,"name":"Tools","item":"https://panchvani.com/tools"},{"@type":"ListItem","position":3,"name":"Gold Value Calculator","item":"https://panchvani.com/tools/gold-value-calculator"}]}
  ]};
  return <main><Header city={cities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/tools">Tools</Link> / Gold Value Calculator</div>
    <p className="page-kicker">FREE GOLD TOOL · INDIA</p>
    <h1 className="page-title">Gold Value Calculator<br/>22K, 24K &amp; 18K</h1>
    <p className="page-subtitle">Enter a weight and purity to calculate value from Panchvani's India gold model. The model uses international gold spot, USD/INR and configured India duty/GST inputs.</p>

    {dataset?.status?.mode==="last-known"?<div className={styles.notice}><strong>Data temporarily unavailable</strong><p>Calculator is using the last known valid model value from {formatGoldUpdatedAt(dataset.updatedAt)} IST.</p></div>:null}
    {!rates?<div className={styles.notice}><strong>Valid rate observation required</strong><p>The calculator activates after the pipeline records a valid observation.</p></div>:null}

    <section className="wide-panel"><GoldValueCalculator rates={rates} label="India gold model"/></section>

    <section className="wide-panel"><div className="seo-copy"><h2>What this calculator includes</h2><p>The displayed per-gram model already includes the configured import-duty and GST inputs. The calculator multiplies that purity-specific value by the entered gold weight. Making charges, wastage, design charges, insurance, delivery and dealer spreads are separate transaction components.</p></div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Check city gold rates</h2><div className={styles.cityGrid}>{citiesList.map(city=><Link className={styles.cityCard} href={`/gold-rate/${city.slug}`} key={city.slug}><strong>{city.name}</strong><small>{city.state}</small><span>Today's 22K &amp; 24K model →</span></Link>)}</div><div className={styles.inlineLinks}><Link className={styles.goldLink} href="/gold-rate">India Gold Rate Today →</Link></div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
