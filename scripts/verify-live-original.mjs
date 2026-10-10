// KQ247 exact-source preservation check. Read-only: no POST, no credentials,
// no database writes, no scheduling and no customer links modified.
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const source="https://br-divine-resonance-az0qxt8z-kq247full.compute.c-3.ap-southeast-1.aws.neon.tech/?region=xsmb";
const archive=new URL("../reference/neon-kq247full-public-original.html",import.meta.url);
const saved=await readFile(archive);
const res=await fetch(source,{signal:AbortSignal.timeout(15000),cache:"no-store"});
if(!res.ok)throw new Error("Original Neon main not healthy: HTTP "+res.status);
const live=Buffer.from(await res.arrayBuffer());
const hash=x=>createHash("sha256").update(x).digest("hex");
const match=live.equals(saved);
const details={
  source, http:res.status, unchanged:match,
  archiveBytes:saved.byteLength, liveBytes:live.byteLength,
  sha256Archive:hash(saved), sha256Live:hash(live),
  scope:"public HTML/JavaScript only; private Neon backend source cannot be read from HTTP response",
  productionWrites:false
};
console.log(JSON.stringify(details,null,2));
if(!match)throw new Error("Public main has diverged from verified backup; DO NOT AUTO-REPLACE production source");
