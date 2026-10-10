"""Keep only map geometry and movement controls in the standalone preview in sync."""
from pathlib import Path
import re
root=Path(__file__).parent
source=(root/'ai-studio-app/public/map.js').read_text(encoding='utf-8')
p=root/'Xem-truoc-ghep-trang-phuc.html'
target=p.read_text(encoding='utf-8')
target=target.replace('viewBox="-65 5 610 770"','viewBox="-90 -65 700 930"')
constants=re.search(r'let NATIONAL_VIEWBOX = .*?;\s*const MAP_BOUNDS = .*?;',source,re.S).group()
target=re.sub(r'(?:let|const) NATIONAL_VIEWBOX = .*?;\s*const MAP_BOUNDS = .*?;',lambda _:constants,target,flags=re.S)
def function_span(text,name):
    start=text.index('function '+name+'(')
    brace=text.index('{',start)
    depth=1; end=brace+1
    while depth:
        if text[end]=='{': depth+=1
        elif text[end]=='}': depth-=1
        end+=1
    return start,end
for name in ['getNationalBox','isAtOverview','updatePanState','animateViewBox','clampBox','applyViewBox','zoomAtPoint']:
    a,b=function_span(source,name)
    if 'function '+name+'(' in target:
        x,y=function_span(target,name);target=target[:x]+source[a:b]+target[y:]
    else:
        target=target.replace('let NATIONAL_VIEWBOX =',source[a:b]+'\n    let NATIONAL_VIEWBOX =',1)
start='// Refit the full-screen camera on resize'
a=source.index(start);b=source.index('function clampBox(',a)
if start in target:
    x=target.index(start);y=target.index('function clampBox(',x);target=target[:x]+source[a:b]+target[y:]
else:
    target=target.replace('function clampBox(',source[a:b]+'function clampBox(',1)
if '<rect x="-2200" y="-2200"' not in target:
    target=target.replace('<!-- Maritime Navigation Grid & Atmosphere -->','<rect x="-2200" y="-2200" width="4900" height="4900" fill="#F4F0E5" pointer-events="none"/>\n<!-- Maritime Navigation Grid & Atmosphere -->')
target=target.replace('</style>','.vietnam-interactive-svg { width:100% !important; height:100% !important; max-width:none !important; max-height:none !important; }\n.svg-map-container.is-pan-locked { cursor:default; }\n</style>',1) if '.svg-map-container.is-pan-locked' not in target else target
a=source.index('let isPointerDown = false;');b=source.index('// Con lăn chuột:',a)
x=target.index('let isPointerDown = false;');y=target.index('// Con lăn chuột:',x)
# The preview wraps its pointer and wheel listeners in a null guard.
target=target[:x]+source[a:b]+'if (mapContainer) {\n'+target[y:]
p.write_text(target,encoding='utf-8')
print('Standalone preview map controls synced.')
