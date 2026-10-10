// Production snapshot integrity probe for existing Neon endpoints.
// Read only. Never generates forecasts, submits POSTs, or mutates locks.
import { predictionDayAt, stationsForDay } from "./contract.mjs";

const day=process.env.KQ247_TARGET_DATE || predictionDayAt();
if(!/^20\d\d-\d\d-\d\d$/.test(day))throw new Error("Invalid target date");
const base="https://br-divine-resonance-az0qxt8z-kq247full.compute.c-3.ap-southeast-1.aws.neon.tech";
const paths=[
  {kind:"three_lotto",path:"/api/three?date="+day},
  {kind:"full_forecast",path:"/api/mirror?data=1&date="+day}
];
const checks=[];
for(const {kind,path} of paths){
  let obj={kind,target_date:day,healthy:false};
  try{
    const response=await fetch(base+path,{cache:"no-store",signal:AbortSignal.timeout(15000)});
    const j=await response.json();
    obj.http=response.status;
    obj.found=j.found===true;
    obj.locked=j.locked===true;
    obj.snapshot_date=j.date;
    if(kind==="three_lotto"){
      obj.model=j.model;
      obj.source_draws=j.source_draws;
      obj.last_source_date=j.source_last_date;
      obj.picks=Array.isArray(j.picks)?j.picks.length:0;
      obj.healthy=response.ok&&j.ok===true&&obj.found&&obj.locked&&j.date===day&&obj.picks===3&&Number(j.source_draws)===500;
    }else{
      obj.model=j.data?.model;
      obj.stations_by_region=Object.fromEntries(["mb","mt","mn"].map(r=>[r,Object.keys(j.data?.predictions?.[r]||{}).length]));
      const expected=stationsForDay(day),pred=j.data?.predictions||{};
      const allExpected=Object.entries(expected).every(([r,sts])=>sts.every(s=>pred[r]?.[s]?.de?.dan75?.length===75&&pred[r]?.[s]?.de?.three_digit?.length===500));
      obj.healthy=response.ok&&j.ok===true&&obj.found&&obj.locked&&j.date===day&&allExpected;
    }
    if(!obj.healthy)obj.reason=String(j.error||"snapshot_incomplete_or_stale").slice(0,160);
  }catch(e){obj.reason=String(e?.message||e).slice(0,160)}
  checks.push(obj);
}
console.log(JSON.stringify({source:"existing_Neon_kq247full",readOnly:true,day,checks},null,2));
if(checks.some(x=>!x.healthy)){
  console.error("Production readiness check failed. No snapshot has been written or changed.");
  process.exitCode=1;
}
