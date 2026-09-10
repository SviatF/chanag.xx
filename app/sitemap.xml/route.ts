import {xml} from "@/lib/xml";

export async function GET(){
  const base="https://panchvani.com";
  const maps=[
    "sitemap-core.xml",
    "sitemap-panchang-daily.xml",
    "sitemap-panchang-monthly.xml",
    "sitemap-festivals.xml",
    "sitemap-vrat.xml",
    "sitemap-muhurat.xml",
    "sitemap-regional.xml",
    "sitemap-tools.xml"
  ];
  return xml(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps.map(m=>`<sitemap><loc>${base}/${m}</loc></sitemap>`).join("")}</sitemapindex>`);
}