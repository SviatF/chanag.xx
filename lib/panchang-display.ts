import {formatDatedTime} from "./india-time";

type TimeWindowLike={start:string;end:string};

export const formatWindow=(window:TimeWindowLike|null)=>
  window?`${window.start} — ${window.end}`:"Not available";

export const formatPanchangTime=(time:string,eventDate:string|null|undefined,baseDate:string)=>
  formatDatedTime(time,eventDate,baseDate);
