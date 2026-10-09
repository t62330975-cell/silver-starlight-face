import {mountReportProgress} from './report-progress.jsx';
import {initAssessmentScene} from './assessment-scene.js';
import {initDemo} from './demo-report.js';
import {FaceLandmarker,FilesetResolver} from '@mediapipe/tasks-vision';
(()=>{
const $=id=>document.getElementById(id);
const video=$('camera-video'),preview=$('preview'),input=$('face-upload'),overlay=$('face-overlay'),status=$('capture-status');
let stream=null,original=null,photoUrl=null,landmarker=null,modelPromise=null,timer=null,sequence=0;
let lastTime=-1;
const pixel=document.createElement('canvas');pixel.width=80;pixel.height=80;
function message(text){status.textContent=text;}
function check(id,text,ok=false){const node=$(id);if(node){node.textContent=text;node.dataset.ok=String(ok);}}
function resetChecks(){check('position-status','等待采集');check('angle-status','等待采集');check('light-status','等待采集');}
function cleanOverlay(){const ctx=overlay.getContext('2d');ctx.clearRect(0,0,overlay.width,overlay.height);}
function stop(){sequence++;clearTimeout(timer);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;video.hidden=true;$('camera-start').hidden=false;$('camera-stop').hidden=true;$('shutter').hidden=true;cleanOverlay();}
function discard(){if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=null;original=null;preview.hidden=true;preview.removeAttribute('src');$('photo-tools').hidden=true;$('analysis-note').hidden=true;$('face-guide').hidden=false;}
async function model(){
 if(landmarker)return landmarker;
 if(!modelPromise)modelPromise=(async()=>{
  
  const vision=await FilesetResolver.forVisionTasks(new URL('vision/wasm/',document.baseURI).href);
  const instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('models/face_landmarker.task',document.baseURI).href,delegate:'CPU'},runningMode:'VIDEO',numFaces:2,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.5});
  landmarker=instance;return instance;
 })().catch(e=>{modelPromise=null;throw e;});
 return modelPromise;
}
function light(source,face){
 try{
  const w=source.videoWidth||source.naturalWidth,h=source.videoHeight||source.naturalHeight;
  const xs=face.map(p=>p.x),ys=face.map(p=>p.y);
  const x=Math.max(0,Math.min(...xs)),y=Math.max(0,Math.min(...ys)),rw=Math.min(1-x,Math.max(...xs)-x),rh=Math.min(1-y,Math.max(...ys)-y);
  const ctx=pixel.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x*w,y*h,rw*w,rh*h,0,0,80,80);
  const data=ctx.getImageData(0,0,80,80).data;let total=0,over=0;
  for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];total+=l;if(l>245)over++;}
  const mean=total/6400;const text=mean<55?'增加正面光线':mean>220||over/6400>.18?'避开强光':'光线合适';check('light-status',text,text==='光线合适');return text;
 }catch{check('light-status','请用自然光');return '请用自然光';}
}
function guide(result,source,live){
 cleanOverlay();
 const faces=result.faceLandmarks||[];
 if(faces.length!==1){check('position-status',faces.length?'仅保留一张人脸':'未检测到人脸');check('angle-status','正对镜头');check('light-status','等待人脸');return faces.length?'画面中请只保留你一个人':'请将人脸放入取景框';}
 const face=faces[0],xs=face.map(p=>p.x),ys=face.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const cx=(left+right)/2,cy=(top+bottom)/2,fh=bottom-top;
 let position='位置合适';
 if(fh<.35)position='靠近一点';else if(fh>.78)position='后退一点';
 else if(Math.abs(cx-.5)>.1)position=(live?(cx>.5):(cx<.5))?'向右移动':'向左移动';
 else if(cy<.39)position='向下移动';else if(cy>.62)position='向上移动';
 check('position-status',position,position==='位置合适');
 const a=face[33],b=face[263],nose=face[1],eyeWidth=Math.abs(b.x-a.x);
 const roll=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
 const yaw=Math.abs(nose.x-(a.x+b.x)/2)/Math.max(.01,eyeWidth);
 let angle='角度合适';
 if(Math.abs(roll)>10)angle='保持头部水平';else if(yaw>.22)angle='正对镜头';
 check('angle-status',angle,angle==='角度合适');
 const lighting=light(source,face);
 if(live){
  const box=overlay.getBoundingClientRect();overlay.width=Math.round(box.width);overlay.height=Math.round(box.height);
  const ctx=overlay.getContext('2d'),sw=video.videoWidth,sh=video.videoHeight,scale=Math.min(box.width/sw,box.height/sh),ox=(box.width-sw*scale)/2,oy=(box.height-sh*scale)/2;
  ctx.strokeStyle='#eef5ffc0';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.strokeRect(ox+(1-right)*sw*scale,oy+top*sh*scale,(right-left)*sw*scale,(bottom-top)*sh*scale);
 }
 if(position!=='位置合适')return position;
 if(angle!=='角度合适')return angle;
 if(lighting!=='光线合适')return lighting;
 return live?'位置合适，保持自然表情后拍照':'照片已就绪 · 原图保留';
}
async function begin(){
 stop();discard();resetChecks();const request=sequence;
 if(!navigator.mediaDevices?.getUserMedia){message('当前浏览器无法打开摄像头，请使用 HTTPS 页面或上传照片');return;}
 $('camera-start').disabled=true;message('请允许浏览器访问摄像头');
 try{
  const active=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1920},height:{ideal:1080}}});
  if(request!==sequence){active.getTracks().forEach(t=>t.stop());return;}
  stream=active;video.srcObject=active;video.hidden=false;await video.play();
  $('camera-start').hidden=true;$('camera-stop').hidden=false;$('shutter').hidden=false;lastTime=-1;
  message('将面部居中，正对镜头，保持自然光照');
  try{
   const detector=await model();if(request!==sequence)return;await detector.setOptions({runningMode:'VIDEO'});
   function loop(){
    if(request!==sequence||!stream)return;
    if(video.readyState>=2&&video.currentTime!==lastTime){
     lastTime=video.currentTime;
     try{message(guide(detector.detectForVideo(video,performance.now()),video,true));}catch{message('保持面部居中，可手动拍照');}
    }
    timer=setTimeout(loop,300);
   }loop();
  }catch{message('将面部对准取景指引，可手动拍照');}
 }catch(e){stop();const hints={NotAllowedError:'摄像头权限未开启，可在浏览器设置中允许或上传照片',NotFoundError:'没有找到摄像头，请上传照片',NotReadableError:'摄像头正被其他程序占用，请关闭后重试'};message(hints[e.name]||'摄像头未能打开，请重试或上传照片');}
 finally{$('camera-start').disabled=false;}
}
async function display(blob){
 stop();discard();original=blob;photoUrl=URL.createObjectURL(blob);const request=sequence;const current=photoUrl;
 preview.src=current;
 try{await preview.decode();}catch{discard();message('无法读取图片，请重新选择');return;}
 if(request!==sequence||current!==photoUrl)return;
 preview.hidden=false;$('face-guide').hidden=true;$('photo-tools').hidden=false;$('analysis-note').hidden=false;
 $('download-original').href=current;
 $('download-original').download='visage-original.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[blob.type]||'png');
 $('photo-meta').textContent=preview.naturalWidth+' × '+preview.naturalHeight+' · 未应用美颜';
 message('照片已就绪 · 原图保留');
 try{const detector=await model();if(request!==sequence)return;await detector.setOptions({runningMode:'IMAGE'});message(guide(detector.detect(preview),preview,false));}catch{resetChecks();message('照片已保留，自动人脸引导暂不可用');}
}
$('camera-start').addEventListener('click',begin);
$('camera-stop').addEventListener('click',()=>{stop();resetChecks();message('摄像头已关闭，可重新打开或上传照片');});
$('choose-photo').addEventListener('click',()=>input.click());
input.addEventListener('change',()=>{const file=input.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){message('请选择不超过 15 MB 的 JPG、PNG 或 WebP 图片');input.value='';return;}display(file);input.value='';});
$('retake').addEventListener('click',()=>{stop();discard();resetChecks();message('打开摄像头，或重新选择原始照片');});
$('shutter').addEventListener('click',()=>{
 if(!stream||!video.videoWidth)return;
 const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
 canvas.getContext('2d').drawImage(video,0,0);
 const request=sequence;$('shutter').disabled=true;
 canvas.toBlob(blob=>{$('shutter').disabled=false;if(request!==sequence)return;if(blob)display(blob);else message('拍照未完成，请重试');},'image/png');
});
document.querySelectorAll('header a').forEach(a=>a.addEventListener('click',()=>{stop();discard();}));
addEventListener('pagehide',()=>{stop();discard();landmarker?.close();});
addEventListener('unload',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){stop();resetChecks();message('摄像头已暂停，请重新打开');}});
const rules=$('capture-rules'),rulesButton=$('open-rules');
rulesButton.addEventListener('click',()=>{if(!rules.open)rules.showModal();rulesButton.setAttribute('aria-expanded','true');});
$('close-rules').addEventListener('click',()=>rules.close());
rules.addEventListener('close',()=>rulesButton.setAttribute('aria-expanded','false'));
rules.addEventListener('click',e=>{if(e.target!==rules)return;const r=rules.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)rules.close();});
initDemo({progress:mountReportProgress($('report-progress')),stopCamera:()=>{stop();resetChecks();message('摄像头已关闭，可重新打开或上传照片');}});
initAssessmentScene();
})();
