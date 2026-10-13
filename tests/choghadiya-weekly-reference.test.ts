import {describe,expect,it} from "vitest";
import {getPanchang} from "../lib/panchang";
import {cityBySlug} from "../lib/cities";

/* Audit-only independent day/night weekday rows:
https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en */
const day=[
  ["Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg"],
  ["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"],
  ["Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog"],
  ["Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh"],
  ["Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh"],
  ["Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char"],
  ["Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal"]
];
const night=[
  ["Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh"],
  ["Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char"],
  ["Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal"],
  ["Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg"],
  ["Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit"],
  ["Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog"],
  ["Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh"]
];
const toM=(t:string)=>{const [h,m]=t.split(":").map(Number);return h*60+m;};
describe("Choghadiya accuracy: seven weekdays and both solar halves",()=>{
  const city=cityBySlug("mumbai");
  for(let weekday=0;weekday<7;weekday++){
    // 2026-09-06 was a Sunday, 09-12 a Saturday
    const date=`2026-09-${String(6+weekday).padStart(2,"0")}`;
    it(`${date}: standard daytime/nighttime Choghadiya rows and exact boundaries`,async()=>{
      const result=await getPanchang(new Date(date+"T06:00:00Z"),city);
      expect(result.dayChoghadiya.map(x=>x.name)).toEqual(day[weekday]);
      expect(result.nightChoghadiya.map(x=>x.name)).toEqual(night[weekday]);
      expect(result.dayChoghadiya[0].start).toBe(result.sunrise);
      expect(result.dayChoghadiya[7].end).toBe(result.sunset);
      expect(result.nightChoghadiya[0].start).toBe(result.sunset);
      for(const group of [result.dayChoghadiya,result.nightChoghadiya]){
        expect(group).toHaveLength(8);
        for(let i=1;i<8;i++){
          expect(group[i].start).toBe(group[i-1].end);
          expect(group[i].startDayOffset).toBe(group[i-1].endDayOffset);
        }
        for(const part of group){
          const duration=toM(part.end)+1440*part.endDayOffset-toM(part.start)-1440*part.startDayOffset;
          expect(duration).toBeGreaterThan(45);
          expect(duration).toBeLessThan(135);
        }
      }
      expect(result.nightChoghadiya[7].endDayOffset).toBe(1);
    });
  }
});
