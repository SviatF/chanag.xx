import SeoQueriesClient from "@/components/SeoQueriesClient";

export const dynamic="force-dynamic";

export default function QueriesPage(){
  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="admin-eyebrow">SEARCH INTELLIGENCE</p><h1>Queries</h1><p>Реальні Google Search Console queries, landing pages, trends, quick wins і cannibalization — без нового API request на кожен filter click.</p></div>
    </header>
    <SeoQueriesClient/>
  </div>;
}
