'use strict';
/* =====================================================================
   投资项目财务评估系统 —— 合规规则库
   版本：2026.11（Phase 3 基础版）
   说明：
   1) 国家层面的税率、最低资本金、折旧年限、建设期利息口径等为通用规则；
   2) 行业基准收益率、折旧年限为“参考区间”，正式报批前应按行业主管部门
      和《建设项目经济评价方法与参数》（第三版）附录复核；
   3) 省级费率/定额仅登记文件名称和参考状态，不内置具体费率数值，避免
      使用过期或不适用的地方标准；
   4) 规则库可由咨询机构按省份/行业继续补充，新增条目无需改动计算引擎。
   扩展方法：
   - 新增行业：在 industries 增加 {key,name,i0Range,minCapital,vatRate,depRange,note}；
   - 新增省级依据：在 provinceFeeDocs[省份] 增加 {name,doc,status}；
   - 新增国家费用依据：在 feeRules 增加 {code,name,base,doc,scope,status}；
   - 调整后同步修改 version/effectiveDate，并在测试中补充对应断言。
===================================================================== */
const PFE_RULES = {
  version: '2026.11',
  effectiveDate: '2026-11-01',
  disclaimer: '本规则库用于课程教学和测算辅助，正式报批前应以现行有效的法律、法规、行业标准和地方计价依据复核，并以主管部门审批意见为准。',

  statusLabels: { ok: '符合', warn: '关注', info: '提示' },
  groups: { tax: '税费', region: '地区与费用', industry: '行业参数', method: '方法口径', report: '报告要素' },

  basisDocs: [
    { name: '建设项目经济评价方法与参数（第三版）', no: '发改投资〔2006〕1325号', scope: '财务评价方法、报表体系、指标口径', use: '全篇' },
    { name: '中华人民共和国增值税法', no: '2026年1月1日起施行', scope: '增值税计税方式、适用税率及留抵', use: '附表8' },
    { name: '中华人民共和国城市维护建设税法', no: '2020年8月11日通过，2021年9月1日施行', scope: '城建税 7%/5%/1%', use: '附表8' },
    { name: '征收教育费附加的暂行规定', no: '国务院令第448号（2005年修订）', scope: '教育费附加 3%', use: '附表8' },
    { name: '关于统一地方教育附加政策有关问题的通知', no: '财综〔2010〕98号', scope: '地方教育附加 2%', use: '附表8' },
    { name: '中华人民共和国企业所得税法', no: '主席令第63号（2018年修正）', scope: '企业所得税 25%/20%/15%/10%', use: '附表10' },
    { name: '中华人民共和国企业所得税法实施条例', no: '国务院令第512号', scope: '固定资产最低折旧年限', use: '附表5' },
    { name: '关于加强固定资产投资项目资本金管理的通知', no: '国发〔2019〕26号', scope: '项目最低资本金比例', use: '资金筹措' },
    { name: '基本建设项目建设成本管理规定', no: '财建〔2016〕504号', scope: '项目建设管理费', use: '工程建设其他费用' },
    { name: '关于进一步放开建设项目专业服务价格的通知', no: '发改价格〔2015〕299号', scope: '前期咨询、勘察设计、招标代理等服务价格实行市场调节', use: '工程建设其他费用' },
    { name: '关于降低部分建设项目收费标准规范收费行为等有关问题的通知', no: '发改价格〔2011〕534号', scope: '施工图审查费等', use: '工程建设其他费用' },
    { name: '建设项目经济评价方法与参数（第三版）行业参数附录', no: '发改投资〔2006〕1325号', scope: '行业基准收益率参考区间', use: '评价基准' },
  ],

  locationCategories: [
    { key: 'urban', name: '市区', cityTax: 0.07 },
    { key: 'county', name: '县城/镇', cityTax: 0.05 },
    { key: 'other', name: '其他', cityTax: 0.01 },
  ],

  vatAllowed: [0.13, 0.09, 0.06],
  incomeTaxAllowed: [0.25, 0.20, 0.15, 0.10],

  industries: [
    { key: 'manufacturing', name: '制造业', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: 0.13, depRange: [5, 20], note: '按货物销售 13%、建筑安装 9%、服务 6% 拆分核对；折旧年限按房屋、设备类别确定。' },
    { key: 'construction', name: '建筑业', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: 0.09, depRange: [5, 30], note: '建筑服务通常适用 9%；最低资本金比例按项目类型复核。' },
    { key: 'transport', name: '交通运输', i0Range: [0.06, 0.10], minCapital: 0.20, vatRate: 0.09, depRange: [10, 30], note: '交通基础设施基准收益率通常低于一般工业项目；按行业参数附录复核。' },
    { key: 'aviation', name: '机场', i0Range: [0.06, 0.10], minCapital: 0.25, vatRate: 0.09, depRange: [10, 30], note: '机场项目最低资本金比例按 25% 参考，具体按国发〔2019〕26号复核。' },
    { key: 'port', name: '港口/航运', i0Range: [0.06, 0.10], minCapital: 0.20, vatRate: 0.09, depRange: [10, 30], note: '港口、沿海及内河航运项目最低资本金比例按 20% 参考。' },
    { key: 'utility', name: '市政公用', i0Range: [0.06, 0.10], minCapital: 0.20, vatRate: 0.09, depRange: [10, 30], note: '供水、供热、燃气等按货物/服务拆分适用税率；基准收益率按行业复核。' },
    { key: 'water', name: '水利', i0Range: [0.06, 0.08], minCapital: 0.20, vatRate: 0.09, depRange: [10, 30], note: '水利项目以公益性或准经营性为主，基准收益率偏低，按行业参数复核。' },
    { key: 'energy', name: '能源电力', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: 0.13, depRange: [10, 30], note: '电力销售通常适用 13%；电网、新能源等项目按行业规定单独复核。' },
    { key: 'realestate', name: '房地产开发', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: 0.09, depRange: [20, 30], note: '房地产开发最低资本金比例按项目类别可能为 20%/25%/30%，须按国发〔2019〕26号复核。' },
    { key: 'services', name: '服务业', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: 0.06, depRange: [5, 20], note: '现代服务通常适用 6%；涉及货物销售或不动产租赁的应拆分核对。' },
    { key: 'other', name: '其他', i0Range: [0.08, 0.12], minCapital: 0.20, vatRate: null, depRange: [5, 30], note: '未分类项目请按所属行业基准收益率和资本金规定单独复核。' },
  ],

  provinces: [
    '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
    '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
    '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省',
    '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  ].map((name, i) => ({ code: 'P' + String(i + 1).padStart(2, '0'), name, localEduRate: 0.02 })),

  feeRules: [
    { code: 'N01', name: '项目建设管理费', base: '项目总投资−建设用地费', doc: '财建〔2016〕504号', scope: 'national', status: 'active' },
    { code: 'N02', name: '前期工作咨询费（项目建议书/可研）', base: '结合合同、采购和适用计价依据确定', doc: '发改价格〔2015〕299号（市场调节）', scope: 'national', status: 'reference' },
    { code: 'N03', name: '环境影响评价费', base: '结合合同、采购和适用计价依据确定', doc: '发改价格〔2015〕299号（市场调节）', scope: 'national', status: 'reference' },
    { code: 'N04', name: '工程勘察费', base: '结合合同、采购和适用计价依据确定', doc: '发改价格〔2015〕299号（市场调节）', scope: 'national', status: 'reference' },
    { code: 'N05', name: '工程设计费', base: '结合合同、采购和适用计价依据确定', doc: '发改价格〔2015〕299号（市场调节）', scope: 'national', status: 'reference' },
    { code: 'N06', name: '施工图审查费', base: '勘察设计费/概算投资额/建筑面积', doc: '发改价格〔2011〕534号', scope: 'national', status: 'active' },
    { code: 'N07', name: '招标代理服务费', base: '结合合同、采购和适用计价依据确定', doc: '发改价格〔2015〕299号（市场调节）', scope: 'national', status: 'reference' },
    { code: 'N08', name: '工程保险费', base: '工程费用', doc: '行业规定/保险合同', scope: 'national', status: 'reference' },
    { code: 'N09', name: '联合试运转费', base: '设备及安装工程费', doc: '咨询实务/行业规定', scope: 'national', status: 'reference' },
    { code: 'N10', name: '办公及生活家具购置费', base: '项目定员人数', doc: '咨询实务/行业规定', scope: 'national', status: 'reference' },
    { code: 'N11', name: '人员培训费', base: '培训人数及培训时间', doc: '咨询实务/行业规定', scope: 'national', status: 'reference' },
    { code: 'N12', name: '城市基础设施配套费', base: '建筑面积', doc: '项目所在地省级规定', scope: 'national', status: 'reference' },
  ],

  /* 省级费用依据：仅登记参考文件名称，具体费率/定额以现行版本为准 */
  provinceFeeDocs: {
    '北京市': [{ name: '北京市现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '天津市': [{ name: '天津市现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '河北省': [{ name: '河北省2018概算其他费用定额', doc: '河北省2018概算其他费用定额', status: 'reference' }],
    '山西省': [{ name: '山西省现行建设工程费用定额', doc: '需按现行版本复核', status: 'reference' }],
    '内蒙古自治区': [{ name: '内蒙古自治区现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '辽宁省': [{ name: '辽宁省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '吉林省': [{ name: '吉林省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '黑龙江省': [{ name: '黑龙江省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '上海市': [{ name: '上海市现行建设工程费用定额', doc: '需按现行版本复核', status: 'reference' }],
    '江苏省': [{ name: '江苏省现行建设工程费用定额', doc: '需按现行版本复核', status: 'reference' }],
    '浙江省': [{ name: '浙江省现行建设工程计价规则', doc: '需按现行版本复核', status: 'reference' }],
    '安徽省': [{ name: '安徽省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '福建省': [{ name: '福建省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '江西省': [{ name: '江西省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '山东省': [{ name: '山东省现行建设工程费用项目组成及计算规则', doc: '需按现行版本复核', status: 'reference' }],
    '河南省': [{ name: '河南省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '湖北省': [{ name: '湖北省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '湖南省': [{ name: '湖南省现行建设工程计价办法', doc: '需按现行版本复核', status: 'reference' }],
    '广东省': [{ name: '广东省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '广西壮族自治区': [{ name: '广西现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '海南省': [{ name: '海南省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '重庆市': [{ name: '重庆市现行建设工程费用定额', doc: '需按现行版本复核', status: 'reference' }],
    '四川省': [{ name: '四川省现行建设工程计价定额', doc: '需按现行版本复核', status: 'reference' }],
    '贵州省': [{ name: '贵州省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '云南省': [{ name: '云南省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '西藏自治区': [{ name: '西藏自治区现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '陕西省': [{ name: '陕西省现行建设工程计价规则', doc: '需按现行版本复核', status: 'reference' }],
    '甘肃省': [{ name: '甘肃省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '青海省': [{ name: '青海省现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '宁夏回族自治区': [{ name: '宁夏现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
    '新疆维吾尔自治区': [{ name: '新疆现行建设工程计价依据', doc: '需按现行版本复核', status: 'reference' }],
  },
};

if (typeof window !== 'undefined') window.PFE_RULES = PFE_RULES;
