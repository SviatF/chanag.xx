import Link from "next/link";
export default function NotFound() {
  return <div className="page-shell">
    <p className="page-kicker">404</p>
    <h1 className="page-title">This moment isn't in the calendar.</h1>
    <p className="page-subtitle">Return to today's Panchang or choose a city.</p>
    <div className="pill-links"><Link href="/">Today</Link><Link href="/cities">Choose city</Link></div>
  </div>
}
