import test from "node:test";
import assert from "node:assert/strict";
import {predictionDayAt,stationsForDay,validatePrediction,validateSnapshot,addDays} from "../scripts/contract.mjs";
test("at 19:30 Vietnam the target becomes tomorrow",()=>{
 assert.equal(predictionDayAt(new Date("2026-10-10T12:29:00.000Z")),"2026-10-10");
 assert.equal(predictionDayAt(new Date("2026-10-10T12:30:00.000Z")),"2026-10-11");
});
test("Sunday and Saturday scheduled stations are isolated",()=>{
 assert.deepEqual(stationsForDay("2026-10-11").mt,["Khánh Hòa","Kon Tum","Huế"]);
 assert.deepEqual(stationsForDay("2026-10-11").mn,["Tiền Giang","Kiên Giang","Đà Lạt"]);
 assert.equal(stationsForDay("2026-10-10").mn.length,4);
});
test("date changes safely",()=>assert.equal(addDays("2026-12-31",1),"2027-01-01"));
test("reject obsolete two-pair AB-BA without 3 independent lottos",()=>{
 assert.throws(()=>validatePrediction({lotto_pairs:["12-21","34-43"]}),/three_single_lotto_required/);
});
test("reject snapshot not explicitly locked",()=>{
 assert.throws(()=>validateSnapshot({date:"2026-10-11",locked:false,predictions:{}},"2026-10-11"),/snapshot_unlocked_or_wrong_date/);
});
test("reject partial station snapshots",()=>{
 assert.throws(()=>validateSnapshot({date:"2026-10-11",locked:true,predictions:{mb:{},mt:{},mn:{}}},"2026-10-11"),/missing_mb_XSMB/);
});
