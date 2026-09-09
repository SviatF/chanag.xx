import Link from "next/link";
import Header from "@/components/Header";
import { cities } from "@/lib/cities";

const credits=[
  ["Gateway of India in the evening, Mumbai, India","SriSriChinmaya","CC BY-SA 4.0","https://commons.wikimedia.org/wiki/File:Gateway_of_India_in_the_evening,_Mumbai,_India.jpg"],
  ["India Gate Sunset","Vinitsharma98","Creative Commons","https://commons.wikimedia.org/wiki/File:India_Gate_Sunset.jpg"],
  ["Sunset at Victoria Memorial Kolkata","Imran Samad","CC BY-SA 4.0","https://commons.wikimedia.org/wiki/File:Sunset_at_Victoria_Memorial_Kolkata.jpg"],
  ["Kapaleeswarar temple","Wikimedia Commons contributor","Creative Commons","https://commons.wikimedia.org/wiki/File:Kapaleeswarar_temple.jpg"],
  ["Vidhan Soudha during sunset","IM3847","CC BY-SA 4.0","https://commons.wikimedia.org/wiki/File:Vidhan_Soudha_during_sunset.jpg"],
  ["Charminar at Sunset","Anumeha Shukla","Creative Commons","https://commons.wikimedia.org/wiki/File:Charminar_at_Sunset.JPG"],
  ["Ganesha altar with flame","Ramon","CC BY-SA 2.0","https://commons.wikimedia.org/wiki/File:Ganesha_altar_with_flame.jpg"],
];

export const metadata={title:"Photo Credits"};

export default function PhotoCredits(){
  return <main><Header city={cities[0]}/><div className="page-shell">
    <p className="page-kicker">ATTRIBUTION</p>
    <h1 className="page-title">Photo credits</h1>
    <p className="page-subtitle">Photography used in the visual presentation is sourced from Wikimedia Commons and remains subject to the license shown on each original file page.</p>
    <div className="wide-panel"><table className="table"><thead><tr><th>Photo</th><th>Author</th><th>License</th><th>Source</th></tr></thead><tbody>
      {credits.map(([title,author,license,url])=><tr key={title}><td>{title}</td><td>{author}</td><td>{license}</td><td><a href={url} target="_blank" rel="noreferrer">Wikimedia Commons ↗</a></td></tr>)}
    </tbody></table></div>
    <div className="pill-links"><Link href="/">← Back home</Link></div>
  </div></main>
}
