import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Accuracy & Limitations",
  description:"How Panchvani validates Panchang calculations, why timings can differ between sources, and where personalized guidance is still required."
};

export default function Page(){
  return <TrustPage
    kicker="ACCURACY & LIMITATIONS"
    title="What our timings mean."
    subtitle="Panchvani is designed for reproducible local Panchang calculations, while remaining explicit about civil-date handling, rounding, calendar conventions and the limits of general-purpose results."
    sections={[
      {title:"Automated validation",paragraphs:["Core Panchang outputs are covered by regression tests that check Tithi, Nakshatra, Yoga, Karana, Amanta month, lunar Samvat values, sunrise, sunset, transition times and inauspicious periods against maintained reference fixtures. The matrix includes western, northern, southern and eastern Indian locations so an early sunrise cannot silently move a result to the following civil day.","Boundary regressions also cover the Chaitra Shukla Pratipada Samvat rollover and after-midnight lunar events. Choghadiya sequence and Abhijit behavior are tested, and the suite runs with every production code push."]},
      {title:"Timing precision and sunrise convention",paragraphs:["Displayed clock values are rounded to the nearest minute. Astronomical rise and set calculations use the selected city's coordinates. The current sunrise/sunset reference uses the upper solar limb with atmospheric refraction at a sea-level horizon. Small differences versus another Panchang can still arise when that source uses a different ephemeris, elevation, refraction model, rounding method or sunrise definition."]},
      {title:"Civil date versus Panchang day",paragraphs:["A requested page date is anchored to the India-local civil day. Solar searches begin at 00:00 IST, while the daily Panchang's Moonrise and Moonset are assigned from local sunrise because the Panchang day is sunrise-based. Events after midnight preserve the following civil date in the displayed result."]},
      {title:"Calendar conventions can differ",paragraphs:["Hindu calendar practice is not globally uniform. Panchvani's core lunar-month field uses the Amanta convention. Purnimanta month systems, regional solar calendars, festival observance, sampradaya rules and local priestly convention can legitimately produce different labels or observance windows. A convention difference should not be presented as an astronomical discrepancy."]},
      {title:"Personalized astrology",paragraphs:["A city-and-date result is not a personalized horoscope. Birth Nakshatra, Pada, Lagna, compatibility and ceremony selection can depend on exact birth time, exact birthplace and individual chart factors. General Panchang and Muhurat pages should be used as planning references rather than substitutes for personalized consultation."]}
    ]}
  />;
}
