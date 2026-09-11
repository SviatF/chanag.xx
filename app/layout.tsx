import type { Metadata } from "next";
import GoogleTagManager from "@/components/GoogleTagManager";
import "./globals.css";
import "./internal-pages.css";
import "./public-responsive-fix.css";

const SITE_URL="https://panchvani.com";

export const metadata: Metadata = {
  metadataBase:new URL(SITE_URL),
  applicationName:"Panchvani",
  title:{default:"Panchvani — Hindu Panchang, Calendar & Muhurat Planning",template:"%s | Panchvani"},
  description:"Location-sensitive Hindu Panchang, Tithi, Nakshatra, Rahu Kalam, Choghadiya, festivals, calendars and general Muhurat planning for cities across India.",
  icons:{icon:[{url:"/favicon-panch.webp",type:"image/webp"}],shortcut:"/favicon-panch.webp"},
  openGraph:{
    type:"website",url:SITE_URL,siteName:"Panchvani",
    title:"Panchvani — Hindu Panchang, Calendar & Muhurat Planning",
    description:"Location-sensitive Hindu Panchang, daily lunar values, local timings, festivals and general Muhurat planning across India."
  },
};

const siteSchema={"@context":"https://schema.org","@graph":[
  {"@type":"Organization","@id":`${SITE_URL}/#organization`,name:"Panchvani",url:SITE_URL,logo:{"@type":"ImageObject",url:`${SITE_URL}/favicon-panch.webp`}},
  {"@type":"WebSite","@id":`${SITE_URL}/#website`,url:SITE_URL,name:"Panchvani",publisher:{"@id":`${SITE_URL}/#organization`},inLanguage:"en-IN"}
]};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en-IN"><body><GoogleTagManager/>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(siteSchema)}}/></body></html>;
}
