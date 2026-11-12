(function(){
  var rv=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1,rootMargin:'0px 0px -6% 0px'});
    rv.forEach(function(el){io.observe(el)});
  }else{rv.forEach(function(el){el.classList.add('in')})}
  document.querySelectorAll('[data-tabs]').forEach(function(g){
    var tabs=[].slice.call(g.querySelectorAll('[role=tab]')),panels=[].slice.call(g.querySelectorAll('[role=tabpanel]'));
    function sel(i,f){tabs.forEach(function(t,j){t.setAttribute('aria-selected',j==i?'true':'false');t.tabIndex=j==i?0:-1});panels.forEach(function(p,j){p.hidden=j!=i});if(f)tabs[i].focus()}
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){sel(i)});
      t.addEventListener('keydown',function(e){var k=e.key,n=tabs.length;
        if(k=='ArrowRight'||k=='ArrowDown'){sel((i+1)%n,1);e.preventDefault()}
        if(k=='ArrowLeft'||k=='ArrowUp'){sel((i-1+n)%n,1);e.preventDefault()}
        if(k=='Home'){sel(0,1);e.preventDefault()}if(k=='End'){sel(n-1,1);e.preventDefault()}});
    });
    g.classList.add('js');sel(0);
  });
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)document.querySelectorAll('svg').forEach(function(s){if(s.pauseAnimations)s.pauseAnimations()});
  var bar=document.getElementById('bar'),tick=false;
  function upd(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')';tick=false}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});upd();
})();

