import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const compiled=await transform(await readFile('src/TechText.jsx','utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'});
function fixture(reduced=false){
 const effects=[],frames=new Map(),events={},refs=[];let id=0,clears=0,disconnected=0;
 const context=new Proxy({measureText(t){const size=parseFloat(this.font?.match(/(\d+(?:\.\d+)?)px/)?.[1]||'64');return {width:t.length*size*.58,actualBoundingBoxLeft:0,actualBoundingBoxRight:t.length*size*.58,actualBoundingBoxAscent:size*.75,actualBoundingBoxDescent:size*.1}},clearRect(){clears++},createRadialGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}}});
 const canvas=()=>({width:0,height:0,getContext:()=>context});
 const container={clientWidth:320,clientHeight:105,dataset:{},style:{},getBoundingClientRect:()=>({left:0,top:0,right:320,bottom:105}),addEventListener(n,f){events[n]=f},removeEventListener(n){delete events[n]}};
 const doc={hidden:false,body:{dataset:{}},createElement:canvas,addEventListener(n,f){events[n]=f},removeEventListener(n){delete events[n]}};
 const observers=[];class Observer{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){disconnected++}}
 const sandbox={module:{exports:{}},exports:{},require(name){
  if(name==='react')return {useEffect:f=>effects.push(f),useRef:v=>{const ref={current:v};refs.push(ref);return ref}};
  if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name.endsWith('.css'))return {};
  throw Error(name);
 },document:doc,window:{devicePixelRatio:3,matchMedia:()=>({matches:reduced})},getComputedStyle:()=>({fontFamily:'Orbitron'}),performance:{now:()=>0},ResizeObserver:Observer,IntersectionObserver:Observer,MutationObserver:Observer,requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:i=>frames.delete(i),console};
 vm.runInNewContext(compiled.code,sandbox);
 const output=sandbox.module.exports.default({text:'your visage',fontSize:70,align:'left',labels:false,draggable:false});
 refs[0].current=container;refs[1].current=canvas();
 const cleanup=effects.map(f=>f()).filter(Boolean);
 const tick=(now=16)=>{const [i,f]=frames.entries().next().value||[];assert.ok(f,'expected scheduled paint');frames.delete(i);f(now)};
 return {container,doc,frames,events,observers,tick,cleanup,paintCount:()=>clears,disconnected:()=>disconnected};
}
const f=fixture();f.tick();assert.equal(f.container.dataset.rendered,'true');assert.ok(f.paintCount()>0);
f.doc.body.dataset.view='assessment';f.observers.at(-1).fn();assert.equal(f.frames.size,0);
f.doc.body.dataset.view='home';f.observers.at(-1).fn();assert.equal(f.frames.size,1);f.tick(32);
f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.frames.size,0);
f.doc.hidden=false;f.events.visibilitychange();assert.equal(f.frames.size,1);
f.cleanup.forEach(fn=>fn());assert.equal(f.frames.size,0);assert.equal(f.disconnected(),3);assert.equal(Object.keys(f.events).length,0);
const quiet=fixture(true);quiet.tick();assert.equal(quiet.frames.size,0,'reduced motion must stop idle sweep');quiet.cleanup.forEach(fn=>fn());
console.log('PASS: TechText draws at narrow width, suspends behind capture and hidden tabs, resumes, cleans up, respects reduced motion');
