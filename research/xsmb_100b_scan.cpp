#include <bits/stdc++.h>
using namespace std;
struct Day { string date; array<uint8_t,27> v{}; array<uint8_t,64> f{}; array<uint8_t,100> has{}; };
struct Candidate { int a,b,lag,op,tr,off,train; };
struct MinTraining { bool operator()(const Candidate& x,const Candidate& y)const { return x.train>y.train; } };
inline int rev(int x){return 10*(x%10)+x/10;}
inline int opfn(int a,int b,int z){switch(z){case 0:return (a+b)%100;case 1:return (a-b+100)%100;case 2:return abs(a-b);case 3:return a*b%100;case 4:return (a/10)*10+b%10;case 5:return (b/10)*10+a%10;default:return (a+2*b)%100;}}
inline int trfn(int x,int z){int r=rev(x);switch(z){case 0:return x;case 1:return r;case 2:return 99-x;case 3:return (x+r)%100;case 4:return (x+100-r)%100;case 5:return x*3%100;case 6:return x*7%100;case 7:return x*9%100;case 8:return x*x%100;default:return ((x/10+x%10)%10)*11;}}
inline int predict(const vector<Day>& d,int t,const Candidate& c){return (trfn(opfn(d[t-1].f[c.a],d[t-c.lag].f[c.b],c.op),c.tr)+c.off)%100;}
void features(Day& d){int sum=0,ten=0,ones=0,w=0,alt=0,xx=0;
 for(int i=0;i<27;i++){int v=d.v[i];d.f[i]=v;d.f[27+i]=rev(v);d.has[v]=1;sum+=v;ten+=v/10;ones+=v%10;w+=(i+1)*v;alt+=(i&1)?-v:v;xx^=v;
 int g=i<7?0:i<14?1:i<21?2:3;d.f[55+g]=(d.f[55+g]+v)%100;}
 d.f[54]=sum%100;d.f[59]=ten%100;d.f[60]=ones%100;d.f[61]=w%100;d.f[62]=abs(alt)%100;d.f[63]=xx%100;
}
int main(){ios::sync_with_stdio(false);ifstream in("xsmb-2-digits.csv");if(!in){cerr<<"DATA_MISSING\n";return 2;}string s;getline(in,s);vector<Day> d;
 while(getline(in,s)){if(s.empty())continue;stringstream ss(s);Day x;getline(ss,x.date,',');int k=0;string part;
 while(getline(ss,part,',')&&k<27){try{int v=stoi(part);if(v<0||v>=100)break;x.v[k++]=(uint8_t)v;}catch(...){break;}}
 if(k==27){features(x);d.push_back(x);}}
 if(d.size()<520){cerr<<"INSUFFICIENT_DRAWS "<<d.size()<<"\n";return 3;}
 const int start=(int)d.size()-500;
 cout<<"SOURCE_DRAWS "<<d.size()<<" TARGET_FROM "<<d[start].date<<" TARGET_TO "<<d.back().date<<"\n"<<flush;
 priority_queue<Candidate,vector<Candidate>,MinTraining> pool;
 constexpr int POOL_SIZE=512;
 uint64_t base=0,digestVal=0,digestTest=0;
 for(int a=0;a<64;a++)for(int b=0;b<64;b++)for(int lag=1;lag<=7;lag++)for(int op=0;op<7;op++)for(int tr=0;tr<10;tr++){
  ++base;uint16_t hit[3][100]{};uint16_t stamp[100]{};
  for(int i=0;i<500;i++){int t=start+i;int fold=i<250?0:i<375?1:2;
   int z=trfn(opfn(d[t-1].f[a],d[t-lag].f[b],op),tr);
   for(uint8_t v:d[t].v){int offset=(int)v-z;if(offset<0)offset+=100;
    if(stamp[offset]!=(uint16_t)(i+1)){stamp[offset]=(uint16_t)(i+1);hit[fold][offset]++;}}
  }
  for(int offset=0;offset<100;offset++){
   digestVal+=(uint64_t)(offset+1)*hit[1][offset];digestTest+=(uint64_t)(offset+1)*hit[2][offset];
   int score=hit[0][offset];if(pool.size()<POOL_SIZE||score>pool.top().train){
    pool.push({a,b,lag,op,tr,offset,score});if(pool.size()>POOL_SIZE)pool.pop();
   }
  }
 }
 cout<<"BASE_VARIANTS "<<base<<" FORMULAS "<<base*100<<" FORMULA_DAY_CASES "<<base*100*500ULL
     <<" OFFSET_UPDATES "<<base*500*27ULL<<" VALIDATION_DIGEST "<<digestVal<<" TEST_DIGEST "<<digestTest<<"\n";
 vector<Candidate> finalists;while(!pool.empty()){finalists.push_back(pool.top());pool.pop();}
 sort(finalists.begin(),finalists.end(),[](const Candidate&a,const Candidate&b){return a.train>b.train;});
 cout<<"TOP_TRAIN "<<finalists[0].train<<"/250; candidate_pool="<<finalists.size()<<"\n";
 vector<Candidate> chosen;array<uint8_t,125> coverage{};
 for(int stage=0;stage<3;stage++){int bestIndex=-1,bestNew=-1,bestTrain=-1;
  for(int j=0;j<(int)finalists.size();j++){const auto& c=finalists[j];bool dup=false;
   for(const auto& s:chosen)if(c.a==s.a&&c.b==s.b&&c.lag==s.lag&&c.op==s.op&&c.tr==s.tr&&c.off==s.off)dup=true;
   if(dup)continue;int gain=0;
   for(int k=0;k<125;k++)if(!coverage[k])gain+=d[start+250+k].has[predict(d,start+250+k,c)];
   if(gain>bestNew||(gain==bestNew&&c.train>bestTrain)){bestNew=gain;bestIndex=j;bestTrain=c.train;}
  }
  Candidate c=finalists[bestIndex];chosen.push_back(c);
  for(int k=0;k<125;k++)coverage[k]|=d[start+250+k].has[predict(d,start+250+k,c)];
  cout<<"CHOSEN_"<<stage+1<<" a="<<c.a<<" b="<<c.b<<" lag="<<c.lag<<" operation="<<c.op
      <<" transform="<<c.tr<<" offset="<<c.off<<" train="<<c.train<<" extra_validation_days="<<bestNew<<"\n";
 }
 int hist[3][7]{};
 for(int i=0;i<500;i++){int t=start+i;int preds[3]{};
  for(int j=0;j<3;j++){int n=predict(d,t,chosen[j]);bool dup=true;
   while(dup){dup=false;for(int k=0;k<j;k++)if(preds[k]==n){dup=true;n=(n+1)%100;break;}}
   preds[j]=n;
  }
  int n=0;for(uint8_t v:d[t].v)for(int p:preds)if((int)v==p){n++;break;}
  int fold=i<250?0:i<375?1:2;hist[fold][min(6,n)]++;
 }
 for(int k=0;k<3;k++){int atLeast1=0,atLeast2=0;for(int j=1;j<=6;j++)atLeast1+=hist[k][j];for(int j=2;j<=6;j++)atLeast2+=hist[k][j];
  cout<<(k==0?"TRAIN":k==1?"VALIDATION":"TEST")<<" >=1 "<<atLeast1<<"/"<<(k==0?250:125)
  <<" >=2 "<<atLeast2<<" HIST[0,1,2,3,4,5,6+] "<<hist[k][0]<<" "<<hist[k][1]<<" "<<hist[k][2]<<" "<<hist[k][3]<<" "<<hist[k][4]<<" "<<hist[k][5]<<" "<<hist[k][6]<<"\n";
 }
}