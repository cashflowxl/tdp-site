(function(){
  function ensurePublicNavigationStyles(){
    if(document.querySelector('link[data-lingdi-public-nav],link[href*="/lingdi-public-nav.css"]')) return;
    var stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='/lingdi-public-nav.css?v=20260822-terra1';
    stylesheet.dataset.lingdiPublicNav='true';
    document.head.appendChild(stylesheet);
  }

  function currentPage(){
    return location.pathname.replace(/^\//,'') || 'index.html';
  }

  function isCurrent(href){
    var target=href.split('#')[0].split('?')[0].replace(/^\//,'') || 'index.html';
    var current=currentPage();
    return target===current;
  }

  function setPublicNavigation(){
    ensurePublicNavigationStyles();
    if(!document.body.hasAttribute('data-lingdi-nav')) return;
    var isEnglish=(document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
    var languagePair=document.body.dataset.langPair||(isEnglish?'/':'/en/');
    var immersive=document.body.dataset.navTheme==='dark';
    var keepFullLinks=document.body.dataset.navLinks==='full';
    var links;
    if(immersive && !keepFullLinks){
      links=isEnglish?[
        ['/en/standard-geo.html','Standard GEO',''],
        ['/en/gem-commerce.html','GEM Commerce',''],
        ['/en/contact.html?source=ai-competitiveness','Measure AI Competitiveness','nav-cta'],
        [languagePair,'中文','nav-lang']
      ]:[
        ['/geo.html','标准 GEO',''],
        ['/geo-gem.html','GEM 电商',''],
        ['/geo-partner.html','全球合伙人',''],
        ['/geo-diagnosis.html','测算 AI 竞争力','nav-cta'],
        [languagePair,'EN','nav-lang']
      ];
    }else{
      links=isEnglish?[
        ['/en/standard-geo.html','Standard GEO',''],
        ['/en/gem-commerce.html','GEM Commerce',''],
        ['/en/ai-marketing-training.html','AI Training',''],
        ['/en/contact.html?source=ai-competitiveness','Measure AI Competitiveness','nav-cta'],
        [languagePair,'中文','nav-lang']
      ]:[
        ['/geo.html','标准 GEO',''],
        ['/geo-gem.html','GEM 电商',''],
        ['/geo-training.html','AI 培训',''],
        ['/geo-diagnosis.html','测算 AI 竞争力','nav-mobile-priority'],
        ['/lingdi-support.html?source=geo-contact','联系顾问','nav-cta'],
        [languagePair,'EN','nav-lang']
      ];
    }
    document.querySelectorAll('.nav').forEach(function(nav){
      if(document.body.dataset.lingdiInternal==='true' || nav.dataset.publicNav==='false') return;
      nav.classList.add('lingdi-public-nav');
      if(immersive) nav.classList.add('lingdi-public-nav-dark');
      var brandContent=isEnglish
        ? '<span class="terra-brand-lockup terra-brand-lockup--nav" aria-hidden="true"><strong class="terra-brand-lockup__primary">TERRA GEO</strong><small class="terra-brand-lockup__byline">BY TERRA DIGITAL POWER</small></span>'
        : '<img src="'+(immersive?'/lingdi-geo-logo-reverse.svg?v=20260820-v12':'/lingdi-geo-logo.svg?v=20260820-v12')+'" width="160" height="45" alt="领地 GEO">';
      nav.innerHTML='<div class="wrap">'+
        '<a class="lingdi-public-brand" href="'+(isEnglish?'/en/':'/')+'" aria-label="'+(isEnglish?'TERRA GEO by Terra Digital Power home':'领地 GEO 首页')+'">'+
          brandContent+
        '</a>'+
        '<div class="lingdi-nav-links" aria-label="'+(isEnglish?'Primary navigation':'主要导航')+'">'+links.map(function(item){
          var active=isCurrent(item[0])?' aria-current="page"':'';
          return '<a class="'+item[2]+'" href="'+item[0]+'"'+active+'>'+item[1]+'</a>';
        }).join('')+'</div>'+
      '</div>';
    });
    if(immersive){
      var syncNav=function(){
        document.querySelectorAll('.nav.lingdi-public-nav-dark').forEach(function(nav){
          nav.classList.toggle('nav-scrolled',window.scrollY>24);
        });
      };
      syncNav();
      window.addEventListener('scroll',syncNav,{passive:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setPublicNavigation);
  else setPublicNavigation();
})();
