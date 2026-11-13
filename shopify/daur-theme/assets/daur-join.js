/* Email sign up band: moves the server made form to sit above the footer and hides it on product, bag and search views. */
(function(){"use strict";
  var j=document.getElementById("daurJoin");if(!j)return;
  var done=/[?&]customer_posted=true/.test(location.search)||j.hasAttribute("data-msg");
  function show(){var p=location.pathname;j.hidden=/\/(products|cart|search|checkouts?|account)(\/|$)/.test(p)}
  function place(){var f=document.getElementById("mFoot");if(!f||!f.parentNode)return false;if(f.previousElementSibling!==j)f.parentNode.insertBefore(j,f);show();return true}
  var n=0,t=setInterval(function(){if(place()||++n>40){clearInterval(t);watch()}},250);
  function watch(){var v=document.getElementById("mView");if(!v||!("MutationObserver"in window))return;var q=0;new MutationObserver(function(){q||(q=requestAnimationFrame(function(){q=0;place()}))}).observe(v,{childList:true});
    if(done){setTimeout(function(){try{j.scrollIntoView({block:"center"})}catch(e){}},600)}}
})();
