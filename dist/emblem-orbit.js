'use strict';
(()=>{
 const logo=document.querySelector('.emblem-orbit');
 const satellite=logo.querySelector('.emblem-satellite');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const tilt=17*Math.PI/180;
 let time=0,last=performance.now();
 document.addEventListener('visibilitychange',()=>last=performance.now());
 function frame(now){if(document.body.dataset.view==='assessment'){last=now;requestAnimationFrame(frame);return;}
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(!document.hidden&&!reduced.matches)time+=dt;
  const theta=time*Math.PI*2/9-.72;
  const x=.505+.34*Math.cos(theta)*Math.cos(tilt)-.086*Math.sin(theta)*Math.sin(tilt);
  const y=.576+.34*Math.cos(theta)*Math.sin(tilt)+.086*Math.sin(theta)*Math.cos(tilt);
  const front=Math.sin(theta)>=0;
  const depth=.92+.14*Math.sin(theta);
  satellite.style.transform=`translate(${x*logo.clientWidth-satellite.clientWidth/2}px,${y*logo.clientHeight-satellite.clientHeight/2}px) scale(${depth})`;
  satellite.style.zIndex=front?'2':'0';
  satellite.style.opacity=front?'1':'.67';
  logo.dataset.orbitX=x.toFixed(3);logo.dataset.orbitY=y.toFixed(3);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
})();
