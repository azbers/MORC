import json, re, sys
T=open('/home/claude/MORC/shopify/theme/layout/theme.liquid').read()
prods=[
 ("moc-runner-v1","DAUR Moc-Runner v1","Hybrids",["badge:Drop 01","Men","silhouette:moc"],"The everyday leather shoe, refined. A leather upper with a hand guided moc toe sits on a cushioned rubber sole.",["Triple Black","Oxblood"],3970,0,[3,5,8,5,1,0]),
 ("phantom-trainer","DAUR Phantom Trainer","Sneakers",["badge:Drop 01","Men"],"A quiet trainer for long city days. Suede overlays on breathable mesh.",["Obsidian / Bone"],4270,4800,[4,5,0,6,4,2]),
 ("grid-court-low","DAUR Grid Court Low","Sneakers",["badge:Drop 01","Men"],"A clean court low that goes with everything. Smooth leather on a stitched rubber cupsole.",["Bone / Ink","Triple Black"],4170,0,[2,7,9,6,3,1]),
 ("unit-derby-02","DAUR Unit Derby 02","Leather",["badge:Drop 01","Men"],"An open laced derby in polished black leather. A stacked heel gives it the stance of a formal shoe.",["Black Full Grain"],4870,0,[1,3,4,4,2,1]),
 ("concrete-mid","DAUR Concrete Mid","Sneakers",["badge:Drop 01","Men"],"A mid cut with weight and structure.",["Ash / Black"],3000,0,[0,2,5,5,3,2]),
 ("volt-signal","DAUR Volt Signal","Sneakers",["badge:Drop 01","Men"],"The one bright pair in the collection. For the days you want to be seen.",["Black / Volt"],4670,0,[2,2,3,2,1,0]),
 ("ward-chelsea","DAUR Ward Chelsea","Leather",["badge:Drop 01","Men"],"A waxed leather chelsea boot on a lugged rubber sole. Elastic gussets, a pull tab and clean lines, nothing more.",["Black Waxed","Dark Brown"],4870,5400,[1,2,3,2,2,1]),
 ("sector-slip","DAUR Sector Slip","Hybrids",["badge:Drop 01","Men"],"Soft black nappa leather, twin elastic gores and a bone vulcanised sole. Slip on and go.",["Black Nappa"],3870,0,[4,6,6,5,3,2]),
 ("pair-for-someone-in-need","A pair for someone in need","Giving",["giving-pair"],"Pay for one pair.",None,3870,0,[5]),
]
raw=[]; vid=1000
for h,t,ty,tags,d,cols,pr,cap,st in prods:
  body="<p>"+d+"</p><ul><li><strong>Upper:</strong> Leather</li><li><strong>Made in:</strong> Pakistan</li></ul>"
  if cols is None:
    vid+=1; raw.append(dict(handle=h,title=t,type=ty,tags=tags,created="2026-11-01",body=body,options=[{"name":"Title","values":["Default Title"]}],variants=[dict(id=vid,options=["Default Title"],price=pr*100,cap=0,qty=5,managed=True,policy="continue",available=True)],models=[],images=[])); continue
  vs=[]
  for c in cols:
    for i,s in enumerate(range(40,46)):
      vid+=1; vs.append(dict(id=vid,options=[c,"EU %d"%s],price=pr*100,cap=cap*100,qty=st[i],managed=True,policy="deny",available=st[i]>0))
  raw.append(dict(handle=h,title=t,type=ty,tags=tags,created="2026-11-01",body=body,options=[{"name":"Color","values":cols},{"name":"Size","values":["EU %d"%s for s in range(40,46)]}],variants=vs,models=[],images=[]))
notes=[dict(id="n%d"%i,pid=p,rating=r,name="Test Buyer %d"%i,city=c,title="[TEST] Sample fit note %d"%i,body="Test entry: comfortable from day one, stitching looks clean.",colour="",size="42",fit="True to size",photo=None,verified=False,date="2026-11-02") for i,(p,r,c) in enumerate([("moc-runner-v1",4,"Karachi"),("moc-runner-v1",3,"Multan"),("phantom-trainer",5,"Lahore"),("grid-court-low",5,"Rawalpindi"),("unit-derby-02",4,"Multan"),("ward-chelsea",5,"Islamabad"),("ward-chelsea",4,"Lahore")])]
cfg=dict(brand="DAUR Supply",domain="http://localhost:8765",currency="Rs.",whatsapp="923199628735",supportEmail="contact@daursupply.com",marketRetail=12000,freeDeliveryPairs=2,delivery=dict(fee=0,days="2 to 5 days"),advance=dict(on=True,code="",deposit=500,required=True,tiers="3000:500, 8000:1000, 15000:1500",free="all"),coupons={},audiences=["Men"],lowStockAt=2,sell=dict(retailAnchor=False,ladder=True,perWear=3),img={k:"" for k in ["hero","sneakers","casual","leather","workshop","checked","door","bench","tools","guide"]},announce="",give=dict(on=True,pct=5,causes=["School fees","Medical bills","Food rations"],quarter=None))
OFFERS=[{'id':'nayadaur','title':'Rs. 300 off your order','code':'NAYADAUR','details':'One use per customer.','min':5500,'sort':1,'ends':None},{'id':'doubleup','title':'Rs. 700 off orders of Rs. 8,000 or more','code':'DOUBLEUP','details':'One use per customer.','min':8000,'sort':2,'ends':'2026-11-25T23:59:00+05:00'}]
page=sys.argv[1]; param=sys.argv[2] if len(sys.argv)>2 else ""
import os
BODY=open(os.environ['BODY']).read() if os.environ.get('BODY') else '<div class="wrap daur-plain"><h1>Plain server copy</h1></div>'
css=open('/home/claude/MORC/shopify/theme/snippets/daur-theme-css.liquid').read()
A="/shopify/theme/assets/"
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>DAUR Supply</title>
<link rel="stylesheet" href="{A}styles.css"><style>{css}</style>
<script>try{{if(matchMedia('(max-width: 900px)').matches&&!/[?&]view=classic/.test(location.search))document.documentElement.classList.add('m-on')}}catch(e){{}}</script>
<link rel="stylesheet" href="{A}daur-m.css" media="(max-width: 900px)"><link rel="stylesheet" href="{A}daur-m-pdp.css" media="(max-width: 900px)"><link rel="stylesheet" href="{A}daur-m-bag.css" media="(max-width: 900px)">
</head><body data-page="{page}"><div class="hdr-ph"></div><main id="app" tabindex="-1">{BODY}</main>
<script>window.DAUR_CONFIG={json.dumps(cfg)};window.DAUR_STATUSES=[];window.DAUR_FITNOTES={json.dumps(notes)};window.DAUR_JOURNAL=[];window.DAUR_OFFERS={json.dumps(OFFERS)};window.DAUR_GIVING=[];window.DAUR_GIVING_ROUNDS=[];
window.DAUR_SHOPIFY={{param:{json.dumps(param)},routes:{{root:"/",account:"/account"}},collections:["all","sneakers","leather-shoes","casual","sale"],raw:{json.dumps(raw)}}};</script>
'''+"".join(f'<script src="{A}{f}" defer></script>' for f in ["daur-shopify.js","shoe.js","icons.js","kicks.js","pile.js","social.js","alive.js","app.js"])+f'''
<script>window.DAUR_M={{assets:"{A}",walletCode:"WALLET350",walletAmount:350,splash:true,splashTag:"Drop 01 is live",cutouts:true}};</script><script src="{A}daur-m.js" defer></script><script src="{A}daur-m-pdp.js" defer></script><script src="{A}daur-m-bag.js" defer></script></body></html>'''
open(sys.argv[3],'w').write(html)
