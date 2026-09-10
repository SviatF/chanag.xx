import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Data Sources",
  description:"The astronomical, geographic and curated data layers used by Panchvani."
};

export default function Page(){
  return <TrustPage
    kicker="DATA SOURCES"
    title="Where Panchvani data comes from."
    subtitle="Calculated values, geographic coverage and curated calendar records are separate layers so their provenance and limitations remain clear."
    sections={[
      {title:"Astronomical calculations",paragraphs:["Daily Panchang calculations use the @typescriptify/sweph implementation of the Swiss Ephemeris-compatible calculation interface with Moshier ephemeris flags. Panchvani calculates the relevant solar and lunar positions at request/build time instead of storing a generic national timing table."]},
      {title:"City geodata",paragraphs:["The expansion city registry is based on the public Vynex/indian-cities-geodata dataset and includes city slug, name, state, coordinates, language profile and population metadata. Core cities retain curated coordinate records used by the runtime calculation layer."]},
      {title:"Festival records",paragraphs:["Festival dates, descriptions, regional names, observance notes and broad Puja timing categories are curated records maintained inside Panchvani. City-specific festival pages then combine those records with the selected city's calculated Panchang and solar timings."]},
      {title:"Search and product telemetry",paragraphs:["Google Search Console, Google Analytics 4 and Cloudflare analytics can be connected to Panchvani's internal monitoring layer. These sources are used to understand discovery, site behavior and infrastructure health; they do not determine astronomical Panchang values."]}
    ]}
  />;
}
