export type SourceState={
  configured:boolean;
  label:string;
  detail:string;
};

export function getDataSourceStatus(){
  const ga4=Boolean(process.env.GA4_PROPERTY_ID);
  const cloudflare=Boolean(
    process.env.CLOUDFLARE_API_TOKEN &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_ZONE_ID
  );

  return {
    ga4:{
      configured:ga4,
      label:"Google Analytics 4",
      detail:ga4?"Property configured":"Awaiting GA4_PROPERTY_ID",
    } satisfies SourceState,
    cloudflare:{
      configured:cloudflare,
      label:"Cloudflare Analytics",
      detail:cloudflare?"Analytics credentials configured":"Awaiting Cloudflare analytics credentials",
    } satisfies SourceState,
  };
}
