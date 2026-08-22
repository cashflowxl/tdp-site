(function(){
  var form=document.getElementById('diagnosis-form');
  var result=document.getElementById('diagnosis-result');
  var branchSelect=document.getElementById('business-branch');
  if(!form||!result||!branchSelect) return;

  var branchLabels={b2b:'B2B / 专业服务',ecommerce:'产品电商',local:'本地服务'};
  var taskLink='';
  var api=(window.LINGDI_API_BASE||'https://api.terradigitalpower.com').replace(/\/$/,'');
  var assessmentEnabled=window.LINGDI_ASSESSMENT_ENABLED===true;
  function value(data,key){return String(data.get(key)||'').trim();}
  function updateBranch(){
    var selected=branchSelect.value;
    var placeholder=form.querySelector('[data-branch-placeholder]');
    if(placeholder) placeholder.hidden=Boolean(selected);
    form.querySelectorAll('[data-branch-panel]').forEach(function(panel){
      var active=panel.dataset.branchPanel===selected;
      panel.hidden=!active; panel.disabled=!active;
    });
  }
  function actionsFor(data){
    var branch=value(data,'branch');
    var actions=['确认比较口径、目标市场、题库与时间窗口。','核对主体、产品、参数、资质、案例与服务边界的公开信源。'];
    if(branch==='ecommerce') actions.push('以只读方式核验订单、退款、净 GMV 与来源字段。');
    else if(branch==='local') actions.push('统一服务半径、营业信息与预约入口的公开记录。');
    else actions.push('统一咨询、会议、商机与签约的承接定义及来源记录。');
    return actions;
  }
  function renderTask(task,data){
    var status=task.status||'已提交';
    result.querySelector('[data-result-brand]').textContent=value(data,'brandName');
    result.querySelector('[data-diagnosis-id]').textContent=task.id;
    result.querySelector('[data-result-status]').textContent=status;
    result.querySelector('[data-task-title]').textContent=status==='已完成'?'真实模型运行已完成':status==='待配置'?'等待官方模型配置':status==='测试中'?'正在运行同题测试':'已提交真实评测任务';
    result.querySelector('[data-task-copy]').textContent=task.notice||'系统将为每个已启用的官方模型保存原题、完整回答、模型、时间与运行状态。';
    result.querySelector('[data-competitor-copy]').textContent='评测分支：'+branchLabels[value(data,'branch')]+'。客户提供的比较对象为：'+value(data,'competitors')+'。只有实际模型回答与可核验公开证据会进入报告结论。';
    var source=value(data,'sourceReadiness');
    result.querySelector('[data-fact-title]').textContent=source==='clear'?'已有信源基础，仍需逐条核验':source==='partial'?'信源尚待统一':'先补可公开核对的信源';
    result.querySelector('[data-fact-copy]').textContent='客户最担心的问题是：“'+value(data,'factConcern')+'”。报告会把已验证、错误、遗漏与待补测分别标注。';
    result.querySelector('[data-business-title]').textContent='先定义可追踪的'+branchLabels[value(data,'branch')]+'承接链路';
    result.querySelector('[data-business-copy]').textContent='真实模型回答与后续业务承接需要分开记录，不把一次模型结果包装成成交承诺。';
    var list=result.querySelector('[data-next-actions]'); list.replaceChildren();
    actionsFor(data).forEach(function(action){var item=document.createElement('li');item.textContent=action;list.appendChild(item);});
  }
  function payloadFrom(data){
    var payload={};
    ['brandName','branch','region','publicUrl','competitors','coreValue','factConcern','sourceReadiness','contact'].forEach(function(key){payload[key]=value(data,key);});
    payload.consent=data.get('consent')==='on'; return payload;
  }
  branchSelect.addEventListener('change',updateBranch); updateBranch();
  form.addEventListener('submit',function(event){
    event.preventDefault(); if(!form.reportValidity()) return;
    var data=new FormData(form), submit=form.querySelector('[type="submit"]');
    if(!assessmentEnabled){
      result.querySelector('[data-result-brand]').textContent=value(data,'brandName');
      result.querySelector('[data-diagnosis-id]').textContent='待开通';
      result.querySelector('[data-result-status]').textContent='人工申请';
      result.querySelector('[data-task-title]').textContent='真实模型评测正在配置';
      result.querySelector('[data-task-copy]').textContent='当前不提交或保存此页填写的信息。请通过顾问确认评测范围后再开启真实模型测试。';
      result.hidden=false; result.focus();
      result.scrollIntoView({behavior:'smooth',block:'start'}); return;
    }
    submit.disabled=true; submit.setAttribute('aria-busy','true'); submit.firstChild.textContent='正在创建真实评测任务 ';
    fetch(api+'/api/public/assessments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payloadFrom(data))})
      .then(function(response){return response.json().then(function(body){if(!response.ok) throw new Error(body.error||'任务创建失败');return body;});})
      .then(function(created){
        taskLink=location.origin+'/geo-assessment-status.html?task='+encodeURIComponent(created.id)+'&token='+encodeURIComponent(created.token);
        renderTask({id:created.id,status:created.status},data); result.hidden=false; result.focus();
        result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      })
      .catch(function(error){var status=result.querySelector('[data-copy-status]');status.textContent='暂时无法创建任务：'+error.message+'。请稍后重试或联系顾问。';result.hidden=false;result.focus();})
      .finally(function(){submit.disabled=false;submit.removeAttribute('aria-busy');submit.firstChild.textContent='提交真实评测任务 ';});
  });
  result.querySelector('[data-copy-result]').addEventListener('click',function(){
    var status=result.querySelector('[data-copy-status]');
    if(!taskLink){status.textContent='任务链接尚未生成。';return;}
    if(!navigator.clipboard){status.textContent='请复制浏览器地址栏中的私密查询链接。';return;}
    navigator.clipboard.writeText(taskLink).then(function(){status.textContent='私密查询链接已复制，请妥善保存，不要公开转发。';}).catch(function(){status.textContent='复制未成功，请手动复制浏览器地址栏中的链接。';});
  });
})();
