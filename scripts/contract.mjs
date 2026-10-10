// KQ247 xổ số — shared, side-effect-free validation. No prediction numbers are generated here.
export const DAILY_VN_TIME = "19:30";
export const ZONE = "Asia/Ho_Chi_Minh";
export const SCHEDULE = Object.freeze({
  mt: Object.freeze({
    0: ["Khánh Hòa","Kon Tum","Huế"],
    1: ["Phú Yên","Huế"],
    2: ["Đắk Lắk","Quảng Nam"],
    3: ["Đà Nẵng","Khánh Hòa"],
    4: ["Bình Định","Quảng Bình","Quảng Trị"],
    5: ["Gia Lai","Ninh Thuận"],
    6: ["Đà Nẵng","Đắk Nông","Quảng Ngãi"]
  }),
  mn: Object.freeze({
    0: ["Tiền Giang","Kiên Giang","Đà Lạt"],
    1: ["TPHCM","Đồng Tháp","Cà Mau"],
    2: ["Bến Tre","Vũng Tàu","Bạc Liêu"],
    3: ["Đồng Nai","Cần Thơ","Sóc Trăng"],
    4: ["Tây Ninh","An Giang","Bình Thuận"],
    5: ["Vĩnh Long","Bình Dương","Trà Vinh"],
    6: ["TPHCM","Long An","Bình Phước","Hậu Giang"]
  })
});
function partsAtVN(date) {
  const d = Object.fromEntries(new Intl.DateTimeFormat("en-GB",{
    timeZone:ZONE, year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return {year:+d.year,month:+d.month,day:+d.day,hour:+d.hour,minute:+d.minute};
}
export function addDays(ymd,n) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ymd))throw new Error("invalid_ymd");
  return new Date(Date.parse(ymd+"T00:00:00Z")+n*86400000).toISOString().slice(0,10);
}
export function predictionDayAt(date=new Date()) {
  const x=partsAtVN(date);
  const today=[x.year,String(x.month).padStart(2,"0"),String(x.day).padStart(2,"0")].join("-");
  return x.hour>19||(x.hour===19&&x.minute>=30)?addDays(today,1):today;
}
export function stationsForDay(ymd) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ymd))throw new Error("invalid_ymd");
  const dow=new Date(ymd+"T12:00:00Z").getUTCDay();
  return {mb:["XSMB"],mt:[...SCHEDULE.mt[dow]],mn:[...SCHEDULE.mn[dow]]};
}
function two(s) {return typeof s==="string"&&/^\d{2}$/.test(s);}
function three(s) {return typeof s==="string"&&/^\d{3}$/.test(s);}
function unique(a) {return Array.isArray(a)&&new Set(a).size===a.length;}
export function validatePrediction(pred) {
  if(!pred||typeof pred!=="object")throw new Error("missing_prediction");
  if(!Array.isArray(pred.lotto_bach_thu)||pred.lotto_bach_thu.length!==3||
      !pred.lotto_bach_thu.every(two)||!unique(pred.lotto_bach_thu))throw new Error("three_single_lotto_required");
  if(!Array.isArray(pred.doubles)||pred.doubles.length!==2||!pred.doubles.every(two)||!unique(pred.doubles))throw new Error("two_double_required");
  const de=pred.de||{};
  for(const [field,length] of [["dan50",50],["dan60",60],["dan75",75]]) {
    if(!Array.isArray(de[field])||de[field].length!==length||!de[field].every(two)||!unique(de[field]))
      throw new Error("invalid_"+field);
  }
  if(!Array.isArray(de.three_digit)||de.three_digit.length!==500||!de.three_digit.every(three)||!unique(de.three_digit))throw new Error("invalid_three_digit");
  const suffixes=new Set(de.dan75);
  if(de.three_digit.some(s=>!suffixes.has(s.slice(-2))))throw new Error("three_digit_outside_dan75");
  return true;
}
export function validateSnapshot(snapshot,ymd) {
  if(snapshot?.date!==ymd||snapshot.locked!==true||!snapshot.predictions)throw new Error("snapshot_unlocked_or_wrong_date");
  const expected=stationsForDay(ymd),a=snapshot.predictions;
  for(const region of ["mb","mt","mn"])for(const station of expected[region]){
    if(!a[region]?.[station])throw new Error("missing_"+region+"_"+station);
    validatePrediction(a[region][station]);
  }
  const actual=Object.entries(a).flatMap(([region,v])=>Object.keys(v||{}).map(st=>region+"|"+st));
  const total=Object.values(expected).reduce((n,stations)=>n+stations.length,0);
  if(actual.length!==total)throw new Error("snapshot_station_count_mismatch");
  return {date:ymd,stations:total,verified:true};
}
