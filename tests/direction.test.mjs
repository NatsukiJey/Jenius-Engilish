import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WORDS,questions,QUESTION_TYPES,promptOf,answerOf,instructionOf} from '../public/data.mjs';
const ORDER=['choice','assemble','write-en','choice-reverse','write-uz'];
const other=l=>l==='en'?'uz':'en';
const slots=[];
for(let t=0;t<4;t++){for(let l=1;l<=50;l++)slots.push({t,l,exam:false});slots.push({t,l:50,exam:true});}
let counts={lesson:0,exam:0,choice:0};
function checkQ(q,where){
 const spec=QUESTION_TYPES[q.type];assert.ok(spec,where+' type');
 assert.equal(promptOf(q.type,q.word),q.word[spec.promptLang],where);
 assert.equal(answerOf(q.type,q.word),q.word[spec.answerLang],where);
 assert.notEqual(spec.promptLang,spec.answerLang,where);
 assert.match(instructionOf(q.type),/\S/);
 if(q.type.startsWith('choice')){
  assert.equal(q.choices.length,4,where);assert.equal(new Set(q.choices).size,4,where);
  const ans=answerOf(q.type,q.word);
  assert.equal(q.choices.filter(c=>c===ans).length,1,where+' correct once');
  assert.ok(!q.choices.includes(promptOf(q.type,q.word)),where+' prompt leaked into options');
  // every option must be a real word in the answer language
  const pool=new Set(WORDS.flat().map(w=>w[spec.answerLang]));
  for(const c of q.choices)assert.ok(pool.has(c),where+' option not in answer language: '+c);
  counts.choice++;
 }
}
test('single helper defines direction for each type',()=>{
 assert.deepEqual(Object.keys(QUESTION_TYPES),ORDER);
 for(const t of ['choice','write-uz'])assert.equal(QUESTION_TYPES[t].promptLang,t==='choice'?'en':'en');
 assert.equal(QUESTION_TYPES['choice-reverse'].promptLang,'uz');assert.equal(QUESTION_TYPES['choice-reverse'].answerLang,'en');
 for(const t of ['assemble','write-en'])assert.deepEqual([QUESTION_TYPES[t].promptLang,QUESTION_TYPES[t].answerLang],['uz','en']);
 assert.deepEqual([QUESTION_TYPES['write-uz'].promptLang,QUESTION_TYPES['write-uz'].answerLang],['en','uz']);
 assert.deepEqual([QUESTION_TYPES.choice.promptLang,QUESTION_TYPES.choice.answerLang],['en','uz']);
});
test('all 1000 lesson slots and 40 exam slots: direction, choices, order',()=>{
 for(const {t,l,exam} of slots){
  const qs=questions(t,l,exam);assert.equal(qs.length,exam?10:5);
  qs.forEach((q,i)=>{assert.equal(q.type,ORDER[i%5],'question order');checkQ(q,`tier${t} ${exam?'exam':'lesson'}${l} q${i+1}`);});
  counts[exam?'exam':'lesson']+=1;
 }
 assert.equal(counts.lesson,200);assert.equal(counts.exam,4);
});
test('lesson slots total 1000 questions; exams total 40',()=>{
 let lq=0,eq=0;for(const {t,l,exam} of slots){const n=questions(t,l,exam).length;if(exam)eq+=n;else lq+=n;}
 assert.equal(lq,1000);assert.equal(eq,40);
});
test('sun/quyosh regression: Beginner level 2 question 4',()=>{
 const q=questions(0,2)[3];assert.equal(q.word.en,'sun');assert.equal(q.type,'choice-reverse');
 assert.equal(promptOf(q.type,q.word),'quyosh');
 assert.ok(q.choices.includes('sun'));assert.ok(!q.choices.includes('quyosh'));
 assert.equal(q.choices.filter(c=>c==='sun').length,1);
 assert.deepEqual([...q.choices].sort(),['friend','green','house','sun']);
});
test('app.mjs renders prompt, instruction and answer via the shared helpers only',async()=>{
 const src=await readFile(new URL('../public/app.mjs',import.meta.url),'utf8');
 assert.match(src,/promptOf\(q\.type,q\.word\)/);assert.match(src,/answerOf\(q\.type,q\.word\)/);assert.match(src,/instructionOf\(q\.type\)/);
 assert.ok(!/reverse\|\|/.test(src));assert.ok(!/q\.word\.(en|uz)\)\}<\/div>/.test(src),'no hard-coded prompt language');
});
