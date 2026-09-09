"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const GTM_ID="GTM-5XZ8HLVR";

export default function GoogleTagManager(){
  const pathname=usePathname();

  if(pathname==="/admin"||pathname.startsWith("/admin/")){
    return null;
  }

  return <>
    <Script id="gtm-loader" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{display:"none",visibility:"hidden"}}
        title="Google Tag Manager"
      />
    </noscript>
  </>;
}
