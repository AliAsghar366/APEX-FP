(function(){
  // Axio Ventures post-hydration patch
  // React error #418 causes re-render from original JS bundle.
  // This script fixes logo, image URLs, nav labels, and hero video after every React render.

  var PATH=window.location.pathname;
  var IS_HOME=PATH==='/'||PATH==='/index.html';
  var LOGO_SRC='/assets/axioventurez-logo.png';

  // Nav label map: what React renders → what we want
  var NAV_MAP={
    'How it Works':'About Us',
    'How It Works':'About Us',
    'Plans':'Services',
    'Standard plan':'Defense & Gov',
    'Expert Plan':'Turnkey Solutions',
    'Affiliate Program':'Smart Security',
    'Affiliate':'Smart Security',
    'Direct to Sim Live':'Technology Solutions',
    'FAQs':'FAQ',
    'Academy':'Smart Security',
    'Get Started':'Contact Us'
  };

  function makeLogo(){
    var img=document.createElement('img');
    img.src=LOGO_SRC;
    img.alt='Axio Ventures';
    img.style.cssText='height:144px;width:auto;display:block;';
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
    // 1. Replace SVG logos with Axio Ventures logo image
    document.querySelectorAll('svg[viewBox="0 0 190 22"], svg[viewBox="0 0 130 22"]').forEach(function(s){
      s.parentNode.replaceChild(makeLogo(),s);
    });

    // 2. Remove Discord community card
    document.querySelectorAll('video[src*="discord.mp4"]').forEach(function(vid){
      var card=vid;
      for(var i=0;i<6;i++){
        if(!card.parentNode) break;
        card=card.parentNode;
        if(card.children&&card.children.length>=3) break;
      }
      if(card&&card.parentNode) card.parentNode.removeChild(card);
    });

    // 3. Remove backend-linked buttons
    ['a[href*="trader/register"]','a[href*="trader/login"]','a[href*="trustpilot.com"]','a[href*="discord.com"]'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(a){
        var el=a.closest('button')||a;
        if(el.parentNode) el.parentNode.removeChild(el);
      });
    });

    // 4. Remove floating GetStartedCard widget
    document.querySelectorAll('.home-card,.get-started-card_GetStartedCard__E3w93').forEach(function(el){
      if(el.parentNode) el.parentNode.removeChild(el);
    });

    // 5. Remove "Get Funded" buttons
    document.querySelectorAll('a,button').forEach(function(el){
      var t=el.textContent.trim();
      if(t==='Get Funded'||(t.startsWith('Get Funded')&&t.length<20)){
        if(el.parentNode) el.parentNode.removeChild(el);
      }
    });

    // 6. Fix /_next/image URLs
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

    // 7. Text node replacement — brand names + nav labels
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
    var node;
    while((node=walker.nextNode())){
      var v=node.nodeValue;
      if(!v) continue;
      // Brand names
      if(v.indexOf('ApexFX')>-1||v.indexOf('APEXFX')>-1||v.indexOf('FXIFY')>-1||v.indexOf('Fxify')>-1||v.indexOf('ApexFP')>-1||v.indexOf('APEXFP')>-1){
        v=v.replace(/ApexFX/g,'Axio Ventures').replace(/APEXFX/g,'Axio Ventures').replace(/FXIFY/g,'Axio Ventures').replace(/Fxify/g,'Axio Ventures').replace(/ApexFP/g,'Axio Ventures').replace(/APEXFP/g,'Axio Ventures');
        node.nodeValue=v;
      }
      // Nav labels
      for(var key in NAV_MAP){
        if(v===key){ node.nodeValue=NAV_MAP[key]; break; }
      }
    }

    // 8. Fix hero headline if React restores original
    if(IS_HOME){
      var h1=document.querySelector('h1');
      if(h1&&(h1.textContent.indexOf('Do you have the talent')>-1||h1.textContent.indexOf('funded trader')>-1)){
        h1.innerHTML='Your Trusted Partner in Procurement &amp; Technology';
      }
      document.querySelectorAll('p').forEach(function(p){
        if(p.textContent.indexOf('Showcase your skills')>-1){
          p.textContent='Delivering tailored, innovative, and cost-effective solutions in government & defense procurement, smart security, IT & software development, and infrastructure.';
        }
      });
    }

    // 9. Fix contact email if React restores original
    var walker2=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
    while((node=walker2.nextNode())){
      if(node.nodeValue&&node.nodeValue.indexOf('support@apexfx.com')>-1){
        node.nodeValue=node.nodeValue.replace(/support@apexfx\.com/g,'info@axioventures.com');
      }
    }
    document.querySelectorAll('a[href*="support@apexfx"]').forEach(function(a){
      a.href='mailto:info@axioventures.com';
    });
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
