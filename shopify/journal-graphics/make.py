import os
css=open('base.css').read()
FT='<div class="ft"><b>DAUR SUPPLY</b><span>daursupply.com / The DAUR Journal</span></div>'
def page(name,ey,h1,body,extra=''):
    open(name+'.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}{extra}</style></head><body><div class="ey">{ey}</div><h1>{h1}</h1>{body}{FT}</body></html>')
E='#2A1C14';B='#B0843F';C='#F5EEE4';M='#6E5A4A';T='#D9C7AE'

# G1 size chart
rows=[(40,25.5,6.5),(41,26.5,7.5),(42,27,8.5),(43,28,9.5),(44,28.5,10.5),(45,29.5,11.5)]
tr=''.join(f'<tr><td>EU {e}</td><td>{c:g} cm</td><td>UK {u:g}</td></tr>' for e,c,u in rows)
page('size-chart','Men\'s size guide','DAUR shoe size chart: EU 40 to 45',
 f'<div style="display:flex;gap:70px;align-items:flex-start"><table>{"<tr><th>EU size</th><th>Foot length</th><th>Approx. UK</th></tr>"}{tr}</table><div class="note"><p><b>How to use it</b></p><p>Measure your foot heel to toe while standing, in the evening.</p><p>Choose the size whose foot length is equal to or just above your measurement.</p><p class="s">Sizes differ between brands. This chart is for DAUR pairs.</p></div></div>',
 'table{border-collapse:collapse;font-size:30px;width:760px}th{font:600 18px "DejaVu Sans Mono",monospace;letter-spacing:.14em;text-transform:uppercase;text-align:left;color:#8A5A2B;padding:0 0 14px;border-bottom:3px solid #2A1C14}td{padding:15px 0;border-bottom:1px solid #D9C7AE}td:first-child{font-weight:700}.note{font-size:25px;line-height:1.45;max-width:520px;border-left:4px solid #B0843F;padding-left:28px}.note p{margin-bottom:16px}.note .s{color:#6E5A4A;font-size:21px}')

# G2 measure foot
svg=f'''<svg width="1440" height="560" viewBox="0 0 1440 560" font-family="DejaVu Sans">
<g>
<rect x="20" y="20" width="36" height="440" fill="{E}"/><text x="38" y="500" text-anchor="middle" font-size="20" fill="{M}">WALL</text>
<rect x="56" y="70" width="300" height="380" fill="#fff" stroke="{T}" stroke-width="3"/>
<path d="M58,262 C58,232 72,214 100,210 C150,204 200,196 245,192 C275,190 300,196 318,210 C332,222 334,240 330,256 C326,276 312,292 290,298 C250,308 190,312 140,316 C100,320 70,312 62,296 C58,288 58,276 58,262 Z" fill="{T}" stroke="{E}" stroke-width="3"/>
<circle cx="322" cy="226" r="9" fill="{T}" stroke="{E}" stroke-width="2"/><circle cx="314" cy="246" r="7" fill="{T}" stroke="{E}" stroke-width="2"/><circle cx="306" cy="264" r="6" fill="{T}" stroke="{E}" stroke-width="2"/><circle cx="296" cy="280" r="5" fill="{T}" stroke="{E}" stroke-width="2"/><circle cx="284" cy="292" r="5" fill="{T}" stroke="{E}" stroke-width="2"/>
<line x1="56" y1="400" x2="332" y2="400" stroke="{B}" stroke-width="4" marker-end="url(#a)" marker-start="url(#a)"/>
<line x1="332" y1="190" x2="332" y2="420" stroke="{E}" stroke-width="3" stroke-dasharray="8 6"/>
<text x="194" y="438" text-anchor="middle" font-size="22" fill="{E}" font-weight="700">foot length</text>
</g>
<defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{B}"/></marker></defs>
<g font-size="27" fill="{E}">
<text x="430" y="95"><tspan font-weight="700">1</tspan>  Put A4 paper on a hard floor, against a wall.</text>
<text x="430" y="165"><tspan font-weight="700">2</tspan>  Stand on it, heel touching the wall, socks on.</text>
<text x="430" y="235"><tspan font-weight="700">3</tspan>  Mark the tip of your longest toe.</text>
<text x="430" y="305"><tspan font-weight="700">4</tspan>  Measure wall to mark in centimetres.</text>
<text x="430" y="375"><tspan font-weight="700">5</tspan>  Repeat on the other foot. Use the longer one.</text>
<text x="430" y="445"><tspan font-weight="700">6</tspan>  Match it to the size chart, equal or just above.</text>
</g>
<text x="430" y="515" font-size="21" fill="{M}">Measure in the evening, when feet are at their largest.</text>
</svg>'''
page('measure-foot','Sizing at home','How to measure your foot size',svg)

# G3 leather layers
layers=[('Grain layer','Full grain keeps it intact; top grain is lightly sanded',B,90),('Corium (fibrous layer)','Split off to make suede and split leather',"#C9A27A",150),('Flesh side','Inner surface of the hide',T,70)]
y=10;g=''
for name,desc,col,h in layers:
    g+=f'<rect x="0" y="{y}" width="760" height="{h}" fill="{col}" stroke="{E}" stroke-width="2"/><text x="800" y="{y+h/2-6}" font-size="27" font-weight="700" fill="{E}">{name}</text><text x="800" y="{y+h/2+26}" font-size="22" fill="{M}">{desc}</text>'
    y+=h
svg=f'<svg width="1440" height="520" viewBox="0 0 1440 520" font-family="DejaVu Sans"><g transform="translate(0 40)">{g}</g><text x="0" y="440" font-size="22" fill="{M}">Simplified cross section of a cattle hide. Real thickness and layer depth vary by animal and tannery.</text></svg>'
page('leather-layers','Leather knowledge','Where the leather grades come from',svg)

# G4 construction
def panel(x,title,sub,stitch):
    s=f'<g transform="translate({x} 0)"><text x="0" y="30" font-size="30" font-weight="700" fill="{E}">{title}</text><text x="0" y="66" font-size="21" fill="{M}">{sub}</text>'
    s+=f'<rect x="20" y="130" width="380" height="34" fill="{T}" stroke="{E}" stroke-width="2"/><text x="210" y="153" text-anchor="middle" font-size="17" fill="{E}">upper</text>'
    s+=f'<rect x="20" y="164" width="380" height="24" fill="#E8DCCB" stroke="{E}" stroke-width="2"/><text x="210" y="181" text-anchor="middle" font-size="15" fill="{E}">insole</text>'
    if stitch=='welt':
        s+=f'<rect x="0" y="188" width="420" height="12" fill="{B}" stroke="{E}" stroke-width="2"/><text x="210" y="122" text-anchor="middle" font-size="16" fill="{M}">brass strip = welt</text>'
        s+=f'<rect x="0" y="200" width="420" height="40" fill="{E}"/><text x="210" y="230" text-anchor="middle" font-size="17" fill="{C}">outsole</text>'
        s+=''.join(f'<line x1="{x0}" y1="186" x2="{x0}" y2="246" stroke="{B}" stroke-width="3" stroke-dasharray="6 4"/>' for x0 in (8,412))
        s+=f'<text x="0" y="300" font-size="20" fill="{E}">Upper, insole and welt stitched together,</text><text x="0" y="328" font-size="20" fill="{E}">then the outsole is stitched to the welt.</text>'
    else:
        s+=f'<rect x="20" y="188" width="380" height="44" fill="{E}"/><text x="210" y="216" text-anchor="middle" font-size="17" fill="{C}">outsole</text>'
        if stitch=='blake':
            s+=''.join(f'<line x1="{x0}" y1="160" x2="{x0}" y2="236" stroke="{B}" stroke-width="3" stroke-dasharray="6 4"/>' for x0 in (60,360))
            s+=f'<text x="0" y="300" font-size="20" fill="{E}">Stitched straight through insole and</text><text x="0" y="328" font-size="20" fill="{E}">outsole. Slim and flexible.</text>'
        else:
            s+=f'<rect x="20" y="184" width="380" height="6" fill="{B}"/>'
            s+=f'<text x="0" y="300" font-size="20" fill="{E}">Outsole bonded with adhesive (brass line).</text><text x="0" y="328" font-size="20" fill="{E}">Light, flexible and affordable.</text>'
    return s+'</g>'
svg=f'<svg width="1440" height="420" viewBox="0 0 1440 420" font-family="DejaVu Sans">{panel(0,"Cemented","Glued sole","cement")}{panel(500,"Blake stitched","Stitched through","blake")}{panel(1000,"Goodyear welt","Stitched to a welt","welt")}<text x="0" y="400" font-size="20" fill="{M}">Simplified cross sections. Dashed brass lines show stitching.</text></svg>'
page('shoe-construction','Shoe construction','Cemented, Blake stitched and Goodyear welted',svg)

# G5 oxford vs derby
def shoe(x,label,closed):
    s=f'<g transform="translate({x} 0)"><text x="0" y="30" font-size="34" font-weight="700" fill="{E}">{label}</text>'
    s+=f'<path d="M20,330 C20,250 60,200 140,190 L330,170 C420,160 520,200 600,260 C640,290 650,330 620,345 L40,345 C25,345 20,340 20,330 Z" fill="{T}" stroke="{E}" stroke-width="3"/>'
    s+=f'<rect x="15" y="345" width="625" height="22" rx="6" fill="{E}"/>'
    if closed:
        s+=f'<path d="M190,190 L360,172 C380,215 370,262 330,290 L230,300 C205,265 195,225 190,190 Z" fill="#C9A27A" stroke="{E}" stroke-width="3"/>'
        s+=f'<path d="M190,190 C260,250 300,280 330,290" fill="none" stroke="{B}" stroke-width="4" stroke-dasharray="7 5"/>'
        s+=''.join(f'<circle cx="{220+i*30}" cy="{215+i*14}" r="5" fill="{E}"/>' for i in range(4))
        s+=f'<text x="0" y="420" font-size="22" fill="{E}">Closed lacing: eyelet panels stitched</text><text x="0" y="450" font-size="22" fill="{E}">under the vamp. Sleeker, more formal.</text>'
    else:
        s+=f'<path d="M150,195 L330,172 L360,180 C380,230 370,272 330,300 L200,312 C170,280 155,240 150,195 Z" fill="#C9A27A" stroke="{E}" stroke-width="3"/>'
        s+=f'<path d="M330,300 L400,300" stroke="{B}" stroke-width="4" stroke-dasharray="7 5"/>'
        s+=''.join(f'<circle cx="{200+i*30}" cy="{215+i*14}" r="5" fill="{E}"/>' for i in range(4))
        s+=f'<text x="0" y="420" font-size="22" fill="{E}">Open lacing: eyelet panels sewn on top</text><text x="0" y="450" font-size="22" fill="{E}">of the vamp. Roomier at the instep.</text>'
    return s+'</g>'
svg=f'<svg width="1440" height="480" viewBox="0 0 1440 480" font-family="DejaVu Sans">{shoe(0,"Oxford",True)}{shoe(760,"Derby",False)}</svg>'
page('oxford-vs-derby','Shoe styles','Oxford vs derby: the lacing tells you',svg)

# G6 fit check
items=[('Toe room','About a thumb width, 1 to 1.5 cm, in front of the longest toe.'),('Heel','Held firmly. Slight lift in new leather is normal.'),('Width','Snug at the ball of the foot, never pinching.'),('Flex point','The shoe bends where your foot bends.'),('Instep','Laces close without strain or a big gap.')]
li=''.join(f'<div class="it"><span>{i+1:02d}</span><div><b>{a}</b><p>{b}</p></div></div>' for i,(a,b) in enumerate(items))
page('fit-check','Fit check','Five signs a shoe fits properly',f'<div class="g">{li}</div>','.g{display:grid;grid-template-columns:1fr 1fr;gap:26px 60px}.it{display:flex;gap:22px;align-items:flex-start;border-top:3px solid #2A1C14;padding-top:16px}.it span{font:700 24px "DejaVu Sans Mono",monospace;color:#B0843F}.it b{font-size:30px}.it p{font-size:23px;line-height:1.4;color:#4A3A2E;margin-top:6px}')
