(function(){
  // Axio Venturez post-hydration patch
  // React error #418 causes re-render from original JS bundle (FXIFY logo + /_next/image URLs).
  // This script fixes logo, image URLs, and hero video after every React render cycle.

  var IS_HOME=window.location.pathname==='/'||window.location.pathname==='/index.html';
  var LOGO_SRC='/assets/axioventurez-logo.jpeg';

  function makeLogo(){
    var img=document.createElement('img');
    img.src=LOGO_SRC;
    img.alt='Axio Venturez';
    img.style.cssText='height:36px;width:auto;display:block;';
    return img;
  }

  function ensureHeroVideo(){
    if(!IS_HOME) return;
    var ROCKET='/assets/programs-individual/hero/starter-2.mp4';
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
    if(section){
      var cv2=section.querySelector('.container-v2');
      if(cv2&&(!cv2.style.zIndex||cv2.style.zIndex==='')){
        cv2.style.position='relative';
        cv2.style.zIndex='1';
      }
    }
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
    // 1. Replace FXIFY/ApexFX SVG logos with Axio Venturez logo image
    document.querySelectorAll('svg[viewBox="0 0 190 22"], svg[viewBox="0 0 130 22"]').forEach(function(s){
      s.parentNode.replaceChild(makeLogo(),s);
    });

    // 1b. Remove Discord community card if React re-renders it
    document.querySelectorAll('video[src*="discord.mp4"]').forEach(function(vid){
      var card=vid;
      // Walk up to find the card container (has multiple sibling divs including the video)
      for(var i=0;i<6;i++){
        if(!card.parentNode) break;
        card=card.parentNode;
        if(card.children&&card.children.length>=3) break;
      }
      if(card&&card.parentNode) card.parentNode.removeChild(card);
    });
    // Remove any remaining Discord buttons/links
    document.querySelectorAll('a[href*="discord.com"]').forEach(function(a){
      var btn=a.closest('button')||a;
      if(btn.parentNode) btn.parentNode.removeChild(btn);
    });

    // 2. Fix /_next/image URLs React puts back after re-render
    document.querySelectorAll('img').forEach(function(img){
      var src=img.getAttribute('src')||'';
      var ss=img.getAttribute('srcset')||'';
      var fixUrl=function(v){
        return v.replace(/\/_next\/image\?url=([^&\s,"]+)(?:&[^\s,"]*)?/g,function(m,e){
          try{ return decodeURIComponent(e); }catch(x){ return e; }
        });
      };
      if(src.indexOf('/_next/image')>-1) img.setAttribute('src',fixUrl(src));
      if(ss.indexOf('/_next/image')>-1) img.setAttribute('srcset',fixUrl(ss));
    });

    // 3. Replace any brand text React re-inserts — walk ALL text nodes
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
    var node;
    while((node=walker.nextNode())){
      var v=node.nodeValue;
      if(v&&(v.indexOf('ApexFX')>-1||v.indexOf('APEXFX')>-1||v.indexOf('FXIFY')>-1||v.indexOf('Fxify')>-1||v.indexOf('ApexFP')>-1||v.indexOf('APEXFP')>-1)){
        node.nodeValue=v.replace(/ApexFX/g,'Axio Venturez').replace(/APEXFX/g,'Axio Venturez').replace(/FXIFY/g,'Axio Venturez').replace(/Fxify/g,'Axio Venturez').replace(/ApexFP/g,'Axio Venturez').replace(/APEXFP/g,'Axio Venturez');
      }
    }

    // 4. Replace hero headline if React restores original
    if(IS_HOME){
      var h1=document.querySelector('h1');
      if(h1&&h1.textContent.indexOf('Do you have the talent')>-1){
        h1.innerHTML='Your Trusted Partner in Procurement &amp; Technology';
      }
      document.querySelectorAll('p').forEach(function(p){
        if(p.textContent.indexOf('Showcase your skills')>-1){
          p.textContent='Delivering tailored, innovative, and cost-effective solutions in government & defense procurement, smart security, IT & software development, and infrastructure.';
        }
      });
    }
  }

  function runAll(){fix();ensureHeroVideo();}

  runAll();
  document.addEventListener('DOMContentLoaded',runAll);
  window.addEventListener('load',runAll);
  [50,150,400,800,1500].forEach(function(t){setTimeout(runAll,t);});

  try{
    new MutationObserver(function(){runAll();})
      .observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  }catch(e){}
})();
