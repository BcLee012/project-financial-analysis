'use strict';
const TRIAL_VERSION='2026.11.18';
const FIELD_HELP={
  projName:'给本次测算起一个名称，导出文件也会使用它。',
  buildYears:'建设阶段的年数。修改后，投资分配等分年参数会相应调整。',
  opYears:'投产后的测算年数，不包含建设期。',
  price:'按表中的单位输入含税售价。例如 3 元/吨 = 0.0003 万元/吨。降低 10% 可输入原值 × 0.9。',
  designQty:'满负荷时一年的设计产量；实际年产量还会乘当年生产负荷。',
  i0:'用于折现和判断的收益率基准。教学默认值是假设，实际项目需保留取值依据。',
  salvageRate:'折旧计算的期末残值比例，0%–100%；实际净回收另由期末净回收比例控制。',
  loanRatio:'借款占投资的比例；其余部分由资本金承担。',
  policyProfile:'建阳政策为固定案例对照，不会根据其他项目自动检索或判断适用性。'
};
pgG.innerHTML=`<div class="guide-head"><span class="eyebrow">使用方法 · ${TRIAL_VERSION}</span><h1 id="guideTitle">从第一次测算，到带走报告。</h1><p>这个工具帮助你计算项目投资、收入、成本和现金流，并比较不同假设。建议先用教学案例走一遍，再填写自己的项目。</p><button class="btn btn-primary" data-action="demo">开始体验教学案例 →</button><button class="btn btn-line" data-go="input">继续编辑当前项目</button></div>
<div class="guide-steps">
<article><span class="step-no">01</span><h2>选一个案例</h2><p>教学案例为虚拟参数，适合练习。建阳案例来自公开可研，但存在税费和成本映射假设。旧表案例仅用于历史口径复现。</p><button class="linkbtn" data-go="input" data-target="caseSel">去选择案例 →</button></article>
<article><span class="step-no">02</span><h2>改一个参数</h2><p>先试着把产品含税单价降低 10%。注意当前显示的单位；其他参数保持不变，才能观察价格带来的影响。</p><button class="linkbtn" data-go="input" data-field="price">去修改含税单价 →</button></article>
<article><span class="step-no">03</span><h2>生成并读懂结果</h2><p>净现值 NPV、内部收益率 IRR、回收期分别描述净收益、收益率和回收时间。未达标不等于软件出错，可在报告中的说明查看原因。</p><button class="linkbtn" data-go="report">去生成评估报告 →</button></article>
<article><span class="step-no">04</span><h2>保存与对比</h2><p>修改前先保存方案 A，修改后保存方案 B，再选择两者进行对比。自动暂存只保留当前编辑数据，并不替你保存多个版本。</p><button class="linkbtn" data-go="input" data-target="btnScenSave">去保存方案 →</button><button class="linkbtn" data-go="compare">去方案对比 →</button></article>
<article><span class="step-no">05</span><h2>带走结果与数据</h2><p>报告可导出 Excel、Word、交互 HTML，PDF 使用浏览器打印保存。项目备份 JSON 保留录入参数，可以在另一个浏览器导入继续编辑。</p><button class="linkbtn" data-go="report" data-target="btnDoc">去导出报告 →</button><button class="linkbtn" data-go="input" data-target="btnProjectDownload">去下载项目备份 →</button></article>
<article><span class="step-no">06</span><h2>做一次小实验</h2><p>记录原案例 NPV → 单价降低 10% → 保存两个方案并对比 → 导出报告。完成后，用自己的话解释为什么结果发生变化。</p><button class="linkbtn" data-go="quiz">去课堂练习 →</button><button class="linkbtn" id="btnFeedback">复制反馈模板 →</button></article>
</div><div class="guide-notes"><h2>使用前了解这三件事</h2><p><b>保存在哪里？</b> 自动暂存和方案在当前浏览器中，清理数据、换浏览器或设备后不会自动同步。重要数据请下载项目备份。</p><p><b>报告能说明什么？</b> 报告基于录入假设进行财务测算；参数检查和固定政策参考不能替代项目审批或完整可研。政策原文链接可在建阳案例报告中查看。</p><p><b>遇到错误怎么办？</b> 根据页面红色提示修改对应字段；如果组件加载或导出失败，可下载项目备份并复制反馈模板，记录步骤及浏览器版本。</p></div>`;
function updateTrialContext(){
  const el=document.getElementById('caseContext');
  el.textContent=(state.caseSource?'案例 / 资料映射':'教学默认或自行录入')+' · '+(state.projName||'未命名项目')+(userEdited?' · 参数已修改':'');
  el.title=state.caseSource||'初始值为虚拟教学参数；请按项目实际资料核实。';
}
function addFieldHelp(){
  for(const [key,help] of Object.entries(FIELD_HELP)){
    const input=[...document.querySelectorAll('[data-k]')].find(el=>el.dataset.k===key);
    if(!input)continue;const p=document.createElement('small');p.className='field-help';p.id='help-'+key;p.textContent=help;input.setAttribute('aria-describedby',p.id);input.insertAdjacentElement('afterend',p);
  }
}
const originalRenderForm=renderForm;
renderForm=function(){originalRenderForm();addFieldHelp();};
addFieldHelp();updateTrialContext();
function navigateTrial(go,field,target){
  if(!showTab(go))return;
  requestAnimationFrame(()=>{
    const el=field?[...document.querySelectorAll('[data-k]')].find(n=>n.dataset.k===field):document.getElementById(target||'');
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.focus({preventScroll:true});el.classList.add('guided-focus');setTimeout(()=>el.classList.remove('guided-focus'),2500);}
  });
}
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-go],[data-action]');if(!button)return;
  if(button.dataset.action==='demo'){
    if(!beforeReplace())return;
    state=normalizeState(clone(DEFAULTS));state.projName='教学案例：新建生产项目';state.caseSource='虚拟教学案例，参数仅用于学习。基准收益率和回收期均为教学假设，不代表真实项目要求。';userEdited=false;clearIssue();save();renderForm();showTab('input');updateTrialContext();toast('已载入教学案例。可先修改含税单价，再生成报告。');
  }else navigateTrial(button.dataset.go,button.dataset.field,button.dataset.target);
});
document.getElementById('scenarioName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('confirmScenario').click();}});
document.getElementById('scenarioDialog').addEventListener('close',()=>{
  const dialog=document.getElementById('scenarioDialog');if(dialog.returnValue!=='save')return;
  if(inputFailure())return;const name=document.getElementById('scenarioName').value.trim();if(!name)return;
  const scens=loadScens();scens.push({name,ts:Date.now(),data:clone(state)});
  if(!saveScens(scens))return;refreshScenSel();document.getElementById('scenSel').value=String(scens.length-1);toast('方案已保存至本浏览器，可前往“方案对比”');
});
document.getElementById('btnUndo').onclick=()=>{
  if(!undoState)return;const previous=undoState;undoState=clone(state);state=previous;userEdited=false;clearIssue();save();renderForm();showTab('input');toast('已恢复上次载入或重置前的参数');
};
document.getElementById('btnUndoDelete').onclick=()=>{
  if(!deletedScens)return;const current=loadScens();current.splice(Math.min(deletedScens.index,current.length),0,deletedScens.record);if(!saveScens(current))return;deletedScens=null;document.getElementById('btnUndoDelete').disabled=true;refreshScenSel();toast('已恢复删除前的方案列表');
};
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
document.getElementById('btnProjectDownload').onclick=()=>{
  // Validate so downloaded files are guaranteed to pass the restore contract.
  const issue=projectIssue(state);if(issue){showIssue('请先修正后再下载可恢复的备份：'+issue.message,issue.key);return;}
  downloadBlob(new Blob([JSON.stringify(projectFileData(state),null,2)],{type:'application/json'}),(state.projName||'项目').replace(/[\\/:*?"<>|]/g,'')+'_项目备份.json');toast('项目备份已下载，可通过“导入项目备份”恢复');
};
document.getElementById('btnProjectImport').onclick=()=>document.getElementById('projectFileInput').click();
document.getElementById('projectFileInput').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>1000000)throw Error('项目文件不能超过 1 MB');const data=parseProjectFile(await file.text(),DEFAULTS);if(!beforeReplace())return;state=data;userEdited=false;clearIssue();save();renderForm();showTab('input');toast('项目已恢复。点击“生成评估报告”查看结果');}
  catch(error){showIssue('导入失败，当前数据已保留：'+error.message);}
  finally{e.target.value='';}
};
async function runExport(id,action){
  if(!ensureReport())return;
  const button=document.getElementById(id),label=button.textContent,status=document.getElementById('exportStatus');
  if((id==='btnDoc'&&!docxLib())||(id==='btnXls'&&typeof XLSX==='undefined')){status.textContent='导出组件未就绪，请刷新重试，或使用打印 / 保存为 PDF。';return;}
  button.disabled=true;button.textContent='正在生成…';status.textContent='正在准备文件，请稍候…';
  try{await new Promise(resolve=>setTimeout(resolve,30));await action();status.textContent='文件已交给浏览器下载。请打开文件检查；也可以下载项目备份保留输入数据。';}
  catch(error){console.error(error);status.textContent='导出失败，输入已保留。请重试、使用打印保存，或下载项目备份。';toast('导出失败：'+error.message);}
  finally{button.disabled=false;button.textContent=label;}
}
document.getElementById('btnFeedback').onclick=async()=>{
  const text=`项目财务分析工具 · ${TRIAL_VERSION}\n浏览器：${navigator.userAgent}\n进行的任务：\n操作步骤：\n期望结果：\n实际结果 / 错误提示：\n最困惑的一步：\n（请自行决定是否提供项目参数，不包含自动上传）`;
  try{await navigator.clipboard.writeText(text);toast('反馈模板已复制，可粘贴后填写');}
  catch(e){const p=document.createElement('textarea');p.value=text;p.setAttribute('aria-label','反馈模板，可选择复制');p.style.cssText='width:100%;min-height:220px';pgG.append(p);p.focus();p.select();}
};
const route=location.hash.slice(1);
if(['guide','input','report','compare','quiz'].includes(route))showTab(route);
else {try{if(!localStorage.getItem(LS_KEY))showTab('guide');}catch(e){showTab('guide');}}
