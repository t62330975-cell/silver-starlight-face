'use strict';
// A single silver meteor follows a diagonal path; the tail always trails its head.
(()=>{
 const canvas=document.getElementById('meteor');
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let w=0,h=0,elapsed=0,last=performance.now();
 function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 addEventListener('resize',resize);resize();
 document.addEventListener('visibilitychange',()=>last=performance.now());
 function draw(now){if(document.body.dataset.view==='assessment'){last=now;requestAnimationFrame(draw);return;}
   const dt=Math.min((now-last)/1000,.05);last=now;
   if(!document.hidden)elapsed+=dt;
   ctx.clearRect(0,0,w,h);
   const phase=(elapsed+3.6)%6.4;
   const duration=1.8;
   if(!reduced.matches&&phase<duration){
     const t=phase/duration;
     // Off-screen start/end keep the trail from popping in and out.
     const x=(-.12+1.43*t)*w, y=(-.12+1.43*t)*h;
     const length=Math.hypot(w,h),ux=w/length,uy=h/length;
     const tail=Math.min(380,length*.28),tx=x-ux*tail,ty=y-uy*tail;
     const alpha=Math.min(1,t/.12,(1-t)/.12);
     ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.max(0,alpha);
     const gradient=ctx.createLinearGradient(tx,ty,x,y);
     gradient.addColorStop(0,'rgba(183,207,241,0)');
     gradient.addColorStop(.45,'rgba(195,216,246,.06)');
     gradient.addColorStop(.84,'rgba(223,235,253,.55)');
     gradient.addColorStop(1,'rgba(255,255,255,1)');
     ctx.strokeStyle=gradient;ctx.lineCap='round';
     // Broad bloom around a crisp silver spine.
     for(const [width,opacity] of [[10,.08],[5,.19],[1.5,1]]){
       ctx.globalAlpha=alpha*opacity;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(x,y);ctx.stroke();
     }
     ctx.globalAlpha=alpha;
     const glow=ctx.createRadialGradient(x,y,0,x,y,19);
     glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(.09,'rgba(237,247,255,.9)');glow.addColorStop(.3,'rgba(189,218,255,.22)');glow.addColorStop(1,'rgba(174,207,255,0)');
     ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,1.7,0,Math.PI*2);ctx.fill();
     canvas.dataset.phase='flying';canvas.dataset.progress=t.toFixed(3);
   }else{canvas.dataset.phase='waiting';}
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   requestAnimationFrame(draw);
 }
 requestAnimationFrame(draw);
})();
