import Link from "next/link";
import { Car, Gem, House, Leaf, Moon, Sparkles, Sun, Baby, BriefcaseBusiness, Heart, Clock3, MapPin } from "lucide-react";
import Header from "@/components/Header";
import DayWheel from "@/components/DayWheel";
import { cities } from "@/lib/cities";
import { formatWindow, getPanchang } from "@/lib/panchang";
import { nextFestival } from "@/lib/festivals";
import { todayInIndia } from "@/lib/dates";

export const dynamic="force-dynamic";

const featured=cities.slice(1,6);
const momentCards=[
  ["Wedding","Find auspicious timings",Heart,"wedding"],
  ["Griha Pravesh","A blessed new home",House,"griha-pravesh"],
  ["Vehicle Purchase","For a safe journey",Car,"vehicle-purchase"],
  ["Naming Ceremony","A bright beginning",Baby,"naming-ceremony"],
  ["Start a Business","For lasting success",BriefcaseBusiness,"business-opening"],
  ["Gold Purchase","Wealth and prosperity",Gem,"gold-purchase"],
] as const;

export default async function Home(){
  const city=cities[0];
  const now=todayInIndia();
  const data=await getPanchang(now,city);
  const festival=nextFestival(now);
  const monthName=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(now);
  const daysInMonth=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).getUTCDate();

  return <main>
    <Header city={city}/>
    <section className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow">ROOTED IN TIME. CLOSER TO A BRIGHTER YOU.</p>
        <h1>Today in {city.name}</h1>
        <p className="hero-date">{data.weekday}, {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(now)}</p>
        <div className="lunar-summary">
          <span>{data.paksha} Paksha</span><i/> <span>{data.tithi}</span>
          <small>Nakshatra · {data.nakshatra}</small>
        </div>
        <div className="sunline">
          <div><Sun size={22}/><span><small>Sunrise</small>{data.sunrise}</span></div>
          <div><Sun size={22}/><span><small>Sunset</small>{data.sunset}</span></div>
        </div>
        <div className="hero-status">
          <div className="status-card good"><Leaf/><span><small>Auspicious</small><strong>Abhijit Muhurat</strong><b>{formatWindow(data.abhijit)}</b></span></div>
          <div className="status-card danger"><Clock3/><span><small>Avoid</small><strong>Rahu Kalam</strong><b>{formatWindow(data.rahu)}</b></span></div>
        </div>
        <Link className="gold-button" href={`/panchang/${city.slug}/${data.date}`}>View full Panchang <span>→</span></Link>
      </div>
      <div className="hero-wheel">
        <DayWheel data={data}/>
        <div className="ambient-copy">SAME SKIES.<br/>DEEPER MEANING.</div>
      </div>
    </section>

    <section className="section shell">
      <div className="section-head"><div><h2>Your Day</h2><p>At a glance, for a more intentional you.</p></div><Link href={`/panchang/${city.slug}/${data.date}`}>All details →</Link></div>
      <div className="day-grid">
        <article className="info-card good"><Sun/><div><span>Best time today</span><h3>Abhijit Muhurat</h3><strong>{formatWindow(data.abhijit)}</strong><p>Excellent for important work, new beginnings and decisions.</p></div></article>
        <article className="info-card danger"><Clock3/><div><span>Avoid this time</span><h3>Rahu Kalam</h3><strong>{formatWindow(data.rahu)}</strong><p>Not ideal for new ventures, financial transactions or travel.</p></div></article>
        <article className="info-card festival"><Sparkles/><div><span>Upcoming festival</span><h3>{festival.name}</h3><strong>{festival.date}</strong><p>{festival.short}</p></div></article>
      </div>
    </section>

    <section className="section shell">
      <div className="section-head"><div><h2>Plan an important moment</h2><p>Find the right Muhurat for life's special milestones.</p></div><Link href="/muhurat/wedding/2026/09">Explore all Muhurat →</Link></div>
      <div className="moment-grid">
        {momentCards.map(([title,sub,Icon,slug])=><Link key={title} className="moment-card" href={`/muhurat/${slug}/2026/09`}><Icon/><h3>{title}</h3><p>{sub}</p></Link>)}
      </div>
    </section>

    <section className="section shell split-section">
      <div className="calendar-preview">
        <div className="section-head"><div><h2>{monthName} in {city.name}</h2><p>Festivals, Tithis and important days at a glance.</p></div></div>
        <div className="calendar-box">
          <div className="calendar-title"><span>‹</span><strong>{monthName} {now.getUTCFullYear()}</strong><span>›</span></div>
          <div className="weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><b key={d}>{d}</b>)}</div>
          <div className="calendar-grid">{Array.from({length:daysInMonth},(_,i)=>i+1).map(day=><Link className={day===now.getUTCDate()?"today":""} href={`/panchang/${city.slug}/${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`} key={day}><strong>{day}</strong><small>{["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami"][day%8]}</small></Link>)}</div>
          <Link className="inline-link" href={`/calendar/${city.slug}/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}`}>View full calendar →</Link>
        </div>
      </div>
      <div className="explore-stack">
        <div>
          <div className="section-head"><div><h2>Explore your Panchang</h2><p>Accurate Panchang for cities across India.</p></div><Link href="/cities">Browse all cities →</Link></div>
          <div className="city-row">{featured.map(c=><Link href={`/panchang/${c.slug}`} key={c.slug}><MapPin size={16}/><strong>{c.name}</strong><small>{c.state}</small></Link>)}</div>
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
            {[["বাংলা","Bengali","bengali"],["தமிழ்","Tamil","tamil"],["മലയാളം","Malayalam","malayalam"],["ગુજરાતી","Gujarati","gujarati"],["मराठी","Marathi","marathi"]].map(([native,label,slug])=><Link href={`/regional/${slug}/mumbai`} key={slug}><strong>{native}</strong><small>{label}</small></Link>)}
          </div>
        </div>
      </div>
    </section>

    <footer className="footer shell"><div><strong>PANCHANG</strong><p>Ancient wisdom, precisely timed.</p></div><div><Link href="/about">About</Link><Link href="/blog">Blog</Link><Link href="/tools">Tools</Link><span>ॐ तत् सत्</span></div></footer>
  </main>
}
