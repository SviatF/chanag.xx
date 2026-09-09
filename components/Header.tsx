import Link from "next/link";
import { ChevronDown, Search, UserRound } from "lucide-react";
import { City, cities } from "@/lib/cities";
import { todayInIndia } from "@/lib/dates";
import { festivalsForYear } from "@/lib/festivals";
import { muhuratRules } from "@/lib/muhurat";
import { regional } from "@/lib/regional";
import CityCommand from "@/components/CityCommand";

type NavLinkItem={
  label:string;
  href:string;
  meta?:string;
};

type NavSection={
  title:string;
  items:NavLinkItem[];
};

function NavDropdown({
  label,
  href,
  sections,
  footer,
}:{
  label:string;
  href:string;
  sections:NavSection[];
  footer?:NavLinkItem;
}){
  return <div className="nav-item">
    <Link className="nav-trigger" href={href}>
      <span>{label}</span>
      <ChevronDown className="nav-chevron" size={12} aria-hidden="true"/>
    </Link>

    <div className="nav-dropdown" role="group" aria-label={`${label} navigation`}>
      <div className="nav-dropdown-panel">
        <div className="nav-dropdown-head">
          <span>{label}</span>
          <small>Explore</small>
        </div>

        <div className={sections.length>1?"nav-dropdown-grid":"nav-dropdown-grid single"}>
          {sections.map(section=><div className="nav-dropdown-section" key={section.title}>
            <small className="nav-dropdown-title">{section.title}</small>
            {section.items.map(item=><Link className="nav-dropdown-link" href={item.href} key={`${section.title}-${item.href}`}>
              <span>{item.label}</span>
              {item.meta?<small>{item.meta}</small>:null}
            </Link>)}
          </div>)}
        </div>

        {footer?<Link className="nav-dropdown-footer" href={footer.href}>
          <span>{footer.label}</span>
          {footer.meta?<small>{footer.meta}</small>:null}
          <b>→</b>
        </Link>:null}
      </div>
    </div>
  </div>;
}

export default function Header({city}:{city:City}) {
  const today=todayInIndia();
  const year=today.getUTCFullYear();
  const month=String(today.getUTCMonth()+1).padStart(2,"0");
  const todayIso=today.toISOString().slice(0,10);

  const featuredCities=["mumbai","delhi","bengaluru","chennai","kolkata"]
    .map(slug=>cities.find(c=>c.slug===slug))
    .filter((item):item is City=>Boolean(item));

  const yearFestivals=festivalsForYear(year);
  const upcomingFestivals=(
    yearFestivals.filter(f=>f.date>=todayIso).length
      ? yearFestivals.filter(f=>f.date>=todayIso)
      : yearFestivals
  ).slice(0,5);

  const muhuratItems=Object.entries(muhuratRules).map(([slug,rule])=>({
    label:rule.title.replace(" Muhurat",""),
    href:`/muhurat/${slug}/${year}/${month}/${city.slug}`,
    meta:"Local timings",
  }));

  const regionalItems=Object.entries(regional).map(([slug,item])=>({
    label:item.label,
    href:`/regional/${slug}/${city.slug}`,
    meta:item.native,
  }));

  return <header className="site-header">
    <Link className="brand" href="/">PANCHANG</Link>

    <nav className="nav" aria-label="Primary navigation">
      <NavDropdown
        label="Panchang"
        href={`/panchang/${city.slug}`}
        sections={[
          {
            title:`Today in ${city.name}`,
            items:[
              {label:"Today's Panchang",href:`/panchang/${city.slug}`,meta:"Tithi · Nakshatra · Muhurat"},
              {label:"Today's Choghadiya",href:`/tools/choghadiya/${city.slug}`,meta:"Day + night"},
            ],
          },
          {
            title:"Popular cities",
            items:featuredCities.map(item=>({
              label:item.name,
              href:`/panchang/${item.slug}`,
              meta:item.state,
            })),
          },
        ]}
        footer={{label:"Browse all cities",href:"/cities",meta:"India Panchang directory"}}
      />

      <NavDropdown
        label="Calendar"
        href={`/calendar/${city.slug}/${year}/${month}`}
        sections={[
          {
            title:"Local calendar",
            items:[
              {label:`${city.name} · this month`,href:`/calendar/${city.slug}/${year}/${month}`,meta:"Tithi + lunar markers"},
              {label:`${year} Festivals Calendar`,href:`/festivals-calendar/${year}`,meta:"Annual pillar"},
              {label:`${year+1} Festivals Calendar`,href:`/festivals-calendar/${year+1}`,meta:"Plan ahead"},
            ],
          },
          {
            title:"City calendars",
            items:featuredCities.slice(0,4).map(item=>({
              label:item.name,
              href:`/calendar/${item.slug}/${year}/${month}`,
              meta:item.state,
            })),
          },
        ]}
        footer={{label:"Open monthly calendar",href:`/calendar/${city.slug}/${year}/${month}`,meta:`Current city · ${city.name}`}}
      />

      <NavDropdown
        label="Festivals"
        href="/festivals"
        sections={[
          {
            title:"Festival hubs",
            items:[
              {label:"All Festivals",href:"/festivals",meta:"2026–2027 directory"},
              {label:`${year} Festival Calendar`,href:`/festivals-calendar/${year}`,meta:"Dates + dedicated pages"},
              {label:`${year+1} Festival Calendar`,href:`/festivals-calendar/${year+1}`,meta:"Future calendar"},
            ],
          },
          {
            title:"Upcoming",
            items:upcomingFestivals.map(festival=>({
              label:festival.name,
              href:`/festivals/${festival.slug}/${festival.year}/${city.slug}`,
              meta:festival.date,
            })),
          },
        ]}
        footer={{label:"Explore all festivals",href:"/festivals",meta:"Dates · rituals · local Panchang"}}
      />

      <NavDropdown
        label="Muhurat"
        href={`/muhurat/wedding/${year}/${month}/${city.slug}`}
        sections={[
          {
            title:"Plan an important moment",
            items:muhuratItems.slice(0,3),
          },
          {
            title:"More Muhurat",
            items:muhuratItems.slice(3),
          },
        ]}
        footer={{label:"Wedding Muhurat",href:`/muhurat/wedding/${year}/${month}/${city.slug}`,meta:`For ${city.name}`}}
      />

      <NavDropdown
        label="Tools"
        href="/tools"
        sections={[
          {
            title:"Panchang calculators",
            items:[
              {label:"Moon Sign Calculator",href:"/tools/moon-sign-calculator",meta:"Chandra Rashi"},
              {label:"Nakshatra Finder",href:"/tools/nakshatra-finder",meta:"Birth Nakshatra + Pada"},
              {label:"Rahu Kalam Calculator",href:"/tools/rahu-kalam-calculator",meta:"City + date"},
              {label:"Choghadiya by City",href:`/tools/choghadiya/${city.slug}`,meta:"8 day + 8 night periods"},
            ],
          },
          {
            title:"Naming",
            items:[
              {label:"Baby Names by Nakshatra",href:"/tools/hindu-baby-names/ashwini",meta:"27 Nakshatra guides"},
            ],
          },
        ]}
        footer={{label:"View all tools",href:"/tools",meta:"Panchang utilities"}}
      />

      <NavDropdown
        label="Regional"
        href="/regional"
        sections={[
          {
            title:"Regional Panchang",
            items:regionalItems,
          },
        ]}
        footer={{label:"Regional directory",href:"/regional",meta:"Bengali · Tamil · Malayalam · Gujarati · Marathi"}}
      />
    </nav>

    <div className="header-actions">
      <Link className="header-search" href="/cities" aria-label="Search cities"><Search size={18}/></Link>
      <CityCommand city={city} cities={cities}/>
      <span className="account-dot" aria-hidden="true"><UserRound size={15}/></span>
    </div>
  </header>;
}
