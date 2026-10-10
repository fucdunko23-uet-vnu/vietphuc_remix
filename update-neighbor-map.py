"""Build a local SVG context layer from Natural Earth 1:50m (public domain)."""
import json, pathlib, re
root = pathlib.Path(__file__).parent
data = json.loads((root/'output/ne_50m_admin_0_countries.geojson').read_text(encoding='utf-8'))
features = {f['properties']['ADM0_A3']: f for f in data['features']}
def polygons(code):
    g = features[code]['geometry']
    return g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
def area(ring):
    return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:])))
mainland=max(polygons('VNM'),key=lambda p:area(p[0]))[0]
west,east=min(p[0] for p in mainland),max(p[0] for p in mainland)
south,north=min(p[1] for p in mainland),max(p[1] for p in mainland)
def project(p):
    return ((p[0]-west)*380.51/(east-west),(north-p[1])*800/(north-south))
def clipped(points):
    # Clip offline, so distant geometry never costs browser parsing or painting.
    for axis,edge,sign in [(0,-2200,1),(0,2700,-1),(1,-2200,1),(1,2700,-1)]:
        result=[]
        for a,b in zip(points,points[1:]+points[:1]):
            inside_a=(a[axis]-edge)*sign>=0
            inside_b=(b[axis]-edge)*sign>=0
            if inside_a: result.append(a)
            if inside_a!=inside_b:
                t=(edge-a[axis])/(b[axis]-a[axis])
                result.append((a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])))
        points=result
        if not points: break
    return points
def path_for(poly):
    parts=[]
    for ring in poly:
        points=clipped([project(p) for p in ring])
        if len(points)>2:
            parts.append('M'+' L'.join(f'{x:.2f},{y:.2f}' for x,y in points)+' Z')
    return ' '.join(parts)
def outline_for(poly):
    parts=[]; last=None
    for ring in poly:
        points=[project(p) for p in ring]
        for a,b in zip(points,points[1:]):
            low,high=0,1
            for axis,mn,mx in [(0,-2200,2700),(1,-2200,2700)]:
                delta=b[axis]-a[axis]
                if delta==0:
                    if not mn<=a[axis]<=mx: high=-1
                else:
                    t1,t2=sorted(((mn-a[axis])/delta,(mx-a[axis])/delta))
                    low=max(low,t1);high=min(high,t2)
            if low>high: last=None;continue
            first=tuple(a[i]+low*(b[i]-a[i]) for i in [0,1])
            end=tuple(a[i]+high*(b[i]-a[i]) for i in [0,1])
            if first!=last: parts.append(f'M{first[0]:.2f},{first[1]:.2f}')
            parts.append(f'L{end[0]:.2f},{end[1]:.2f}');last=end
    return ' '.join(parts)
items=['<g id="neighbor-countries-group" opacity="0.82" aria-label="Các nước xung quanh — đường nét khái quát Natural Earth">',
       '<!-- Natural Earth 1:50m, public domain. Geographic context, not a legal boundary map. -->']
for code,name,label,lon,lat,fill in [
    ('CHN','china','TRUNG QUỐC',106.5,24.1,'#EDE8DC'),
    ('LAO','laos','LÀO',102.8,18.3,'#EAE4D6'),
    ('KHM','cambodia','CAMPUCHIA',104.5,12.6,'#EDE7DB'),
    ('THA','thailand','THÁI LAN',100.9,16.3,'#E8E2D4'),
    ('MMR','myanmar','MYANMAR',96.3,21.0,'#E8E2D4'),
    ('MYS','malaysia','MALAYSIA',102.0,4.5,'#EAE4D6'),
    ('IDN','indonesia','INDONESIA',112.0,-1.5,'#EDE8DC'),
    ('PHL','philippines','PHILIPPINES',122.0,12.0,'#EAE4D6'),
    ('BRN','brunei','BRUNEI',114.6,4.8,'#E8E2D4'),
    ('BGD','bangladesh','BANGLADESH',90.3,24.0,'#EAE4D6'),
    ('IND','india','ẤN ĐỘ',86.0,24.5,'#EDE8DC'),
    ('TWN','taiwan','ĐÀI LOAN',121.0,23.8,'#EAE4D6')]:
    paths=[]; outlines=[]
    hainan=[]
    for poly in polygons(code):
        d=path_for(poly)
        if not d: continue
        xs=[p[0] for p in poly[0]];ys=[p[1] for p in poly[0]]
        if code=='CHN' and min(xs)>108 and max(xs)<112 and min(ys)>17 and max(ys)<21:
            hainan.append(d)
        else:
            paths.append(d)
            outlines.append(outline_for(poly))
    x,y=project((lon,lat))
    items.append(f'<g id="neighbor-{name}"><path d="{" ".join(paths)}" fill="{fill}" fill-rule="evenodd"/><path d="{" ".join(outlines)}" fill="none" stroke="#BDB3A3" stroke-width="0.9" stroke-linejoin="round"/><text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" font-size="11" font-family="Georgia,serif" fill="#938775" letter-spacing="2">{label}</text></g>')
    if hainan:
        x,y=project((109.8,19.2))
        items.append(f'<g id="neighbor-hainam"><path d="{" ".join(hainan)}" fill="{fill}" stroke="#BDB3A3" stroke-width="0.9"/><text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" font-size="7" fill="#938775">HẢI NAM</text></g>')
items.append('</g>')
layer='\n'.join(items)
for name in ['ai-studio-app/public/map.js','Xem-truoc-ghep-trang-phuc.html']:
    p=root/name
    text=p.read_text(encoding='utf-8')
    updated,count=re.subn(r'<g id="neighbor-countries-group".*?(?=\s*<!-- 2\. HISTORIC RIVERWAYS)',lambda _:layer+'\n',text,flags=re.S)
    assert count==1,name
    p.write_text(updated,encoding='utf-8')
print('Updated neighboring countries in local app and standalone preview.')
