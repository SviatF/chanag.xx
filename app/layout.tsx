import type { Metadata } from "next";
import "./globals.css";
import "./internal-pages.css";

const GTM_ID="GTM-5XZ8HLVR";

export const metadata: Metadata = {
  metadataBase:new URL("https://panchang.in"),
  title:{default:"Panchang — Precise Hindu Calendar & Muhurat",template:"%s | Panchang"},
  description:"Hyperlocal Hindu Panchang, auspicious timings, Rahu Kalam, festivals and Muhurat for cities across India.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en">
    <head>
      {/* Google Tag Manager */}
      <script
        dangerouslySetInnerHTML={{
          __html:`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
        }}
      />
      {/* End Google Tag Manager */}
    </head>
    <body>
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{display:"none",visibility:"hidden"}}
          title="Google Tag Manager"
        />
      </noscript>
      {/* End Google Tag Manager (noscript) */}
      {children}
    </body>
  </html>
}
