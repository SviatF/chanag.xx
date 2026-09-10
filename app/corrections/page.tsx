import TrustPage from "@/components/TrustPage";

export const metadata={
  title:"Panchvani Corrections Policy",
  description:"How Panchvani investigates and corrects calculation, calendar and editorial discrepancies."
};

export default function Page(){
  return <TrustPage
    kicker="CORRECTIONS"
    title="Corrections should fix the source, not one page."
    subtitle="When a discrepancy is confirmed, Panchvani aims to correct the underlying data, rule or calculation and then validate the affected page family."
    sections={[
      {title:"What makes a useful correction report",paragraphs:["A reproducible report should identify the exact Panchvani URL, city, date, field or timing in question and, where relevant, the comparison source and convention being used."],items:["Exact page URL","City and date","Field or time window that appears incorrect","Expected value and comparison source","Any relevant regional or sampradaya convention"]},
      {title:"How discrepancies are evaluated",paragraphs:["The first step is to determine whether the difference comes from astronomical calculation, city coordinates, rounding, a regional calendar convention, a festival record or a traditional-rule profile. Differences caused by legitimate convention choices are documented rather than automatically treated as calculation errors."]},
      {title:"How fixes are applied",paragraphs:["Calculation defects should be fixed in the shared engine and covered by a regression test. Data defects should be corrected in the relevant registry or curated record. Editorial errors should be updated without changing unrelated calculated output. This approach prevents the same issue from remaining hidden on thousands of programmatic pages."]}
    ]}
  />;
}
