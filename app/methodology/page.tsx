import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchang Calculation Methodology",
  description:"How Panchvani calculates Tithi, Nakshatra, sunrise, Rahu Kalam, Choghadiya and other location-sensitive Panchang values."
};

export default function Page(){
  return <TrustPage
    kicker="CALCULATION METHODOLOGY"
    title="How Panchvani calculates Panchang."
    subtitle="The calculation layer is deterministic: the same civil date and city coordinates produce the same Panchang result under the same engine, astronomical convention and calendar rules."
    sections={[
      {title:"Civil date and astronomical engine",paragraphs:["Panchvani treats a requested date as an India-local civil date. Rise and set searches begin at 00:00 IST for that date rather than 00:00 UTC, which prevents an early sunrise in eastern India from being skipped. Panchvani uses the sweph calculation layer with Moshier ephemeris flags, with Lahiri sidereal mode for the calendar factors that require sidereal longitude."],items:["Requested date anchored to 00:00 IST before local event searches","Gregorian civil date converted to Julian day","Lahiri sidereal mode for sidereal Sun and Moon longitude","City longitude and latitude used for local rise and set calculations","India-facing time output is expressed in IST"]},
      {title:"Sunrise convention",paragraphs:["For the current Panchang reference model, sunrise and sunset use the upper solar limb with atmospheric refraction at a sea-level horizon. This convention is stated explicitly because Hindu calendar products can use different sunrise definitions. Panchvani does not silently mix sunrise conventions between page families."]},
      {title:"Tithi, Nakshatra, Yoga and Karana",paragraphs:["Tithi is derived from the angular separation of the Moon and Sun in 12-degree segments. Nakshatra divides the sidereal lunar longitude into 27 equal sectors, with each Nakshatra divided again into four Padas. Yoga is derived from the normalized sum of sidereal Sun and Moon longitude, while Karana follows six-degree half-Tithi segments.","Tithi and Nakshatra end times are not fixed labels: Panchvani searches forward from local sunrise and numerically refines the next segment transition. If a transition occurs after midnight, the following civil date is retained and displayed with the clock time."]},
      {title:"Panchang-day Moonrise and Moonset",paragraphs:["The civil date begins at midnight, but the Panchang day is sunrise-based. Moonrise and Moonset shown on a daily Panchang are therefore searched from that day's local sunrise. This keeps a pre-sunrise lunar event from being assigned to the wrong Panchang day and allows a Moonrise after midnight to be shown with the following civil date."]},
      {title:"Sunrise-dependent periods",paragraphs:["Rahu Kalam, Yamaganda and Gulika are calculated by dividing the local daylight interval from sunrise to sunset into eight equal parts and applying the weekday sequence. Abhijit is derived from the central part of the 15-fold daylight Muhurta division used by the current engine, with the current rule omitting Wednesday."]},
      {title:"Choghadiya",paragraphs:["Day Choghadiya divides local sunrise-to-sunset into eight equal periods. Night Choghadiya divides sunset-to-next-sunrise into eight periods. The weekday-specific sequence determines whether each period is presented as favorable, neutral or unfavorable."]},
      {title:"Hindu month and Samvat layers",paragraphs:["The core Hindu month label uses an Amanta model derived from the sidereal solar sign around the previous new moon. It is intentionally identified as Amanta because Purnimanta and regional calendar month labels can differ on the same civil date.","The lunar Vikram and Shaka Samvat year shown in Panchvani changes at the Chaitra Shukla Pratipada year boundary. The engine resolves the Amavasya-to-Pratipada transition whose sidereal Sun is in Meena, then assigns the civil start date using the local sunrise relationship. If the complete Pratipada occurs between two sunrises, the civil date on which Pratipada begins is retained instead of applying a fixed Gregorian March cutoff."]}
    ]}
  />;
}
