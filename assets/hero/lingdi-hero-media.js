(function(){
  var video=document.querySelector('[data-lingdi-hero-video]');
  if(!video) return;

  var mobileQuery=window.matchMedia('(max-width: 700px)');
  var reducedQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData=Boolean(navigator.connection&&navigator.connection.saveData);
  var slowConnection=Boolean(navigator.connection&&/^(slow-)?2g$/.test(navigator.connection.effectiveType||''));
  var lowMemory=Boolean(navigator.deviceMemory&&navigator.deviceMemory<=2);
  var hero=video.closest('[data-space-hero]');
  var isVisible=true;
  var activeVariant='';

  video.muted=true;
  video.defaultMuted=true;
  video.playsInline=true;

  function posterFor(mobile){
    return mobile?'/assets/hero/lingdi-global-mobile-poster.webp':'/assets/hero/lingdi-global-desktop-poster.webp';
  }

  function sourceFor(mobile){
    var stem=mobile?'mobile':'desktop';
    return '/assets/hero/lingdi-global-'+stem+'.mp4';
  }

  function canAnimate(){
    return !saveData&&!slowConnection&&!lowMemory&&!reducedQuery.matches;
  }

  function setStatic(mobile){
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.poster=posterFor(mobile);
    hero&&hero.classList.add('is-static');
    hero&&hero.classList.remove('is-video-ready');
    activeVariant=mobile?'mobile-static':'desktop-static';
  }

  function safePlay(){
    if(!isVisible||document.hidden||!canAnimate()) return;
    hero&&hero.classList.remove('is-static');
    var promise;
    try{
      promise=video.play();
    }catch(error){
      hero&&hero.classList.add('is-static');
      return;
    }
    if(promise&&typeof promise.then==='function'){
      promise.then(function(){
        hero&&hero.classList.remove('is-static');
        hero&&hero.classList.add('is-video-ready');
      }).catch(function(){
        hero&&hero.classList.add('is-static');
      });
    }else{
      hero&&hero.classList.add('is-video-ready');
    }
  }

  function configure(){
    var mobile=mobileQuery.matches;
    var nextVariant=mobile?'mobile':'desktop';
    video.poster=posterFor(mobile);
    if(!canAnimate()){
      if(activeVariant!==nextVariant+'-static') setStatic(mobile);
      return;
    }
    if(activeVariant===nextVariant&&video.getAttribute('src')){
      safePlay();
      return;
    }
    activeVariant=nextVariant;
    hero&&hero.classList.remove('is-static','is-video-ready');
    video.src=sourceFor(mobile);
    video.load();
    safePlay();
  }

  function retryPlayback(){
    if(!canAnimate()) return;
    if(!video.getAttribute('src')){
      activeVariant='';
      configure();
      return;
    }
    safePlay();
  }

  video.addEventListener('canplay',function(){
    hero&&hero.classList.add('is-video-ready');
    safePlay();
  });
  video.addEventListener('playing',function(){
    hero&&hero.classList.remove('is-static');
    hero&&hero.classList.add('is-video-ready');
  });
  video.addEventListener('error',function(){
    setStatic(mobileQuery.matches);
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        isVisible=entry.isIntersecting;
        if(isVisible) safePlay();
        else video.pause();
      });
    },{threshold:.08}).observe(hero||video);
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden) video.pause();
    else safePlay();
  });
  document.addEventListener('WeixinJSBridgeReady',retryPlayback,false);
  document.addEventListener('touchstart',retryPlayback,{once:true,passive:true});
  document.addEventListener('pointerdown',retryPlayback,{once:true,passive:true});
  window.addEventListener('pageshow',retryPlayback);
  mobileQuery.addEventListener&&mobileQuery.addEventListener('change',configure);
  reducedQuery.addEventListener&&reducedQuery.addEventListener('change',configure);
  configure();
})();
