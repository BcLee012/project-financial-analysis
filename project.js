'use strict';
/* Shared validation and project-file contract; no browser dependencies. */
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function projectIssue(s){
  const fail=(key,message)=>({key,message});
  if(!s||typeof s!=='object')return fail('projName','项目数据格式不正确');
  for(const k of ['projName','projPlace','projIndustry','province','location','industryKey','reportOrg','reportNo','reportDate','caseSource'])if(typeof s[k]!=='string'||s[k].length>8000)return fail(k,'项目文字信息格式不正确或过长');
  if(!s.projName.trim())return fail('projName','请填写项目名称');
  if(typeof PFE_RULES!=='undefined'){for(const [key,rows,valueKey] of [['province',PFE_RULES.provinces,'name'],['industryKey',PFE_RULES.industries,'key'],['location',PFE_RULES.locationCategories,'key']])if(!rows.some(row=>row[valueKey]===s[key]))return fail(key,'请选择列表中的地区或行业');}
  for(const [k,max] of [['buildYears',10],['opYears',30]])if(!Number.isInteger(s[k])||s[k]<1||s[k]>max)return fail(k,`${k==='buildYears'?'建设期':'运营期'}须为 1–${max} 的整数年`);
  if(!Number.isInteger(s.repayYears)||s.repayYears<1||s.repayYears>s.opYears)return fail('repayYears','借款偿还年限须为整数，且在 1 年至运营期之间');
  const labels={instRate:'安装费率',freightRate:'设备运杂费率',basicRsv:'基本预备费率',priceRsv:'涨价预备费率',landFee:'土地征用费',startupFee:'开办费',patentFee:'专利及技术使用费',ltRate:'长期借款利率',depYears:'固定资产折旧年限',salvageRate:'折旧残值率',assetRecoveryRatio:'期末净回收比例',landDepYears:'土地折旧年限',patentAmortYears:'无形资产摊销年限',startupAmortYears:'开办费摊销年限',designQty:'年设计产量',unitMat:'单位原材料成本',unitFuel:'单位燃料成本',staff:'员工人数',wage:'人均年工资',repairRate:'修理费率',otherRate:'其他费用费率',price:'产品含税单价',vatRate:'增值税率',cityTax:'城建税率',eduTax:'教育附加率',dAr:'应收账款周转天数',dMat:'原材料周转天数',dFuel:'燃料周转天数',dWip:'在产品周转天数',dFg:'产成品周转天数',dCash:'现金周转天数',dAp:'应付账款周转天数',wcLoanRate:'流动资金利率',wcLoanRatio:'流动资金借款比例',incomeTax:'所得税率',surplusR:'盈余公积比例',welfareR:'公益金比例',ptBase:'静态回收期基准',pdBase:'动态回收期基准'};
  for(const [k,l] of Object.entries(labels))if(!Number.isFinite(s[k])||s[k]<0)return fail(k,`${l}须填写非负数值，不能留空`);
  for(const k of ['depYears','landDepYears','patentAmortYears','startupAmortYears','designQty','ptBase','pdBase'])if(s[k]<=0)return fail(k,`${labels[k]}须大于 0`);
  if(!Number.isInteger(s.staff))return fail('staff','员工人数须为非负整数');
  for(const k of ['freightRate','salvageRate','vatRate','cityTax','eduTax','wcLoanRatio','incomeTax','surplusR','welfareR'])if(s[k]>1)return fail(k,`${labels[k]}须在 0% 至 100% 之间`);
  if(s.surplusR+s.welfareR>1)return fail('welfareR','盈余公积和公益金比例合计不能超过 100%');
  for(const k of ['i0','i0Pre','i0Equity'])if(!(k!=='i0'&&s[k]==null)&&(!Number.isFinite(s[k])||s[k]<=-1))return fail(k,'基准收益率须为大于 −100% 的有效数值');
  for(const k of ['matVatRate','fuelVatRate'])if(s[k]!=null&&(!Number.isFinite(s[k])||s[k]<0||s[k]>1))return fail(k,'进项税率须在 0% 至 100% 之间，或留空');
  for(const [k,n] of [['load',s.opYears],['incomeTaxRates',s.opYears],['invSplit',s.buildYears],['loanRatio',s.buildYears]]){
    if(!Array.isArray(s[k])||s[k].length!==n)return fail(k,`分年参数数量与计算期不一致，请检查${k==='load'?'生产负荷':k==='incomeTaxRates'?'所得税率':'建设期分配'}`);
    for(let i=0;i<n;i++){
      const v=s[k][i];if(k==='incomeTaxRates'&&v==null)continue;
      if(!Number.isFinite(v)||v<0||(['incomeTaxRates','loanRatio'].includes(k)&&v>1))return fail(`${k}.${i}`,'请填写有效的分年参数：负荷和投资分配须非负，借款及所得税比例须在 0% 至 100% 之间');
    }
  }
  if(!s.invSplit.some(v=>v>0))return fail('invSplit.0','各年投资分配合计须大于 0（计算时会按合计归一化）');
  if(!Array.isArray(s.engItems)||!s.engItems.length||s.engItems.length>200)return fail('engItems','工程明细须包含 1–200 项');
  for(let i=0;i<s.engItems.length;i++){
    const it=s.engItems[i];if(!it||typeof it.name!=='string'||it.name.length>300)return fail('engItems',`第 ${i+1} 项工程名称无效`);
    for(const k of ['qty','price','equip'])if(!Number.isFinite(it[k])||it[k]<0)return fail(`engItems.${i}.${k}`,`第 ${i+1} 项工程的工程量、单价和设备费须填写非负数值`);
  }
  if(!s.engItems.some(it=>it.qty*it.price>0||it.equip>0)&&s.landFee+s.startupFee+s.patentFee<=0)return fail('engItems','请填写至少一项大于 0 的建设投资');
  for(const [k,allowed] of Object.entries({caliber:['current','legacy'],repayMethod:['equalPrincipal','equalInstallment'],buildIntMode:['half','full'],vatMethod:['general','simple'],policyProfile:['none','jianyangWater']}))if(!allowed.includes(s[k]))return fail(k,'请选择有效的计算或案例选项');
  return null;
}
function parseProjectFile(text,defaults){
  if(text.length>1000000)throw Error('项目文件过大，请选择本工具导出的项目数据文件');
  const pack=JSON.parse(text);
  if(!pack||pack.format!=='pfe-project'||pack.version!==1||!pack.data||typeof pack.data!=='object')throw Error('文件格式或版本不支持，请选择本工具导出的 JSON 项目文件');
  const data={};for(const k of Object.keys(defaults)){if(!Object.prototype.hasOwnProperty.call(pack.data,k))throw Error('项目文件缺少参数：'+k);data[k]=pack.data[k];}
  const issue=projectIssue(data);if(issue)throw Error(issue.message);
  return data;
}
function projectFileData(data){return {format:'pfe-project',version:1,exportedAt:new Date().toISOString(),data};}
