import type {Metadata} from "next";
import ExpandedPanchangTool from "@/components/ExpandedPanchangTool";

export const metadata:Metadata={
  title:"Moon Phase Today India — Lunar Phase & Illumination",
  description:"Check today's or any date's Moon phase, illumination, Paksha, Tithi, moonrise and moonset for a supported Indian city.",
  alternates:{canonical:"/tools/moon-phase"}
};

export default function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  return <ExpandedPanchangTool slug="moon-phase" searchParams={searchParams}/>;
}
