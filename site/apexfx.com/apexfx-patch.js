(function(){
  // ApexFX post-hydration patch
  // React error #418 causes re-render from original JS bundle (FXIFY logo + /_next/image URLs).
  // This script fixes both after every React render cycle.

  function fix(){
    // 1. Replace original 190px FXIFY Futures logo with ApexFX SVG
    document.querySelectorAll('svg[viewBox="0 0 190 22"]').forEach(function(s){
      var ns='http://www.w3.org/2000/svg';
      // Build replacement: keep the icon group, add ApexFX text
      var newSvg=document.createElementNS(ns,'svg');
      newSvg.setAttribute('width','130');
      newSvg.setAttribute('height','22');
      newSvg.setAttribute('viewBox','0 0 130 22');
      newSvg.setAttribute('fill','none');
      newSvg.setAttribute('xmlns',ns);
      // Copy the icon <g filter="..."> group (first child)
      var iconGroup=s.querySelector('g[filter]');
      if(iconGroup) newSvg.appendChild(iconGroup.cloneNode(true));
      // Add ApexFX text
      var txt=document.createElementNS(ns,'text');
      txt.setAttribute('x','46');
      txt.setAttribute('y','17');
      txt.setAttribute('fill','white');
      txt.setAttribute('font-size','15');
      txt.setAttribute('font-weight','700');
      txt.setAttribute('font-family','inherit');
      txt.setAttribute('letter-spacing','0.5');
      txt.textContent='ApexFX';
      newSvg.appendChild(txt);
      // Copy defs
      var defs=s.querySelector('defs');
      if(defs) newSvg.appendChild(defs.cloneNode(true));
      s.parentNode.replaceChild(newSvg,s);
    });

    // 2. Fix /_next/image URLs React puts back after re-render
    document.querySelectorAll('img').forEach(function(img){
      var src=img.getAttribute('src')||'';
      var ss=img.getAttribute('srcset')||'';
      var fix=function(v){
        return v.replace(/\/_next\/image\?url=([^&\s,"]+)(?:&[^\s,"]*)?/g,function(m,e){
          try{ return decodeURIComponent(e); }catch(x){ return e; }
        });
      };
      if(src.indexOf('/_next/image')>-1) img.setAttribute('src',fix(src));
      if(ss.indexOf('/_next/image')>-1) img.setAttribute('srcset',fix(ss));
    });
  }

  // Fire at multiple points to cover React's async render phases
  fix();
  document.addEventListener('DOMContentLoaded',fix);
  window.addEventListener('load',fix);
  [50,150,400,800,1500].forEach(function(t){setTimeout(fix,t);});

  // MutationObserver catches every React DOM update
  try{
    new MutationObserver(function(){fix();})
      .observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  }catch(e){}
})();
