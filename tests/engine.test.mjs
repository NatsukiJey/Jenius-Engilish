import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,settle,normalize,gradeUzbek,MAX_GRADE_INPUT,editDistance,maxTypos,loseHeart,completeLevel,buy,REGEN_MS,RETRY_MS,dayKey} from '../public/engine.mjs';
import {TIERS,WORDS,questions,lessonWords} from '../public/data.mjs';
test('4 stages × 50 levels × 5 questions, vocabulary and translation integrity',()=>{
 assert.equal(TIERS.length,4);for(let t=0;t<4;t++){assert.equal(WORDS[t].length,50);for(let l=1;l<=50;l++){const qs=questions(t,l);assert.equal(qs.length,5);assert.equal(new Set(qs.map(q=>q.type)).size,5);assert.deepEqual(qs.map(q=>q.word),lessonWords(t,l));for(const q of qs){assert.ok(q.word.en&&q.word.uz);if(q.type.startsWith('choice')){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.choices.includes(q.type==='choice'?q.word.uz:q.word.en));}}}assert.equal(questions(t,50,true).length,10);}
});
test('new progress and normalized Uzbek apostrophes',()=>{const s=freshState();assert.equal(s.hearts,5);assert.equal(s.coins,0);assert.equal(normalize('  DO‘ST!  '),normalize("do'st"));assert.equal(normalize(' THANK   YOU '),'thank you');});
test('hearts regenerate every 30 minutes, capped at five',()=>{const s=freshState(),now=100000;for(let i=0;i<5;i++)assert.ok(loseHeart(s,now));assert.equal(s.hearts,0);assert.equal(loseHeart(s,now),false);settle(s,now+REGEN_MS-1);assert.equal(s.hearts,0);settle(s,now+REGEN_MS);assert.equal(s.hearts,1);settle(s,now+5*REGEN_MS);assert.equal(s.hearts,5);assert.equal(s.regenAt,null);});
test('exact economy and replay farming blocked',()=>{const s=freshState();for(let l=1;l<=50;l++)completeLevel(s,0,l);assert.equal(s.coins,1050);assert.equal(s.completed[0].length,50);assert.equal(completeLevel(s,0,1),0);assert.equal(s.coins,1050);assert.equal(completeLevel(s,1,4),0);});
test('shop: prices, caps, no overspending, single freeze',()=>{const s=freshState();assert.equal(buy(s,'heart').ok,false);s.coins=1000;s.hearts=2;assert.equal(buy(s,'heart').ok,true);assert.equal(s.coins,850);assert.equal(s.hearts,3);assert.equal(buy(s,'refill').ok,true);assert.equal(s.coins,350);assert.equal(s.hearts,5);assert.equal(buy(s,'freeze').ok,true);assert.equal(s.coins,50);assert.equal(buy(s,'freeze').ok,false);assert.equal(buy(s,'refill').ok,false);assert.equal(buy(s,'unknown').ok,false);});
test('streak increments once daily and resets after a missed day',()=>{const s=freshState();const date=new Date(2026,10,10,12).getTime();completeLevel(s,0,1,date);completeLevel(s,0,2,date);assert.equal(s.streak,1);completeLevel(s,0,3,date+86400000);assert.equal(s.streak,2);settle(s,date+3*86400000);assert.equal(s.streak,0);});
test('one-day freeze works; two skipped days do not',()=>{const date=new Date(2026,10,10,12).getTime();const s=freshState();completeLevel(s,0,1,date);s.freeze=1;settle(s,date+2*86400000);assert.equal(s.streak,1);assert.equal(s.freeze,0);completeLevel(s,0,2,date+2*86400000);assert.equal(s.streak,2);const t=freshState();completeLevel(t,0,1,date);t.freeze=1;settle(t,date+3*86400000);assert.equal(t.streak,0);});
test('test retry interval is precisely five minutes',()=>assert.equal(RETRY_MS,300000));

const VOCAB=WORDS.flat().map(w=>w.uz);
const g=(given,answer)=>gradeUzbek(given,answer,VOCAB);
test('write-uz: exact matches, case and Uzbek apostrophes are plain correct',()=>{
 for(const [x,a] of [['olma','olma'],['OLMA ','olma'],["do'st",'do‘st'],['do’st','do‘st'],['DOʻST','do‘st'],['kechki  ovqat','kechki ovqat']]){const r=g(x,a);assert.equal(r.ok,true,x);assert.equal(r.kind,'exact',x);assert.equal(r.feedback,undefined);}
});
test('write-uz: hyphen/space variation tolerated; omitted hyphen gets feedback',()=>{
 assert.equal(g('ob havo','ob-havo').kind,'exact');
 const r=g('obhavo','ob-havo');assert.equal(r.ok,true);assert.equal(r.kind,'separator');assert.match(r.feedback,/obhavo/);assert.match(r.feedback,/ob-havo/);
 assert.equal(g('uyvazifasi','uy vazifasi').ok,true);
});
test('write-uz: one typo in 5+ letter words is accepted with located feedback',()=>{
 const r=g('mushuk','mushuk');assert.equal(r.kind,'exact');
 const a=g('maktap','maktab');assert.equal(a.ok,true);assert.equal(a.kind,'typo');assert.match(a.feedback,/maktap/);assert.match(a.feedback,/maktab/);assert.match(a.feedback,/\[p\]/);assert.match(a.feedback,/\[b\]/);
 assert.equal(g('maktb','maktab').ok,true);   // missing letter
 assert.equal(g('maktaab','maktab').ok,true); // extra letter
 assert.equal(g('maktba','maktab').ok,true);  // swapped letters
 assert.equal(g('qalam','qalam').ok,true);
});
test('write-uz: two typos only in long words (7+)',()=>{
 assert.equal(g('shifoxna','shifoxona').ok,true);
 const r=g('shefoxnoa','shifoxona');assert.equal(r.ok,true);assert.equal(r.typos,2);
 assert.equal(g('shifoxnaa','shifoxona').ok,true);
 assert.equal(g('sheefoxona','shifoxona').ok,true);
 assert.equal(g('sheifxona','shifoxona').ok,true);
 assert.equal(g('shefxona','shifoxona').ok,true);
 assert.equal(g('kitbo','kitob').ok,true);          // 5 letters, 1 swap
 assert.equal(g('kotbo','kitob').ok,false);          // 5 letters: 2 typos not allowed
 assert.equal(g('olmx','olma').ok,false);           // 4 letters strict
 assert.equal(g('aeropurt','aeroport').ok,true);
 assert.equal(g('shefoxnoq','shifoxona').ok,false); // 3 typos
 assert.equal(g('kmtbx','kitob').ok,false);
});
test('write-uz: Uzbek apostrophe omission counts as one typo only where allowed',()=>{
 assert.equal(g('bog‘','bog‘').kind,'exact');
 assert.equal(g('dost','do‘st').ok,true);        // apostrophe counts as a letter: 5 chars, 1 typo
 assert.equal(g('yomgir','yomg‘ir').ok,true);   // missing apostrophe, 1 typo
 assert.equal(g("yomg'ir",'yomg‘ir').kind,'exact');
});
test('write-uz: short words and other vocabulary are never fuzzy-accepted',()=>{
 for(const [x,a] of [['sut','suv'],['uy','it'],['oy','uy'],['ota','ona'],['opa','ona'],['kun','tun'],['tun','kun'],['stul','stol'],['non','nom'],['ha','yo‘q'],['bir','biz'],['ikk','ikki'],['uch','ich']])assert.equal(g(x,a).ok,false,`${x} for ${a}`);
 assert.equal(g('ikki','ikki').ok,true);
 assert.equal(maxTypos(3),0);assert.equal(maxTypos(5),1);assert.equal(maxTypos(7),2);
 // Every vocabulary word typed for a DIFFERENT word is rejected
 for(const t of WORDS)for(const w of t)for(const o of VOCAB){if(o!==w.uz&&o.replace(/[\s-]/g,'')!==w.uz.replace(/[\s-]/g,''))assert.equal(g(o,w.uz).ok,false,`${o} for ${w.uz}`);}
});
test('write-uz: clearly wrong and empty answers rejected',()=>{
 for(const x of ['','   ','kitob','banan','xxxxxx','apple','12345'])assert.equal(g(x,'maktab').ok,false,x);
 assert.equal(g('olma','shifoxona').ok,false);
 assert.equal(editDistance('ab','ba'),1);
});
test('strict modes stay strict: normalize does not forgive typos',()=>{
 assert.notEqual(normalize('aple'),normalize('apple'));assert.notEqual(normalize('maktap'),normalize('maktab'));
 assert.notEqual(normalize('obhavo'),normalize('ob-havo'));
});
test('app.mjs applies fuzzy grading only to write-uz and keeps hearts rule',async()=>{
 const {readFile}=await import('node:fs/promises');const src=await readFile(new URL('../public/app.mjs',import.meta.url),'utf8');
 assert.match(src,/q\.type==='write-uz'\?gradeUzbek/);assert.equal((src.match(/gradeUzbek\(/g)||[]).length,1);
 assert.match(src,/else\{s\.mistakes\+\+;if\(!q\.type\.startsWith\('write'\)\)loseHeart/);
});
test('gradeUzbek rejects absurdly long input quickly (bounded edit distance)',()=>{
 const longest=WORDS.flat().reduce((m,w)=>Math.max(m,w.uz.length),0);
 assert.ok(longest<=MAX_GRADE_INPUT/2,'bound must be generous vs longest vocabulary phrase');
 for(const w of WORDS.flat())assert.equal(gradeUzbek(w.uz,w.uz).ok,true);
 const t=Date.now();
 for(const huge of ['a'.repeat(200000),'kitob '.repeat(50000),'kitob'+' '.repeat(1e6)+'x'])assert.deepEqual(gradeUzbek(huge,'kitob',['kitob','kitop']),{ok:false,kind:'wrong'});
 assert.ok(Date.now()-t<1000);
 assert.equal(gradeUzbek('kitpb','kitob',['kitob']).ok,true);
});
test('write-uz: curated known-other-word guard rejects documented false positives',()=>{
 for(const [x,a] of [['tort','to‘rt'],['ochmoq','oshmoq'],['yechin','yechim'],['kech','kecha'],['tahlil qilmoq','taklif qilmoq'],['Tort ','to‘rt'],['tahlil  qilmoq','taklif qilmoq']]){const r=g(x,a);assert.equal(r.ok,false,x+' -> '+a);}
 // the correct answers and existing safe typo/separator acceptance still work
 for(const [x,a,k] of [['to‘rt','to‘rt','exact'],['oshmoq','oshmoq','exact'],['yechim','yechim','exact'],['kecha','kecha','exact'],['taklif qilmoq','taklif qilmoq','exact'],['maktap','maktab','typo'],['shefoxnoa','shifoxona','typo'],['obhavo','ob-havo','separator'],['taklif qilmok','taklif qilmoq','typo']]){const r=g(x,a);assert.equal(r.ok,true,x);assert.equal(r.kind,k,x);}
});
