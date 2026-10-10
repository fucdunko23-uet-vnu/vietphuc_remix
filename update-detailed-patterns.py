from pathlib import Path
from urllib.parse import quote
import re
woven='''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="48" viewBox="0 0 96 48"><g fill="none" stroke="#D8B56A" stroke-width=".75" stroke-linejoin="round"><path d="M-24 24 0 4 24 24 48 4 72 24 96 4 120 24M-24 24 0 44 24 24 48 44 72 24 96 44 120 24M0 4 24 24 48 4 72 24 96 4M0 44 24 24 48 44 72 24 96 44"/><path d="M0 0H96M0 48H96M0 7H6V2H12V7H18V2H24V7H30V2H36V7H42V2H48V7H54V2H60V7H66V2H72V7H78V2H84V7H90V2H96M0 41H6V46H12V41H18V46H24V41H30V46H36V41H42V46H48V41H54V46H60V41H66V46H72V41H78V46H84V41H90V46H96" opacity=".7"/><path d="m24 10 15 14-15 14L9 24Zm48 0 15 14-15 14-15-14Z"/><g id="flower"><path d="M24 14Q31 19 24 24Q17 19 24 14ZM34 24Q29 31 24 24Q29 17 34 24ZM24 34Q17 29 24 24Q31 29 24 34ZM14 24Q19 17 24 24Q19 31 14 24Z"/><circle cx="24" cy="24" r="3"/><path d="m24 18 6 6-6 6-6-6Z"/></g><use href="#flower" x="48"/><path d="M0 17q8 0 8 7t-8 7M48 17q8 0 8 7t-8 7q-8 0-8-7t8-7M96 17q-8 0-8 7t8 7"/><path d="m0 21 3 3-3 3-3-3Zm48 0 3 3-3 3-3-3Zm48 0 3 3-3 3-3-3Z"/></g></svg>'''
clouds='''<svg xmlns="http://www.w3.org/2000/svg" width="100" height="48" viewBox="0 0 100 48"><g fill="none" stroke="#FFF" stroke-width=".85" stroke-linecap="round"><path d="M3 29C-1 21 5 15 12 18C12 9 22 6 28 12C34 5 44 9 44 16C53 13 59 20 55 27C65 26 66 34 59 37H9C2 37-1 32 3 29Z"/><path d="M9 29C7 24 13 21 17 25C17 17 25 16 28 21C32 16 39 18 39 24C47 21 50 29 45 31H17M22 28q7-9 14 0M8 40H58M18 43H48"/><path d="M53 10C49 3 57-1 62 3C66-3 74-2 76 5C83 1 90 6 88 12C97 9 103 17 97 21H60C53 21 49 16 53 10ZM61 14q-3-7 5-6q4-7 9 0q8-3 9 5M61 24H96"/><path d="M68 40q-8-8 0-14q8 6 0 14Zm0-10q10-9 16 0q-6 9-16 0ZM84 30q8-9 14 0q-6 9-14 0Z"/><circle cx="68" cy="30" r="2"/></g></svg>'''
def update(file,selector,svg,size):
 p=Path(file);s=p.read_text(encoding='utf-8');a=s.index(selector+' {');b=s.index('\n}',a);chunk=s[a:b]
 uri='url("data:image/svg+xml,'+quote(svg,safe='')+'")'
 chunk=re.sub(r'background-image: url\([^\n]+\);',lambda m:'background-image: '+uri+';',chunk,count=1)
 chunk=re.sub(r'background-size: [^;]+;', 'background-size: '+size+';',chunk,count=1)
 s=s[:a]+chunk+s[b:];p.write_text(s,encoding='utf-8')
update('ai-studio-app/public/site.css','.button-weave-texture',woven,'96px 48px')
update('ai-studio-app/public/style.css','.btn-reveal-pattern',clouds,'100px 48px')
print('Updated woven rosettes and cloud filigree; navbar map keeps its white tint.')
