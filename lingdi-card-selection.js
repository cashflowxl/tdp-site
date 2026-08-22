(function(){
  function setSelected(group,card){
    group.querySelectorAll('[data-selectable-card]').forEach(function(item){
      item.classList.toggle('is-selected',item===card && !card.classList.contains('is-selected'));
    });
  }

  document.querySelectorAll('[data-selectable-group]').forEach(function(group){
    group.addEventListener('click',function(event){
      if(event.target.closest('a,button,input,select,textarea')) return;
      var card=event.target.closest('[data-selectable-card]');
      if(card && group.contains(card)) setSelected(group,card);
    });
    group.addEventListener('keydown',function(event){
      var card=event.target.closest('[data-selectable-card]');
      if(!card || !group.contains(card) || event.target.closest('a,button,input,select,textarea')) return;
      if(event.key==='Enter' || event.key===' '){
        event.preventDefault();
        setSelected(group,card);
      }else if(event.key==='Escape'){
        group.querySelectorAll('[data-selectable-card]').forEach(function(item){item.classList.remove('is-selected');});
        card.blur();
      }
    });
  });
})();
