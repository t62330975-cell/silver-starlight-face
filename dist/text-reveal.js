// Original free scroll-driven 3D reveal; no paid registry or license required.
(()=>{
 const lines=[...document.querySelectorAll('.hero-copy h1 span')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0;
 function frame(){if(document.body.dataset.view==='assessment'){requestAnimationFrame(frame);return;}
   const distance=Math.max(1,document.documentElement.scrollHeight-innerHeight);
   const target=Math.min(1,Math.max(0,scrollY/distance));
   current+=(target-current)*.095;
   lines.forEach((line,i)=>{
     const p=reduced.matches?1:Math.min(1,Math.max(0,(current-i*.13)/.65));
     const ease=1-Math.pow(1-p,3);
     const angle=(i===0?36:72)*(1-ease);
     line.style.transform=`translate3d(0,${(1-ease)*(24+i*12)}px,${-90*(1-ease)}px) rotateX(${angle}deg)`;
     line.style.opacity=String((i===0?.8:.38)+ease*(i===0?.2:.62));
     line.style.filter=`blur(${(1-ease)*(i===0?0:1.4)}px)`;
   });
   document.querySelector('.hero-copy').dataset.scrollProgress=current.toFixed(3);
   requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
})();
