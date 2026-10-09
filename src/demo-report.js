export const sampleReport = Object.freeze({
 mode:'demo', source:'fixed_sample', usesUploadedPhoto:false,
 notice:'固定示例数据，与上传照片无关；用于展示功能，不构成医学诊断。',
 dimensions:[
  {name:'毛孔可见度',value:58,level:'中等',description:'展示毛孔外观的评估维度。'},
  {name:'痘痘外观',value:32,level:'较轻',description:'展示可见痘痘的评估维度。'},
  {name:'色斑外观',value:46,level:'中等',description:'展示局部色素外观的评估维度。'},
  {name:'泛红外观',value:40,level:'中等',description:'展示局部泛红的评估维度。'},
  {name:'细纹可见度',value:28,level:'较轻',description:'展示细纹外观的评估维度。'},
  {name:'纹理粗糙度',value:54,level:'中等',description:'展示皮肤表面纹理的评估维度。'},
  {name:'肤色不均',value:44,level:'中等',description:'展示肤色均匀程度的评估维度。'},
  {name:'表面油光',value:62,level:'较明显',description:'展示照片中可见的表面反光。'}
 ],
 suggestions:{
  morning:{label:'早间护理',title:'温和清洁 · 保湿 · 防晒',text:'使用温和、非磨砂型洁面产品；按需要使用保湿产品。出门前选择广谱、SPF 30 或以上的防晒产品，户外约每两小时及游泳或出汗后补涂。'},
  evening:{label:'晚间护理',title:'减少刺激，保留基础护理',text:'温和清洁后保湿，避免用力搓洗和频繁去角质。容易长痘时，可优先选择标注“不堵塞毛孔”的产品；不要挤压痘痘。'},
  attention:{label:'重点关注',title:'示例关注：油光与表面纹理',text:'这只是固定示例的护理展示，不是对你的照片的判断。避免因油光而反复强力清洁。若出现持续红肿、疼痛、明显瘙痒或快速变化的皮损，应咨询皮肤科医生。'}
 }
});
export function initDemo({stopCamera,document:doc=document,download=downloadReport,progress=()=>{},nextStep=()=>new Promise(resolve=>setTimeout(resolve,180))}){
 const get=id=>doc.getElementById(id);
 const capture=get('capture-section'),report=get('demo-report'),button=get('open-demo');
 let busy=false,disposed=false;
 if(typeof addEventListener==='function')addEventListener('pagehide',()=>disposed=true,{once:true});
 const rows=dimensions=>dimensions.map(d=>'<article class="metric"><div class="metric-title"><h3>'+d.name+'</h3><span>'+d.level+'</span></div><div class="metric-number">'+d.value+'<small>/ 100</small></div><div class="metric-track"><i style="width:'+d.value+'%"></i></div><p>'+d.description+'</p></article>').join('');
 function radar(){const points=sampleReport.dimensions.map((d,i)=>{const a=i*Math.PI/4-Math.PI/2;return (150+Math.cos(a)*d.value*1.04).toFixed(1)+','+(150+Math.sin(a)*d.value*1.04).toFixed(1)}).join(' ');get('radar-shape').setAttribute('points',points);}
 function select(key){const item=sampleReport.suggestions[key];get('advice-title').textContent=item.title;get('advice-text').textContent=item.text;doc.querySelectorAll('[data-advice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.advice===key)));}
 doc.querySelectorAll('[data-advice]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.advice)));
 get('view-advice').addEventListener('click',()=>{select('attention');const heading=get('advice-heading');heading.focus({preventScroll:true});heading.scrollIntoView({behavior:'auto',block:'start'});});
 button.addEventListener('click',async()=>{
  if(busy||disposed)return;
  busy=true;button.disabled=true;stopCamera();progress({status:'working',percent:0});
  let completed=0;
  try{
   const tasks=[()=>get('demo-dimensions').innerHTML=rows(sampleReport.dimensions.slice(0,4)),()=>get('demo-dimensions').innerHTML+=rows(sampleReport.dimensions.slice(4)),radar,()=>{get('demo-highlights').innerHTML=rows([sampleReport.dimensions[7],sampleReport.dimensions[5],sampleReport.dimensions[0]]);get('all-metrics').open=false;select('morning')}];
   for(const task of tasks){await nextStep();if(disposed)return;task();completed++;progress({status:completed===tasks.length?'done':'working',percent:completed/tasks.length*100});}
   await nextStep();if(disposed)return;
   capture.hidden=true;report.hidden=false;get('report-title').focus();
  }catch{if(!disposed)progress({status:'error',percent:completed/4*100});}
  finally{busy=false;button.disabled=false;}
 });
 get('return-capture').addEventListener('click',()=>{report.hidden=true;capture.hidden=false;button.focus();});
 get('export-demo').addEventListener('click',()=>download(sampleReport,doc));
}

function downloadReport(report,doc){
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=doc.createElement('a');
 link.href=url;link.download='cervis-demo-report.json';doc.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
