import React from 'react';
import {createRoot} from 'react-dom/client';
import LatticeLoader from './LatticeLoader.jsx';
export function mountReportProgress(container){
 const root=createRoot(container);
 function update({status='idle',percent=0}={}){
  const working=status==='working';
  root.render(<div className={'report-loader '+(status==='idle'?'is-idle':'')} aria-busy={working}>
   <LatticeLoader status={status==='idle'?'working':status} label={status==='idle'?'等待查看示例报告':'准备示例报告'} doneLabel="示例报告已就绪" errorLabel="准备失败，请重试" pattern="orbit" grid={3} shape="round" color="#edf3fb" doneColor="#ffffff" errorColor="#d4deee" cellSize={5} gap={3} fontSize={11} step={110} glow={false} showTimer={status!=='idle'} elapsed={status==='idle'?0:undefined}/>
   {status!=='idle'&&<span className="report-loader-percent" aria-label={'示例报告准备进度 '+percent+'%'}>{percent}%</span>}
  </div>);
 }
 update();addEventListener('pagehide',()=>root.unmount(),{once:true});return update;
}
