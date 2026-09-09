import type { Metadata } from "next";
import "./admin.css";

export const metadata:Metadata={
  title:{default:"Panchvani Control Plane",template:"%s · Panchvani Admin"},
  robots:{index:false,follow:false,nocache:true},
};

export default function AdminRootLayout({children}:{children:React.ReactNode}){
  return children;
}
