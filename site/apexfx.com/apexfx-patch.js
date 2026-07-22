(function(){
  // Block leftover FXIFY tracking/ads infrastructure (GTM, Google Ads conversion,
  // DoubleClick, Microsoft Clarity, TikTok Pixel, Twitter Ads, Intercom widget).
  // These still fire on every page view and send Axio Ventures' visitor data to
  // FXIFY's own analytics/ad accounts — and the failed/slow external connection
  // attempts were a major contributor to page load time.
  var BLOCKED_HOSTS=['gtm.fxifyfutures.com','googletagmanager.com','google-analytics.com',
    'doubleclick.net','google.com/ccm','analytics.tiktok.com','ads-twitter.com',
    'analytics.twitter.com','t.co/i/','clarity.ms','intercom.io'];
  function isBlocked(url){
    if(!url) return false;
    url=String(url);
    for(var i=0;i<BLOCKED_HOSTS.length;i++){ if(url.indexOf(BLOCKED_HOSTS[i])>-1) return true; }
    return false;
  }
  function guardSrcProperty(proto){
    var d=Object.getOwnPropertyDescriptor(proto,'src');
    if(!d||!d.set) return;
    Object.defineProperty(proto,'src',{
      get:d.get,
      set:function(value){ if(isBlocked(value)) return; d.set.call(this,value); },
      configurable:true
    });
  }
  if(window.HTMLScriptElement) guardSrcProperty(HTMLScriptElement.prototype);
  if(window.HTMLImageElement) guardSrcProperty(HTMLImageElement.prototype);
  if(window.HTMLIFrameElement) guardSrcProperty(HTMLIFrameElement.prototype);
  var origSetAttribute=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(name,value){
    if(name==='src'&&isBlocked(value)) return;
    return origSetAttribute.apply(this,arguments);
  };
  if(window.fetch){
    var origFetch=window.fetch;
    window.fetch=function(input){
      var url=typeof input==='string'?input:(input&&input.url);
      if(isBlocked(url)) return Promise.resolve(new Response(null,{status:204}));
      return origFetch.apply(this,arguments);
    };
  }
  if(navigator.sendBeacon){
    var origSendBeacon=navigator.sendBeacon;
    navigator.sendBeacon=function(url){ if(isBlocked(url)) return true; return origSendBeacon.apply(navigator,arguments); };
  }
  var origXhrOpen=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method,url){
    if(isBlocked(url)){ this.send=function(){}; url='about:blank'; }
    return origXhrOpen.apply(this,arguments);
  };
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push=function(){};

  // Axio Ventures post-hydration patch
  // React error #418 causes re-render from original JS bundle.
  // This script fixes logo, image URLs, nav labels, and hero video after every React render.

  var PATH=window.location.pathname;
  var IS_HOME=PATH==='/'||PATH==='/index.html';
  var LOGO_SRC='/assets/axioventurez-logo.png';
  var ICON_SRC='/assets/axioventurez-icon.png';

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

  function makeLogo(src){
    var a=document.createElement('a');
    a.href='/';
    a.style.cssText='display:inline-block;cursor:pointer;height:100%;';
    var img=document.createElement('img');
    img.src=src;
    img.alt='Axio Ventures';
    img.style.cssText='height:100%;width:auto;display:block;';
    a.appendChild(img);
    return a;
  }

  function removeHomeOnlySections(){
    if(!IS_HOME) return;
    // Remove comparison table section (Excellence in Every Aspect)
    var adv=document.getElementById('advantage');
    if(adv&&adv.parentNode) adv.parentNode.removeChild(adv);
    // Remove plan cards section (Choose what's best for you)
    var plans=document.getElementById('plans');
    if(plans&&plans.parentNode) plans.parentNode.removeChild(plans);
    // Extra: remove any element containing 'Choose what' text
    document.querySelectorAll('div[id="plans"],section[id="plans"]').forEach(function(el){
      if(el.parentNode) el.parentNode.removeChild(el);
    });
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
    // 1. Replace SVG logos with Axio Ventures logo (wrapped in <a href="/">)
    // Header slot (wide) gets the full logo; footer slot (compact) gets the icon-only
    // mark so it doesn't overflow its much smaller container and overlap nearby text.
    // Distinguished by the actual container class, not viewBox (both slots share viewBoxes).
    document.querySelectorAll('svg[viewBox="0 0 190 22"], svg[viewBox="0 0 130 22"]').forEach(function(s){
      var parent=s.parentNode;
      if(!parent) return;
      var isFooter = !!(s.closest && s.closest('.footer_Footer_info_logo__FePTR'));
      var src = isFooter ? ICON_SRC : LOGO_SRC;
      var newEl=makeLogo(src);
      if(parent.tagName==='A'){
        // Parent anchor already has its own CSS-class height (e.g. header_Header_logo);
        // don't override it with an inline style, or height:100% loses that reference
        // and falls back to the image's natural size.
        parent.href='/';
        parent.replaceChild(newEl.querySelector('img'),s);
      } else {
        parent.replaceChild(newEl,s);
      }
    });
    // Also ensure any already-injected logo/icon img is inside an <a href="/"> and sized to its container
    document.querySelectorAll('img[src*="axioventurez-logo"], img[src*="axioventurez-icon"]').forEach(function(img){
      img.style.height='100%';
      img.style.width='auto';
      var a=img.parentNode;
      if(a&&a.tagName!=='A'){
        a=document.createElement('a');
        a.href='/';
        a.style.cssText='display:inline-block;cursor:pointer;height:100%;';
        img.parentNode.insertBefore(a,img);
        a.appendChild(img);
      }
      // If already wrapped in an <a>, leave its height alone — it may carry its
      // own CSS-class sizing (e.g. header_Header_logo) that inline 100% would break.
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
    ['a[href*="trader/register"]','a[href*="trader/login"]','a[href*="trustpilot.com"]','a[href*="discord.com"]','a[href*="intercom.help"]','a[href="/academy"]','a[href="https://app.fxifyfutures.com/"]'].forEach(function(sel){
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

  function runAll(){fix();ensureHeroVideo();removeHomeOnlySections();}

  runAll();
  document.addEventListener('DOMContentLoaded',runAll);
  window.addEventListener('load',runAll);
  [50,150,400,800,1500].forEach(function(t){setTimeout(runAll,t);});

  try{
    new MutationObserver(function(){runAll();})
      .observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  }catch(e){}
})();
