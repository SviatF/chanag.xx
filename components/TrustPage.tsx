import Link from "next/link";
import Header from "@/components/Header";
import {coreCities} from "@/lib/cities";

type TrustSection={
  title:string;
  paragraphs:string[];
  items?:string[];
};

export default function TrustPage({kicker,title,subtitle,sections}:{kicker:string;title:string;subtitle:string;sections:TrustSection[]}){
  return <main><Header city={coreCities[0]}/><div className="page-shell internal-visual internal-tools">
    <div className="breadcrumbs"><Link href="/">Home</Link> / {title}</div>
    <p className="page-kicker">{kicker}</p>
    <h1 className="page-title">{title}</h1>
    <p className="page-subtitle">{subtitle}</p>

    {sections.map(section=><section className="wide-panel" key={section.title}>
      <div className="seo-copy">
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
        {section.items?.length?<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>:null}
      </div>
    </section>)}

    <div className="pill-links">
      <Link href="/about">About</Link>
      <Link href="/methodology">Methodology</Link>
      <Link href="/accuracy">Accuracy</Link>
      <Link href="/data-sources">Data sources</Link>
      <Link href="/editorial-policy">Editorial policy</Link>
      <Link href="/corrections">Corrections</Link>
      <Link href="/disclaimer">Disclaimer</Link>
      <Link href="/photo-credits">Photo credits</Link>
    </div>
  </div></main>;
}
