(function(){
  var trigger=document.querySelector('[data-lingdi-share]');
  var dialog=document.getElementById('lingdi-share-dialog');
  var toast=document.querySelector('.share-toast');
  if(!trigger||!dialog||!toast) return;

  var shareData={
    title:'领地 GEO｜让全球 AI 推荐你的品牌',
    text:'从专业基线出发，用事实、信源、内容与技术行动，提升品牌被准确理解、可信引用和优先推荐的机会。',
    url:'https://www.terradigitalpower.com/'
  };
  var toastTimer=0;
  var lastFocused=null;

  function isWechat(){
    return /MicroMessenger/i.test(navigator.userAgent||'');
  }

  function showToast(message){
    window.clearTimeout(toastTimer);
    toast.textContent=message;
    toast.hidden=false;
    toastTimer=window.setTimeout(function(){toast.hidden=true;},2600);
  }

  function openDialog(){
    lastFocused=document.activeElement;
    dialog.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    document.documentElement.classList.add('share-dialog-open');
    dialog.querySelector('.share-dialog-card').focus();
  }

  function closeDialog(){
    dialog.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('share-dialog-open');
    if(lastFocused&&typeof lastFocused.focus==='function') lastFocused.focus();
  }

  async function copyLink(){
    if(navigator.clipboard&&window.isSecureContext){
      try{
        await navigator.clipboard.writeText(shareData.url);
        return true;
      }catch(error){}
    }
    var field=document.createElement('textarea');
    field.value=shareData.url;
    field.setAttribute('readonly','');
    field.style.position='fixed';
    field.style.opacity='0';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0,field.value.length);
    var copied=false;
    try{copied=document.execCommand('copy');}catch(error){}
    field.remove();
    return copied;
  }

  async function copyWithStatus(){
    if(await copyLink()) showToast('官网链接已复制，可以粘贴发送。');
    else showToast('未能自动复制，请从地址栏复制官网链接。');
  }

  trigger.addEventListener('click',async function(){
    if(isWechat()){
      openDialog();
      return;
    }
    if(typeof navigator.share==='function'){
      try{
        await navigator.share(shareData);
        return;
      }catch(error){
        if(error&&error.name==='AbortError') return;
      }
    }
    await copyWithStatus();
  });

  dialog.querySelectorAll('[data-share-close]').forEach(function(button){
    button.addEventListener('click',closeDialog);
  });
  dialog.querySelector('[data-share-copy]').addEventListener('click',copyWithStatus);
  dialog.addEventListener('keydown',function(event){
    if(event.key==='Escape'){
      event.preventDefault();
      closeDialog();
      return;
    }
    if(event.key!=='Tab') return;
    var focusable=Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled])'));
    if(!focusable.length) return;
    var card=dialog.querySelector('.share-dialog-card');
    var first=focusable[0];
    var last=focusable[focusable.length-1];
    if(document.activeElement===card){event.preventDefault();(event.shiftKey?last:first).focus();}
    else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
})();
