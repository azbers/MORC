const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:900}});
for(const n of process.argv.slice(2)){await p.goto('file://'+process.cwd()+'/'+n+'.html');await p.screenshot({path:n+'.png'});}
await b.close();})();
