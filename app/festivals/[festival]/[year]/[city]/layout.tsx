import type {ReactNode} from "react";
import {findCityBySlug} from "@/lib/cities";
import {festivalBySlugYear} from "@/lib/festivals";
import {getLunarMonthConventions} from "@/lib/calendar-conventions";
import {buildFestivalCityQualityContent} from "@/lib/festival-content-engine";
import {getPanchang} from "@/lib/panchang";
import {getFestivalLocalReference} from "@/lib/religious-integrity";
import {parseRouteYear} from "@/lib/route-validation";

export default async function FestivalCityLayout({children,params}:{children:ReactNode;params:Promise<{festival:string;year:string;city:string}>}){
  const p=await params;
  const city=findCityBySlug(p.city);
  const year=parseRouteYear(p.year);
  const festival=year?festivalBySlugYear(p.festival,year):undefined;
  if(!city||!year||!festival)return children;

  const date=new Date(`${festival.date}T06:00:00Z`);
  const data=await getPanchang(date,city);
  const lunar=getLunarMonthConventions(date,city,data);
  const localReference=getFestivalLocalReference(festival,data);
  const content=buildFestivalCityQualityContent(festival,city,data,lunar,localReference);

  return <>
    {children}
    <section className="page-shell internal-visual internal-festival" aria-label={`${festival.name} ${year} in ${city.name} local analysis`}>
      <section className="wide-panel">
        <div className="seo-copy">
          <small>DIRECT LOCAL ANSWER · {city.state.toUpperCase()}</small>
          <h2>{festival.name} {year} in {city.name}</h2>
          <p>{content.directAnswer}</p>
        </div>
        <div className="data-grid">
          {content.directFacts.map(item=><div className="data-card" key={item.label}><small>{item.label}</small><strong>{item.value}</strong>{item.note?<small>{item.note}</small>:null}</div>)}
        </div>
      </section>

      <section className="wide-panel">
        <div className="seo-copy">
          <h2>{content.ritualTitle}</h2>
          <p>{content.ritualBody}</p>
        </div>
      </section>

      <section className="wide-panel">
        <div className="seo-copy">
          <h2>{content.cityTitle}</h2>
          <p>{content.cityBody}</p>
        </div>
      </section>

      {content.regionalBody?<section className="wide-panel"><div className="seo-copy"><h2>{content.regionalTitle}</h2><p>{content.regionalBody}</p></div></section>:null}

      <section className="wide-panel">
        <div className="seo-copy">
          <h2>How to compare this city with another location</h2>
          <p>{content.comparisonPrompt}</p>
        </div>
      </section>
    </section>
  </>;
}
