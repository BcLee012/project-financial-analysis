'use strict';
/* =====================================================================
   分节分析提示生成器
   统一写作结构：结论句 + 数据依据 + 方法/口径 + 关注事项
   原则：只用计算期内数据，不做预测，不使用主观评分。
===================================================================== */
const INSIGHT_LABELS={
  investment:'建设投资',financing:'资金筹措',depreciation:'折旧摊销',cost:'总成本',
  revenue:'收入税金',workingCapital:'流动资金',repayment:'还本付息',profit:'利润分配',
  cashflow:'全部投资现金流',capitalCashflow:'资本金现金流',sourceUse:'资金来源运用',
  balanceSheet:'资产负债表',indicators:'评价指标',bep:'盈亏平衡',sensitivity:'敏感性',
  survival:'财务生存能力',analysis:'规则判断',
};

function buildInsights(s,M,J,A){
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const div=(a,b)=>b?a/b:NaN;
  const share=(v,total)=>total?v/total:NaN;
  const largest=a=>a.slice().sort((x,y)=>Math.abs(y.value)-Math.abs(x.value))[0];
  const fin=a=>a.filter(isFinite);
  const ny=M.normalY;
  const out={};
  const add=(key,level,title,text)=>{(out[key]=out[key]||[]).push({level,title,text});};
  const minIcr=fin(M.icrY).length?Math.min(...fin(M.icrY)):NaN;
  const minDscr=fin(M.dscrY).length?Math.min(...fin(M.dscrY)):NaN;
  const maxDebt=Math.max(...M.bs.map(b=>b.debtRatio));
  const curr=fin(M.bs.map(b=>b.currentRatio));
  const quick=fin(M.bs.map(b=>b.quickRatio));
  const minCurrent=curr.length?Math.min(...curr):NaN;
  const minQuick=quick.length?Math.min(...quick):NaN;
  const minCum=Math.min(...M.cumSurplusY);
  const negYears=M.cumSurplusY.filter(v=>v<0).length;
  const npvOk=isFinite(M.ind.ai.npv)&&M.ind.ai.npv>=0;
  const irrOk=isFinite(M.ind.ai.irr)&&M.ind.ai.irr>=s.i0;
  const R=(typeof PFE_RULES!=='undefined')?PFE_RULES:null;
  const ind=R?R.industries.find(i=>i.key===s.industryKey):null;

  /* 建设投资 */
  const invParts=[
    {name:'建筑工程费',value:M.gBuild},{name:'设备购置费',value:M.gEquip},
    {name:'安装工程费',value:M.gInst},{name:'其他费用',value:M.gOther},{name:'预备费',value:M.rsv},
  ];
  const invL=largest(invParts);
  add('investment','key','投资构成',`建设投资 ${f2(M.conInv)} 万元；${invL.name}占比最高，为 ${pc(share(invL.value,M.conInv),1)}，设备购置费与安装工程费合计占 ${pc(share(M.gEquip+M.gInst,M.conInv),1)}（按附表1口径）。`);
  const rsvRate=div(M.rsv,M.conInv);
  add('investment',rsvRate>0.15?'watch':'info','预备费',`预备费 ${f2(M.rsv)} 万元，占建设投资 ${pc(rsvRate,1)}；${rsvRate>0.15?'高于 15% 参考值，建议核对工程量与费率':'未超过 15% 参考值'}。`);
  const othShare=share(M.gOther,M.conInv);
  if(othShare>0.20)add('investment','watch','其他费用',`其他费用 ${f2(M.gOther)} 万元，占建设投资 ${pc(othShare,1)}，高于 20% 参考值，建议按费用科目逐项复核。`);

  /* 资金筹措 */
  const debt=M.ltP0+sum(M.wcLoanY);
  const finTotal=M.capTotal+debt;
  const capShare=div(M.capTotal,finTotal);
  add('financing','key','融资结构',`项目资本金 ${f2(M.capTotal)} 万元，占融资总额 ${pc(capShare,1)}；债务资金 ${f2(debt)} 万元，占 ${pc(1-capShare,1)}。`);
  if(capShare<0.20)add('financing','watch','资本金比例',`资本金比例 ${pc(capShare,1)} 低于 20% 参考下限，需按行业规定复核。`);
  add('financing','info','建设期利息',`建设期利息 ${f2(M.buildIntTotal)} 万元，占建设投资 ${pc(div(M.buildIntTotal,M.conInv),2)}，按“${s.buildIntMode==='half'?'半年':'全年'}计息”口径。`);

  /* 折旧摊销 */
  const depAm=M.depTotY[ny]+M.amortY[ny];
  add('depreciation','key','折旧摊销',`正常年折旧摊销 ${f2(depAm)} 万元，占总成本 ${pc(div(depAm,M.totCostY[ny]),1)}；其中折旧 ${f2(M.depTotY[ny])} 万元、摊销 ${f2(M.amortY[ny])} 万元。`);
  if(ind&&(s.depYears<ind.depRange[0]||s.depYears>ind.depRange[1]))add('depreciation','watch','折旧年限',`折旧年限 ${s.depYears} 年，超出${ind.name}参考区间 ${ind.depRange[0]}–${ind.depRange[1]} 年，需按资产类别复核。`);
  else add('depreciation','info','折旧年限',`折旧年限 ${s.depYears} 年，残值率 ${pc(s.salvageRate,0)}；折旧期结束后修理费基数相应下降。`);

  /* 总成本 */
  const costParts=[
    {name:'原材料',value:M.matY[ny]},{name:'燃料动力',value:M.fuelY[ny]},
    {name:'工资福利',value:M.wagY[ny]},{name:'修理费',value:M.repY[ny]},
    {name:'其他费用',value:M.othY[ny]},{name:'折旧费',value:M.depTotY[ny]},
    {name:'摊销费',value:M.amortY[ny]},{name:'利息支出',value:M.intTotalY[ny]},
  ];
  const costL=largest(costParts);
  const fixedShare=div(M.fixCostY[ny],M.totCostY[ny]);
  add('cost','key','成本结构',`正常年总成本 ${f2(M.totCostY[ny])} 万元；${costL.name}占比最高，为 ${pc(share(costL.value,M.totCostY[ny]),1)}；固定成本占 ${pc(fixedShare,1)}，可变成本占 ${pc(1-fixedShare,1)}。`);
  if(fixedShare>0.50)add('cost','watch','成本刚性',`固定成本占比 ${pc(fixedShare,1)} 高于 50%，负荷下降时单位成本上升较快。`);
  if(s.price>0.01){
    const uc=div(M.opcY[ny],s.designQty*Math.max(s.load[ny],1e-9));
    const price=M.isCurrent?s.price/(1+s.vatRate):s.price;
    if(isFinite(uc))add('cost','info','单位成本',`正常年单位产品经营成本 ${f2(uc)} 万元，${M.isCurrent?'不含税':''}产品单价 ${f2(price)} 万元。`);
  }

  /* 收入税金 */
  const taxShare=div(M.taxSurY[ny],M.revY[ny]);
  const vatLabel=M.isCurrent&&s.vatMethod==='simple'?'简易计税征收率':'增值税率';
  add('revenue','key','收入与税负',`正常年营业收入 ${f2(M.revY[ny])} 万元，税金及附加 ${f2(M.taxSurY[ny])} 万元，占收入 ${pc(taxShare,1)}；${vatLabel} ${pc(s.vatRate,0)}${M.isCurrent&&s.vatMethod==='simple'?'（进项不抵扣）':''}。`);
  if(taxShare>0.10)add('revenue','watch','税负水平',`税金及附加占收入 ${pc(taxShare,1)}，高于 10% 参考值，建议复核税率与进项抵扣。`);

  /* 流动资金 */
  const wc=M.wcY[ny],wcShare=div(wc,M.revY[ny]),wcTurn=div(M.revY[ny],wc);
  add('workingCapital','key','流动资金占用',`正常年流动资金 ${f2(wc)} 万元，占营业收入 ${pc(wcShare,1)}，周转率 ${f2(wcTurn)} 次。`);
  if(wcShare>0.30)add('workingCapital','watch','占用水平',`流动资金占营业收入 ${pc(wcShare,1)}，高于 30% 参考值，建议复核周转天数。`);

  /* 还本付息 */
  add('repayment','key','偿债指标',`ICR ${isFinite(minIcr)?'最低 '+f2(minIcr):'不适用'}、DSCR ${isFinite(minDscr)?'最低 '+f2(minDscr):'不适用'}。运营期长期借款利息合计 ${f2(sum(M.ltIntY))} 万元，占运营期收入 ${pc(div(sum(M.ltIntY),sum(M.revY)),1)}。`);
  if(minIcr<1||minDscr<1)add('repayment','watch','偿债压力',`${minIcr<1?'ICR':'DSCR'} 最低值低于 1，存在${minIcr<1?'付息':'还本付息'}缺口。`);

  /* 利润 */
  const netMargin=div(M.netProfitY[ny],M.revY[ny]);
  add('profit','key','利润水平',`正常年利润总额 ${f2(M.profitY[ny])} 万元、净利润 ${f2(M.netProfitY[ny])} 万元，销售净利率 ${pc(netMargin,1)}；累计未分配利润末年 ${f2(M.cumUndistY[M.cumUndistY.length-1])} 万元。`);
  const lossYears=M.profitY.filter(v=>v<0).length;
  if(lossYears)add('profit','watch','亏损年份',`有 ${lossYears} 个运营年利润总额为负，需关注累计未分配利润的恢复情况。`);

  /* 现金流 */
  const fp=M.aiCum.findIndex(v=>v>=0);
  add('cashflow','key','现金流指标',`全部投资 NPV ${f2(M.ind.ai.npv)} 万元、IRR ${pc(M.ind.ai.irr)}、静态回收期 ${isFinite(M.ind.ai.pt)?f2(M.ind.ai.pt)+' 年':'未回收'}；累计净现金流${fp>=0?'第 '+fp+' 个时点转正':'未转正'}。`);
  if(!npvOk||!irrOk)add('cashflow','watch','收益水平','全部投资 NPV<0 或 IRR<基准收益率，项目自身收益不足以覆盖基准要求。');

  /* 资本金现金流 */
  add('capitalCashflow','key','资本金收益',`资本金 IRR ${pc(M.ind.eq.irr)}、NPV ${f2(M.ind.eq.npv)}；${M.ind.eq.irr>=M.ind.ai.irr?'高于':'低于'}全部投资 IRR ${pc(M.ind.ai.irr)}。`);

  /* 资金来源运用 */
  add('sourceUse','key','资金平衡',`运营期累计盈余资金最小值 ${f2(minCum)} 万元，负值年份 ${negYears} 个。`);
  if(negYears)add('sourceUse','watch','资金缺口',`存在 ${negYears} 个累计盈余资金为负的年份，需补充资本金或调整融资/还款安排。`);

  /* 资产负债表 */
  add('balanceSheet','key','资产负债',`资产负债率最高 ${pc(maxDebt,1)}，流动比率最低 ${f2(minCurrent)}，速动比率最低 ${f2(minQuick)}。`);
  if(maxDebt>0.70)add('balanceSheet','watch','负债水平',`资产负债率最高 ${pc(maxDebt,1)}，高于 70% 参考值，需关注长期偿债压力。`);
  if(isFinite(minCurrent)&&minCurrent<1)add('balanceSheet','watch','流动性',`流动比率最低 ${f2(minCurrent)}，低于 1，短期偿债能力偏紧。`);

  /* 指标汇总 */
  const passed=J.items.filter(i=>i.pass).length;
  const applicable=J.items.filter(i=>i.pass!==null);
  add('indicators','key','判断指标',`${passed}/${applicable.length} 项适用指标达标。${applicable.filter(i=>!i.pass).map(i=>i.label).join('、')||'无未达标项'}。`);
  if(J.passAll)add('indicators','info','综合评价','全部适用指标达到基准要求。');

  /* 盈亏平衡 */
  const bep=M.bepNormal,normalLoad=s.load[M.normalY];
  const safety=M.isCurrent?(normalLoad-bep)/normalLoad:1-bep;
  if(isFinite(bep)){
    add('bep','key','盈亏平衡',`正常年 BEP ${pc(bep,1)}，按该年预计产量计算的安全边际率 ${pc(safety,1)}。`);
    if(safety<0.20)add('bep','watch','安全边际',`正常年安全边际率为 ${pc(safety,1)}，对负荷和价格变化较敏感。`);
  }else{
    add('bep','watch','盈亏平衡','该年无正贡献额，无法得出保本点。');
  }

  /* 敏感性 */
  if(A&&A.sensitivity&&A.sensitivity.ranking.length){
    const top=A.sensitivity.ranking[0];
    add('sensitivity','key','敏感因素',`最敏感因素为${top.name}，每变动 1% 使 NPV 变动 ${f2(top.perPct)} 万元（±20% 变动 ${f2(top.change)} 万元）。`);
    const near=A.sensitivity.critical.filter(c=>c.changePct!=null&&Math.abs(c.changePct)<0.10);
    if(near.length)add('sensitivity','watch','临界点',`${near.map(c=>c.name+' '+pc(c.changePct,1)).join('、')} 的 NPV=0 临界点位于 ±10% 内，需重点监控。`);
    else add('sensitivity','info','临界点',`${A.sensitivity.critical.filter(c=>c.changePct!=null).map(c=>c.name+' '+pc(c.changePct,1)).join('、')||'在 −70%～+100% 范围内未出现 NPV=0'}。`);
  }

  /* 生存能力 */
  add('survival','key','财务生存',`累计盈余资金最小值 ${f2(minCum)} 万元，负值年份 ${negYears} 个；${minCum>=0?'各年均为非负':'存在资金缺口年份'}。`);
  if(minCum<0)add('survival','watch','资金链',`累计盈余资金出现负值，需通过资本金、借款期限或流动资金安排弥补。`);

  /* 规则判断 */
  if(A&&A.classification)add('analysis','key','规则判断',`${A.classification.level}；${A.classification.reasons.join('；')}。`);

  return out;
}
