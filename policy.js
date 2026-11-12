'use strict';
/* 人工核验的单案例政策资料；不是实时政策检索，也不自动判断项目合规。 */
const PFE_POLICY = {
  jianyangWater: {
    checked: '2026-11-12',
    project: '南平市建阳区供水设施及管道提升工程',
    source: 'https://ggzy.np.gov.cn/npztbold/AttachStorage/ZTBFileStorage/202210/J079/2a7cb661-a4df-4d51-ad12-c6e33145c6b9/20220809%E5%8D%97%E5%B9%B3%E5%B8%82%E5%BB%BA%E9%98%B3%E5%8C%BA%E4%BE%9B%E6%B0%B4%E8%AE%BE%E6%96%BD%E5%8F%8A%E7%AE%A1%E9%81%93%E6%8F%90%E5%8D%87%E6%94%B9%E9%80%A0%E5%B7%A5%E7%A8%8B%E5%8F%AF%E8%A1%8C%E6%80%A7%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A.pdf',
    records: [
      { name:'《供水条例》', id:'国务院令第831号，第14条等', date:'2026-06-01施行', url:'https://sfj.wuhan.gov.cn/zfxxgk/zc/qtzdgkwj/202603/t20260325_2744858.shtml', summary:'供水工程建设应符合有关法律、法规和国家标准；有关居民住宅共有供水设施的改造按具体情形处理。', action:'对照实际建设内容核对供水规划、技术标准、水质保障及有关验收资料。该条例不适用于倒推2022年可研的编制要求。' },
      { name:'《福建省城乡供水条例》（2021年修正文本）', id:'第二十一条、第二十二条等', date:'2021年修正文本；当前效力待核', url:'https://fj.gov.cn/zwgk/flfg/dfxfg/202105/t20210512_5592900.htm', summary:'文本涉及供水专项规划、设施改造年度计划及老旧管道更新。省政府网页将该文本标记为废止、失效，尚需核清具体原因及现行版本。', action:'请向法规库或主管部门核验现行效力及与上位法的衔接；取得建阳区供水专项规划和年度改造计划后再判断。' },
      { name:'《南平市推动大规模设备更新和消费品以旧换新行动工作方案》', id:'市政基础设施更新部分', date:'2024年发布，目标至2027年', url:'https://fgw.fujian.gov.cn/ztzl/dgmsbgxhxfpyjhx/dm/np_63018/202406/t20240604_6460083.htm', summary:'提出更新老旧、破损和影响水质的供水管道及二次供水设施。', action:'可用作2024年之后城市更新方向的背景；应核对项目实施时间、纳入计划情况和具体资金条件，不能据此认定获得补助。' },
      { name:'投资项目可行性研究报告编写大纲及说明', id:'发改投资规〔2023〕304号', date:'2023-05-01施行', url:'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/202304/t20230407_1353356.html', summary:'政府投资项目原则上按政府投资通用大纲；企业投资项目参考企业投资大纲。', action:'先核实投资性质和拟编制报告时点，再选择对应大纲；不作为2022年可研的事后编制标准。' },
      { name:'《城镇供水价格管理办法》', id:'国家发展改革委、住房城乡建设部令第46号', date:'2021-10-01施行；执行版本需复核', url:'https://www.ndrc.gov.cn/xxgk/zcfb/fzggwl/202108/t20210806_1293274_ext.html', summary:'规范城镇供水价格制定或调整，涉及成本监审与水价管理。', action:'核对建阳当地有效水价批复、价格类别及项目实际收费权；公开可研中的假定收入不得直接等同当前获批水价。' },
      { name:'关于进一步放开建设项目专业服务价格的通知', id:'发改价格〔2015〕299号', date:'2015-03-01执行', url:'https://www.ndrc.gov.cn/xxgk/zcfb/tz/202009/t20200927_1239632.html', summary:'通知列明的前期咨询、勘察设计、招标代理、监理及环评咨询服务价格实行市场调节。', action:'结合采购文件、合同及适用计价依据核实费用；不得把历史政府指导价直接当作现行强制收费标准。' }
    ],
    pending: '项目当前阶段、实际竣工及运营数据；投资性质和审批文件；供水专项规划及改造计划；当地现行水价及收费权；资金来源和专项债具体条件；水质、环评、用地及施工验收等资料，均需进一步核实。'
  }
};
function policyReportHtml(profile) {
  const p = PFE_POLICY[profile];
  if (!p) return '';
  const rows = p.records.map(r => `<tr><td class="l"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a><br>${r.id}<br>${r.date}</td><td class="l">${r.summary}</td><td class="l">${r.action}</td></tr>`).join('');
  return `<div class="rp-sec"><h3>政策与项目适用性分析 · 建阳试点</h3><p class="rp-p">本节为固定案例的人工整理，核验日期：${p.checked}；不是实时检索，也不是项目合规或审批结论。政策可能变化，使用前须复核原文及现行效力。</p><p class="rp-p">对照项目：<a href="${p.source}" target="_blank" rel="noopener noreferrer">${p.project}（2022年公开可研报告）</a>。公开可研估算总投资12,136.01万元，其中静态建设投资11,936.08万元；这些是历史估算，不代表实际投资或当前建设状态。本节仅供对照该项目，不随当前输入自动判断适用性。</p><div class="tscroll"><table class="rtable"><caption>政策依据、适用条件与核查动作</caption><thead><tr><th class="l">政策与生效时间</th><th class="l">相关内容</th><th class="l">项目核查动作</th></tr></thead><tbody>${rows}</tbody></table></div><p class="rp-note">待核事项：${p.pending}</p></div>`;
}
if (typeof window !== 'undefined') { window.PFE_POLICY = PFE_POLICY; window.policyReportHtml = policyReportHtml; }
