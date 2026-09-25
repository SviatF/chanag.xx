import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import {cityBySlug} from "@/lib/cities";
import {festivalsForYear,type Festival} from "@/lib/festivals";
import {festivalDateIsValidated,validateFestivalYear} from "@/lib/festival-expansion";
import {isVratIndexable,isYearlyCalendarIndexable,isYearlyMuhuratIndexable,primaryMuhuratEvents,primaryVratTypes,robotsFor,yearlyIndexYears} from "@/lib/seo-policy";
import {sitemapPriorityCities} from "@/lib/seo-sitemap";
import {hinduCalendarYearSsgPriority} from "@/lib/static-seo-routes";
import {parseRouteYear} from "@/lib/route-validation";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "@/lib/yearly-expansion";

export const dynamicParams=true;
export const revalidate=86400;

export function generateStaticParams(){return hinduCalendarYearSsgPriority;}

type YearFact={label:string;value:string;note?:string};
type FestivalSummary=Pick<Festival,"name"|"date">;

function monthName(month:number){return new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,month-1,1,6)));}
function isLeapYear(year:number){return year%4===0&&(year%100!==0||year%400===0);}
function festivalDistribution(festivals:readonly FestivalSummary[]){
  const counts=new Map<number,number>();
  for(const item of festivals){const month=Number(item.date.slice(5,7));if(month>=1&&month<=12)counts.set(month,(counts.get(month)??0)+1);}
  const active=[...counts.entries()].sort((a,b)=>a[0]-b[0]);
  const max=Math.max(0,...active.map(([,count])=>count));
  const peak=active.filter(([,count])=>count===max).map(([month])=>monthName(month));
  const bands={opening:0,middle:0,closing:0};
  for(const [month,count] of active){if(month<=4)bands.opening+=count;else if(month<=8)bands.middle+=count;else bands.closing+=count;}
  const dominant=Object.entries(bands).sort((a,b)=>b[1]-a[1])[0] as [keyof typeof bands,number]|undefined;
  return {activeMonths:active.length,peak,max,dominant:dominant?.[0]??"none",dominantCount:dominant?.[1]??0};
}

function buildYearContext(year:number,activeYears:readonly number[],festivals:readonly FestivalSummary[],coverage:{present:number;expected:number},cityCount:number,vratCount:number,muhuratCount:number){
  const index=activeYears.indexOf(year);
  const leap=isLeapYear(year);
  const festival=festivalDistribution(festivals);
  const role=index===0?"archive":index===1?"current":index===2?"next":"forward";
  const roleCopy={
    archive:{
      eyebrow:"YEARLY HINDU CALENDAR · ARCHIVE REFERENCE",
      title:"Completed-year calendar reference",
      direct:`This completed-year hub organizes twelve monthly Panchang entry points, the maintained festival record, sunrise-based Vrat series and annual Muhurat hubs as a retrospective calendar reference.`,
      body:`The year sits at the historical edge of the active calendar window. Its strongest use is retrospective comparison: month sequence, festival distribution, annual observance links and city-by-city yearly pages can be read as a closed calendar cycle rather than a future planning horizon.`,
      month:`Read the twelve months as a completed sequence. Each month opens the Mumbai baseline first, while city-year pages provide the local solar and lunar context for comparison.`,
      planningTitle:"Retrospective observance and Muhurat map",
      planning:`The Vrat and Muhurat links below preserve the year's full planning structure for comparison with later calendar cycles. This makes the archive useful for checking how annual candidate density and lunar observance patterns differed from the current year.`,
    },
    current:{
      eyebrow:"YEARLY HINDU CALENDAR · ACTIVE YEAR",
      title:"Current operating calendar",
      direct:`This is the active Hindu-calendar year: twelve monthly Panchang hubs connect the present calendar cycle with maintained festivals, Vrat series, city calendars and Muhurat planning.`,
      body:`The current-year page is organized around active use. Monthly entry points lead into date-level Panchang, city-year pages expose local seasonal movement, and observance hubs connect the same year to Ekadashi, Purnima, Amavasya and the primary Muhurat families.`,
      month:`Use the month grid as the main navigation layer for the active calendar cycle, then move to a city or exact date when local sunrise-sensitive values matter.`,
      planningTitle:"Active-year observance and planning layer",
      planning:`Vrat series and Muhurat hubs below belong to the same live calendar cycle, so the yearly page works as the bridge between recurring lunar observances and event-planning months.`,
    },
    next:{
      eyebrow:"YEARLY HINDU CALENDAR · NEXT-YEAR PLANNING",
      title:"Near-future planning calendar",
      direct:`This near-future Hindu-calendar hub is structured for advance planning across twelve months, with maintained festivals, Vrat series, city calendars and yearly Muhurat entry points grouped into one forward calendar cycle.`,
      body:`Because this year is the first forward planning horizon, the page emphasizes sequence and preparation: scan the annual month grid, identify festival-heavy periods, then open city calendars or Muhurat hubs for location-sensitive timing before the relevant month arrives.`,
      month:`The twelve-month grid is an advance-planning map. It is designed to move from annual overview to month, city and exact-date pages as the year approaches.`,
      planningTitle:"Advance observance and Muhurat planning",
      planning:`The annual links below make it possible to identify Vrat cadence and Muhurat-rich months before moving into city-specific timing windows.`,
    },
    forward:{
      eyebrow:"YEARLY HINDU CALENDAR · FORWARD HORIZON",
      title:"Longer-range calendar horizon",
      direct:`This forward-horizon Hindu-calendar page extends the annual architecture beyond the immediate next year, linking twelve monthly hubs with maintained festival records, Vrat series, city calendars and annual Muhurat planning.`,
      body:`This is the outer edge of the rolling calendar horizon. Its value is structural planning across a longer lead time: compare the shape of the year, identify where maintained festivals cluster, and use the linked city or Muhurat pages when the planning window becomes more immediate.`,
      month:`Treat the twelve-month grid as a long-range map first. More granular city, observance and timing pages provide the detail when a specific month becomes relevant.`,
      planningTitle:"Long-range observance and planning map",
      planning:`The Vrat and Muhurat hubs below expose the annual structure at longer range, separating broad calendar planning from the city-specific timing decisions that come later.`,
    }
  }[role];
  const festivalBand=festival.dominant==="opening"?"opening four months":festival.dominant==="middle"?"middle four months":festival.dominant==="closing"?"closing four months":"no dominant annual band";
  const festivalTitle=festival.activeMonths===0?"Festival footprint · no active months":festival.activeMonths<=3?"Festival footprint · concentrated":festival.activeMonths<=7?"Festival footprint · banded":"Festival footprint · broad";
  const festivalBody=festivals.length
    ? `${festivals.length} maintained festival records occupy ${festival.activeMonths} Gregorian months. The strongest concentration sits in the ${festivalBand}${festival.peak.length?`; ${festival.peak.join(" / ")} ${festival.peak.length===1?"has":"share"} the highest monthly count`:""}. This distribution gives the year its own festival rhythm rather than repeating a generic annual list.`
    : `The maintained festival collection for this year is currently empty, so the annual page is defined by its month, city, Vrat and Muhurat structure.`;
  const calendarType=leap?"leap-year Gregorian frame":"common-year Gregorian frame";
  const facts:YearFact[]=[
    {label:"Calendar role",value:role,note:roleCopy.title},
    {label:"Gregorian frame",value:leap?"leap year":"common year",note:leap?"February has an extra civil day":"Standard civil-year length"},
    {label:"Maintained festival records",value:String(coverage.present),note:`${coverage.expected} catalog positions`},
    {label:"Festival footprint",value:`${festival.activeMonths} months`,note:festivalBand},
    {label:"City yearly calendars",value:String(cityCount),note:"Active city layer"},
    {label:"Vrat / Muhurat hubs",value:`${vratCount} / ${muhuratCount}`,note:"Annual observance and planning families"},
  ];
  return {
    eyebrow:roleCopy.eyebrow,
    title:roleCopy.title,
    directAnswer:roleCopy.direct,
    body:`${roleCopy.body} The civil scaffold is a ${calendarType}.`,
    monthBody:roleCopy.month,
    planningTitle:roleCopy.planningTitle,
    planningBody:roleCopy.planning,
    festivalTitle,
    festivalBody,
    facts,
  };
}

export async function generateMetadata({params}:{params:Promise<{year:string}>}):Promise<Metadata>{
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  return {title:`Hindu Calendar ${year} — Festivals, Vrat & Panchang`,description:`Hindu Calendar ${year} with monthly Panchang entry points, maintained festival dates, Ekadashi, Purnima, Amavasya and yearly Muhurat planning hubs.`,alternates:{canonical:hinduCalendarYearPath(year)},robots:robotsFor(isYearlyCalendarIndexable(year))};
}

export default async function HinduCalendarYear({params}:{params:Promise<{year:string}>}){
  const p=await params;const year=parseRouteYear(p.year);if(!year)notFound();
  const city=cityBySlug("mumbai");
  const activeYears=yearlyIndexYears();
  const indexable=isYearlyCalendarIndexable(year);
  const festivals=festivalsForYear(year).filter(item=>festivalDateIsValidated(item.slug,year));
  const coverage=validateFestivalYear(year);
  const vratLinks=primaryVratTypes.filter(vrat=>isVratIndexable(vrat,year)).map(vrat=>({href:`/vrat/${vrat}/${year}`,label:vrat.replaceAll("-"," ")}));
  const muhuratLinks=primaryMuhuratEvents.filter(event=>isYearlyMuhuratIndexable(event,year)).map(event=>({href:muhuratYearPath(event,year),label:event.replaceAll("-"," ")}));
  const yearContext=buildYearContext(year,activeYears,festivals,{present:coverage.present,expected:coverage.expected},sitemapPriorityCities.length,vratLinks.length,muhuratLinks.length);
  const ld={"@context":"https://schema.org","@type":"CollectionPage","name":`Hindu Calendar ${year}`,"url":`https://panchvani.com${hinduCalendarYearPath(year)}`,"description":yearContext.directAnswer};

  return <main><Header city={city}/><div className="page-shell internal-visual internal-calendar">
    <div className="breadcrumbs"><Link href="/">Home</Link> / Hindu Calendar / {year}</div>
    <p className="page-kicker">{yearContext.eyebrow}</p>
    <h1 className="page-title">Hindu Calendar<br/>{year}</h1>
    <p className="page-subtitle">{yearContext.directAnswer}</p>

    <section className="wide-panel"><div className="seo-copy"><small>YEAR CONTEXT</small><h2>{yearContext.title}</h2><p>{yearContext.body}</p></div><div className="data-grid">{yearContext.facts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}</div></section>

    <section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>12-month calendar</h2><p className="page-subtitle">{yearContext.monthBody}</p><div className="city-directory">{yearlyMonths.map(item=><Link href={`/calendar/${city.slug}/${year}/${item.slug}`} key={item.slug}><small>{year}</small><strong>{item.name}</strong><span>Monthly Panchang · Mumbai baseline</span></Link>)}</div></section>

    {indexable?<section className="wide-panel"><h2 className="page-title" style={{fontSize:32}}>Hindu Calendar {year} by city</h2><p className="page-subtitle">Open a city year to compare twelve local month-start Panchang states, seasonal sunrise movement and linked observance pages.</p><div className="city-directory">{sitemapPriorityCities.map(item=><Link href={cityCalendarYearPath(item,year)} key={item.slug}><small>{item.state}</small><strong>{item.name}</strong><span>12 local monthly entry points</span></Link>)}</div></section>:null}

    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.planningTitle}</h2><p>{yearContext.planningBody}</p></div><div className="pill-links">{vratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} {year}</Link>)}{muhuratLinks.map(item=><Link href={item.href} key={item.href}>{item.label} Muhurat {year}</Link>)}</div></section>

    <section className="wide-panel"><div className="seo-copy"><h2>{yearContext.festivalTitle}</h2><p>{yearContext.festivalBody}</p></div>{festivals.length?<div className="city-directory">{festivals.map(item=><Link href={`/festivals/${item.slug}/${year}`} key={item.slug}><small>{item.date}</small><strong>{item.name}</strong><span>{item.short}</span></Link>)}</div>:null}</section>

    <div className="pill-links">{activeYears.includes(year-1)?<Link href={hinduCalendarYearPath(year-1)}>← {year-1}</Link>:null}{activeYears.includes(year+1)?<Link href={hinduCalendarYearPath(year+1)}>{year+1} →</Link>:null}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </div></main>;
}
