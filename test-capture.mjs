import vm from 'node:vm';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const source=(await readFile('src/assessment-client.js','utf8')).replace(/^import .*;\s*$/gm,'');
const handlers=new Map(),globalEvents={},docEvents={};let stopped=0,revoked=0,allowed=false;
const ctx={clearRect(){},beginPath(){},arc(){},fill(){},setLineDash(){},strokeRect(){},drawImage(){},getImageData(){return {data:new Uint8ClampedArray(80*80*4).fill(140)}}};
function el(){return {hidden:false,disabled:false,dataset:{},files:[],textContent:'',src:'',href:'',width:500,height:350,videoWidth:1280,videoHeight:720,naturalWidth:480,naturalHeight:640,currentTime:1,readyState:2,
setAttribute(name,value){this.attrs??={};this.attrs[name]=value;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();},addEventListener(name,fn){this.events??={};this.events[name]=fn;},click(){this.clicked=true;},removeAttribute(){},getContext(){return ctx;},getBoundingClientRect(){return {width:500,height:350}},play:async()=>{},pause(){},decode:async()=>{}};}
const ids=new Map();const get=id=>{if(!ids.has(id))ids.set(id,el());return ids.get(id)};
let faces=[];const detector={setOptions:async()=>{},detect:()=>({faceLandmarks:faces}),detectForVideo:()=>({faceLandmarks:faces}),close(){}};
const url=class extends URL{};url.createObjectURL=()=>'blob:original';url.revokeObjectURL=()=>revoked++;
const sandbox={initDemo:()=>{},mountReportProgress:()=>()=>{},initAssessmentScene:()=>{},console,URL:url,Blob,Uint8ClampedArray,Math,performance:{now:()=>1000},innerWidth:1280,innerHeight:720,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:true}),addEventListener:(n,f)=>globalEvents[n]=f,
document:{baseURI:'https://example.test/',hidden:false,getElementById:get,createElement:el,querySelectorAll:()=>[],addEventListener:(n,f)=>docEvents[n]=f},
navigator:{mediaDevices:{getUserMedia:async()=>{if(!allowed)throw Object.assign(new Error(),{name:'NotAllowedError'});return {getTracks:()=>[{stop:()=>stopped++}]};}}},
FilesetResolver:{forVisionTasks:async()=>({})},FaceLandmarker:{createFromOptions:async()=>detector}};
vm.runInNewContext(source,sandbox);
get('open-rules').events.click();assert.equal(get('capture-rules').open,true);assert.equal(get('open-rules').attrs['aria-expanded'],'true');get('close-rules').events.click();assert.equal(get('capture-rules').open,false);assert.equal(get('open-rules').attrs['aria-expanded'],'false');
await get('camera-start').events.click();
assert.match(get('capture-status').textContent,/权限/);assert.equal(get('camera-start').disabled,false);
allowed=true;await get('camera-start').events.click();assert.equal(get('shutter').hidden,false);assert.match(get('capture-status').textContent,/人脸/);
get('camera-stop').events.click();assert.equal(stopped,1);assert.equal(get('camera-video').srcObject,null);assert.equal(get('shutter').hidden,true);
get('face-upload').files=[{type:'image/png',size:16*1024*1024}];get('face-upload').events.change();assert.match(get('capture-status').textContent,/15 MB/);
get('face-upload').files=[new Blob(['unaltered'],{type:'image/png'})];get('face-upload').events.change();for(let i=0;i<8;i++)await Promise.resolve();
assert.equal(get('download-original').href,'blob:original');assert.equal(get('preview').hidden,false);assert.equal(get('download-original').download,'cervis-original.png');assert.match(get('position-status').textContent,/未检测到/);
get('retake').events.click();assert.equal(get('preview').hidden,true);assert.ok(revoked>0);
await get('camera-start').events.click();sandbox.document.hidden=true;docEvents.visibilitychange();assert.equal(get('camera-video').srcObject,null);assert.equal(stopped,2);
console.log('PASS: rules open/close, camera denial, close, background cleanup, upload limit, original retention, no-face detection, retake');