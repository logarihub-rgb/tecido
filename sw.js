const C='tecido-v4';
const ARQ=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ARQ)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
// envia os lançamentos guardados no celular quando a internet volta (mesmo com o app fechado)
function idb(){return new Promise((ok,er)=>{const r=indexedDB.open('tecido',1);r.onupgradeneeded=()=>r.result.createObjectStore('fila',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)})}
function todos(db){return new Promise((ok,er)=>{const r=db.transaction('fila').objectStore('fila').getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>er(r.error)})}
function apaga(db,id){return new Promise(ok=>{const tx=db.transaction('fila','readwrite');tx.objectStore('fila').delete(id);tx.oncomplete=ok;tx.onerror=ok})}
async function avisa(m){const cs=await self.clients.matchAll({includeUncontrolled:true,type:'window'});cs.forEach(c=>c.postMessage(m))}
async function envia(){
  const db=await idb(),itens=await todos(db);
  for(const it of itens){
    const res=await fetch(it.api,{method:'POST',body:JSON.stringify({pin:it.pin,action:it.a,p:Object.assign({},it.p,{_id:it.id})})});
    const r=await res.json();
    await apaga(db,it.id);
    await avisa({tipo:'feito',id:it.id,ok:!!r.ok,msg:r.msg,erro:r.erro,data:r.ok?r.data:null});
  }
}
self.addEventListener('sync',e=>{if(e.tag==='fila')e.waitUntil(envia())});
