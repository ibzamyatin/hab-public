(function(){
  'use strict';
  var copper=['#ffe0ae','#d49a65','#bd8355','#eeb074'];
  document.querySelectorAll('svg.scene').forEach(function(svg){
    var first=svg.querySelector('use[href^="#bd-"]');
    var motionNodes=[];
    svg.querySelectorAll('circle, g').forEach(function(node){
      if(node.querySelector(':scope > animateMotion'))motionNodes.push(node);
    });
    motionNodes.forEach(function(node,i){
      var motion=node.querySelector(':scope > animateMotion');
      if(motion&&motion.getAttribute('path')){
        var track=document.createElementNS('http://www.w3.org/2000/svg','path');
        track.setAttribute('d',motion.getAttribute('path'));track.setAttribute('fill','none');track.setAttribute('stroke','#bd8355');track.setAttribute('stroke-width','1.1');track.setAttribute('opacity','.48');track.classList.add('signal-track');
        if(first)svg.insertBefore(track,first);else svg.insertBefore(track,svg.firstChild);
      }
      node.classList.add(node.tagName.toLowerCase()==='circle'?'signal-dot':'signal-carrier');
      if(node.tagName.toLowerCase()==='circle')node.setAttribute('fill',copper[i%copper.length]);
      else node.querySelectorAll('use').forEach(function(use){use.classList.add('signal-carrier');use.style.setProperty('--t','#ffe0ae');use.style.setProperty('--l','#d49a65');use.style.setProperty('--r','#9a603c')});
      if(first)svg.insertBefore(node,first);else svg.insertBefore(node,svg.firstChild);
    });
  });
})();
