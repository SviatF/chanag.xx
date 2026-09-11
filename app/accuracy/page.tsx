import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Accuracy & Limitations",
  description:"How Panchvani validates Panchang calculations, why timings and month names can differ between sources, and where personalized guidance is still required.",
  alternates:{canonical:"/accuracy"}
};

export default function Page(){
  return <TrustPage
    kicker="ACCURACY & LIMITATIONS"
    title="What our timings mean."
    subtitle="Panchvani is designed for reproducible local Panchang calculations, while remaining explicit about civil-date handling, rounding, calendar conventions and the limits of general-purpose results."
    sections={[
      {title:"Automated validation",paragraphs:["Core Panchang outputs are covered by regression tests that check Tithi, Nakshatra, Yoga, Karana, lunar months, Samvat values, sunrise, sunset, transition times and inauspicious periods against maintained reference fixtures. The matrix includes western, northern, southern and eastern Indian locations so an early sunrise cannot silently move a result to the following civil day.","Boundary regressions cover the Chaitra Shukla Pratipada year rollover, Gujarati Kartika Shukla Pratipada rollover, after-midnight lunar events, Adhika Maas detection and supported regional solar-month day assignment around Sankranti. Choghadiya sequence and Abhijit behavior are also tested, and the suite runs with every production code push."]},
      {title:"Timing precision and sunrise convention",paragraphs:["Displayed clock values are rounded to the nearest minute. Astronomical rise and set calculations use the selected city's coordinates. The current sunrise/sunset reference uses the upper solar limb with atmospheric refraction at a sea-level horizon. Small differences versus another Panchang can still arise when that source uses a different coordinate point, elevation, ephemeris, refraction model, rounding method or sunrise definition."]},
      {title:"Civil date versus Panchang day",paragraphs:["A requested page date is anchored to the India-local civil day. Solar searches begin at 00:00 IST, while the daily Panchang's Moonrise and Moonset are assigned from local sunrise because the Panchang day is sunrise-based. Events after midnight preserve the following civil date in the displayed result."]},
      {title:"Calendar conventions can differ without the astronomy being wrong",paragraphs:["Panchvani shows both Amanta and Purnimanta lunar month labels. During regular Krishna Paksha these can differ by one named month even though both refer to the same Tithi and astronomical day. Adhika Maas is marked when a lunar month contains no sidereal Sankranti between its bounding new moons.","Regional solar calendars can also assign a Sankranti to different civil dates because Tamil, Malayalam and Bengali traditions use different day-boundary rules. Gujarati Samvat has a different New Year boundary from Chaitradi Vikram Samvat. Panchvani keeps these conventions explicit instead of treating a naming difference as an astronomical error."]},
      {title:"Festival and ritual limits",paragraphs:["Festival pages combine curated festival-date records with city-local Panchang context. A broad local timing reference is not presented as a festival-specific ritual Muhurat. Observances such as Raksha Bandhan, Janmashtami, Diwali or Karwa Chauth can require rules involving Bhadra, Nishita, Pradosh, Madhyahna, moonrise or sampradaya-specific criteria that are separate from a generic sunrise/sunset window."]},
      {title:"Personalized astrology",paragraphs:["A city-and-date result is not a personalized horoscope. Birth Nakshatra, Pada, Lagna, compatibility and ceremony selection can depend on exact birth time, exact birthplace and individual chart factors. General Panchang and Muhurat pages should be used as planning references rather than substitutes for personalized consultation."]}
    ]}
  />;
}
