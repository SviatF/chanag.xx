import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"About Panchvani",
  description:"What Panchvani is, how its Panchang data is produced, and how the platform approaches city coverage and religious-calendar differences."
};

export default function Page(){
  return <TrustPage
    kicker="ABOUT PANCHVANI"
    title="A transparent Panchang reference."
    subtitle="Panchvani is a location-sensitive Hindu calendar and timing platform built to make daily Panchang, festivals, Muhurat and traditional time windows easier to use across Indian cities."
    sections={[
      {title:"What Panchvani provides",paragraphs:["The platform combines astronomical calculation with clearly separated editorial and traditional-rule layers. Daily Panchang values and sunrise-dependent periods are calculated for the selected city; festival descriptions, regional terminology and Muhurat rule profiles are maintained as curated product data."]},
      {title:"Why location matters",paragraphs:["Sunrise, sunset, moonrise and sunrise-derived periods vary by location. Panchvani therefore uses city coordinates instead of presenting one national timing as if it applied everywhere in India."]},
      {title:"How we expand",paragraphs:["Panchvani supports a broad city pool for users while search-engine indexing is expanded deliberately. New indexable city coverage is activated from observed search demand and quality review rather than by publishing every possible URL at once."]},
      {title:"Scope",paragraphs:["Panchvani is a general informational reference. It does not replace a personalized Kundli, sampradaya-specific ritual guidance or the judgment of a qualified practitioner for ceremonies that depend on individual birth data or local tradition."]}
    ]}
  />;
}
