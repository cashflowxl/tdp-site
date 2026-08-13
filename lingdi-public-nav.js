(function(){
  function ensurePublicNavigationStyles(){
    if(document.querySelector('link[data-lingdi-public-nav]')) return;
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/lingdi-public-nav.css';
    stylesheet.dataset.lingdiPublicNav = 'true';
    document.head.appendChild(stylesheet);
  }
  function setPublicNavigation(){
    ensurePublicNavigationStyles();
    document.querySelectorAll('.nav').forEach(function(nav){
      if(document.body.dataset.lingdiInternal === 'true' || nav.dataset.publicNav === 'false') return;
      var current = location.pathname.replace(/^\//,'') || 'index.html';
      var links = [
        ['/#service','服务方案'],
        ['/lingdi-live-orders.html','订单查询'],
        ['/lingdi-partner.html','合伙人资格'],
        ['/lingdi-account.html','个人中心'],
        ['/lingdi-support.html','技术支持']
      ];
      nav.classList.add('lingdi-public-nav');
      nav.innerHTML = '<div class="wrap"><a class="lingdi-public-brand" href="/" aria-label="领地 AI 首页"><b class="logo">LD</b><span>领地 AI<small>AI 商业应用落地服务商</small></span></a><div class="lingdi-nav-links" aria-label="网站导航">' + links.map(function(item){
        var path = item[0].replace(/^\//,'').split('#')[0] || 'index.html';
        var active = current === path ? ' aria-current="page"' : '';
        return '<a href="'+item[0]+'"'+active+'>'+item[1]+'</a>';
      }).join('') + '</div></div>';
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setPublicNavigation); else setPublicNavigation();
})();
