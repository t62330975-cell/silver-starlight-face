import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import TechText from './TechText.jsx';

export async function mountTechSlogans(doc=document){
 const groups=[...doc.querySelectorAll('[data-tech-slogan]')];
 if(!groups.length)return;
 try{await doc.fonts?.load('700 64px Orbitron');}catch{}
 groups.forEach(group=>{
  const lines=[...group.children].filter(line=>line.matches('[data-tech-line]'));
  const roots=lines.map(line=>({line,text:line.textContent.trim(),root:createRoot(line)}));
  const measure=doc.createElement('canvas').getContext('2d');
  if(!measure)return;
  let lastSize=0;
  const render=()=>{
   const target=parseFloat(getComputedStyle(group).fontSize);
   measure.font='700 '+target+'px Orbitron';
   if('letterSpacing' in measure)measure.letterSpacing=(-.035*target)+'px';
   const longest=Math.max(...roots.map(({text})=>measure.measureText(text).width));
   const size=Math.min(target,target*(group.clientWidth*.88)/Math.max(1,longest));
   if(Math.abs(size-lastSize)<.1)return;
   lastSize=size;
   group.style.setProperty('--tech-size',size+'px');
   flushSync(()=>roots.forEach(({text,root})=>root.render(
    <TechText text={text} align="left" fontFamily="Orbitron, Arial, sans-serif"
     fontWeight={700} fontSize={size} letterSpacing={-.035} color="#ffffff"
     accentColor="#f4f7ff" reveal="letter" dashLength={4} dashGap={2}
     specks={8} labels={false} draggable={false} selection={true}
     sweep={true} speed={.65}/>
   )));
  };
  const observer=new ResizeObserver(render);
  observer.observe(group);
  render();
  doc.defaultView.addEventListener('pagehide',()=>{observer.disconnect();roots.forEach(({root})=>root.unmount());},{once:true});
 });
}
