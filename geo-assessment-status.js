(function(){
  var query=new URLSearchParams(location.search);
  var id=query.get('task');
  var token=query.get('token');
  var api=(window.LINGDI_API_BASE||'https://api.terradigitalpower.com').replace(/\/$/,'');
  var status=document.querySelector('[data-status]');
  var brand=document.querySelector('[data-brand]');
  var note=document.querySelector('[data-note]');
  var runs=document.querySelector('[data-runs]');
  var evidence=document.querySelector('[data-evidence]');

  if(!id||!token){
    status.textContent='链接不完整';
    note.textContent='请使用提交任务后收到的完整私密链接。';
    return;
  }

  function render(task){
    status.textContent=task.status||'状态未知';
    brand.textContent=task.brandName?'评测对象：'+task.brandName:'';
    note.textContent=task.notice||'已保存同题测试的模型运行记录。';
    var grouped={};
    (task.runs||[]).forEach(function(run){
      var key=run.provider_label;
      grouped[key]=grouped[key]||[];
      grouped[key].push(run);
    });
    runs.replaceChildren();
    evidence.replaceChildren();
    Object.keys(grouped).forEach(function(key){
      var list=grouped[key];
      var item=document.createElement('article');
      var finished=list.filter(function(run){return run.status==='完成';}).length;
      item.innerHTML='<span>OFFICIAL MODEL</span><h2></h2><p></p>';
      item.querySelector('h2').textContent=key;
      item.querySelector('p').textContent=finished?finished+' 条原始回答已保存':list.map(function(run){return run.status;}).filter(function(value,index,array){return array.indexOf(value)===index;}).join('、');
      runs.appendChild(item);
    });
    (task.runs||[]).filter(function(run){return run.status==='完成'&&run.response_text;}).forEach(function(run){
      var item=document.createElement('article');
      var label=document.createElement('span');
      var heading=document.createElement('h2');
      var prompt=document.createElement('p');
      var answer=document.createElement('pre');
      label.textContent='RAW EVIDENCE · '+run.provider_label+' · Q'+run.question_index;
      heading.textContent=run.model;
      prompt.textContent=run.prompt;
      answer.textContent=run.response_text;
      item.append(label,heading,prompt,answer);
      evidence.appendChild(item);
    });
  }

  fetch(api+'/api/public/assessments/'+encodeURIComponent(id)+'?token='+encodeURIComponent(token)).then(function(response){
    return response.json().then(function(body){
      if(!response.ok)throw new Error(body.error||'读取失败');
      return body;
    });
  }).then(function(body){
    render(body.task);
  }).catch(function(error){
    status.textContent='暂时无法读取';
    status.className='error';
    note.textContent=error.message+'。请稍后重试或联系顾问。';
  });
})();
