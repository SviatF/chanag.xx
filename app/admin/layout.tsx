import type { Metadata } from "next";
import "./admin.css";

export const metadata:Metadata={
  title:{default:"Panchang Control Plane",template:"%s · Panchang Admin"},
  robots:{index:false,follow:false,nocache:true},
};

export default function AdminRootLayout({children}:{children:React.ReactNode}){
  return children;
}
