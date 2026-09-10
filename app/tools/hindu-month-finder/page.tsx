import type {Metadata} from "next";
import ExpandedPanchangTool from "@/components/ExpandedPanchangTool";

export const metadata:Metadata={
  title:"Hindu Month Finder — Current Hindu Lunar Month",
  description:"Find the Amanta Hindu lunar month, Tithi, Paksha, Vikram Samvat and Shaka Samvat for any supported Indian city and date.",
  alternates:{canonical:"/tools/hindu-month-finder"}
};

export default function Page({searchParams}:{searchParams:Promise<{city?:string;date?:string}>}){
  return <ExpandedPanchangTool slug="hindu-month-finder" searchParams={searchParams}/>;
}
