'use strict';
// Image-texture particle technique inspired by isladjan/particles-playground.
// Original implementation: dependency-free WebGL, custom converging trajectories.
const canvas=document.getElementById('cosmos');
const INTRO_DURATION=3.1, BURST_DURATION=2.8;
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
function fail(message){canvas.dataset.status='unavailable';console.error(message);}
if(!gl){fail('当前浏览器未能启用星光动画，请使用支持 WebGL 的浏览器。');}
else { start().catch(()=>fail('人脸图像加载失败，请刷新页面重试。')); }
async function start(){
const image=new Image(); image.src='face.png';await image.decode();
const sample=document.createElement('canvas');sample.width=500;sample.height=Math.round(500*image.height/image.width);
const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,sample.width,sample.height);
const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
let seed=27419;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const values=[];let faceCount=0;
function point(x,y,light,type){const a=random()*Math.PI*2;const radius=1.25+random()*1.1;values.push(x,y,Math.cos(a)*radius,Math.sin(a)*radius,random(),light,type,random());}
for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
const i=(y*sample.width+x)*4;const l=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
if(l>.19&&random()<(.11+l*.5)) {point((x/sample.width-.5)*2,(.5-y/sample.height)*2,l,0);faceCount++;}}
for(let i=0;i<1500;i++){let x=random()*2-1,y=random()*2-1;point(x,y,.25+random()*.65,1);}
// A distant, diagonal star river, kept subtle behind the portrait.
for(let i=0;i<1900;i++){const x=random()*2-1;const y=x*.42+.13+(random()+random()+random()-1.5)*.28;point(x,y,.07+random()*.22,2);}
const vertex=`precision highp float;
attribute vec2 aTarget;attribute vec2 aOrigin;attribute float aSeed;attribute float aLight;attribute float aType;attribute float aDepth;
uniform vec2 uResolution;uniform vec2 uPointer;uniform vec2 uFace;uniform vec2 uScale;uniform vec2 uClick;uniform float uBurst;uniform float uTime;uniform float uCycle;uniform float uDpr;uniform float uReduced;uniform float uTrail;uniform float uTrailAlpha;
varying float vLight;varying float vType;varying float vSeed;varying float vTime;
void main(){
float t=clamp((uCycle-uTrail-aSeed*.55)/2.55,0.,1.); if(uReduced>.5)t=1.;
float ease=t*t*t*(t*(t*6.-15.)+10.);
vec2 target=uFace+aTarget*uScale;
vec2 origin=aOrigin; origin.x*=1.3;
vec2 p=mix(origin,target,ease);
float arc=sin(t*3.1415926)*(1.-t)*.32;
p+=vec2(-aOrigin.y,aOrigin.x)*arc;
p+=vec2(sin(uTime*.32+aSeed*50.),cos(uTime*.27+aSeed*40.))*.0017*ease;
float light=aLight;
float burst=0.;
if(aType<.5&&uBurst>=0.&&uReduced<.5){
float age=max(0.,uBurst-uTrail-aSeed*.16);
float outward=1.-pow(1.-clamp(age/.65,0.,1.),3.);
float returnT=clamp((age-.9)/1.7,0.,1.);
float inward=returnT*returnT*returnT*(returnT*(returnT*6.-15.)+10.);
burst=outward*(1.-inward);
vec2 delta=(target-uClick)*vec2(uResolution.x/uResolution.y,1.);
float angle=atan(delta.y,delta.x)+(aSeed-.5)*1.3;
vec2 direction=vec2(cos(angle)*uResolution.y/uResolution.x,sin(angle));
p+=direction*burst*(.3+aDepth*.95);
p+=vec2(-direction.y,direction.x)*sin(burst*3.1415926)*.10*sin(aSeed*40.);
light*=1.+burst*.4;
}
if(aType>.5){p=aTarget;p+=vec2(sin(uTime*.025+aSeed*20.),cos(uTime*.019+aSeed*15.))*.008;}
p+=uPointer*(.002+aDepth*.009)*(aType>.5?1.:ease);
gl_Position=vec4(p,0.,1.);
float twinkle=.79+.21*sin(uTime*(.7+aDepth*1.8)+aSeed*80.);
float arrival=exp(-pow((uCycle-3.05)/.24,2.))*.55;
if(uReduced>.5)arrival=0.;
if(aType<.5)light*=1.+arrival;
float trailVisibility=1.;
if(uTrail>0.){trailVisibility=aType>.5?0.:max(4.*t*(1.-t),burst);if(uReduced>.5)trailVisibility=0.;}
vLight=light*twinkle*uTrailAlpha*trailVisibility;vType=aType;vSeed=aSeed;vTime=uTime;
float size=aType>.5?1.1+aDepth*2.5:1.25+aLight*1.6+burst*.7;
if(aType<.5&&aSeed>.994)size=7.+arrival*3.;
if(aType>.5&&aSeed>.985)size=12.;
gl_PointSize=size*uDpr*(aType>1.5?.7:1.);
}`;
const fragment=`precision mediump float;varying float vLight;varying float vType;varying float vSeed;varying float vTime;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);if(r>1.)discard;
float core=exp(-r*r*5.0);float halo=exp(-r*r*2.0)*.22;float a=(core+halo)*vLight*(vType<.5?2.65:1.8);
if(vType<.5&&vSeed>.994){float rays=pow(max(0.,1.-abs(p.x)),22.)+pow(max(0.,1.-abs(p.y)),22.);a=(exp(-r*4.)+rays*.2)*vLight*1.5;}
if(vType>.5){a*=.58;if(vSeed>.985){float cross=pow(max(0.,1.-abs(p.x)),25.)+pow(max(0.,1.-abs(p.y)),25.);a=(exp(-r*5.)+cross*.24)*vLight;}}
vec3 color=mix(vec3(.60,.72,.92),vec3(.94,.97,1.),vLight);gl_FragColor=vec4(color*a,1.);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
[['aTarget',2,0],['aOrigin',2,2],['aSeed',1,4],['aLight',1,5],['aType',1,6],['aDepth',1,7]].forEach(([name,n,offset])=>{const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,32,offset*4);});
const uniforms={};['uResolution','uPointer','uFace','uScale','uClick','uBurst','uTime','uCycle','uDpr','uReduced','uTrail','uTrailAlpha'].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(.008,.016,.035,1);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');gl.uniform1f(uniforms.uReduced,reduced.matches?1:0);
let face=[.39,0],scale=[1,1];
function resize(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uResolution,w,h);gl.uniform1f(uniforms.uDpr,dpr);const mobile=w<801;const portraitHeight=mobile?Math.min(h*.8,w*1.1):h*.88;const portraitWidth=portraitHeight*image.width/image.height;scale=[portraitWidth/w,portraitHeight/h];face=[mobile?.10:.39,0];gl.uniform2f(uniforms.uScale,...scale);gl.uniform2f(uniforms.uFace,...face);}
addEventListener('resize',resize);resize();let pointer=[0,0],smooth=[0,0];addEventListener('pointermove',e=>{pointer=[e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2];});document.addEventListener('pointerleave',()=>pointer=[0,0]);
let time=0,cycle=0,last=performance.now(),burstStart=-10,bursts=0;
function explode(x,y){if((cycle<INTRO_DURATION&&!reduced.matches)||time-burstStart<BURST_DURATION)return;burstStart=time;gl.uniform2f(uniforms.uClick,x,y);canvas.dataset.bursts=String(++bursts);}
function onFace(x,y){const tx=(x-face[0])/scale[0],ty=(y-face[1])/scale[1];return Math.pow((tx-.06)/.67,2)+Math.pow((ty-.04)/.87,2)<1;}
canvas.addEventListener('click',e=>{const x=e.clientX/innerWidth*2-1,y=1-e.clientY/innerHeight*2;if(onFace(x,y))explode(x,y);});
canvas.addEventListener('pointermove',e=>{const x=e.clientX/innerWidth*2-1,y=1-e.clientY/innerHeight*2;canvas.style.cursor=onFace(x,y)?'pointer':'default';});
canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();explode(face[0],face[1]);}});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
reduced.addEventListener('change',()=>gl.uniform1f(uniforms.uReduced,reduced.matches?1:0));
function draw(now){if(document.body.dataset.view==='assessment'){last=now;requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){time+=dt;cycle+=dt;}smooth[0]+=(pointer[0]-smooth[0])*.035;smooth[1]+=(pointer[1]-smooth[1])*.035;gl.uniform2f(uniforms.uPointer,...smooth);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uCycle,cycle);const age=time-burstStart;gl.uniform1f(uniforms.uBurst,age<BURST_DURATION?age:-1);gl.clear(gl.COLOR_BUFFER_BIT);
// Dim prior trajectory samples give moving stars short silver light trails.
if(!reduced.matches&&(cycle<INTRO_DURATION||age<BURST_DURATION)){
for(let i=4;i>=1;i--){gl.uniform1f(uniforms.uTrail,i*.035);gl.uniform1f(uniforms.uTrailAlpha,.19*(1-i/5));gl.drawArrays(gl.POINTS,0,values.length/8);}}
gl.uniform1f(uniforms.uTrail,0);gl.uniform1f(uniforms.uTrailAlpha,1);gl.drawArrays(gl.POINTS,0,values.length/8);canvas.dataset.phase=age<BURST_DURATION?'burst':cycle<INTRO_DURATION&&!reduced.matches?'gathering':'formed';requestAnimationFrame(draw);}
canvas.dataset.faceParticles=faceCount;canvas.dataset.ready='true';requestAnimationFrame(draw);
}
