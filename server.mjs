import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
let config={};try{config=JSON.parse(await readFile(path.join(root,'telegram-config.json'),'utf8'));}catch{}
const limits=new Map();const allowed=new Set(['/','/index.html','/style.css','/app.mjs','/data.mjs','/engine.mjs']);
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/api/report'){
  if(req.method!=='POST'){res.writeHead(405);return res.end();}
  const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`){res.writeHead(403);return res.end();}
  const key=req.socket.remoteAddress;const now=Date.now();for(const [ip,time] of limits)if(now-time>60000)limits.delete(ip);
  if(limits.has(key)){res.writeHead(429,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Bir daqiqadan keyin qayta urinib ko‘ring.'}));}
  let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000){res.writeHead(413);res.end();return;}}const data=JSON.parse(body);const message=typeof data.message==='string'?data.message.trim():'';
   if(message.length<10||message.length>2000){res.writeHead(400,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Xabar 10–2000 belgidan iborat bo‘lsin.'}));}
   if(!config.token||!config.chatId){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Telegram hali sozlanmagan.'}));}
   limits.set(key,now);
   const upstream=await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:config.chatId,text:`🐛 Jenius — xatolik xabari\n\n${message}`}),signal:AbortSignal.timeout(12000)});const result=await upstream.json();
   res.writeHead(result.ok?200:502,{'Content-Type':'application/json'});res.end(JSON.stringify(result.ok?{ok:true,messageId:result.result.message_id}:{error:'Telegram xabarni qabul qilmadi. Keyinroq urinib ko‘ring.'}));
  }catch{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Xabar yuborilmadi. Internetni tekshirib qayta urinib ko‘ring.'}));}return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 if(!allowed.has(pathname)){res.writeHead(404);return res.end('Not found');}
 try{const file=pathname==='/'?'index.html':pathname.slice(1);const bytes=await readFile(path.join(root,'public',file));const type=file.endsWith('.css')?'text/css':file.endsWith('.mjs')?'text/javascript':'text/html';res.writeHead(200,{'Content-Type':`${type}; charset=utf-8`,'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end('Not found');}
});
const port=Number(process.env.PORT||4173);const host=process.env.HOST||'127.0.0.1';server.listen(port,host,()=>console.log(`Jenius ready: http://${host}:${port}`));
