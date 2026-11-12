'use strict';
/* =====================================================================
   财务指标分析层
   方法：比率分析、趋势分析、结构分析、敏感性/临界点分析、规则判断
   原则：只使用计算期内的测算结果，不进行外推预测；不引入主观权重评分。
===================================================================== */
function analyzeModel(s,M,J){
  const nO=s.opYears;
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const mean=a=>a.length?sum(a)/a.length:0;
  const finite=a=>a.filter(isFinite);
  const div=(a,b)=>b?a/b:NaN;
  const share=(v,total)=>total?v/total:NaN;
  const ny=M.normalY;

  const trend=(label,arr)=>{
    const n=arr.length;
    if(!n)return {label,first:NaN,last:NaN,changePct:NaN,cagr:NaN,slope:NaN,r2:NaN,direction:'—'};
    const first=arr[0],last=arr[n-1];
    const changePct=Math.abs(first)>1e-12?(last-first)/Math.abs(first):NaN;
    const cagr=first>0&&last>0?Math.pow(last/first,1/Math.max(1,n-1))-1:NaN;
    let slope=0,r2=0;
    if(n>1){
      const xs=arr.map((_,i)=>i),mx=mean(xs),my=mean(arr);
      let num=0,den=0;
      xs.forEach((x,i)=>{num+=(x-mx)*(arr[i]-my);den+=(x-mx)*(x-mx);});
      slope=den?num/den:0;
      let ssTot=0,ssRes=0;
      arr.forEach((y,i)=>{ssTot+=(y-my)*(y-my);ssRes+=(y-(my+slope*(xs[i]-mx)))*(y-(my+slope*(xs[i]-mx)));});
      r2=ssTot?Math.max(0,Math.min(1,1-ssRes/ssTot)):0;
    }
    const direction=Math.abs(slope)<1e-9?'持平':slope>0?'上升':'下降';
    return {label,first,last,changePct,cagr,slope,r2,direction};
  };

  const minIcr=finite(M.icrY).length?Math.min(...finite(M.icrY)):NaN;
  const avgIcr=mean(finite(M.icrY));
  const minDscr=finite(M.dscrY).length?Math.min(...finite(M.dscrY)):NaN;
  const avgDscr=mean(finite(M.dscrY));
  const debtArr=M.bs.map(b=>b.debtRatio);
  const maxDebt=Math.max(...debtArr);
  const avgDebt=mean(debtArr);
  const currArr=M.bs.map(b=>b.currentRatio).filter(isFinite);
  const quickArr=M.bs.map(b=>b.quickRatio).filter(isFinite);
  const minCurrent=currArr.length?Math.min(...currArr):NaN;
  const minQuick=quickArr.length?Math.min(...quickArr):NaN;
  const minCum=Math.min(...M.cumSurplusY);
  const negYears=M.cumSurplusY.filter(v=>v<0).length;

  const status=(ok,ref)=>ok===null||ok===undefined?(ref||'—'):ok?'达标':'未达标';
  const checks=Object.fromEntries(J.items.map(it=>[it.key,it.pass]));
  const icrPass=checks.icr===undefined?(isFinite(minIcr)?minIcr>=1:null):checks.icr;
  const dscrPass=checks.dscr===undefined?(isFinite(minDscr)?minDscr>=1:null):checks.dscr;
  const indicators=[
    {group:'盈利能力',name:'全部投资财务净现值 NPV',value:M.ind.ai.npv,unit:'万元',benchmark:'≥ 0',status:status(M.ind.ai.npv>=0),method:'折现现金流法'},
    {group:'盈利能力',name:'全部投资内部收益率 IRR',value:M.ind.ai.irr,unit:'',benchmark:'≥ '+pc(s.i0,0),status:status(isFinite(M.ind.ai.irr)&&M.ind.ai.irr>=s.i0),method:'使 NPV=0 的折现率'},
    {group:'盈利能力',name:'静态投资回收期',value:M.ind.ai.pt,unit:'年',benchmark:'≤ '+s.ptBase,status:status(isFinite(M.ind.ai.pt)&&M.ind.ai.pt<=s.ptBase),method:'累计净现金流量法'},
    {group:'盈利能力',name:'动态投资回收期',value:M.ind.ai.pd,unit:'年',benchmark:'≤ '+s.pdBase,status:status(isFinite(M.ind.ai.pd)&&M.ind.ai.pd<=s.pdBase),method:'累计折现净现金流量法'},
    {group:'盈利能力',name:'总投资收益率 ROI',value:M.roiPre,unit:'',benchmark:'参考',status:'参考',method:'EBIT/项目总投资'},
    {group:'盈利能力',name:'资本金净利润率 ROE',value:M.roeNormal,unit:'',benchmark:'参考',status:'参考',method:'净利润/项目资本金'},
    {group:'盈利能力',name:'销售净利率（正常年）',value:div(M.netProfitY[ny],M.revY[ny]),unit:'',benchmark:'参考',status:'参考',method:'净利润/营业收入'},
    {group:'盈利能力',name:'成本利润率（正常年）',value:div(M.profitY[ny],M.totCostY[ny]),unit:'',benchmark:'参考',status:'参考',method:'利润总额/总成本费用'},
    {group:'偿债能力',name:'利息备付率 ICR（最低）',value:minIcr,unit:'',benchmark:'≥ 1',status:status(icrPass,'不适用'),method:'(利润总额+利息)/利息'},
    {group:'偿债能力',name:'偿债备付率 DSCR（最低）',value:minDscr,unit:'',benchmark:'≥ 1',status:status(dscrPass,'不适用'),method:'(净利润+折旧+摊销+利息)/应还本付息'},
    {group:'偿债能力',name:'资产负债率（最高）',value:maxDebt,unit:'',benchmark:'参考 ≤ 70%',status:maxDebt<=0.70?'参考':'关注',method:'负债总额/资产总额'},
    {group:'偿债能力',name:'流动比率（最低）',value:minCurrent,unit:'',benchmark:'参考 ≥ 1.2',status:isFinite(minCurrent)&&minCurrent>=1.2?'参考':'关注',method:'流动资产/流动负债'},
    {group:'偿债能力',name:'速动比率（最低）',value:minQuick,unit:'',benchmark:'参考 ≥ 1.0',status:isFinite(minQuick)&&minQuick>=1.0?'参考':'关注',method:'(流动资产−存货)/流动负债'},
    {group:'营运能力',name:'应收账款周转率（正常年）',value:div(M.revY[ny],M.arY[ny]),unit:'次',benchmark:'参考',status:'参考',method:'营业收入/应收账款'},
    {group:'营运能力',name:'存货周转率（正常年）',value:div(M.opcY[ny],M.invY2[ny]),unit:'次',benchmark:'参考',status:'参考',method:'经营成本/存货'},
    {group:'营运能力',name:'流动资金周转率（正常年）',value:div(M.revY[ny],M.wcY[ny]),unit:'次',benchmark:'参考',status:'参考',method:'营业收入/流动资金'},
    {group:'生存能力',name:'累计盈余资金最小值',value:minCum,unit:'万元',benchmark:'≥ 0',status:status(isFinite(minCum)&&minCum>=0),method:'资金来源−资金运用逐年累计'},
    {group:'不确定性',name:'盈亏平衡点 BEP',value:M.bepNormal,unit:'',benchmark:'< 100%',status:status(isFinite(M.bepNormal)&&M.bepNormal<1),method:M.isCurrent?'固定成本/满产贡献额':'固定成本/(收入−税金−可变成本)'},
  ];

  const revenue=trend('营业收入',M.revY);
  const totalCost=trend('总成本费用',M.totCostY);
  const profit=trend('利润总额',M.profitY);
  const netProfit=trend('净利润',M.netProfitY);
  const debtTrend=trend('资产负债率',debtArr);
  const cumSurplusTrend=trend('累计盈余资金',M.cumSurplusY);
  const firstPositiveCum=M.aiCum.findIndex(v=>v>=0);
  const trends=[revenue,totalCost,profit,netProfit,debtTrend,cumSurplusTrend];

  const invTotal=M.conInv;
  const costTotal=M.totCostY[ny];
  const finTotal=M.capTotal+M.ltP0+sum(M.wcLoanY);
  const assetTotal=M.bs[ny].asset;
  const liabTotal=M.bs[ny].liabEq;
  const structures={
    investment:[
      {name:'建筑工程费',value:M.gBuild},
      {name:'设备购置费',value:M.gEquip},
      {name:'安装工程费',value:M.gInst},
      {name:'其他费用',value:M.gOther},
      {name:'预备费',value:M.rsv},
    ].map(x=>({...x,share:share(x.value,invTotal)})),
    cost:[
      {name:'原材料',value:M.matY[ny]},
      {name:'燃料动力',value:M.fuelY[ny]},
      {name:'工资福利',value:M.wagY[ny]},
      {name:'修理费',value:M.repY[ny]},
      {name:'其他费用',value:M.othY[ny]},
      {name:'折旧费',value:M.depTotY[ny]},
      {name:'摊销费',value:M.amortY[ny]},
      {name:'利息支出',value:M.intTotalY[ny]},
    ].map(x=>({...x,share:share(x.value,costTotal)})),
    financing:[
      {name:'项目资本金',value:M.capTotal},
      {name:'长期借款',value:M.ltP0},
      {name:'流动资金借款',value:sum(M.wcLoanY)},
    ].map(x=>({...x,share:share(x.value,finTotal)})),
    assets:[
      {name:'流动资产',value:M.bs[ny].ca},
      {name:'固定资产净值',value:M.bs[ny].faNet},
      {name:'无形及其他资产净值',value:M.bs[ny].iaNet},
    ].map(x=>({...x,share:share(x.value,assetTotal)})),
    liabilities:[
      {name:'流动负债',value:M.bs[ny].cl},
      {name:'长期借款',value:M.bs[ny].ltBal},
      {name:'所有者权益',value:M.bs[ny].equity},
    ].map(x=>({...x,share:share(x.value,liabTotal)})),
  };

  const baseNpv=M.ind.ai.npv;
  const sensFactors=[
    {key:'inv',name:'建设投资',arr:M.sens?M.sens.inv:[]},
    {key:'opc',name:'经营成本',arr:M.sens?M.sens.opc:[]},
    {key:'rev',name:'营业收入',arr:M.sens?M.sens.rev:[]},
  ].map(f=>{
    const change=f.arr.length===5?f.arr[4]-f.arr[0]:NaN;
    const perPct=f.arr.length===5?change/40:NaN;
    const elasticity=Math.abs(baseNpv)>1e-9?perPct/baseNpv:NaN;
    return {...f,change,perPct,elasticity};
  }).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
  const criticalPoint=key=>{
    const fn=k=>computeModel(s,key==='inv'?{inv:k}:key==='opc'?{opc:k}:{rev:k}).ind.ai.npv;
    let lo=0.3,hi=2.0,flo=fn(lo),fhi=fn(hi);
    if(!isFinite(flo)||!isFinite(fhi)||flo*fhi>0)return null;
    for(let i=0;i<60;i++){
      const mid=(lo+hi)/2,fm=fn(mid);
      if(flo*fm<=0){hi=mid;fhi=fm;}else{lo=mid;flo=fm;}
    }
    return (lo+hi)/2;
  };
  const criticalPoints=sensFactors.map(f=>({name:f.name,k:criticalPoint(f.key)})).map(x=>({...x,changePct:x.k!=null?(x.k-1):null}));

  const reasons=[];
  const {npvAi:npvOk,irrAi:irrOk,ptAi:ptOk,pdAi:pdOk,fsurv:survOk}=checks;
  const equityOk=checks.npvEq&&checks.irrEq;
  const debtOk=icrPass!==false&&dscrPass!==false;
  let level='财务可行';
  if(!npvOk||!irrOk){level='财务不可行（收益不足）';reasons.push('全部投资 NPV<0 或 IRR<基准收益率');}
  if(!survOk){if(level==='财务可行')level='财务生存能力不足';reasons.push('累计盈余资金出现负值');}
  if(!debtOk){if(level==='财务可行')level='存在偿债压力';reasons.push('适用的 ICR 或 DSCR 未达到 1');}
  if(!ptOk||!pdOk){if(level==='财务可行')level='基本可行（回收期偏长）';reasons.push('静态或动态回收期超过基准');}
  if(M.isCurrent&&!equityOk){
    if(level==='财务可行'||level.startsWith('基本可行'))level='资本金收益未达标';
    reasons.push('资本金 NPV 或 IRR 未达到基准');
  }
  if(!reasons.length)reasons.push('所有适用指标均满足基准');

  const largest=a=>a.slice().sort((x,y)=>Math.abs(y.value)-Math.abs(x.value))[0];
  const invL=largest(structures.investment);
  const costL=largest(structures.cost);
  const finL=largest(structures.financing);
  const conclusions=[];
  conclusions.push(`盈利能力：NPV ${f2(M.ind.ai.npv)} 万元、IRR ${pc(M.ind.ai.irr)}，${npvOk&&irrOk?'达到':'未达到'}基准；ROI ${pc(M.roiPre)}、ROE ${pc(M.roeNormal)}。`);
  conclusions.push(`偿债能力：ICR ${icrPass===null?'不适用':'最低 '+f2(minIcr)}、DSCR ${dscrPass===null?'不适用':'最低 '+f2(minDscr)}。资产负债率最高 ${pc(maxDebt,1)}。`);
  conclusions.push(`生存能力：累计盈余资金最小值 ${f2(minCum)} 万元，负值年份 ${negYears} 个。`);
  conclusions.push(`趋势：计算期内营业收入${revenue.direction}、总成本${totalCost.direction}、净利润${netProfit.direction}；资产负债率${debtTrend.direction}。`);
  conclusions.push(`结构：建设投资中${invL.name}占比 ${pc(invL.share,1)}；正常年总成本中${costL.name}占比 ${pc(costL.share,1)}；融资中${finL.name}占比 ${pc(finL.share,1)}。`);
  if(sensFactors.length){
    const top=sensFactors[0];
    conclusions.push(`敏感性：最敏感因素为${top.name}，每变动 1% 使 NPV 变动 ${f2(top.perPct)} 万元；${criticalPoints.filter(c=>c.changePct!=null).map(c=>`${c.name}临界点 ${pc(c.changePct,1)}`).join('、')||'在 −70%～+100% 范围内未出现 NPV=0 的临界点'}。`);
  }
  if(isFinite(M.ind.eq.irr)&&M.ind.eq.irr>=(s.i0Equity??s.i0)&&(!npvOk||!irrOk)){
    conclusions.push('资本金收益率高于基准而全部投资收益率低于基准：项目收益对融资结构较敏感，应结合资本金比例、补贴或价格机制评价。');
  }
  conclusions.push(`可行性判断：${level}。${reasons.join('；')}。`);

  return {
    version:'2026.11',
    methods:[
      {name:'比率分析法',use:'盈利能力、偿债能力、营运能力'},
      {name:'趋势分析法',use:'计算期内收入、成本、利润、负债率的斜率、R²、CAGR'},
      {name:'结构分析法',use:'投资、成本、融资、资产、负债结构'},
      {name:'敏感性分析与临界点',use:'±20% NPV 变动、每 1% 变动、NPV=0 临界点'},
      {name:'规则判断法',use:'NPV/IRR/回收期/ICR/DSCR/生存能力阈值'},
    ],
    classification:{level,reasons},
    indicators,trends,structures,sensitivity:{ranking:sensFactors,critical:criticalPoints},
    survival:{minCum,negYears,minIcr,avgIcr,minDscr,avgDscr,maxDebt,avgDebt,minCurrent,minQuick,firstPositiveCum},
    conclusions,
    limitations:[
      '本分析仅使用计算期内测算数据，不进行外推预测。',
      '价格、成本、负荷、税率等参数由用户输入或公开资料映射，未开展市场、技术、政策专项论证。',
      '趋势分析反映计算期内负荷爬坡、折旧和还款安排的影响，不代表未来市场趋势。',
    ],
  };
}
