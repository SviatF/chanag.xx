import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"About Panchvani",
  description:"What Panchvani is, how its Panchang data is produced, and how the platform approaches city coverage and religious-calendar differences.",
  alternates:{canonical:"/about"}
};

export default function Page(){
  return <TrustPage
    kicker="ABOUT PANCHVANI"
    title="A transparent Panchang reference."
    subtitle="Panchvani is a location-sensitive Hindu calendar and timing platform built to make daily Panchang, festivals, Muhurat and traditional time windows easier to use across Indian cities."
    sections={[
      {title:"What Panchvani provides",paragraphs:["The platform combines astronomical calculation with clearly separated editorial and traditional-rule layers. Daily Panchang values and sunrise-dependent periods are calculated for the selected city; festival descriptions, regional terminology and Muhurat rule profiles are maintained as curated product data."]},
      {title:"Why location matters",paragraphs:["Sunrise, sunset, moonrise and sunrise-derived periods vary by location. Panchvani therefore uses city coordinates instead of presenting one national timing as if it applied everywhere in India."]},
      {title:"How we expand",paragraphs:["Panchvani supports a broad city pool for users while public city coverage is expanded deliberately. New city experiences are added from observed demand and quality review rather than by publishing every possible page at once."]},
      {title:"How page types differ",paragraphs:["Daily Panchang pages focus on a city and civil date, festival pages combine curated observance records with local calculations, Muhurat pages rank screened candidate dates, and regional pages apply native terminology and calendar conventions. These layers are kept separate so each URL can answer a distinct search intent with its own data."]}
    ]}
  />;
}
