import {supportedCities,type City} from "@/lib/cities";

export default function ToolLookupForm({city,date,submitLabel}:{city:City;date:string;submitLabel:string}){
  return <form className="wide-panel" method="get">
    <label>City<br/><select name="city" defaultValue={city.slug}>{supportedCities.map(item=><option value={item.slug} key={item.slug}>{item.name}, {item.state}</option>)}</select></label>
    <label>Date<br/><input type="date" name="date" defaultValue={date}/></label>
    <button className="gold-button" type="submit">{submitLabel}</button>
  </form>;
}
