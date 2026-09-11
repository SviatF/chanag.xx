import {notFound} from "next/navigation";
import {isRegionalLanguageSlug,regionalLanguageSeo} from "@/lib/regional-seo";

export default async function RegionalLanguageLayout({children,params}:{children:React.ReactNode;params:Promise<{language:string}>}){
  const {language}=await params;
  if(!isRegionalLanguageSlug(language))notFound();
  return <div lang={regionalLanguageSeo[language].hreflang}>{children}</div>;
}
