export function initAssessmentScene(){
 const canvas=document.getElementById('capture-sky'),ctx=canvas.getContext('2d');
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const logo=document.querySelector('.capture-logo'),satellite=logo.querySelector('.emblem-satellite');
 let w=innerWidth,h=innerHeight,elapsed=0,active=false,frame=0,last=performance.now(),lastDraw=-100;
 const stars=Array.from({length:innerWidth<700?700:1500},(_,i)=>{
  const x=Math.random(),river=i>=(innerWidth<700?300:600);
  return {x,y:river? .5-(x*2-1)*.21-.065+(Math.random()+Math.random()+Math.random()-1.5)*.14:Math.random(),r:river?.3+Math.random()*.55:.45+Math.random()*1.1,p:Math.random()*6.28,spark:!river&&Math.random()>.985};
 });
 function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 function enter(){active=true;last=performance.now();canvas.dataset.phase='steady';}
 function meteor(){
  const phase=(elapsed+3.6)%6.4;if(reduced.matches||phase>=1.8)return;
  const t=phase/1.8,x=(-.12+1.43*t)*w,y=(-.12+1.43*t)*h,l=Math.hypot(w,h),tail=Math.min(380,l*.28),tx=x-w/l*tail,ty=y-h/l*tail,alpha=Math.max(0,Math.min(1,t/.12,(1-t)/.12));
  const g=ctx.createLinearGradient(tx,ty,x,y);g.addColorStop(0,'rgba(183,207,241,0)');g.addColorStop(.84,'rgba(223,235,253,.55)');g.addColorStop(1,'white');ctx.strokeStyle=g;ctx.lineCap='round';
  for(const [width,opacity] of [[10,.08],[5,.19],[1.5,1]]){ctx.globalAlpha=alpha*opacity;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(x,y);ctx.stroke();}
  ctx.globalAlpha=alpha;const glow=ctx.createRadialGradient(x,y,0,x,y,19);glow.addColorStop(0,'white');glow.addColorStop(.15,'rgba(237,247,255,.8)');glow.addColorStop(1,'rgba(174,207,255,0)');ctx.fillStyle=glow;ctx.fillRect(x-19,y-19,38,38);ctx.globalAlpha=1;
 }
 function orbit(){const tilt=17*Math.PI/180,theta=elapsed*Math.PI*2/9-.72,x=.505+.34*Math.cos(theta)*Math.cos(tilt)-.086*Math.sin(theta)*Math.sin(tilt),y=.576+.34*Math.cos(theta)*Math.sin(tilt)+.086*Math.sin(theta)*Math.cos(tilt);satellite.style.transform='translate('+(x*logo.clientWidth-satellite.clientWidth/2)+'px,'+(y*logo.clientHeight-satellite.clientHeight/2)+'px) scale('+(.92+.14*Math.sin(theta))+')';satellite.style.zIndex=Math.sin(theta)>=0?'2':'0';satellite.style.opacity=Math.sin(theta)>=0?'1':'.67';}
 function draw(now){
  const dt=Math.min((now-last)/1000,.05);last=now;if(active&&!document.hidden&&!reduced.matches)elapsed+=dt;
  if(active&&!document.hidden&&now-lastDraw>=1000/30){lastDraw=now;
   ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
   for(const s of stars){const x=(s.x+Math.sin(elapsed*.025+s.p)*.004)*w,y=(s.y+Math.cos(elapsed*.019+s.p)*.004)*h;ctx.fillStyle='rgba(225,237,255,'+(.18+.4*(.79+.21*Math.sin(elapsed*.9+s.p)))+')';ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();if(s.spark){ctx.strokeStyle='#e9f2ff70';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}}
   meteor();
   ctx.globalCompositeOperation='source-over';orbit();
  }
  frame=requestAnimationFrame(draw);
 }
 function onMessage(e){if(e.source===parent&&e.origin===new URL(document.baseURI).origin&&e.data==='visage:assessment-enter')enter();}
 addEventListener('message',onMessage);addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>last=performance.now());
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);removeEventListener('message',onMessage);removeEventListener('resize',resize)});
 resize();if(parent===window)enter();frame=requestAnimationFrame(draw);
}
