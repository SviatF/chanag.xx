import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Disclaimer",
  description:"Important limitations for Panchang, Muhurat, festival and astrology-related information on Panchvani."
};

export default function Page(){
  return <TrustPage
    kicker="DISCLAIMER"
    title="General Panchang reference, not personal advice."
    subtitle="Panchvani provides calculated and curated calendar information for general planning and educational use."
    sections={[
      {title:"General information",paragraphs:["Panchang, Choghadiya, Rahu Kalam, festival and general Muhurat information on Panchvani is provided as a reference. It should not be treated as legal, financial, medical or other professional advice."]},
      {title:"Religious and astrological practice",paragraphs:["Ritual and astrological traditions can differ by region, lineage, sampradaya and practitioner. Personalized ceremony selection may require birth charts, exact birth data and tradition-specific rules that are outside a general city-and-date page."]},
      {title:"Planning decisions",paragraphs:["Users remain responsible for decisions made from the information displayed on Panchvani. For significant rites or personalized astrology, confirm the relevant timing and convention with a qualified practitioner who follows the tradition appropriate to you."]},
      {title:"Corrections and evolution",paragraphs:["Calculation methods, curated records and regional layers can be improved as additional validation becomes available. Panchvani documents its methodology and correction approach so material changes can be made transparently rather than hidden behind generic claims of accuracy."]}
    ]}
  />;
}
