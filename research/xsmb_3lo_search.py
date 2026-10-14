#!/usr/bin/env python3
"""Isolated XSMB 3-number research runner. Never modifies production.
Uses historical results strictly before each predicted draw.
Requires Python 3.11+. Run: python3 research/xsmb_3lo_search.py --seconds 3600
"""
import argparse,csv,json,math,random,time,pathlib,collections
def load(path):
    with open(path,encoding="utf-8-sig",newline="") as f:
        rows=list(csv.DictReader(f))
    if any(len(r["numbers"].split())!=27 for r in rows):
        raise ValueError("Every draw must have exactly 27 two-digit endings")
    return [(r["date"],[int(x) for x in r["numbers"].split()]) for r in rows]
def evaluate(rows,cfg,days=500):
    window,decay,penalty,neighbor,double,offset=cfg
    hits=nhay=0; parts=[0]*5
    for i in range(len(rows)-days,len(rows)):
        scores=[0.0]*100
        for j in range(i-window,i):
            weight=math.exp(-decay*(i-j-1))
            for v in rows[j][1]: scores[v]+=weight
        for v in set(rows[i-1][1]): scores[v]-=penalty
        for v in rows[i-1][1]:
            scores[(v+1)%100]+=neighbor
            scores[(v-1)%100]+=neighbor
            scores[(v*2+offset)%100]+=double
        pick=sorted(range(100),key=lambda x:(-scores[x],x))[:3]
        k=sum(v in pick for v in rows[i][1])
        hits+=k>0;nhay+=k;parts[(i-(len(rows)-days))//100]+=k>0
    return {"hits":hits,"nhay":nhay,"parts":parts}
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--csv",default="research/data/xsmb_27_endings.csv")
    ap.add_argument("--seconds",type=int,default=3600)
    ap.add_argument("--seed",type=int,default=20261014)
    ap.add_argument("--out",default="research/results/xsmb_3lo_search_progress.json")
    args=ap.parse_args()
    rows=load(args.csv)
    if len(rows)<600:raise ValueError("Need >=600 draws")
    random.seed(args.seed)
    output=pathlib.Path(args.out);output.parent.mkdir(parents=True,exist_ok=True)
    best={"hits":-1};tested=0;start=time.monotonic()
    while time.monotonic()-start<args.seconds:
        cfg=(random.choice([10,14,21,30,45,60,90]),
             random.choice([0,.01,.02,.03,.04,.06,.08]),
             random.choice([0,1,2,3,4]),
             random.choice([0,1,2,3,4,5,6]),
             random.choice([0,.5,1,1.5,2,3]),
             random.choice([-2,-1,0,1,2]))
        result=evaluate(rows,cfg)
        tested+=1
        if result["hits"]>best["hits"]:
            best={**result,"config":cfg}
        if tested%25==0:
            report={"tested":tested,"elapsed_seconds":round(time.monotonic()-start,2),
                    "best":best,"target":360,"production_updated":False,
                    "warning":"Exploratory in-sample optimization only; independent holdout required."}
            output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
            print(f"tested={tested} best={best['hits']}/500 nhay={best['nhay']}",flush=True)
    output.write_text(json.dumps({"tested":tested,"best":best,"production_updated":False,
        "warning":"In-sample search; do not deploy without independent validation."},indent=2),encoding="utf-8")
if __name__=="__main__":main()
