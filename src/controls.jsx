import React,{useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import './progress.css';
import assessmentDocument from 'assessment-document';
function Controls(){
 const [progress,setProgress]=useState(0),[status,setStatus]=useState('READY'),[message,setMessage]=useState('准备就绪');
 const busy=useRef(false);
 const frameRef=useRef(null);
 const [page,setPage]=useState(location.hash==='#assessment'?'ready':'home');
 useEffect(()=>{document.body.dataset.view=page==='ready'?'assessment':'home';if(page==='ready')frameRef.current?.contentWindow?.postMessage('visage:assessment-enter',location.origin);},[page]);
 useEffect(()=>{
  const entry=document.querySelector('.enter-button');
  function start(event){
   if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   event.preventDefault();if(busy.current)return;
   busy.current=true;entry.setAttribute('aria-disabled','true');
   setProgress(0);setStatus('LOADING…');setMessage('正在加载面部照片界面');
   setPage('loading');
  }
  function restore(){if(location.hash!=='#assessment'){setPage('home');setProgress(0);setStatus('READY');setMessage('准备就绪');busy.current=false;entry.removeAttribute('aria-disabled');}}
  entry.addEventListener('click',start);addEventListener('hashchange',restore);
  return()=>{entry.removeEventListener('click',start);removeEventListener('hashchange',restore);};
 },[]);
 function ready(){if(page==='ready'){frameRef.current?.contentWindow?.postMessage('visage:assessment-enter',location.origin);return;}if(page!=='loading')return;setProgress(100);setStatus('COMPLETE');setMessage('加载完成，正在进入');setTimeout(()=>{setPage('ready');location.hash='assessment';document.querySelector('.assessment-frame')?.focus();},350);}
 return <><div className="loading-control" data-loading={page==='loading'}><div className="loading-label"><span>{status}</span><span>{progress}%</span></div><div className="segmented-progress" role="progressbar" aria-label="面部照片界面加载进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="progress-cells" aria-hidden="true">{Array.from({length:14},(_,i)=><span key={i} className={i<Math.floor(progress/100*14)?'is-loaded':''}/>)}</div></div><div className="loading-hint" role="status">{message}</div></div>{page!=='home'&&<iframe ref={frameRef} allow="camera" className="assessment-frame" title="面部照片界面" data-ready={page==='ready'} srcDoc={assessmentDocument} onLoad={ready}/>}</>;
}
createRoot(document.getElementById('wake-control')).render(<Controls/>);
