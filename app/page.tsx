import Link from "next/link";
import { Car, Gem, House, Leaf, Moon, Sparkles, Sun, Baby, BriefcaseBusiness, Heart, Clock3, MapPin } from "lucide-react";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import Header from "@/components/Header";
import DayWheel from "@/components/DayWheel";
import { cities, cityBySlug } from "@/lib/cities";
import { formatPanchangTime, formatWindow, getPanchang } from "@/lib/panchang";
import { festivalsForYear, nextFestival } from "@/lib/festivals";
import { todayInIndia } from "@/lib/dates";
import mainHero from "@/lib/main-hero.webp";
import geneshaYourDay from "@/lib/genesha-your_day.webp";

export const dynamic="force-dynamic";

const featuredSlugs=["delhi","kolkata","chennai","bengaluru","hyderabad"];

const cityVisuals:Record<string,string>={
  mumbai:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Gateway_of_India_in_the_evening%2C_Mumbai%2C_India.jpg?width=1400",
  delhi:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset_at_INDIA_GATE.jpg?width=1600",
  kolkata:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset_at_Victoria_Memorial_Kolkata.jpg?width=1200",
  chennai:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kapaleeswarar_temple.jpg?width=1000",
  bengaluru:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Vidhan_Soudha_during_sunset.jpg?width=1200",
  hyderabad:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Charminar_at_Sunset.JPG?width=1200"
};
const momentCards=[
  ["Wedding","Find auspicious timings",Heart,"wedding"],
  ["Griha Pravesh","A blessed new home",House,"griha-pravesh"],
  ["Vehicle Purchase","For a safe journey",Car,"vehicle-purchase"],
  ["Naming Ceremony","A bright beginning",Baby,"naming-ceremony"],
  ["Start a Business","For lasting success",BriefcaseBusiness,"business-opening"],
  ["Gold Purchase","Wealth and prosperity",Gem,"gold-purchase"],
] as const;

const getMonthData=unstable_cache(async(citySlug:string,year:number,month:number)=>{
  const city=cityBySlug(citySlug);
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  return Promise.all(Array.from({length:days},(_,index)=>
    getPanchang(new Date(Date.UTC(year,month-1,index+1,6)),city)
  ));
},["home-month-panchang"],{revalidate:21600});

export default async function Home({searchParams}:{searchParams:Promise<{city?:string}>}){
  const q=await searchParams;
  const store=await cookies();
  const city=cityBySlug(q.city??store.get("panchang_city")?.value??"mumbai");
  const now=todayInIndia();
  const data=await getPanchang(now,city);
  const nakshatraEnd=formatPanchangTime(data.nakshatraEnd,data.nakshatraEndDate,data.date);
  const festival=nextFestival(now);
  const year=now.getUTCFullYear();
  const month=now.getUTCMonth()+1;
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(now);
  const monthData=await getMonthData(city.slug,year,month);
  const firstWeekday=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const featured=featuredSlugs.map(cityBySlug);
  const monthFestivals=festivalsForYear(year).filter(f=>{
    const d=new Date(f.date+"T00:00:00Z");
    return d.getUTCFullYear()===year&&d.getUTCMonth()+1===month;
  });
  const festivalByDate=new Map(monthFestivals.map(f=>[f.date,f]));
  const bestChoghadiya=data.dayChoghadiya.find(p=>p.effect==="good");
  const bestTime=data.abhijit
    ? {name:"Abhijit Muhurat",time:formatWindow(data.abhijit)}
    : bestChoghadiya
      ? {name:`${bestChoghadiya.name} Choghadiya`,time:`${bestChoghadiya.start} — ${bestChoghadiya.end}`}
      : {name:"See full Panchang",time:"Multiple local windows"};

  const prev=new Date(Date.UTC(year,month-2,1));
  const next=new Date(Date.UTC(year,month,1));

  return <main>
    <Header city={city}/>
    <section className="hero shell concept-master-hero">
      <img className="concept-master-hero-image" src={mainHero.src} alt="" aria-hidden="true"/>
      <div className="concept-master-hero-overlay" aria-hidden="true"/>
      <div className="concept-corner concept-corner-tl" aria-hidden="true"/>
      <div className="concept-corner concept-corner-bl" aria-hidden="true"/>
      <div className="hero-copy concept-hero-copy">
        <p className="eyebrow">ROOTED IN TIME. CLOSER TO A BRIGHTER YOU.</p>
        <h1>Today in {city.name}</h1>
        <p className="hero-date">{data.weekday}, {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(now)}</p>
        <div className="lunar-summary">
          <span>{data.paksha} Paksha</span><i/> <span>{data.tithi}</span>
          <small>Nakshatra · {data.nakshatra} until {nakshatraEnd}</small>
        </div>
        <div className="sunline">
          <div><Sun size={22}/><span><small>Sunrise</small>{data.sunrise}</span></div>
          <div><Sun size={22}/><span><small>Sunset</small>{data.sunset}</span></div>
        </div>
        <div className="hero-status">
          <div className="status-card good"><Leaf/><span><small>Highlighted auspicious period</small><strong>{bestTime.name}</strong><b>{bestTime.time}</b></span></div>
          <div className="status-card danger"><Clock3/><span><small>Avoid</small><strong>Rahu Kalam</strong><b>{formatWindow(data.rahu)}</b></span></div>
        </div>
        <Link className="gold-button" href={`/panchang/${city.slug}/${data.date}`}>View full Panchang <span>→</span></Link>
        <div className="hero-quote"><i/> <span>“Good timing turns ordinary moments into blessings.”</span></div>
      </div>
      <div className="hero-wheel concept-hero-wheel">
        <DayWheel data={data} placement="hero"/>
      </div>
    </section>

    <section className="section shell your-day-section">
      <div className="section-head"><div><h2>Your Day</h2><p>At a glance, for a more intentional you.</p></div><Link href={`/panchang/${city.slug}/${data.date}`}>All details →</Link></div>
      <div className="your-day-layout">
        <div className="day-grid">
          <article className="info-card good"><Sun/><div><span>Highlighted time today</span><h3>{bestTime.name}</h3><strong>{bestTime.time}</strong><p>Calculated from today's local Panchang and daylight window.</p></div></article>
          <article className="info-card danger"><Clock3/><div><span>Avoid this time</span><h3>Rahu Kalam</h3><strong>{formatWindow(data.rahu)}</strong><p>Location-sensitive period calculated from local sunrise and sunset.</p></div></article>
          <article className="info-card festival"><Sparkles/><div><span>Upcoming festival</span><h3>{festival.name}</h3><strong>{festival.date}</strong><p>{festival.short}</p></div></article>
        </div>
        <div className="your-day-art" aria-hidden="true">
          <img className="your-day-photo-layer" src={geneshaYourDay.src} alt=""/>
          <div className="your-day-photo-shade"/>
          <span>TRADITION<br/>LIVES BRIGHTER<br/>TOGETHER</span>
        </div>
      </div>
    </section>

    <section className="section shell ritual-section">
      <div className="section-symbol" aria-hidden="true">ॐ</div>
      <div className="section-head"><div><h2>Plan an important moment</h2><p>Find the right Muhurat for life's special milestones.</p></div><Link href={`/muhurat/wedding/${year}/${String(month).padStart(2,"0")}`}>Explore all Muhurat →</Link></div>
      <div className="moment-grid">
        {momentCards.map(([title,sub,Icon,slug])=><Link key={title} className="moment-card" href={`/muhurat/${slug}/${year}/${String(month).padStart(2,"0")}`}><Icon/><h3>{title}</h3><p>{sub}</p></Link>)}
      </div>
    </section>

    <section className="section shell split-section">
      <div className="calendar-preview">
        <div className="section-head"><div><h2>{monthName} in {city.name}</h2><p>Real Tithis, lunar markers and festivals for your city.</p></div></div>
        <div className="calendar-box">
          <div className="calendar-title">
            <Link href={`/calendar/${city.slug}/${prev.getUTCFullYear()}/${String(prev.getUTCMonth()+1).padStart(2,"0")}`} aria-label="Previous month">‹</Link>
            <strong>{monthName} {year}</strong>
            <Link href={`/calendar/${city.slug}/${next.getUTCFullYear()}/${String(next.getUTCMonth()+1).padStart(2,"0")}`} aria-label="Next month">›</Link>
          </div>
          <div className="weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><b key={d}>{d}</b>)}</div>
          <div className="calendar-grid">
            {Array.from({length:firstWeekday},(_,i)=><span className="calendar-blank" key={"blank-"+i}/>)}
            {monthData.map(day=>{
              const isToday=day.date===data.date;
              const festivalDay=festivalByDate.get(day.date);
              const lunarKey=["Ekadashi","Purnima","Amavasya"].includes(day.tithi);
              const dayNum=Number(day.date.slice(-2));
              return <Link
                className={[isToday?"today":"",festivalDay?"festival-day":"",lunarKey?"lunar-key":""].filter(Boolean).join(" ")}
                href={`/panchang/${city.slug}/${day.date}`}
                key={day.date}
                title={festivalDay?`${festivalDay.name} · ${day.tithi}`:`${day.tithi} · ${day.nakshatra}`}
              >
                <strong>{dayNum}</strong>
                <small>{day.tithi}</small>
                <i className="calendar-marker" aria-hidden="true"/>
              </Link>;
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-lunar"/>Ekadashi / Purnima / Amavasya</span><span><i className="legend-festival"/>Festival</span></div>
          <Link className="inline-link" href={`/calendar/${city.slug}/${year}/${String(month).padStart(2,"0")}`}>View full calendar →</Link>
        </div>
      </div>
      <div className="explore-stack">
        <div>
          <div className="section-head"><div><h2>Explore your Panchang</h2><p>Location-specific Panchang for cities across India.</p></div><Link href="/cities">Browse all cities →</Link></div>
          <div className="city-row">{featured.map(c=><Link
            href={`/?city=${c.slug}`}
            key={c.slug}
            className={c.slug===city.slug?"active-city":""}
            style={{backgroundImage:`linear-gradient(180deg,rgba(8,10,9,.12),rgba(8,10,9,.88)),url("${cityVisuals[c.slug]??cityVisuals.mumbai}")`}}
          ><MapPin size={15}/><strong>{c.name}</strong><small>{c.state}</small></Link>)}</div>
        </div>
        <div>
          <div className="section-head"><div><h2>Tools</h2><p>Simple tools for deeper insights.</p></div><Link href="/tools">View all tools →</Link></div>
          <div className="tools-grid">
            <Link href="/tools/moon-sign-calculator"><Moon/><span><strong>Moon Sign</strong><small>Calculator</small></span></Link>
            <Link href="/tools/nakshatra-finder"><Sparkles/><span><strong>Nakshatra</strong><small>Finder</small></span></Link>
            <Link href="/tools/rahu-kalam-calculator"><Clock3/><span><strong>Rahu Kalam</strong><small>Calculator</small></span></Link>
            <Link href="/tools/hindu-baby-names/ashwini"><Leaf/><span><strong>Baby Names</strong><small>by Nakshatra</small></span></Link>
          </div>
        </div>
        <div>
          <div className="section-head"><div><h2>Regional Panchang</h2><p>In your language, closer to your roots.</p></div><Link href="/regional">View all languages →</Link></div>
          <div className="language-grid">
            {[["বাংলা","Bengali","bengali"],["தமிழ்","Tamil","tamil"],["മലയാളം","Malayalam","malayalam"],["ગુજરાતી","Gujarati","gujarati"],["मराठी","Marathi","marathi"]].map(([native,label,slug])=><Link href={`/regional/${slug}/${city.slug}`} key={slug}><strong>{native}</strong><small>{label}</small></Link>)}
          </div>
        </div>
      </div>
    </section>

    <footer className="footer shell"><div><strong>PANCHVANI</strong><p>Ancient wisdom for a brighter tomorrow.</p></div><div className="footer-links"><Link href="/about">About</Link><Link href="/methodology">Methodology</Link><Link href="/corrections">Corrections</Link><Link href="/photo-credits">Credits</Link><span className="footer-social">◉</span><span className="footer-social">◎</span><span className="footer-social">𝕏</span><span className="footer-divider">||</span><span>ॐ तत् सत्</span></div></footer>
  </main>;
}
