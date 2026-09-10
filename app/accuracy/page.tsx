import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Accuracy & Limitations",
  description:"How Panchvani validates Panchang calculations, why timings can differ between sources, and where personalized guidance is still required."
};

export default function Page(){
  return <TrustPage
    kicker="ACCURACY & LIMITATIONS"
    title="What our timings mean."
    subtitle="Panchvani is designed for reproducible local Panchang calculations, while remaining explicit about rounding, tradition-specific rules and the limits of general-purpose results."
    sections={[
      {title:"Automated validation",paragraphs:["Core Panchang outputs are covered by regression tests that check Tithi, Nakshatra, Yoga, Karana, Hindu month, Samvat values, sunrise, sunset, transition times and inauspicious periods against maintained reference fixtures. Choghadiya sequence and Abhijit behavior are also tested, and the test suite runs with every production code push."]},
      {title:"Timing precision",paragraphs:["Displayed clock values are rounded to the nearest minute. Astronomical rise and set calculations use the selected city's coordinates and the engine's configured rise/set model. Small differences of a few minutes versus another Panchang can arise from ephemeris settings, refraction assumptions, rounding, sunrise definition or rule conventions."]},
      {title:"Calendar conventions can differ",paragraphs:["Hindu calendar practice is not globally uniform. Amanta versus Purnimanta month systems, regional festival observance, sampradaya rules and local priestly convention can legitimately produce different labels or observance windows. Panchvani therefore avoids presenting every tradition as identical."]},
      {title:"Personalized astrology",paragraphs:["A city-and-date result is not a personalized horoscope. Birth Nakshatra, Pada, Lagna, compatibility and ceremony selection can depend on exact birth time, exact birthplace and individual chart factors. General Panchang and Muhurat pages should be used as planning references rather than substitutes for personalized consultation."]}
    ]}
  />;
}
