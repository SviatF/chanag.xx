import type {Metadata} from "next";
import ExpandedPanchangTool from "@/components/ExpandedPanchangTool";

export const metadata:Metadata={
  title:"Nakshatra Today — Nakshatra & Pada by Date",
  description:"Find today's or any date's Nakshatra, Pada, Chandra Rashi and local transition time for a supported Indian city.",
  alternates:{canonical:"/tools/nakshatra-today"}
};

export default function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  return <ExpandedPanchangTool slug="nakshatra-today" searchParams={searchParams}/>;
}
