(function(){
  var form = document.getElementById('diagnosis-form');
  var result = document.getElementById('diagnosis-result');
  if(!form || !result) return;

  function value(data,key){ return String(data.get(key) || ''); }
  function evidencePoints(input){ return input === 'yes' ? 2 : input === 'partial' ? 1 : 0; }
  function addAction(list,text){ if(list.indexOf(text) === -1 && list.length < 3) list.push(text); }

  form.addEventListener('submit',function(event){
    event.preventDefault();
    if(!form.reportValidity()) return;
    var data = new FormData(form);
    var brand = value(data,'brandName').trim();
    var businessType = value(data,'businessType');
    var commerceValues = ['douyinShop','attribution','qualifications','fulfillment'].map(function(key){ return value(data,key); });
    var actions = [];
    var commerceTitle = '';
    var commerceCopy = '';

    if(businessType === 'service'){
      commerceTitle = '先明确咨询与签约入口';
      commerceCopy = '服务型业务不必以抖音小店为门槛，重点是咨询来源、客户跟进、合同与交付能否被记录。';
      addAction(actions,'明确一个可追踪的咨询、签约与交付入口。');
    }else if(value(data,'douyinShop') === 'no'){
      commerceTitle = '成交载体存在明确缺口';
      commerceCopy = '当前选择显示尚无抖音小店。若目标是承接豆包到抖音电商的可归因成交，应先核对平台实际规则与店铺方案。';
      addAction(actions,'先核实抖音店铺与豆包来源订单的正式承接条件。');
    }else if(commerceValues.indexOf('unknown') !== -1 || commerceValues.indexOf('partial') !== -1){
      commerceTitle = '条件可能具备，但证据未齐';
      commerceCopy = '店铺、归因、资质或履约至少有一项待核验。正式报告前应查看后台截图、有效资质和真实流程。';
      addAction(actions,'补齐店铺、归因、资质和履约的后台证据。');
    }else if(value(data,'douyinShop') === 'yes' && value(data,'attribution') === 'yes'){
      commerceTitle = '具备进入正式核验的基础';
      commerceCopy = '你的选择显示交易载体和来源归因已有基础，但这只是客户自述，仍需后台证据与平台现行规则复核。';
    }else{
      commerceTitle = '先确认成交路径';
      commerceCopy = '当前信息不足以判断可归因成交是否成立，建议先明确客户从 AI 到咨询、下单与交付的完整路径。';
      addAction(actions,'画出客户从 AI 提问到咨询或成交的完整路径。');
    }

    var geoScore = evidencePoints(value(data,'questions')) + evidencePoints(value(data,'officialSources')) + evidencePoints(value(data,'evidence'));
    var geoTitle = geoScore >= 5 ? '证据基础较好' : geoScore >= 3 ? '有材料，但尚未形成体系' : '应先补基础证据';
    var geoCopy = geoScore >= 5 ? '客户问题、官方表达和证据材料已有较好基础，下一步是按真实问题测试 AI 回答并记录引用。' : geoScore >= 3 ? '现有材料可以启动，但需要统一官网、店铺与自媒体口径，并把案例和证据逐条编号。' : '现在直接大量发内容风险较高，应先整理客户问题、核心产品事实和可公开证据。';
    if(value(data,'questions') !== 'yes') addAction(actions,'整理客户最常问、最接近购买决策的 10 个问题。');
    if(value(data,'evidence') !== 'yes') addAction(actions,'建立产品、案例、检测或专业证据清单并标注来源。');
    if(value(data,'officialSources') !== 'yes') addAction(actions,'统一官网、店铺和自媒体的核心业务表述。');

    var baseline = value(data,'baseline');
    var baselineTitle = baseline === 'yes' ? '已有可复核基线' : baseline === 'partial' ? '测试过，但不可稳定复核' : '还没有 AI 回答基线';
    var baselineCopy = baseline === 'yes' ? '建议继续固定问题、模型版本、时间、账号地区和完整回答，避免只截取有利结果。' : baseline === 'partial' ? '零散测试不能代表稳定可见度，需要统一问题集并保存完整回答与引用。' : '没有基线就无法判断后续变化。正式诊断应先对约定问题做多模型、重复测试。';
    if(baseline !== 'yes') addAction(actions,'用同一问题集记录三个 AI 的完整回答、时间与引用。');
    while(actions.length < 3) addAction(actions,'与顾问确认完整报告所需的最小证据包。');

    var overall = geoScore >= 5 && baseline === 'yes' && commerceValues.indexOf('no') === -1 ? '可进入人工复核' : geoScore >= 3 ? '建议补证后复核' : '先完成基础建设';
    result.querySelector('[data-result-brand]').textContent = brand;
    result.querySelector('[data-result-status]').textContent = overall;
    result.querySelector('[data-commerce-title]').textContent = commerceTitle;
    result.querySelector('[data-commerce-copy]').textContent = commerceCopy;
    result.querySelector('[data-geo-title]').textContent = geoTitle;
    result.querySelector('[data-geo-copy]').textContent = geoCopy;
    result.querySelector('[data-baseline-title]').textContent = baselineTitle;
    result.querySelector('[data-baseline-copy]').textContent = baselineCopy;
    var list = result.querySelector('[data-next-actions]');
    list.innerHTML = actions.map(function(item){ return '<li>'+item+'</li>'; }).join('');
    var summaryText = [
      brand+'｜领地 GEO 在线预诊断',
      '总体状态：'+overall,
      '成交承接：'+commerceTitle+'。'+commerceCopy,
      'GEO 证据：'+geoTitle+'。'+geoCopy,
      'AI 基线：'+baselineTitle+'。'+baselineCopy,
      '建议行动：'+actions.map(function(item,index){return (index+1)+'. '+item;}).join(' '),
      '说明：以上基于客户选择自动生成，尚未独立核验。'
    ].join('\n');
    sessionStorage.setItem('lingdi_geo_diagnosis_summary',summaryText);
    result.hidden = false;
    result.focus();
    result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });

  result.querySelector('[data-copy-result]').addEventListener('click',function(){
    var summary = sessionStorage.getItem('lingdi_geo_diagnosis_summary') || result.innerText.replace(/复制预诊断摘要|联系顾问，申请完整报告|结果如何产生/g,'').trim();
    var status = result.querySelector('[data-copy-status]');
    navigator.clipboard.writeText(summary).then(function(){status.textContent='预诊断摘要已复制。';}).catch(function(){status.textContent='复制未成功，请手动选择结果文字。';});
  });
})();
