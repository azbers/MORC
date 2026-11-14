/* Email sign up band: moves the server made form to sit above the footer and hides it on product, bag and search views. */
(function(){"use strict";
  var j=document.getElementById("daurJoin");if(!j)return;
  var done=/[?&]customer_posted=true/.test(location.search)||j.hasAttribute("data-msg");
  function show(){var p=location.pathname;j.hidden=/\/(products|cart|search|checkouts?|account)(\/|$)/.test(p)}
  function place(){var f=document.getElementById("mFoot");if(!f||!f.parentNode)return false;if(f.previousElementSibling!==j)f.parentNode.insertBefore(j,f);show();j.classList.toggle("dj-last",getComputedStyle(f).display==="none");return true}
  addEventListener("resize",function(){place()},{passive:true});
  var n=0,t=setInterval(function(){if(place()||++n>40){clearInterval(t);watch()}},250);
  function watch(){var v=document.getElementById("mView");if(!v||!("MutationObserver"in window))return;var q=0;new MutationObserver(function(){q||(q=requestAnimationFrame(function(){q=0;place()}))}).observe(v,{childList:true});
    if(done){setTimeout(function(){try{j.scrollIntoView({block:"center"})}catch(e){}},600)}}
})();

/* One main heading per page: the classic layout stays in the page but hidden, so its h1 is demoted once the visible view has drawn its own. */
(function(){
  function demote(){
    var v=document.getElementById('mView'),a=document.getElementById('app');
    if(!v||!a||!document.documentElement.classList.contains('m-on')||!v.querySelector('h1'))return;
    var hs=a.querySelectorAll('h1');
    for(var i=0;i<hs.length;i++){var h=hs[i],d=document.createElement('div');
      for(var k=0;k<h.attributes.length;k++)d.setAttribute(h.attributes[k].name,h.attributes[k].value);
      d.setAttribute('data-h1','');while(h.firstChild)d.appendChild(h.firstChild);h.parentNode.replaceChild(d,h);}
  }
  var t;function later(){clearTimeout(t);t=setTimeout(demote,400)}
  if(window.MutationObserver){var v=document.getElementById('mView');if(v)new MutationObserver(later).observe(v,{childList:true});var a=document.getElementById('app');if(a)new MutationObserver(later).observe(a,{childList:true,subtree:true});}
  if(document.readyState==='complete')later();else window.addEventListener('load',later);
})();
