/* Native scroll -> bounded SVG state. No wheel interception or animation loop. */
(function () {
  'use strict';
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = matchMedia('(max-width: 760px)');
  var pending = false;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var phase = function (p, start, end) {
    var x = clamp((p - start) / (end - start));
    return x * x * (3 - 2 * x);
  };
  var scenes = [];
  document.querySelectorAll('.hscene > svg.scene, .pvis > svg.scene, .altin > svg.scene, .kbv > svg.scene, .fc > svg.scene').forEach(function (svg) {
    var actors = [];
    svg.querySelectorAll('use[href^="#bd-"]').forEach(function (building) {
      var wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      building.parentNode.insertBefore(wrapper, building);
      wrapper.appendChild(building);
      actors.push(wrapper);
    });
    var routes = [];
    svg.querySelectorAll('circle').forEach(function (dot) {
      var animation = dot.querySelector('animateMotion[path]');
      if (!animation) return;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', animation.getAttribute('path'));
      var length = path.getTotalLength();
      if (!length) return;
      routes.push({ dot: dot, path: path, length: length });
      dot.querySelectorAll('animate, animateMotion').forEach(function (node) { node.remove(); });
    });
    if (svg.pauseAnimations) svg.pauseAnimations();
    svg.classList.add('scroll-scene');
    scenes.push({ svg: svg, actors: actors, routes: routes });
  });
  function render() {
    pending = false;
    var height = window.innerHeight;
    scenes.forEach(function (scene) {
      if (!scene.svg.getClientRects().length) return;
      var rect = scene.svg.getBoundingClientRect();
      // Geometry is measured afresh: deep links, tab changes and history restoration work.
      var progress = clamp((height * .94 - rect.top) / (height * .66 + rect.height * .22));
      if (motion.matches) progress = 1;
      scene.actors.forEach(function (actor, index) {
        var settle = phase(progress, index * .025, .68 + index * .025);
        var lift = (1 - settle) * (narrow.matches ? 10 : 26);
        actor.setAttribute('transform', 'translate(0 ' + (-lift).toFixed(3) + ')');
        actor.style.opacity = (.72 + settle * .28).toFixed(3);
      });
      scene.routes.forEach(function (route, index) {
        var p = phase(progress, .12 + index * .035, .84 + index * .02);
        var point = route.path.getPointAtLength(route.length * p);
        // SMIL on this dot was removed: position has a single scroll controller.
        route.dot.setAttribute('cx', point.x);
        route.dot.setAttribute('cy', point.y);
        route.dot.style.opacity = motion.matches ? '0' : (Math.sin(Math.PI * p) * .9).toFixed(3);
      });
      scene.svg.style.setProperty('--connection', phase(progress, .1, .8).toFixed(3));
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  addEventListener('hashchange', schedule);
  document.addEventListener('click', schedule);
  document.addEventListener('keydown', schedule);
  if (motion.addEventListener) motion.addEventListener('change', schedule);
  if (narrow.addEventListener) narrow.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  render();
})();
