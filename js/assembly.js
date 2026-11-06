(function(){
  'use strict';
  var motion=matchMedia('(prefers-reduced-motion: reduce)');
  var ns='http://www.w3.org/2000/svg', colors=['#D49A65','#9B8CFF','#4FD1E0','#FFB547','#FF7A6B','#FFFFFF'];
  var pieces=[], cursors=[], overlay, frame=0, dirty=true, enabled=false, lastFrame=0, nextId=0;
  var prepared=new WeakSet(),sectionObserver,sceneObserver;
  function random(i,s){var x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)}
  // Expand reused buildings into independent roof, wall, window and foundation paths.
  function expand(root,depth){
    if(depth>5)return;
    Array.from(root.querySelectorAll('use')).forEach(function(use){
      var href=use.getAttribute('href')||use.getAttribute('xlink:href');
      var source=href&&href[0]==='#'?document.getElementById(href.slice(1)):null;
      if(!source||source.tagName.toLowerCase()!=='g')return;
      var g=document.createElementNS(ns,'g');
      if(href.indexOf('#bd-')===0)g.dataset.building=href.slice(1);
      Array.from(use.attributes).forEach(function(a){if(a.name!=='href'&&a.name!=='id'&&a.name!=='xlink:href')g.setAttribute(a.name,a.value)});
      Array.from(source.childNodes).forEach(function(n){g.appendChild(n.cloneNode(true))});
      g.querySelectorAll('[id]').forEach(function(n){n.removeAttribute('id')});
      use.replaceWith(g);expand(g,depth+1);
    });
  }
  function prepare(root){
    if(prepared.has(root))return;prepared.add(root);
    root.querySelectorAll('svg').forEach(function(svg){if(svg.dataset.swarmPrepared)return;svg.dataset.swarmPrepared='true';
      // Keep the comparison chart out of the assembly system: it draws its own lines.
      if(svg.closest('.gr'))return;if(svg.closest('[data-stone-icon]')){if(svg.matches('[data-stone-icon]'))add(svg,false);return}if(svg.closest('[hidden]')){delete svg.dataset.swarmPrepared;return}
      // Miniature team scenes use shared geometry and one carrier per illustration.
      var floor=svg.querySelector('path[fill="#181818"][stroke="#313131"]');
      if(floor){
        var edge=floor.cloneNode(false);edge.setAttribute('transform','translate(0 7)');edge.setAttribute('fill','#101110');edge.setAttribute('stroke','#45433d');edge.setAttribute('stroke-width','1.2');floor.before(edge);
        floor.setAttribute('fill','url(#slateSurface)');floor.setAttribute('stroke','#4c4940');
      }
      // Put all connection pulses below the first building, never above its facade.
      var buildings=Array.from(svg.children).filter(function(n){return n.matches('use[href^="#bd-"]')||n.querySelector('use[href^="#bd-"]')});
      var wires=document.createElementNS(ns,'g');wires.classList.add('wire-layer');
      if(buildings.length)svg.insertBefore(wires,buildings[0]);else svg.appendChild(wires);
      Array.from(svg.querySelectorAll('circle > animateMotion')).forEach(function(motion){
        var dot=motion.parentElement,path=motion.getAttribute('path');if(!path)return;
        var nums=path.match(/-?[\d.]+/g).map(Number);
        if(nums.length===4){var a=nums;path='M'+a[0]+' '+a[1]+' C'+(a[0]+(a[2]-a[0])*.45)+' '+a[1]+' '+(a[0]+(a[2]-a[0])*.55)+' '+a[3]+' '+a[2]+' '+a[3];motion.setAttribute('path',path)}
        var track=document.createElementNS(ns,'path');track.setAttribute('d',path);track.setAttribute('fill','none');track.setAttribute('stroke','#bd8355');track.setAttribute('stroke-width','1.1');track.setAttribute('opacity','.48');wires.appendChild(track);
        dot.setAttribute('fill','#ffe6bd');dot.setAttribute('r','2.4');dot.classList.add('copper-pulse');wires.appendChild(dot);
        // Short glowing comet tail shares the same path and timing.
        for(var k=1;k<=3;k++){var tail=dot.cloneNode(true);tail.setAttribute('r',String(2.2-k*.4));tail.setAttribute('fill',k===1?'#eeb074':'#be7547');var am=tail.querySelector('animateMotion');var begin=parseFloat(am.getAttribute('begin'))||0;am.setAttribute('begin',(begin+k*.045)+'s');wires.insertBefore(tail,dot)}
      });
      if((root.closest('#team,#dirs')!==null)){add(svg,false);return}
      expand(svg,0);
      svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,use').forEach(function(el){
        if(el.closest('defs,clipPath,mask,filter'))return;
        if(el.closest('.wire-layer'))return;
        var g=document.createElementNS(ns,'g');el.before(g);g.appendChild(el);
        if(el.tagName.toLowerCase()==='path'&&/^url\(#stone(Top|Left|Right)\)$/.test(el.getAttribute('fill')||'')){
          var vein=el.cloneNode(false);vein.setAttribute('fill','url(#marbleVeins)');vein.setAttribute('opacity','.65');vein.removeAttribute('stroke');g.appendChild(vein);
        }
        add(g,true);
      });
    });
    // Wrap words without changing even a single original character or whitespace.
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    var nodes=[];while(walker.nextNode()){
      var n=walker.currentNode;
      if(n.textContent.trim()&&!n.parentElement.closest('svg,script,style,h1,[hidden],.swarm-detail,.chart-legend'))nodes.push(n);
    }
    nodes.forEach(function(n){
      var fragment=document.createDocumentFragment();
      (root.id==='team'?[n.textContent]:n.textContent.split(/(\s+)/)).forEach(function(word){
        if(!word)return;
        if(/^\s+$/.test(word)){fragment.appendChild(document.createTextNode(word));return}
        var span=document.createElement('span');span.style.display='inline-block';if(root.id==='team')span.style.maxWidth='100%';span.textContent=word;fragment.appendChild(span);add(span,false);
      });n.replaceWith(fragment);
    });
    root.querySelectorAll('h1,img').forEach(function(el){if(!el.closest('[hidden],.swarm-detail'))add(el,false)});
  }
  function add(el,svg){var i=nextId++;pieces.push({el:el,svg:svg,i:i,state:0,progress:0,start:0,duration:2650+random(i,2)*1050,delay:random(i,3)*650,angle:random(i,1)*Math.PI*2,distance:100+random(i,4)*260});var p=pieces[pieces.length-1];p.building=el.closest('[data-building]');if(p.building)p.building.swarmRemaining=(p.building.swarmRemaining||0)+1;el.dataset.swarmId=String(i);el.classList.add('swarm-detail')}
  function schedule(){if(enabled&&!frame)frame=requestAnimationFrame(draw)}
  function measure(){
    // Completed pieces never move again; pending anchors are measured at their layout positions.
    pieces.forEach(function(p){if(p.state!==2){p.el.style.removeProperty('--swarm-x');p.el.style.removeProperty('--swarm-y');p.el.style.removeProperty('--swarm-r')}});
    pieces.forEach(function(p){
      if(p.state===2)return;
      var r=p.el.getBoundingClientRect();p.top=r.top+scrollY;p.left=r.left;p.w=r.width;p.h=r.height;
      p.visible=!!p.el.getClientRects().length&&!!(r.width||r.height)&&!p.el.closest('[hidden]');
      p.sx=1;p.sy=1;
      if(p.svg){var m=p.el.getScreenCTM();if(m){p.sx=Math.hypot(m.a,m.b)||1;p.sy=Math.hypot(m.c,m.d)||1}}
    });dirty=false;
  }
  function finish(p){if(p.state===2)return;if(p.building){p.building.swarmRemaining--;if(!p.building.swarmRemaining)p.building.classList.add('texture-ready')}p.el.classList.remove('swarm-flying');p.el.removeAttribute('data-swarm-id');if(p.cursor){p.cursor.remove();p.cursor=null}p.state=2;p.progress=1;p.el.classList.add('swarm-done');['--swarm-x','--swarm-y','--swarm-r','--swarm-opacity'].forEach(function(k){p.el.style.removeProperty(k)})}
  function makeCursor(p){
    var c=document.createElement('div');c.className='assembly-cursor';c.dataset.swarmId=String(p.i);c.style.color=colors[p.i%colors.length];
    c.innerHTML='<svg viewBox="0 0 26 32" fill="currentColor"><path d="M2 2L23 20L13 21L9 30Z" stroke="#131209" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    overlay.appendChild(c);p.cursor=c;
  }
  function draw(now){
    frame=0;if(!enabled||document.hidden)return;if(now-lastFrame<32){schedule();return}lastFrame=now;if(dirty)measure();
    var active=[],running=false,vh=innerHeight;
    pieces.forEach(function(p){
      if(p.state===2||!p.visible)return;
      var top=p.top-scrollY;
      if(p.state===0){
        if(top>vh*1.08){if(!p.hidden){p.el.style.setProperty('--swarm-opacity','0');p.hidden=true}return}
        if(top+p.h<0){finish(p);return}
        if(overlay)overlay.hidden=false;p.state=1;p.el.classList.add('swarm-flying');p.start=now+p.delay;
        var x=p.left+p.w/2,y=top+p.h/2,side=p.i%4;
        var margin=100+Math.max(p.w,p.h);
        var startX=side===0?-margin:side===1?innerWidth+margin:random(p.i,7)*innerWidth;
        var startY=side===2?-margin:side===3?vh+margin:random(p.i,8)*vh;
        p.fromX=startX-x;p.fromY=startY-y;
        makeCursor(p);
      }
      // A flight has its own clock: scrolling never fast-forwards or reverses it.
      p.progress=Math.min(1,Math.max(p.progress,(now-p.start)/p.duration,0));
      if(p.progress>=1){finish(p);return}
      running=true;
      var t=p.progress,eased=t*t*(3-2*t),remain=1-eased;
      var bend=Math.sin(t*Math.PI)*(random(p.i,9)-.5)*240;
      var length=Math.hypot(p.fromX,p.fromY)||1;
      var dx=p.fromX*remain-p.fromY/length*bend;
      var dy=p.fromY*remain+p.fromX/length*bend;
      p.el.style.setProperty('--swarm-x',(dx/p.sx).toFixed(2)+'px');p.el.style.setProperty('--swarm-y',(dy/p.sy).toFixed(2)+'px');
      p.el.style.setProperty('--swarm-r',((random(p.i,5)-.5)*18*remain).toFixed(2)+'deg');
      p.el.style.setProperty('--swarm-opacity',p.progress===0?'0':'1');
      active.push(p);
    });
    // Read actual transformed bounds after all writes. This includes SVG parent transforms,
    // rotation, bobbing and scrolling. Each cursor keeps the same detail for its whole flight.
    var positions=active.map(function(p){var r=p.el.getBoundingClientRect();return {p:p,x:r.left+r.width/2,y:r.top+r.height/2}});
    positions.forEach(function(item){
      var c=item.p.cursor;
      var width=innerWidth<=600?15:20,height=innerWidth<=600?20:26;
      c.style.transform='translate3d('+(item.x-width*2/26).toFixed(2)+'px,'+(item.y-height*2/32).toFixed(2)+'px,0)';
      c.style.opacity=item.p.progress>0?'1':'0';
    });
    // Drop completed records: later scrolls only visit unfinished details.
    pieces=pieces.filter(function(p){return p.state!==2});
    if(!running&&overlay)overlay.hidden=true;
    if(running)schedule();
  }
  function enable(){
    if(motion.matches)return;enabled=true;document.documentElement.classList.add('swarm-on');
    overlay=document.createElement('div');overlay.className='assembly-overlay';overlay.setAttribute('aria-hidden','true');
    document.body.appendChild(overlay);dirty=true;schedule();
  }
  function disable(){enabled=false;cancelAnimationFrame(frame);frame=0;if(overlay)overlay.remove();cursors=[];pieces.forEach(finish);document.documentElement.classList.remove('swarm-on')}
  function prepareSection(section){prepare(section);dirty=true;schedule()}
  function setup(){
    if(motion.matches)return;
    prepareSection(document.getElementById('hero'));
    if(!sectionObserver){
      sectionObserver=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){prepareSection(e.target);sectionObserver.unobserve(e.target)}})},{rootMargin:'250px'});
      document.querySelectorAll('main>.sec').forEach(function(section){sectionObserver.observe(section)});
      sceneObserver=new IntersectionObserver(function(entries){entries.forEach(function(e){var svg=e.target;if(e.isIntersecting){svg.removeAttribute('data-sleep');if(!motion.matches)svg.unpauseAnimations()}else{svg.setAttribute('data-sleep','');svg.pauseAnimations()}})},{rootMargin:'100px'});
      document.querySelectorAll('main svg').forEach(function(svg){sceneObserver.observe(svg)});
    }
  }
  setup();enable();
  document.addEventListener('visibilitychange',function(){if(document.hidden){cancelAnimationFrame(frame);frame=0}else schedule()});
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',function(){dirty=true;schedule()});
  addEventListener('load',function(){dirty=true;schedule()},{once:true});
  if(document.fonts)document.fonts.ready.then(function(){dirty=true;schedule()});
  // Tab panels are measured only after they become visible.
  new MutationObserver(function(entries){entries.forEach(function(e){if(!e.target.hidden&&e.target.matches('[role=tabpanel]'))prepare(e.target)});dirty=true;schedule()}).observe(document.querySelector('main'),{subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('focusin',function(e){pieces.forEach(function(p){if(e.target.contains(p.el)||p.el.contains(e.target))finish(p)});schedule()});
  motion.addEventListener('change',function(){if(motion.matches)disable();else{setup();enable()}});
})();

