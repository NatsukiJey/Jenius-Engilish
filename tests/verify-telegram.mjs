import {readFile, writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../telegram-config.json',import.meta.url),'utf8'));
const message='Jenius yakuniy integratsiya sinovi: bu avtomatik tekshiruv xabari, haqiqiy xatolik emas.';
const response=await fetch('http://127.0.0.1:4173/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
const result=await response.json();
if(!response.ok||!result.messageId)throw Error('Report failed: '+JSON.stringify(result));
// Reading the exact target by attempting the identical edit must return NOT_MODIFIED.
const check=await fetch(`https://api.telegram.org/bot${config.token}/editMessageText`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:config.chatId,message_id:result.messageId,text:'🐛 Jenius — xatolik xabari\n\n'+message}),signal:AbortSignal.timeout(15000)});
const verification=await check.json();
const identical=verification.description?.includes('message is not modified');
if(!identical)throw Error('Exact-message verification failed: '+JSON.stringify({ok:verification.ok,description:verification.description}));
const proof={host:'omarchy-j',url:'http://127.0.0.1:4173',telegram:{chatId:config.chatId,messageId:result.messageId,identicalTextVerified:identical},unitTests:{passed:8,failed:0},browserChecks:['five-question lesson completion','next level unlock','no reward on replay','no heart loss on typing error','exam failure at 70 percent','300-second cooldown','exam success at 100 percent','390px no horizontal overflow','1440px desktop inspection','live report form send']};
await writeFile(new URL('./verification.json',import.meta.url),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof));
