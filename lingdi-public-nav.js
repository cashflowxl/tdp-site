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
      var navMode = document.body.dataset.lingdiNav || '';
      var isGeo = navMode === 'geo' || navMode === 'geo-diagnosis';
      var links = isGeo ? [
        ['/','GEO首页'],
        ['/geo.html#method','服务方法'],
        ['/geo-diagnosis.html','在线预诊断'],
        ['/#partners','渠道合作'],
        ['/geo.html#diagnosis','申请沟通']
      ] : [
        ['/geo.html','GEO业务'],
        ['/#service','服务方案'],
        ['/lingdi-live-orders.html','订单查询'],
        ['/lingdi-partner.html','合伙人资格'],
        ['/lingdi-account.html','个人中心'],
        ['/lingdi-support.html','技术支持']
      ];
      nav.classList.add('lingdi-public-nav');
      nav.innerHTML = '<div class="wrap"><a class="lingdi-public-brand" href="/" aria-label="领地 GEO 首页"><b class="logo">LD</b><span>'+(isGeo?'领地 GEO':'领地 AI')+'<small>'+(isGeo?'让 AI 成为企业新的销售入口':'AI 商业应用落地服务商')+'</small></span></a><div class="lingdi-nav-links" aria-label="网站导航">' + links.map(function(item){
        var path = item[0].replace(/^\//,'').split('#')[0] || 'index.html';
        var active = item[0].indexOf('#') === -1 && current === path ? ' aria-current="page"' : '';
        return '<a href="'+item[0]+'"'+active+'>'+item[1]+'</a>';
      }).join('') + '</div></div>';
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setPublicNavigation); else setPublicNavigation();
})();
