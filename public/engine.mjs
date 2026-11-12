export const MAX_HEARTS=5, REGEN_MS=30*60*1000, RETRY_MS=5*60*1000;
export function freshState(){return {version:1,tier:null,hearts:5,coins:0,regenAt:null,completed:[[],[],[],[]],passed:[false,false,false,false],retryAt:[0,0,0,0],streak:0,lastDay:null,freeze:0};}
export function normalize(s){return String(s).normalize('NFKC').toLowerCase().replace(/[‘’ʻʼ`]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'');}
export function dayKey(now=Date.now()){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dayNumber(key){const [y,m,d]=key.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;}
export function settle(s,now=Date.now()){
 if(s.hearts<5&&s.regenAt&&now>=s.regenAt){const n=1+Math.floor((now-s.regenAt)/REGEN_MS);s.hearts=Math.min(5,s.hearts+n);s.regenAt=s.hearts===5?null:s.regenAt+n*REGEN_MS;}
 if(s.lastDay&&s.streak){const gap=dayNumber(dayKey(now))-dayNumber(s.lastDay);if(gap>1){if(gap===2&&s.freeze){s.freeze=0;s.lastDay=dayKey(now-86400000);}else {s.streak=0;s.lastDay=null;}}}
 return s;
}
export function loseHeart(s,now=Date.now()){if(s.hearts<=0)return false;s.hearts--;if(!s.regenAt)s.regenAt=now+REGEN_MS;return true;}
export function completeLevel(s,tier,level,now=Date.now()){settle(s,now);if(s.completed[tier].includes(level))return 0;if(level!==s.completed[tier].length+1)return 0;s.completed[tier].push(level);const reward=20+(level%10===0?10:0);s.coins+=reward;const today=dayKey(now);if(s.lastDay!==today){s.streak++;s.lastDay=today;}return reward;}
export function buy(s,item){settle(s);const cost={heart:150,refill:500,freeze:300}[item];if(!cost)return {ok:false,message:'Mahsulot topilmadi.'};if(item==='freeze'&&s.freeze)return {ok:false,message:'Sizda allaqachon himoya bor.'};if(item!=='freeze'&&s.hearts===5)return {ok:false,message:'Jonlaringiz to‘liq!'};if(s.coins<cost)return {ok:false,message:'Tangalar yetarli emas.'};s.coins-=cost;if(item==='freeze')s.freeze=1;else {s.hearts=item==='heart'?s.hearts+1:5;if(s.hearts===5)s.regenAt=null;}return {ok:true,message:item==='freeze'?'Strayk himoyasi olindi!':'Jonlar qo‘shildi!'};}

// ---- Fuzzy grading for English->Uzbek typing (write-uz ONLY) ----
// Thresholds (by length of the correct answer with spaces/hyphens removed):
//   <=4 letters : 0 typos (too many real words are 1-2 edits apart: suv/sut, ona/ota, it/oy)
//   5-6 letters : 1 typo
//   >=7 letters : 2 typos
// Protections: (1) a typed word that is itself another vocabulary answer is wrong;
// (2) the learner text must be strictly closer to the target than to any other vocabulary
// answer; (3) the first letter must match when 2 typos are used.
const sepless=s=>normalize(s).replace(/[\s-]+/g,'');
const spaced=s=>normalize(s).replace(/-/g,' ').replace(/\s+/g,' ').trim();
export function editDistance(a,b){ // Damerau (adjacent swap = 1 edit)
 const d=Array.from({length:a.length+1},(_,i)=>{const r=new Array(b.length+1).fill(0);r[0]=i;return r;});
 for(let j=0;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}
 return d[a.length][b.length];
}
// Longest vocabulary phrase is 26 chars; inputs beyond this bound can never be a valid answer,
// and bounding them keeps the edit-distance matrices small (<= 100 x answer length).
export const MAX_GRADE_INPUT=100;
export function maxTypos(len){return len<=4?0:len<=6?1:2;}
function markDiff(g,a){let p=0;while(p<g.length&&p<a.length&&g[p]===a[p])p++;let s=0;while(s<g.length-p&&s<a.length-p&&g[g.length-1-s]===a[a.length-1-s])s++;
 const mk=x=>x.slice(0,p)+'['+x.slice(p,x.length-s)+']'+x.slice(x.length-s);return {given:mk(g),answer:mk(a),position:p+1};}
// vocab: array of all Uzbek answers (strings). Returns {ok,kind,feedback,...}; kind: exact|separator|typo|wrong
// Small CURATED list of real Uzbek words that are NOT in the app vocabulary but are one or two
// edits away from a vocabulary answer (found by review). It is not a dictionary; extend it when
// a new false positive is found. Entries are compared after normalize() with spaces/hyphens removed.
export const KNOWN_OTHER_WORDS=['tort','ochmoq','yechin','kech','tahlil'];
const OTHER=new Set(KNOWN_OTHER_WORDS.map(sepless));
const tokens=s=>spaced(s).split(' ').filter(Boolean);
// Per-token guard: a typed word that is a known other word (or another vocabulary word) and is not
// one of the answer's own words means the learner wrote a different word, not a typo.
function otherTokenGuard(given,answer,vocab){
 const own=new Set(tokens(answer).map(sepless));
 const known=new Set([...OTHER]);for(const v of vocab)if(sepless(v)!==sepless(answer))for(const t of tokens(v))if(t.length>=4)known.add(sepless(t));
 return tokens(given).some(t=>{const k=sepless(t);return !own.has(k)&&known.has(k);})||(OTHER.has(sepless(given))&&!own.has(sepless(given)));
}
export function gradeUzbek(given,answer,vocab=[]){
 if(String(given).trim().length>MAX_GRADE_INPUT)return {ok:false,kind:'wrong'};
 const g=sepless(given),a=sepless(answer);
 if(!g)return {ok:false,kind:'wrong'};
 if(g===a){
  if(normalize(given)===normalize(answer)||spaced(given)===spaced(answer))return {ok:true,kind:'exact'};
  return {ok:true,kind:'separator',given:given.trim(),answer,feedback:`✓ To‘g‘ri! Faqat chiziqcha/bo‘shliqqa e’tibor bering. Siz yozdingiz: ${given.trim()} → To‘g‘ri yozilishi: ${answer}`};
 }
 const limit=maxTypos(a.length),dist=editDistance(g,a);
 const wrong={ok:false,kind:'wrong'};
 if(!limit||dist>limit||Math.abs(g.length-a.length)>limit)return wrong;
 if(dist>=2&&g[0]!==a[0])return wrong;
 if(otherTokenGuard(given,answer,vocab))return wrong;
 for(const v of vocab){const o=sepless(v);if(o===a)continue;if(o===g||editDistance(g,o)<=dist)return wrong;}
 const m=markDiff(spaced(given),spaced(answer));
 return {ok:true,kind:'typo',typos:dist,given:given.trim(),answer,feedback:`✓ Deyarli to‘g‘ri! Kichik imlo xatosi: ${dist} ta harf. Siz yozdingiz: ${given.trim()} → To‘g‘ri yozilishi: ${answer}. Xato joyi (${m.position}-belgi atrofida): ${m.given} → ${m.answer}`};
}
