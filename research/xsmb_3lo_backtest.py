#!/usr/bin/env python3
"""Leakage-free XSMB three-number rolling baseline. Input CSV: date,numbers
numbers = 27 space-separated two-digit prize endings per drawing (duplicates kept).
Rows must be in ascending date order. At least 500 test days plus 60 training days.
"""
import csv, argparse, collections, json, pathlib, sys
from datetime import date

def read(path):
    rows=[]
    with open(path,encoding="utf-8-sig",newline="") as f:
        for row in csv.DictReader(f):
            d=date.fromisoformat(row["date"])
            nums=row["numbers"].replace(","," ").split()
            if len(nums)!=27 or any(not n.isdigit() or not 0<=int(n)<=99 for n in nums):
                raise ValueError(f"{d}: expected exactly 27 valid 00-99 endings")
            rows.append((d,[int(n) for n in nums]))
    if len({d for d,_ in rows})!=len(rows) or rows!=sorted(rows):
        raise ValueError("Dates must be unique and sorted ascending")
    return rows

def pick(history,window):
    count=collections.Counter(n for _,nums in history[-window:] for n in nums)
    return sorted(range(100),key=lambda n:(-count[n],n))[:3]

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--csv",required=True)
    p.add_argument("--days",type=int,default=500)
    p.add_argument("--warmup",type=int,default=60)
    p.add_argument("--out",default="backtest-report.json")
    a=p.parse_args()
    rows=read(a.csv)
    if len(rows)<a.days+a.warmup: raise SystemExit(f"INSUFFICIENT DATA: need {a.days+a.warmup} rows, got {len(rows)}")
    results={}
    for window in (7,14,30,60):
        if window>a.warmup: continue
        hits=0; total=0; distribution=collections.Counter()
        details=[]
        for i in range(len(rows)-a.days,len(rows)):
            chosen=pick(rows[:i],window)
            count=sum(rows[i][1].count(n) for n in chosen)
            hits+=int(count>0);total+=count;distribution[count]+=1
            details.append({"date":rows[i][0].isoformat(),"pick":[f"{n:02d}" for n in chosen],"nhay":count})
        results[str(window)]={"days_hit":hits,"days_tested":a.days,"total_nhay":total,"hit_rate":round(hits/a.days,6),"nhay_distribution":dict(sorted(distribution.items())),"daily":details}
    output={"method":"trailing_frequency_baselines_no_lookahead","target_days_hit":360,"note":"Exploratory backtest; selecting best window on the same 500 days is not out-of-sample validation.","results":results}
    pathlib.Path(a.out).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(a.out).write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({k:{"days_hit":v["days_hit"],"total_nhay":v["total_nhay"]} for k,v in results.items()}))
if __name__=="__main__":main()
