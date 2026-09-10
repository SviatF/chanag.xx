import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Editorial Policy",
  description:"How Panchvani separates calculated Panchang data from explanatory, festival and traditional-rule content."
};

export default function Page(){
  return <TrustPage
    kicker="EDITORIAL POLICY"
    title="Useful first. Verifiable where possible."
    subtitle="Panchvani separates deterministic calculation from explanatory and tradition-sensitive content so readers can understand what is computed, what is curated and where conventions may vary."
    sections={[
      {title:"Calculated data is not rewritten for narrative",paragraphs:["Astronomical Panchang values are produced by the calculation engine from date and location inputs. Editorial copy may explain those values, but it should not alter a calculated Tithi, Nakshatra, sunrise or timing simply to match a preferred narrative."]},
      {title:"Tradition-sensitive content",paragraphs:["Festival observance and Muhurat practice can vary by region, sampradaya and practitioner. When Panchvani provides a general rule or broad timing reference, the page should state that scope rather than implying a single universal religious rule."]},
      {title:"No synthetic freshness",paragraphs:["Pages should not receive a new date, updated label or freshness claim unless underlying data, calculation logic or editorial information has materially changed. The platform is designed to distinguish recurring calculated pages from genuinely updated editorial content."]},
      {title:"Programmatic content standard",paragraphs:["City and date pages are published because their underlying timings and calendar state are location- or date-specific, not merely because a template can generate another URL. Search indexing is deliberately narrower than runtime coverage and expands from demand and quality signals."]},
      {title:"Corrections",paragraphs:["Verified factual or calculation issues should be corrected at the source layer where possible so every affected page benefits from the fix. Material rule changes should also be covered by regression tests when they can be expressed deterministically."]}
    ]}
  />;
}
