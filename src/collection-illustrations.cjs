// Build-time vector artwork. Shares the original collection's portrait proportions.
// Decorative textile details are illustrations, not verified historical patterns.
const { renderOutfitScene } = require('../ai-studio-app/styling.cjs');
const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color = '#475747', opacity = '.25', width = 1.5) => p(d, 'none', `stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const rect = (x,y,w,h,fill,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const repeat = (n,fn) => Array.from({length:n},(_,i)=>fn(i)).join('');
function replaceLayer(svg, name, replacement) {
  const start = svg.indexOf(`<g data-layer="${name}"`);
  if (start < 0) throw new Error('Missing illustration layer: '+name);
  const tags = /<g\b[^>]*>|<\/g>/g; tags.lastIndex = start;
  let depth = 0, tag;
  while ((tag = tags.exec(svg))) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (!depth) return svg.slice(0,start)+replacement+svg.slice(tags.lastIndex);
  }
  throw new Error('Unbalanced illustration layer');
}
function textileBand(x,y,w,base,accent) {
  return `<g data-detail="woven-border">${rect(x,y,w,14,base)}${line(`M${x} ${y+2}h${w}M${x} ${y+12}h${w}`,accent,'.85',1)}${repeat(Math.floor(w/12),i=>p(`M${x+6+i*12} ${y+4}l4 3-4 3-4-3Z`,accent))}</g>`;
}
function flower(x,y,color) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width=".9" opacity=".65">${repeat(6,i=>`<ellipse cx="0" cy="-5" rx="2.7" ry="5" transform="rotate(${i*60})"/>`)}${circle(0,0,2,color)}</g>`;
}
function clothes(index, main, secondary, accent, id) {
  const fabric = `url(#${id}-silk)`;
  const sleeves = p('M218 176L195 185Q181 192 177 213L158 282L161 325H186L190 283L212 221Z',fabric)+p('M262 176L285 185Q299 192 303 213L322 282L319 325H294L290 283L268 221Z',fabric);
  const longBody = p('M218 174L195 185L201 269L187 462Q239 479 293 462L279 269L285 185L262 174Z',fabric);
  const shortBody = p('M218 174L200 184L207 252L202 303Q240 313 278 303L273 252L280 184L262 174Z',fabric);
  const collar = p('M221 174V187Q240 195 259 187V174L254 169H226Z',main)+line('M222 175V187Q240 195 258 187',secondary,'.8',2);
  const folds = line('M190 210L171 281M290 210L309 281M211 268L199 451M269 268L282 451M231 317L226 459M251 318L258 460')+line('M207 202L209 244M207 290L196 438M275 288L286 438','#FFFFFF','.16',4);
  const skirt = p('M213 295H267L291 492Q240 504 189 492Z',secondary)+line('M219 321L202 489M230 323L223 496M251 324L257 495M262 321L278 489','#172C30','.32',2);
  const pearls = repeat(5,i=>circle(253+(i?19:0),191+i*20,2.4,accent));
  let lower = '', garment = '', headwear = '';
  if (index===6 || index===7) {
    lower=skirt;
    garment=sleeves+longBody+folds;
    garment+=p('M215 174H225V230Q240 239 255 230V174H265V241Q240 251 215 241Z',accent)+line('M219 179V236Q240 246 261 236V179',secondary,'.9',2);
    garment+=p('M225 176Q240 184 255 176V229Q240 237 225 229Z',secondary);
    for (const x of [161,294]) {
      garment+=repeat(5,i=>rect(x,299+i*4,25,4,['#AB5054','#CCAC61','#708B7C','#E9DCC8','#3B4051'][i]));
    }
    garment+=repeat(3,r=>repeat(3,c=>flower(215+c*25,277+r*56,accent)))+textileBand(193,443,94,main,accent);
    headwear=p('M210 120Q210 93 240 96Q270 93 270 120L263 126Q240 118 217 126Z','#3B3441')+line('M214 109Q241 99 266 110',accent,'.8',2)+circle(262,108,3,accent)+line('M260 105L274 99',accent,'1',2);
  } else if (index===8 || index===9) {
    garment=sleeves+longBody+folds;
    garment+=p('M218 174L244 217L265 266L253 275L228 225L211 179Z',secondary)+p('M262 174L212 259L218 276L273 184Z',accent);
    garment+=line('M219 178L260 268M262 179L215 267',main,'.5',1.5);
    garment+=p('M203 281Q240 289 277 281V294Q240 302 203 294Z',accent)+p('M234 295L227 406L238 400L244 299L255 389L266 398L254 295Z',accent);
    garment+=line('M192 450Q240 465 287 450',secondary,'.5',2);
    headwear=p('M211 120Q210 97 240 98Q269 97 269 120L262 125Q240 118 218 125Z','#3F3D36')+line('M218 109Q240 104 262 110','#7E7765','.7',2);
  } else if (index===10 || index===11) {
    garment=sleeves+shortBody+line('M240 185V303M209 249L204 300M271 249L276 300M185 218L171 282M295 218L309 282');
    garment+=p('M218 174Q221 191 240 201Q260 191 262 174L253 172Q240 186 227 172Z',secondary)+repeat(5,i=>circle(241,208+i*18,2,accent));
    garment+=p('M207 267H226V286Q216 291 207 286ZM254 267H273V286Q263 291 254 286Z',main)+line('M207 267H226M254 267H273',accent,'.6',1.5);
    garment+=line('M164 316H186M295 316H318',secondary,'.5',3);
    if(index===10) garment+=p('M220 180L217 255L208 276L211 285L225 263L229 189Z',secondary)+repeat(7,i=>line(`M217 ${199+i*10}h10`,accent,'.65',1));
  } else if (index===12) {
    lower=p('M212 288H268Q284 363 323 466Q241 503 157 466Q196 363 212 288Z',secondary);
    lower+=repeat(13,i=>line(`M${215+i*4} 303Q${210+i*5} 382 ${166+i*12} ${470+Math.round(15*Math.sin(i/12*Math.PI))}`,i%2?'#56758A':'#102936','.55',2));
    lower+=p('M160 452Q240 483 320 452L324 467Q240 501 156 467Z',accent)+line('M161 448Q240 480 319 448','#D9BD79','.95',2)+repeat(17,i=>p(`M${166+i*9} ${461+Math.round(18*Math.sin(i/16*Math.PI))}l3 3-3 3-3-3Z`,'#E4C991'));
    garment=sleeves+shortBody+p('M217 178H229V272H217ZM251 178H263V272H251Z',accent)+textileBand(205,286,70,main,accent);
    garment+=repeat(6,i=>p(`M${221+(i%2)*34} ${195+Math.floor(i/2)*24}l5 6-5 6-5-6Z`,'#E5C58B'))+textileBand(162,302,24,accent,'#E4C991')+textileBand(294,302,24,accent,'#E4C991');
    garment+=line('M224 178Q240 209 256 178','#D9E1DA','1',3)+line('M220 178Q240 218 260 178','#E7EAE0','.8',2);
    headwear=p('M211 123Q208 102 220 98H260Q273 106 269 124Z',main)+textileBand(214,108,53,main,accent);
  } else if (index===13) {
    lower=skirt+textileBand(195,475,90,secondary,'#8B9586');
    garment=sleeves+shortBody+p('M220 174Q240 185 260 174L253 187Q240 195 227 187Z',secondary)+line('M240 191V300','#8A9B95','.6',1);
    garment+=repeat(6,i=>p(`M234 ${201+i*16}q-5-6-7-2t7 6q5-6 9-3t-9 5Z`,'#BBC4BA',`stroke="#73877E" stroke-width=".8"`));
    garment+=p('M205 291Q240 299 275 291V305Q240 314 205 305Z',accent)+line('M209 295Q240 302 271 295','#BAE0BA','.65',2);
    headwear=p('M211 121Q210 98 240 97Q270 99 270 122L264 129Q240 121 217 128Z','#303B36')+p('M260 110L274 122L272 187L258 180Z','#303B36')+textileBand(259,157,14,'#934449','#DBBC76')+repeat(4,i=>line(`M${260+i*3} 181v9`,'#C19A61','.8',1));
  } else if (index>=14 && index<=16) {
    lower=skirt;
    garment=sleeves+shortBody+line('M218 175Q240 196 262 175',accent,'1',3);
    if(index===14) {
      garment+=repeat(5,r=>repeat(5,c=>p(`M${211+c*12} ${202+r*16}l10 0v12h-10Z`,['#BA6654','#C6A34F','#739389','#A98088'][(r+c)%4])+p(`M${213+c*12} ${204+r*16}l6 0-6 8Z`,'#E0C795')));
      garment+=textileBand(205,291,70,accent,'#DDC788')+textileBand(162,299,24,accent,'#DDC788')+textileBand(294,299,24,accent,'#DDC788');
      lower+=textileBand(197,457,86,accent,'#D8C997')+textileBand(194,477,92,main,'#C0A162');
      headwear=p('M212 123Q209 101 240 96Q270 101 269 124Z',main)+textileBand(215,107,49,accent,'#DBC996');
    } else {
      garment+=textileBand(209,211,62,accent,'#D6BB75')+textileBand(204,290,72,accent,'#D6BB75')+textileBand(162,301,24,accent,'#D6BB75')+textileBand(294,301,24,accent,'#D6BB75');
      lower+=textileBand(203,339,74,accent,'#D4B875')+textileBand(196,460,88,accent,'#D4B875')+line('M258 307L274 489',accent,'.8',2);
      if(index===16) garment+=repeat(5,i=>line(`M${216+i*12} 239v31`,accent,'.8',2));
    }
  } else if(index===17) {
    garment=p('M218 175L190 185Q167 199 156 228L136 306L153 341L183 328L194 282L211 225Z',fabric)+p('M262 175L290 185Q313 199 324 228L344 306L327 341L297 328L286 282L269 225Z',fabric)+longBody+collar+folds+pearls;
    garment+=line('M143 309L179 319M300 319L337 309M192 449Q240 461 288 449',secondary,'.65',2)+line('M250 187Q256 207 273 212L276 320',accent,'.65',1.5);
    headwear=p('M211 122Q207 96 240 98Q273 95 269 122L261 126Q240 118 219 126Z',main)+line('M216 109Q240 103 265 110',secondary,'.6',2);
  }
  return { garment:`<g data-layer="garment" data-construction="collection-${index}">${garment}</g>`, lower, headwear };
}
function arch(x,y,w,h,color) { return p(`M${x} ${y+h}V${y+w/2}a${w/2} ${w/2} 0 0 1 ${w} 0v${h-w/2}Z`,color)+line(`M${x+w/2} ${y+6}v${h-6}M${x+3} ${y+h/2}h${w-6}`,'#D4CEB6','.8',1.5); }
function roof(x,y,w,color) { return p(`M${x-18} ${y+20}Q${x+12} ${y+18} ${x+25} ${y-3}H${x+w-25}Q${x+w-12} ${y+18} ${x+w+18} ${y+20}Z`,color)+line(`M${x-5} ${y+14}H${x+w+5}M${x+5} ${y+8}H${x+w-5}`,'#E2CCAF','.65',1.5)+repeat(Math.floor(w/15),i=>line(`M${x+15+i*15} ${y+1}l-4 16`,'#806451','.4',1)); }
function tree(x,y,scale=1,palm=false) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${line('M0 10Q-8-45 0-112','#8F8869','1',7)}${palm?repeat(5,i=>`<g transform="rotate(${i*35-70} 0 -108)">${p('M0-108Q-30-135-62-103Q-25-117 0-108Z','#7D9B7E')}</g>`):p('M0-124C-56-150-77-84-39-69C-77-43-46-4-14-26C12 1 53-19 32-55C74-85 44-141 0-124Z','#93AD8B')+p('M-6-119Q-50-125-45-86Q-24-108-6-119Z','#B1C3A0')}</g>`;
}
function background(index) {
  let bg=rect(0,0,480,560,['#EDE6E9','#EAF0E4','#ECEADF','#E4EEE7','#EEE8DC','#E6EFE7','#E2ECE6','#E7EFE2','#E8E9DD','#EDE9D9','#E6ECD8','#E5ECE4'][index-6])+circle(370,77,35,'#FFF2D0');
  if(index===6) {
    bg+=rect(20,230,440,150,'#D9B7A0')+rect(54,253,372,119,'#CF9A82')+rect(117,162,246,102,'#B98370')+roof(97,157,286,'#8D675A')+rect(149,122,182,41,'#B6876E')+roof(132,112,216,'#7A6656');
    bg+=repeat(5,i=>arch(71+i*76,296,40,76,'#7F8171'))+repeat(6,i=>rect(138+i*37,173,5,75,'#E6CAA3'))+line('M37 263H443M38 277H442','#E9D6B2','1',4)+rect(154,140,172,5,'#DEBC77');
    bg+=p('M0 386H480V560H0Z','#E8DFD0')+repeat(4,i=>line(`M0 ${413+i*44}H480`,'#C8C5B5','.6',1.2))+repeat(5,i=>line(`M${80+i*80} 386L${-100+i*170} 560`,'#C8C5B5','.6',1.2));
  } else if(index===7 || index===11) {
    bg+=p('M0 225Q120 190 255 216T480 211V560H0Z','#ABC4B4')+p('M0 287Q160 267 480 287V560H0Z','#BAD1CD');
    bg+=repeat(12,i=>line(`M${(i%3)*32} ${315+i*18}h${180+(i%4)*23}m90 0h100`,'#E8F1E7','.7',1.5));
    if(index===7) bg+=p('M40 260H440L424 272H54Z','#9A8B71')+line('M56 259Q103 196 149 259Q195 196 241 259Q287 196 333 259Q379 196 425 259','#879581','1',4)+repeat(13,i=>line(`M${61+i*30} 235v25`,'#8B9787','.8',2));
    else bg+=repeat(3,i=>`<g transform="translate(${25+i*164} ${305+i*24})">${p('M0 0Q45 14 100 0L82 24H19Z','#947D62')}${rect(20,-20,61,22,'#C6AE7B')}${p('M10-20L47-43L89-20Z','#758E77')}${line('M48-42V4','#D2C8A6','1',2)}</g>`)+tree(440,295,.9,true);
    bg+=p('M0 463Q110 424 227 458T480 460V560H0Z','#D1DAC4')+tree(26,407,1.35,index===11);
  } else if(index===8) {
    bg+=rect(38,255,404,112,'#BFAD92')+rect(156,172,168,99,'#B7A087')+roof(140,165,200,'#847A64')+rect(175,130,130,38,'#BCA68B')+roof(158,119,164,'#7D7462');
    bg+=arch(60,287,40,80,'#767D68')+arch(380,287,40,80,'#767D68')+arch(205,270,70,97,'#797B65')+repeat(5,i=>arch(174+i*28,191,17,37,'#6E7D6B'))+line('M38 266H442','#DED4B4','1',6);
    bg+=p('M0 379H480V560H0Z','#E0DBCB')+repeat(4,i=>line(`M0 ${406+i*45}H480`,'#BDBFAE','.5',1.5))+tree(18,378,.9);
  } else if(index===9 || index===10) {
    bg+=rect(27,171,426,203,index===9?'#DBC99E':'#DEC78E')+roof(13,149,454,index===9?'#8C7C61':'#B48F6A');
    bg+=repeat(6,i=>arch(48+i*65,205,34,70,'#829681'))+repeat(6,i=>arch(48+i*65,300,34,74,'#84907A'))+line('M26 288H454','#F3E5BF','1',9)+repeat(7,i=>rect(32+i*65,186,7,188,'#EADDB8'));
    if(index===10) bg+=circle(241,182,18,'#F5EDCD', 'stroke="#A88C62" stroke-width="2"')+line('M241 170V182L249 188','#7A8066','1',2);
    else bg+=line('M0 189Q240 234 480 179','#9D997C','.8',1.5)+repeat(4,i=>`<g>${line(`M${56+i*118} 199v14`)}<ellipse cx="${56+i*118}" cy="225" rx="10" ry="14" fill="#BA8E6E"/>${line(`M${56+i*118} 213v24`,'#F0CF9B','.9',1)}</g>`);
    bg+=p('M0 385H480V560H0Z','#E1DDCE')+repeat(4,i=>line(`M0 ${419+i*43}H480`,'#C6C6B8','.7',1))+tree(451,380,.85);
  } else if(index>=12 && index<=14) {
    bg+=p('M0 242L74 161L135 209L226 118L303 222L389 147L480 213V430H0Z','#A6BCAF')+p('M0 299L97 215L173 277L295 187L374 267L480 216V462H0Z','#8AA99C');
    bg+=line('M48 188L74 161L92 184M199 150L226 118L256 156M366 176L389 147L412 170','#DAE0CB','.7',3);
    bg+=p('M0 353Q130 282 259 340T480 317V560H0Z',index===14?'#B7BBA0':'#AFC29C')+p('M0 440Q127 363 265 408T480 390V560H0Z','#CDD3AF');
    if(index===12 || index===13) bg+=repeat(7,i=>line(`M-20 ${344+i*27}Q100 ${296+i*28} 211 ${338+i*27}T500 ${322+i*29}`,index===13?'#8CA771':'#859E79','.9',3));
    if(index===12) bg+=rect(31,326,101,61,'#B99E78')+roof(20,310,122,'#7A7B65')+rect(46,343,17,28,'#717E6A')+rect(94,343,18,28,'#717E6A')+line('M42 386v22M119 386v22','#8F8869','1',4);
    if(index===14) bg+=repeat(9,i=>p(`M${i*62-20} ${340+i%3*13}l18-53 19 12 15 58Z`,'#84958A'))+repeat(16,i=>`<g>${line(`M${20+i*29} 550v-${18+i%4*7}`,'#8FA17F','.9',1.3)}${circle(20+i*29,531-i%4*7,3,'#CDA4A2')}${circle(23+i*29,533-i%4*7,2,'#E9C5B7')}</g>`);
    bg+=p('M214 380Q250 450 155 560H299Q273 458 245 384Z','#DFD8BD');
  } else {
    bg+=p('M0 268Q100 223 240 259T480 244V560H0Z','#A7B69A')+p('M0 378Q160 338 480 366V560H0Z','#C0CCAE');
    const tall=index===16;
    bg+=p(tall?'M48 280L117 120L181 280Z':'M27 258L80 211H373L433 258Z',tall?'#9C9272':'#8B8068');
    bg+=rect(tall?58:53,tall?278:259,tall?116:350,78,'#AB9874')+repeat(tall?5:12,i=>line(`M${(tall?62:57)+i*28} ${tall?284:265}v65`,'#7D8064','.55',2))+repeat(tall?4:9,i=>line(`M${(tall?70:66)+i*37} 336v40`,'#8C8268','1',5));
    bg+=line(tall?'M119 337L152 394M105 337L138 394':'M322 337L352 392M309 337L339 392','#8F8265','1',3)+repeat(6,i=>line(`M${(tall?108:312)+i*5} ${345+i*8}h14`,'#A18F6A','1',2));
    if(index===17) bg+=roof(54,205,372,'#897D67')+repeat(5,i=>arch(70+i*71,275,39,62,'#737E65'));
    bg+=p('M0 432Q220 386 480 423V560H0Z','#DBD3B6')+tree(455,365,1.4)+tree(10,346,1.05);
  }
  bg+=repeat(6,i=>`<g>${line(`M${17+i*86} 557q-7-18-12-20m12 20q3-24 10-27`,'#8C9E7C','.75',1.5)}${p(`M${13+i*86} 550q-14-12-14-3q8 6 14 3Z`,'#A7B48C')}</g>`);
  return `<g data-layer="background" data-scene="collection-${index}">${bg}</g>`;
}
const palettes = [
  ['#866888','#F1E9D8','#CEAA6A'], ['#BD9C52','#F4EDD9','#8E5964'],
  ['#875052','#EAD9B8','#D2AE70'], ['#487266','#E7E6D1','#AABB9B'],
  ['#9B7655','#E0D8C1','#DFC796'], ['#79A48D','#EFE6CC','#D8BB7D'],
  ['#344D58','#243B49','#AE5B59'], ['#EEEADD','#303E3E','#5E947F'],
  ['#344344','#37423F','#A95E4F'], ['#353E3E','#303C3C','#A85C50'],
  ['#374A47','#33433F','#C29466'], ['#518279','#EEE8D7','#C8AB6D'],
];
function renderCollectionIllustration(index, preset) {
  const [main,secondary,accent] = palettes[index-6];
  const id = 'heritage-collection-'+index;
  const avatar = [6,7,9,11,12,13,14,15,16].includes(index) ? 'Tóc dài' : 'Tóc ngắn';
  let svg = renderOutfitScene({ garment:'Áo ngũ thân', background:'Sân vườn', avatar, accessory:preset['Phụ kiện yêu thích'], colors:[main,secondary,accent], sceneId:id });
  svg=svg.replace(/data-garment="[^"]*"/,`data-garment="${index===17?'Áo tấc':preset['Loại trang phục']}"`).replace(/data-background="[^"]*"/,`data-background="${preset['Bối cảnh']}"`);
  svg=svg.replace(/<title[^>]*>[^<]*<\/title>/,`<title id="vpr-${id}-title">Minh họa ${index===17?'Áo tấc':preset['Loại trang phục']} · ${preset['Bối cảnh']}</title>`);
  const garment=clothes(index,main,secondary,accent,id);
  svg=replaceLayer(svg,'background',background(index));
  svg=replaceLayer(svg,'garment',garment.garment);
  if(garment.lower) svg=replaceLayer(svg,'trousers',`<g data-layer="skirt">${garment.lower}</g>`);
  if(garment.headwear) svg=replaceLayer(svg,'hair-front',`<g data-layer="hair-front">${garment.headwear}</g>`);
  svg=svg.replace('</defs>',`<linearGradient id="${id}-silk" x1="0" y1="0" x2="1" y2=".2"><stop offset="0" stop-color="${secondary}" stop-opacity=".8"/><stop offset=".18" stop-color="${main}"/><stop offset=".66" stop-color="${main}"/><stop offset="1" stop-color="${main}" stop-opacity=".85"/></linearGradient></defs>`);
  return svg;
}
module.exports={renderCollectionIllustration};
