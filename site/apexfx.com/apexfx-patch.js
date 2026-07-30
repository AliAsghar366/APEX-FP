(function(){
  console.log('ApexFX patch script loaded');
  
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
  var IS_ABOUT=PATH==='/how.html'||PATH==='/how';
  var IS_SERVICES=PATH==='/programs/standard.html'||PATH==='/programs/expert.html'||PATH==='/programs/standard'||PATH==='/programs/expert'||PATH==='/affiliate.html'||PATH==='/affiliate'||PATH==='/direct-to-sim-live.html'||PATH==='/direct-to-sim-live'||PATH==='/contact-us.html'||PATH==='/contact-us';
  var LOGO_SRC='/assets/axioventurez-logo.png';
  var ICON_SRC='/assets/axioventurez-icon.png';

  // Inject aggressive CSS to hide unwanted elements immediately
  var hideStyle=document.createElement('style');
  hideStyle.textContent='\
    /* Hide newsletter sections */\
    [class*="Newsletter"], [class*="newsletter"], [id*="newsletter"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide payout sections */\
    [class*="payout"], [id*="payout"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide subscribe sections */\
    [class*="subscribe"], [id*="subscribe"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide verified sections */\
    [class*="verified"], [id*="verified"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide Get Started sections */\
    [class*="GetStarted"], [class*="get-started"], [id*="get-started"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide join section */\
    [class*="Join"], [id*="join"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }\
    /* Hide 100% verified payouts text specifically */\
    section:has(*:contains("100%")), section:has(*:contains("100 percent")), section:has(*:contains("verified payouts")) { display: none !important; }\
    /* Scale logo to 2.5x in header and footer */\
    header img[src*="axioventurez"], footer img[src*="axioventurez"], nav img[src*="axioventurez"] { transform: scale(2.5) !important; transform-origin: left center !important; }\
  ';
  document.head.appendChild(hideStyle);

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
    // Apply to all pages including technology solution
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

    // 4.5. Remove newsletter subscription section (site-wide) - more aggressive
    document.querySelectorAll('*').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('subscribe to our newsletter')>-1||text.toLowerCase().indexOf('newsletter')>-1){
        var section=el;
        for(var i=0;i<15;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'||section.className.indexOf('Newsletter')>-1||section.className.indexOf('newsletter')>-1){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
    });

    // 4.6. Remove successful payout section and "100 percent verified payouts"
    document.querySelectorAll('*').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('successful payout')>-1||text.toLowerCase().indexOf('payout')>-1||text.toLowerCase().indexOf('100 percent verified payouts')>-1||text.toLowerCase().indexOf('100% verified payouts')>-1){
        var section=el;
        for(var i=0;i<15;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'||section.className.indexOf('payout')>-1){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
    });

    // 4.7. Remove "Get started with Axio Ventures" text/sections (site-wide) - more aggressive
    document.querySelectorAll('*').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('get started with axio ventures')>-1||text.toLowerCase().indexOf('get started with')>-1){
        var section=el;
        for(var i=0;i<15;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'||section.tagName==='FORM'){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
    });

    // 4.8. CSS-based hiding as fallback
    var style=document.createElement('style');
    style.textContent='\
      [class*="Newsletter"], [class*="newsletter"], [id*="newsletter"] { display: none !important; }\
      [class*="payout"], [id*="payout"] { display: none !important; }\
      [class*="subscribe"], [id*="subscribe"] { display: none !important; }\
      [class*="verified"], [id*="verified"] { display: none !important; }\
    ';
    document.head.appendChild(style);

    // 4.9. Additional text-based removal for newsletter
    document.querySelectorAll('section, div, form').forEach(function(el){
      var html=el.innerHTML||'';
      if(html.toLowerCase().indexOf('subscribe to our newsletter')>-1){
        el.style.display='none';
        if(el.parentNode) el.parentNode.removeChild(el);
      }
    });

    // 4.10. Remove "100 percent verified payouts" and similar text from main page
    document.querySelectorAll('section, div, p, span, h1, h2, h3, h4, h5, h6').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('100 percent verified payouts')>-1||text.toLowerCase().indexOf('100% verified payouts')>-1||text.toLowerCase().indexOf('verified payouts')>-1){
        var section=el;
        for(var i=0;i<10;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
    });

    // 4.11. Remove "Choose best for you" or "Choose what's best for you" text
    document.querySelectorAll('section, div, p, span, h1, h2, h3, h4, h5, h6').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('choose best for you')>-1||text.toLowerCase().indexOf('choose what\'s best for you')>-1||text.toLowerCase().indexOf('choose what')>-1){
        var section=el;
        for(var i=0;i<15;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
    });

    // 4.12. Remove "want to be our affiliate" text
    document.querySelectorAll('section, div, p, span, h1, h2, h3, h4, h5, h6').forEach(function(el){
      var text=el.textContent||'';
      if(text.toLowerCase().indexOf('want to be our affiliate')>-1||text.toLowerCase().indexOf('become an affiliate')>-1||text.toLowerCase().indexOf('affiliate program')>-1){
        var section=el;
        for(var i=0;i<15;i++){
          if(!section.parentNode) break;
          section=section.parentNode;
          if(section.tagName==='SECTION'||section.tagName==='DIV'){
            section.style.display='none';
            if(section.parentNode) section.parentNode.removeChild(section);
            break;
          }
        }
      }
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

    // 10. Replace About Us page content with Axio Ventures content
    if(IS_ABOUT){
      // Replace all headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el){
        var text=el.textContent||'';
        // Replace main heading
        if(text.indexOf('How it Works')>-1||text.indexOf('How It Works')>-1){
          el.textContent='Welcome to Axio Ventures';
        }
        // Replace section headings
        if(text.indexOf('Our Mission')>-1){
          el.textContent='Our Mission';
        }
        if(text.indexOf('Our Vision')>-1){
          el.textContent='Our Vision';
        }
        if(text.indexOf('Our Aim')>-1){
          el.textContent='Our Aim';
        }
        if(text.indexOf('Quality Services')>-1){
          el.textContent='Quality Services Is Our Main Objective';
        }
        if(text.indexOf('Personalized')>-1){
          el.textContent='Personalized Solutions';
        }
        if(text.indexOf('Innovation')>-1){
          el.textContent='Innovation Driven';
        }
        if(text.indexOf('Trusted')>-1){
          el.textContent='Trusted Expertise';
        }
        // Replace service section headings
        if(text.indexOf('Procurement')>-1&&!text.indexOf('Services')>-1){
          el.textContent='Procurement & Construction Services';
        }
        if(text.indexOf('Technology')>-1){
          el.textContent='Smart Technology Solutions';
        }
        // Replace subsection headings
        if(text.indexOf('Government')>-1||text.indexOf('Corporate')>-1){
          el.textContent='Procurement for Government & Corporate Projects';
        }
        if(text.indexOf('Construction')>-1){
          el.textContent='Construction & Civil Engineering Services';
        }
        if(text.indexOf('Telecom')>-1){
          el.textContent='Telecom Infrastructure Development';
        }
        if(text.indexOf('Turnkey')>-1){
          el.textContent='Turnkey Solutions';
        }
        if(text.indexOf('Security Alarm')>-1){
          el.textContent='Security Alarm Systems';
        }
        if(text.indexOf('AI Camera')>-1){
          el.textContent='Smart AI Cameras';
        }
        if(text.indexOf('Electric')>-1){
          el.textContent='Electric Fencing';
        }
        if(text.indexOf('Access')>-1){
          el.textContent='Smart Access Control';
        }
        if(text.indexOf('Smart Home')>-1){
          el.textContent='Smart Homes';
        }
      });

      // Replace all text content with Axio Ventures content
      var walker3=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
      while((node=walker3.nextNode())){
        var v=node.nodeValue;
        if(!v) continue;
        // Mission
        if(v.indexOf('Our mission is to provide')>-1||v.indexOf('mission')>-1&&v.length<200){
          node.nodeValue='To deliver integrated solutions that empower our clients with smart automation, security, and sustainable infrastructure—while maintaining excellence, innovation, and integrity in everything we do.';
        }
        // Vision
        if(v.indexOf('Our vision is to become')>-1||v.indexOf('vision')>-1&&v.length<200){
          node.nodeValue='To be recognized as a leader in digital transformation and infrastructure development by blending intelligent technology with reliable engineering to build a more secure and efficient future.';
        }
        // Aim
        if(v.indexOf('Our aim is to')>-1||v.indexOf('aim')>-1&&v.length<200){
          node.nodeValue='To bridge the digital and physical world through smart automation, innovative software, and solid infrastructure—ensuring every client we serve experiences measurable value and long-term success.';
        }
        // Quality Services
        if(v.indexOf('quality')>-1&&v.indexOf('service')>-1&&v.length<150){
          node.nodeValue='We deliver peace of mind, operational efficiency, and future-ready infrastructure. Each client\'s needs are unique—we listen, analyze, and respond with precision-driven solutions.';
        }
        // Personalized Solutions
        if(v.indexOf('personalized')>-1||v.indexOf('custom')>-1){
          node.nodeValue='We deliver peace of mind, operational efficiency, and future-ready infrastructure. Each client\'s needs are unique—we listen, analyze, and respond with precision-driven solutions.';
        }
        // Innovation Driven
        if(v.indexOf('innovation')>-1&&v.length<150){
          node.nodeValue='Building synergy between technology and infrastructure. We\'re not just adapting to the future—we\'re actively shaping it with smart security and sustainable construction.';
        }
        // Trusted Expertise
        if(v.indexOf('expertise')>-1&&v.length<150){
          node.nodeValue='Spanning residential, commercial, and government sectors. We bring expertise, dedication, and results to every challenge—creating safer, smarter, and more sustainable spaces.';
        }
        // Procurement & Construction Services description
        if(v.indexOf('End-to-end')>-1&&v.length<200){
          node.nodeValue='End-to-end solutions from sourcing to execution';
        }
        if(v.indexOf('Vast supplier')>-1){
          node.nodeValue='Vast supplier network and experienced project managers';
        }
        if(v.indexOf('Focus on quality')>-1){
          node.nodeValue='Focus on quality, sustainability, and cost-efficiency';
        }
        if(v.indexOf('Residential')>-1&&v.indexOf('commercial')>-1){
          node.nodeValue='Residential, commercial, and industrial expertise';
        }
        // Procurement for Government & Corporate Projects
        if(v.indexOf('We specialize in strategic')>-1||v.indexOf('strategic sourcing')>-1){
          node.nodeValue='We specialize in strategic sourcing, indenting, and supply of essential equipment and materials for public and private sector projects. Our procurement team ensures timely delivery, regulatory compliance, and cost-effectiveness.';
        }
        // Construction & Civil Engineering Services
        if(v.indexOf('From planning to execution')>-1){
          node.nodeValue='From planning to execution, we handle residential, commercial, and public infrastructure projects. This includes civil works, building construction, OFC laying, electrical infrastructure, smart city components, and more.';
        }
        // Telecom Infrastructure Development
        if(v.indexOf('We support telecom')>-1){
          node.nodeValue='We support telecom providers with infrastructure rollouts including pole installations, cable ducting, tower construction, and fiber optic laying. Our work meets national telecom standards and regulatory compliances.';
        }
        // Turnkey Solutions
        if(v.indexOf('Clients often need')>-1){
          node.nodeValue='Clients often need end-to-end services—and we deliver. From planning and procurement to construction and after-sales support, we act as a single-window partner for diverse needs.';
        }
        // Tech section heading
        if(v.indexOf('Tech isn\'t a luxury')>-1){
          node.nodeValue='Tech isn\'t a luxury anymore—it\'s a necessity. We help you stay ahead, stay secure, and stay smart.';
        }
        // Security Alarm Systems
        if(v.indexOf('Advanced intrusion')>-1){
          node.nodeValue='Advanced intrusion detection and alarm systems for comprehensive security coverage.';
        }
        // Smart AI Cameras
        if(v.indexOf('Intelligent surveillance')>-1){
          node.nodeValue='Intelligent surveillance with AI-powered analytics and real-time monitoring.';
        }
        // Electric Fencing
        if(v.indexOf('High-security perimeter')>-1){
          node.nodeValue='High-security perimeter protection with advanced electric fencing solutions.';
        }
        // Smart Access Control
        if(v.indexOf('Biometric and card')>-1){
          node.nodeValue='Biometric and card-based access control systems for enhanced security.';
        }
        // Smart Homes
        if(v.indexOf('Complete home automation')>-1){
          node.nodeValue='Complete home automation solutions for modern, connected living.';
        }
      }
    }

    // 11. Replace Services pages content with Axio Ventures content
    if(IS_SERVICES){
      document.querySelectorAll('h1, h2, h3').forEach(function(el){
        var text=el.textContent||'';
        // Replace plan names with service names
        if(text.indexOf('Standard plan')>-1||text.indexOf('Standard Plan')>-1){
          el.textContent='Defense & Government Procurement';
        }
        if(text.indexOf('Expert Plan')>-1||text.indexOf('Expert plan')>-1){
          el.textContent='Turnkey Procurement Solutions';
        }
        if(text.indexOf('Plans')>-1||text.indexOf('Choose')>-1){
          el.textContent='Comprehensive Solutions for Every Need';
        }
      });

      // Replace service descriptions
      var walker4=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
      while((node=walker4.nextNode())){
        var v=node.nodeValue;
        if(!v) continue;
        // Defense & Government Procurement description
        if(v.indexOf('Standard')>-1&&v.indexOf('plan')>-1&&v.length<300){
          node.nodeValue='Strategic sourcing, compliance assurance, and risk-managed acquisition for public sector institutions.';
        }
        // Turnkey Procurement description
        if(v.indexOf('Expert')>-1&&v.indexOf('plan')>-1&&v.length<300){
          node.nodeValue='Fully managed procurement processes from planning to delivery.';
        }
        // Technology Solutions
        if(v.indexOf('technology')>-1&&v.indexOf('solution')>-1&&v.length<200){
          node.nodeValue='Global sourcing of specialized equipment with expert integration.';
        }
        // Smart Security
        if(v.indexOf('security')>-1&&v.indexOf('smart')>-1&&v.length<200){
          node.nodeValue='Cutting-edge systems including smart surveillance, alarms, automation, and energy solutions.';
        }
      }

      // Replace feature/benefit sections
      document.querySelectorAll('li, p').forEach(function(el){
        var text=el.textContent||'';
        if(text.indexOf('Unparalleled')>-1){
          el.textContent='Years of experience in procurement & technology';
        }
        if(text.indexOf('End-to-End')>-1){
          el.textContent='From strategy to implementation';
        }
        if(text.indexOf('Tailor-Made')>-1){
          el.textContent='Customized for your challenges';
        }
        if(text.indexOf('Cost-Effective')>-1){
          el.textContent='Maximum efficiency, quality assured';
        }
        if(text.indexOf('Innovative')>-1&&text.indexOf('Technologies')>-1){
          el.textContent='Smart security, automation, IT infrastructure';
        }
        if(text.indexOf('100%')>-1&&text.indexOf('Satisfaction')>-1){
          el.textContent='Proven track record of success';
        }
      });
    }
  }

  function runAll(){
    console.log('ApexFX patch running...');
    fix();
    ensureHeroVideo();
    removeHomeOnlySections();
    console.log('ApexFX patch completed');
  }
  
  // Run immediately
  runAll();
  
  // Run on DOM ready
  document.addEventListener('DOMContentLoaded',function(){
    console.log('ApexFX patch running on DOMContentLoaded');
    runAll();
  });
  
  // Run on window load
  window.addEventListener('load',function(){
    console.log('ApexFX patch running on window load');
    runAll();
  });
  
  // Run repeatedly to catch React re-renders
  [50,150,400,800,1500,3000,5000].forEach(function(t){
    setTimeout(function(){
      console.log('ApexFX patch running at timeout '+t);
      runAll();
    },t);
  });
  
  // Run every 3 seconds continuously
  setInterval(function(){
    console.log('ApexFX patch running in interval');
    runAll();
  },3000);

  try{
    new MutationObserver(function(){
      console.log('ApexFX patch running on DOM mutation');
      runAll();
    })
      .observe(document.documentElement,{childList:true,subtree:true,attributes:false});
  }catch(e){
    console.log('MutationObserver error:',e);
  }
})();
