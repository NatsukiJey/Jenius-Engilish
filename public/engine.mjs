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
