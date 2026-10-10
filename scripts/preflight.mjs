// Non-mutating Buildkite bootstrap. It intentionally DOES NOT create or lock customer forecasts.
import {predictionDayAt,stationsForDay,DAILY_VN_TIME,ZONE} from "./contract.mjs";
const day=process.env.KQ247_TARGET_DATE||predictionDayAt();
const regions=stationsForDay(day);
console.log(JSON.stringify({stage:"preflight",engine:"kq247-xoso-1930-engine",targetDate:day,timezone:ZONE,runAtVN:DAILY_VN_TIME,stationCount:Object.values(regions).reduce((sum,arr)=>sum+arr.length,0),regions,source:"Neon KQ247 history",writesAllowed:false},null,2));
const sources=[
  ["neon-main","https://br-divine-resonance-az0qxt8z-kq247web.compute.c-3.ap-southeast-1.aws.neon.tech/?region=xsmb"],
  ["neon-forecast-api","https://br-divine-resonance-az0qxt8z-kq247xsmb.compute.c-3.ap-southeast-1.aws.neon.tech/api/predict"]
];
for(const [name,url] of sources){
  try{
    const r=await fetch(url,{method:"GET",signal:AbortSignal.timeout(10000)});
    console.log(JSON.stringify({source:name,http:r.status,reachable:r.ok}));
    if(!r.ok)process.exitCode=1;
  }catch(e){
    console.error(JSON.stringify({source:name,error:String(e?.message||e)}));
    process.exitCode=1;
  }
}
if(!process.env.KQ247_NEON_DATABASE_URL)
 console.log("NOTE: Neon SQL secret is not configured for Buildkite. This run tests connectivity only and cannot produce snapshots.");
console.log("NOTE: Snapshot publishing remains DISABLED until exact 3-lotto/de/3-digit model has passed tests and an immutable-lock transaction is configured.");
