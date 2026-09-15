export const xml=(body:string)=>new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});

export type SitemapUrlEntry=string|{loc:string;lastmod?:string};
export type SitemapIndexEntry={loc:string;lastmod?:string};

const escapeXml=(value:string)=>value
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&apos;");

const validLastmod=(value:string|undefined)=>Boolean(value&&/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value));
const lastmodTag=(value:string|undefined)=>validLastmod(value)?`<lastmod>${escapeXml(value!)}</lastmod>`:"";

export const urlset=(urls:SitemapUrlEntry[])=>`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(entry=>{
  const item=typeof entry==="string"?{loc:entry}:entry;
  return `<url><loc>${escapeXml(item.loc)}</loc>${lastmodTag(item.lastmod)}</url>`;
}).join("")}</urlset>`;

export const sitemapindex=(maps:SitemapIndexEntry[])=>`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps.map(item=>`<sitemap><loc>${escapeXml(item.loc)}</loc>${lastmodTag(item.lastmod)}</sitemap>`).join("")}</sitemapindex>`;
