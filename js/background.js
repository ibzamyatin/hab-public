(function(){
  var canvas=document.createElement('canvas');canvas.className='world-grid';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  var ctx=canvas.getContext('2d'),grid=document.createElement('canvas'),gridCtx=grid.getContext('2d'),w,h,dpr,raf=0,last=0,motion=matchMedia('(prefers-reduced-motion:reduce)');
  function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);grid.width=canvas.width;grid.height=canvas.height;gridCtx.setTransform(dpr,0,0,dpr,0,0);gridCtx.lineWidth=.6;gridCtx.strokeStyle='rgba(160,116,73,.13)';gridCtx.beginPath();for(var x=0;x<w;x+=72){gridCtx.moveTo(x,0);gridCtx.lineTo(x,h)}for(var y=0;y<h;y+=72){gridCtx.moveTo(0,y);gridCtx.lineTo(w,y)}gridCtx.stroke();paint(performance.now(),true)}
  function paint(now,force){raf=0;if(document.hidden)return;if(!force&&now-last<40){raf=requestAnimationFrame(paint);return}last=now;
    ctx.clearRect(0,0,w,h);ctx.drawImage(grid,0,0,w,h);var step=72;
    if(!motion.matches)for(var i=0;i<12;i++){
      var phase=(now*.00009+i*.173)%1;if(phase>.72)continue;
      var horizontal=i%2===0,len=horizontal?w:h,head=phase/.72*(len+260)-130,lane=(i*191+Math.floor(now/16000)*72)%(horizontal?h:w);lane=Math.round(lane/step)*step;
      var gradient=horizontal?ctx.createLinearGradient(head-150,0,head,0):ctx.createLinearGradient(0,head-150,0,head);gradient.addColorStop(0,'rgba(185,112,58,0)');gradient.addColorStop(.75,'rgba(226,160,100,.3)');gradient.addColorStop(1,'rgba(255,225,181,.9)');ctx.strokeStyle=gradient;ctx.lineWidth=1.3;ctx.beginPath();if(horizontal){ctx.moveTo(head-150,lane);ctx.lineTo(head,lane)}else{ctx.moveTo(lane,head-150);ctx.lineTo(lane,head)}ctx.stroke();
      ctx.fillStyle='#ffe2b6';ctx.shadowColor='#e5a56b';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(horizontal?head:lane,horizontal?lane:head,1.8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
    if(!motion.matches)raf=requestAnimationFrame(paint);
  }
  addEventListener('resize',function(){cancelAnimationFrame(raf);resize()});document.addEventListener('visibilitychange',function(){cancelAnimationFrame(raf);if(!document.hidden)paint(performance.now(),true)});motion.addEventListener('change',function(){cancelAnimationFrame(raf);paint(performance.now(),true)});resize();
})();

