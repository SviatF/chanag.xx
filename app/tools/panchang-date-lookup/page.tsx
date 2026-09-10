import type {Metadata} from "next";
import ExpandedPanchangTool from "@/components/ExpandedPanchangTool";

export const metadata:Metadata={
  title:"Panchang Date Lookup — Tithi, Nakshatra & Timings",
  description:"Look up Tithi, Nakshatra, Yoga, Karana, sunrise, sunset, Rahu Kalam and Hindu month for any supported Indian city and date.",
  alternates:{canonical:"/tools/panchang-date-lookup"}
};

export default function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  return <ExpandedPanchangTool slug="panchang-date-lookup" searchParams={searchParams}/>;
}
