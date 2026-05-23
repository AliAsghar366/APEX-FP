(function(){
  // ApexFX post-hydration patch
  // React error #418 causes re-render from original JS bundle (FXIFY logo + /_next/image URLs).
  // This script fixes both after every React render cycle.

  var IS_HOME=window.location.pathname==='/'||window.location.pathname==='/index.html';

  function ensureHeroVideo(){
    if(!IS_HOME) return;
    var ROCKET='/assets/programs-individual/hero/starter-2.mp4';
    // Re-inject hero background video if React removed it
    var existing=document.getElementById('apexfx-hero-bg');
    var section=document.querySelector('section.flex.flex-col.relative');
    if(!existing&&section){
      var vid=document.createElement('video');
      vid.id='apexfx-hero-bg';
      vid.autoplay=true;
      vid.muted=true;
      vid.setAttribute('playsinline','');
      vid.loop=true;
      vid.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
      var src=document.createElement('source');
      src.src=ROCKET;
      src.type='video/mp4';
      vid.appendChild(src);
      section.insertBefore(vid,section.firstChild);
      vid.play().catch(function(){});
    }
    // Make sure container-v2 is above the video
    if(section){
      var cv2=section.querySelector('.container-v2');
      if(cv2&&(!cv2.style.zIndex||cv2.style.zIndex==='')) {
        cv2.style.position='relative';
        cv2.style.zIndex='1';
      }
    }
    // Swap the React BgVideo source to rocket
    document.querySelectorAll('source[src*="bg-reencoded.mp4"]').forEach(function(s){
      s.setAttribute('src',ROCKET);
      var v=s.parentNode;
      if(v&&v.tagName==='VIDEO'){v.load();v.play().catch(function(){});}
    });
    document.querySelectorAll('video[src*="bg-reencoded.mp4"]').forEach(function(v){
      v.setAttribute('src',ROCKET);
      v.load();v.play().catch(function(){});
    });
  }

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

  function runAll(){fix();ensureHeroVideo();}

  // Fire at multiple points to cover React's async render phases
  runAll();
  document.addEventListener('DOMContentLoaded',runAll);
  window.addEventListener('load',runAll);
  [50,150,400,800,1500].forEach(function(t){setTimeout(runAll,t);});

  // MutationObserver catches every React DOM update
  try{
    new MutationObserver(function(){runAll();})
      .observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  }catch(e){}
})();
