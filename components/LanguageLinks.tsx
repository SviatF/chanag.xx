import Link from "next/link";

const labels:Record<string,string>={
  "en-IN":"English",
  "bn-IN":"বাংলা",
  "ta-IN":"தமிழ்",
  "ml-IN":"മലയാളം",
  "gu-IN":"ગુજરાતી",
  "mr-IN":"मराठी",
};

export default function LanguageLinks({languages,title="Read this in another language"}:{languages:Record<string,string>;title?:string}){
  const entries=Object.entries(languages).filter(([hreflang])=>hreflang!=="x-default"&&labels[hreflang]);
  if(entries.length<2)return null;
  return <section className="wide-panel language-switcher" aria-label={title}>
    <small>{title}</small>
    <div className="pill-links">{entries.map(([hreflang,href])=><Link href={href} hrefLang={hreflang} key={`${hreflang}-${href}`}>{labels[hreflang]}</Link>)}</div>
  </section>;
}
