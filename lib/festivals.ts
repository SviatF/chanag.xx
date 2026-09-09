export type Festival = {
  slug: string;
  name: string;
  date: string;
  short: string;
};

export const festivals2026: Festival[] = [
  { slug:"makar-sankranti", name:"Makar Sankranti", date:"2026-01-14", short:"Solar transition into Makara and a major harvest observance." },
  { slug:"maha-shivaratri", name:"Maha Shivaratri", date:"2026-02-15", short:"A night devoted to Shiva, observed with fasting and vigil." },
  { slug:"janmashtami", name:"Janmashtami", date:"2026-09-04", short:"Celebration of the birth of Krishna." },
  { slug:"ganesh-chaturthi", name:"Ganesh Chaturthi", date:"2026-09-14", short:"Festival celebrating Ganesha and auspicious new beginnings." },
];

export function nextFestival(date:Date) {
  const iso=date.toISOString().slice(0,10);
  return festivals2026.find(f=>f.date>=iso) ?? festivals2026[0];
}
