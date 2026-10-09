import vm from 'node:vm';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const source=(await readFile('src/assessment-scene.js','utf8')).replace('export function','function');
function setup(reduced=false){
 let tick,clock=0,cancelled=0;const events={},classes=new Set();
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const canvas={dataset:{},getContext:()=>ctx},satellite={style:{},clientWidth:5,clientHeight:5},logo={clientWidth:120,clientHeight:120,querySelector:()=>satellite};
 const parent={};const doc={baseURI:'https://example.test/',hidden:false,body:{classList:{toggle(k,b){b?classes.add(k):classes.delete(k)},remove(k){classes.delete(k)}}},getElementById:id=>id==='capture-sky'?canvas:{getBoundingClientRect:()=>({left:100,top:150,width:400,height:300})},querySelector:()=>logo,addEventListener(){}};
 const sandbox={URL,document:doc,parent,window:{},location:{origin:'null'},matchMedia:()=>({matches:reduced}),innerWidth:1200,innerHeight:800,devicePixelRatio:1,performance:{now:()=>clock},requestAnimationFrame:f=>(tick=f,1),cancelAnimationFrame:()=>cancelled++,addEventListener:(n,f)=>events[n]=f,removeEventListener(){},Math};
 vm.runInNewContext(source+';initAssessmentScene();',sandbox);
 return {canvas,classes,events,parent,step(){clock+=50;tick(clock)},get cancelled(){return cancelled}};
}
const s=setup();for(let i=0;i<70;i++)s.step();assert.equal(s.canvas.dataset.phase,undefined,'must wait while embedded page is hidden');
s.events.message({source:s.parent,origin:'https://untrusted.test',data:'visage:assessment-enter'});assert.equal(s.canvas.dataset.phase,undefined);
s.events.message({source:s.parent,origin:'https://example.test',data:'visage:assessment-enter'});assert.equal(s.canvas.dataset.phase,'steady');assert.ok(!s.classes.has('scene-entering'));
for(let i=0;i<60;i++)s.step();assert.equal(s.canvas.dataset.phase,'steady');assert.ok(!s.classes.has('scene-entering'));s.events.pagehide();assert.equal(s.cancelled,1);
const r=setup(true);r.events.message({source:r.parent,origin:'https://example.test',data:'visage:assessment-enter'});assert.equal(r.canvas.dataset.phase,'steady');assert.ok(!r.classes.has('scene-entering'));
console.log('PASS: entry waits for visible iframe, inherited srcdoc origin, rejects foreign messages, no convergence animation, cleanup, reduced motion');
