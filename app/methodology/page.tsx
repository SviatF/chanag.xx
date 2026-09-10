import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchang Calculation Methodology",
  description:"How Panchvani calculates Tithi, Nakshatra, sunrise, Rahu Kalam, Choghadiya and other location-sensitive Panchang values."
};

export default function Page(){
  return <TrustPage
    kicker="CALCULATION METHODOLOGY"
    title="How Panchvani calculates Panchang."
    subtitle="The calculation layer is deterministic: the same date and city coordinates produce the same Panchang result under the same engine and rules."
    sections={[
      {title:"Astronomical engine",paragraphs:["Panchvani uses the sweph calculation layer with Moshier ephemeris flags. Sidereal Sun and Moon positions are calculated in Lahiri sidereal mode for the calendar factors that require sidereal longitude."],items:["Gregorian date converted to Julian day","Lahiri sidereal mode for sidereal Sun and Moon longitude","City longitude and latitude used for local rise and set calculations","India-facing time output is expressed in IST"]},
      {title:"Tithi, Nakshatra, Yoga and Karana",paragraphs:["Tithi is derived from the angular separation of the Moon and Sun in 12-degree segments. Nakshatra divides the sidereal lunar longitude into 27 equal sectors, with each Nakshatra divided again into four Padas. Yoga is derived from the normalized sum of sidereal Sun and Moon longitude, while Karana follows six-degree half-Tithi segments.","Tithi and Nakshatra end times are not fixed labels: Panchvani searches forward from local sunrise and numerically refines the next segment transition."]},
      {title:"Sunrise-dependent periods",paragraphs:["Rahu Kalam, Yamaganda and Gulika are calculated by dividing the local daylight interval from sunrise to sunset into eight equal parts and applying the weekday sequence. Abhijit is derived from the central part of the 15-fold daylight Muhurta division used by the current engine, with the current rule omitting Wednesday."]},
      {title:"Choghadiya",paragraphs:["Day Choghadiya divides local sunrise-to-sunset into eight equal periods. Night Choghadiya divides sunset-to-next-sunrise into eight periods. The weekday-specific sequence determines whether each period is presented as favorable, neutral or unfavorable."]},
      {title:"Hindu month and calendar layers",paragraphs:["The core Hindu month label uses an Amanta model derived from the sidereal solar sign around the previous new moon. Regional pages then apply their own calendar naming layer where supported rather than merely translating an English heading."]}
    ]}
  />;
}
