import type {Metadata} from "next";
import ExpandedPanchangTool from "@/components/ExpandedPanchangTool";

export const metadata:Metadata={
  title:"Tithi Finder — Tithi Today & Date Calculator",
  description:"Find Tithi, Paksha and the local Tithi transition time for any supported Indian city and date.",
  alternates:{canonical:"/tools/tithi-finder"}
};

export default function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  return <ExpandedPanchangTool slug="tithi-finder" searchParams={searchParams}/>;
}
