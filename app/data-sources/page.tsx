import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Data Sources",
  description:"The astronomical, geographic and curated data layers used by Panchvani.",
  alternates:{canonical:"/data-sources"}
};

export default function Page(){
  return <TrustPage
    kicker="DATA SOURCES"
    title="Where Panchvani data comes from."
    subtitle="Calculated values, geographic coverage, reference fixtures and curated calendar records are separate layers so their provenance and limitations remain clear."
    sections={[
      {title:"Astronomical calculations",paragraphs:["Daily Panchang calculations use the @typescriptify/sweph implementation of the Swiss Ephemeris-compatible calculation interface with Moshier ephemeris flags. Panchvani calculates solar and lunar positions from the requested India-local civil date and city coordinates instead of storing a generic national timing table.","Sidereal Panchang factors use Lahiri ayanamsha. The current sunrise/sunset reference uses the upper solar limb with atmospheric refraction at a sea-level horizon; this convention is documented because another Panchang can legitimately choose a different sunrise definition."]},
      {title:"Reference fixtures and regression checks",paragraphs:["Maintained regression fixtures include their comparison-source URLs and expected Panchang values. The suite covers multiple Indian regions, including an eastern-city case with sunrise before 05:30 IST, plus Samvat boundary and after-midnight Moonrise cases. Reference data is used for validation; it does not replace Panchvani's own runtime calculation."]},
      {title:"City geodata",paragraphs:["The expansion city registry is based on the public Vynex/indian-cities-geodata dataset and includes city slug, name, state, coordinates, language profile and population metadata. Core cities retain curated coordinate records used by the runtime calculation layer."]},
      {title:"Festival records",paragraphs:["Festival dates, descriptions, related regional terminology, observance notes and broad timing categories are curated records maintained inside Panchvani. City-specific festival pages combine those records with the selected city's calculated Panchang and solar timings. A broad timing category is not presented as a substitute for a festival-specific ritual rule."]},
      {title:"Search and product telemetry",paragraphs:["Google Search Console, Google Analytics 4 and Cloudflare analytics can be connected to Panchvani's internal monitoring layer. These sources are used to understand discovery, site behavior and infrastructure health; they do not determine astronomical Panchang values."]}
    ]}
  />;
}
