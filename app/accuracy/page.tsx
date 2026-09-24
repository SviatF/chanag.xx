import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Accuracy & Validation",
  description:"How Panchvani validates Panchang calculations, timing precision, civil-date handling and regional calendar conventions.",
  alternates:{canonical:"/accuracy"}
};

export default function Page(){
  return <TrustPage
    kicker="ACCURACY & VALIDATION"
    title="How Panchvani validates its timings."
    subtitle="Panchvani is built around reproducible city-and-date calculations, explicit astronomical conventions and regression checks across Indian regions."
    sections={[
      {title:"Automated validation",paragraphs:["Core Panchang outputs are covered by regression tests that check Tithi, Nakshatra, Yoga, Karana, lunar months, Samvat values, sunrise, sunset, transition times and inauspicious periods against maintained reference fixtures. The matrix includes western, northern, southern and eastern Indian locations so an early sunrise cannot silently move a result to the following civil day.","Boundary regressions cover the Chaitra Shukla Pratipada year rollover, Gujarati Kartika Shukla Pratipada rollover, after-midnight lunar events, Adhika Maas detection and supported regional solar-month day assignment around Sankranti. Choghadiya sequence and Abhijit behavior are also tested, and the suite runs with every production code push."]},
      {title:"Timing precision and sunrise convention",paragraphs:["Displayed clock values are rounded to the nearest minute. Astronomical rise and set calculations use the selected city's coordinates. The current sunrise/sunset reference uses the upper solar limb with atmospheric refraction at a sea-level horizon.","When another Panchang uses a different coordinate point, elevation, ephemeris, refraction model, rounding method or sunrise definition, its displayed clock time can differ even when both calculations are internally consistent."]},
      {title:"Civil date versus Panchang day",paragraphs:["A requested page date is anchored to the India-local civil day. Solar searches begin at 00:00 IST, while the daily Panchang's Moonrise and Moonset are assigned from local sunrise because the Panchang day is sunrise-based. Events after midnight preserve the following civil date in the displayed result."]},
      {title:"Calendar-convention validation",paragraphs:["Panchvani shows both Amanta and Purnimanta lunar month labels. During regular Krishna Paksha these can differ by one named month even though both refer to the same Tithi and astronomical day. Adhika Maas is marked when a lunar month contains no sidereal Sankranti between its bounding new moons.","Tamil, Malayalam and Bengali solar-calendar layers apply their own civil-day assignment around Sankranti. Gujarati Samvat uses its Kartika New Year boundary separately from the generic Chaitradi Vikram Samvat calculation."]},
      {title:"Festival-rule validation",paragraphs:["Festival dates are stored as curated records and paired with local Panchang calculations. Festival-specific timing engines are implemented separately for observances whose selection depends on dedicated rule sets such as Bhadra, Nishita, Pradosh, Madhyahna or moonrise."]},
      {title:"Source-level corrections",paragraphs:["When a discrepancy is confirmed, the calculation, data record or rule source is corrected and the affected page family is regression-tested. This keeps fixes consistent across every URL that depends on the same underlying logic."]}
    ]}
  />;
}
