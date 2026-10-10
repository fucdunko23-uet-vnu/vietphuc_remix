// Original styling illustrations; these are not historical reconstructions.
// Kept dependency-free so this file can be prepended to an n8n Code node.
function vprSvgEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function vprSvgColor(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function vprSvgBackground(background, id) {
  const window = function (x, y, width, height) {
    return '<g><rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="3" fill="#789390"/>' +
      '<path d="M' + (x + width / 2) + ' ' + y + 'v' + height + 'M' + x + ' ' + (y + height / 2) + 'h' + width + '" stroke="#DFDAC9" stroke-width="3"/></g>';
  };
  if (background === 'Sân trường') {
    return '<g data-layer="background"><rect width="480" height="560" fill="#E6EFE9"/>' +
      '<circle cx="382" cy="75" r="34" fill="#FFF4CE"/>' +
      '<path d="M0 293Q124 277 251 293T480 282V560H0Z" fill="#D5DECD"/>' +
      '<path d="M26 140H454V347H26Z" fill="#EADBB4"/>' +
      '<path d="M17 140L38 120H442L464 140Z" fill="#B36C57"/>' +
      '<path d="M23 144H457M24 239H456M25 344H455" stroke="#F4E9CC" stroke-width="9"/>' +
      '<path d="M45 155V341M147 155V341M333 155V341M435 155V341" stroke="#F5EACE" stroke-width="12"/>' +
      window(68, 169, 49, 48) + window(169, 169, 43, 48) + window(270, 169, 43, 48) + window(362, 169, 49, 48) +
      window(68, 265, 49, 47) + window(362, 265, 49, 47) +
      '<rect x="207" y="261" width="66" height="83" rx="5" fill="#9EA99D"/>' +
      '<path d="M194 345H286L319 383H159Z" fill="#C6C8B2"/>' +
      '<path d="M0 397H480V560H0Z" fill="#E8E4D8"/>' +
      '<path d="M0 452H480M0 510H480M112 397L52 560M369 397L427 560" stroke="#D7D6C9" stroke-width="1.5"/>' +
      '<path d="M42 180Q46 260 42 383M42 241L14 213M43 225L69 194" fill="none" stroke="#879982" stroke-width="8" stroke-linecap="round"/>' +
      '<g fill="#91AC90"><ellipse cx="14" cy="178" rx="48" ry="39"/><ellipse cx="54" cy="142" rx="58" ry="48"/><ellipse cx="89" cy="189" rx="40" ry="34"/></g>' +
      '<g fill="#A8BDA0"><ellipse cx="18" cy="149" rx="36" ry="31"/><ellipse cx="67" cy="117" rx="33" ry="25"/></g>' +
      '<path d="M412 368H480V384H412Z" fill="#BFC7B2"/><path d="M428 384V401M468 384V401" stroke="#849783" stroke-width="5"/>' +
      '<ellipse cx="418" cy="420" rx="27" ry="5" fill="#D7DACA"/><path d="M409 414L418 405L427 414Z" fill="#BF8D65"/></g>';
  }
  if (background === 'Phố cổ') {
    return '<g data-layer="background"><rect width="480" height="560" fill="#E9ECE1"/>' +
      '<circle cx="371" cy="73" r="37" fill="#FFF5D6"/>' +
      '<path d="M0 174L109 151L137 365H0Z" fill="#E5C577"/><path d="M337 151L480 172V371H326Z" fill="#D5B66E"/>' +
      '<path d="M78 147H370V368H78Z" fill="#EDCF85"/>' +
      '<path d="M60 148L85 118H361L391 148Z" fill="#A26950"/>' +
      '<path d="M73 140H378M79 132H370M85 124H363" stroke="#C0916B" stroke-width="2"/>' +
      '<path d="M-15 174L3 150L87 133L85 153ZM368 153L366 135L481 152L498 176Z" fill="#956B55"/>' +
      '<g fill="#6A7D69"><rect x="105" y="173" width="54" height="74" rx="22"/><rect x="304" y="173" width="43" height="74" rx="20"/><rect x="8" y="218" width="36" height="81" rx="3"/><rect x="420" y="211" width="43" height="87" rx="3"/></g>' +
      '<path d="M132 177V245M325 177V245M11 231H42M11 245H42M11 259H42M422 229H461M422 246H461M422 263H461" stroke="#C3BA84" stroke-width="2"/>' +
      '<path d="M95 250H168V274H95ZM296 250H356V274H296Z" fill="#896F4C"/>' +
      '<path d="M104 254V269M119 254V269M134 254V269M149 254V269M307 254V269M322 254V269M337 254V269" stroke="#D6BF85" stroke-width="3"/>' +
      '<path d="M99 291H165V367H99ZM296 291H362V367H296Z" fill="#7C8168"/><path d="M132 295V365M329 295V365" stroke="#A1A183" stroke-width="2"/>' +
      '<path d="M0 379Q227 356 480 385V560H0Z" fill="#DED9C9"/>' +
      '<path d="M0 416Q240 396 480 419M0 464Q240 440 480 467M0 520Q240 493 480 524M115 375L48 560M359 378L430 560" fill="none" stroke="#CCCABB" stroke-width="1.5"/>' +
      '<path d="M0 185Q218 225 480 175" fill="none" stroke="#9B9C7B" stroke-width="1.5"/>' +
      '<g><path d="M69 196V210" stroke="#997950" stroke-width="2"/><ellipse cx="69" cy="225" rx="14" ry="18" fill="#C78669"/><path d="M69 208V242M60 212Q55 225 61 238M78 212Q83 225 77 238" fill="none" stroke="#E7B794" stroke-width="1.5"/><path d="M69 243V253" stroke="#B98161" stroke-width="3"/></g>' +
      '<g><path d="M394 194V211" stroke="#997950" stroke-width="2"/><ellipse cx="394" cy="225" rx="13" ry="17" fill="#BC9574"/><path d="M394 209V241M386 212Q381 225 387 237M402 212Q407 225 401 237" fill="none" stroke="#E6C49B" stroke-width="1.5"/><path d="M394 242V252" stroke="#B98161" stroke-width="3"/></g>' +
      '<path d="M391 363H424L420 396H395Z" fill="#AF9878"/><path d="M407 368V317M407 345Q378 337 383 321Q402 320 407 345M407 334Q429 319 434 305Q411 306 407 334" fill="#8EA780" stroke="#809779" stroke-width="3"/></g>';
  }
  return '<g data-layer="background"><rect width="480" height="560" fill="#E5EDE4"/>' +
    '<circle cx="355" cy="86" r="40" fill="#FFF5D7"/>' +
    '<path d="M0 287Q90 242 208 277T480 269V560H0Z" fill="#BACDB3"/>' +
    '<path d="M0 337Q115 299 252 330T480 314V560H0Z" fill="#CBD8BE"/>' +
    '<path d="M223 310H272Q272 389 342 434Q411 477 433 560H45Q96 447 185 411Q249 384 223 310Z" fill="#E8E2CF"/>' +
    '<path d="M57 213Q71 291 62 366M63 281L24 250M65 259L98 229" fill="none" stroke="#899880" stroke-width="9" stroke-linecap="round"/>' +
    '<g fill="#90AC8B"><ellipse cx="32" cy="193" rx="74" ry="59"/><ellipse cx="81" cy="154" rx="67" ry="65"/><ellipse cx="112" cy="219" rx="54" ry="48"/></g>' +
    '<g fill="#A6BE9A"><ellipse cx="31" cy="149" rx="54" ry="42"/><ellipse cx="90" cy="128" rx="42" ry="35"/></g>' +
    '<path d="M425 197Q409 281 418 349M418 257L451 226" fill="none" stroke="#97A183" stroke-width="8" stroke-linecap="round"/>' +
    '<g fill="#A1B894"><ellipse cx="413" cy="174" rx="63" ry="65"/><ellipse cx="471" cy="194" rx="60" ry="52"/></g>' +
    '<ellipse cx="389" cy="152" rx="37" ry="36" fill="#B6C8A5"/>' +
    '<path d="M345 354Q389 342 451 357L449 369Q389 355 347 366Z" fill="#AAAFA0"/><path d="M357 367V388M435 367V389" stroke="#919D8D" stroke-width="7"/>' +
    '<g fill="#8FAB87"><ellipse cx="34" cy="372" rx="42" ry="20"/><ellipse cx="81" cy="388" rx="29" ry="20"/><ellipse cx="468" cy="398" rx="48" ry="25"/></g>' +
    '<g stroke="#829D7D" stroke-width="2"><path d="M48 425V392M63 434V408M434 428V403M452 438V416"/></g>' +
    '<g fill="#D49B8D"><circle cx="48" cy="392" r="6"/><circle cx="63" cy="408" r="5"/><circle cx="434" cy="403" r="6"/><circle cx="452" cy="416" r="5"/></g>' +
    '<path d="M130 473L153 462L171 470L153 482ZM347 485L366 483L382 495L359 500ZM97 525L126 510L146 519L125 535Z" fill="#D1D0BC"/></g>';
}

function renderOutfitScene(options) {
  options = options || {};
  const garments = ['Áo dài', 'Áo ngũ thân', 'Áo tứ thân'];
  const backgrounds = ['Sân trường', 'Phố cổ', 'Sân vườn'];
  const accessories = ['Túi mini', 'Túi tote', 'Khăn lụa', 'Quạt giấy', 'Kẹp tóc', 'Không dùng phụ kiện'];
  const garment = garments.indexOf(options.garment) >= 0 ? options.garment : 'Áo dài';
  const background = backgrounds.indexOf(options.background) >= 0 ? options.background : 'Sân trường';
  const avatar = options.avatar === 'Tóc ngắn' ? 'Tóc ngắn' : 'Tóc dài';
  const accessory = accessories.indexOf(options.accessory) >= 0 ? options.accessory : 'Không dùng phụ kiện';
  const shoe = options.shoe === 'sneakers' ? 'sneakers' : 'flats';
  const suppliedColors = Array.isArray(options.colors) ? options.colors : [];
  const primary = vprSvgColor(suppliedColors[0], '#397C73');
  const secondary = vprSvgColor(suppliedColors[1], '#F2E7D5');
  const accent = vprSvgColor(suppliedColors[2], '#C98967');
  const id = 'vpr-' + String(options.sceneId || 'scene').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
  const skin = '#DBA681';
  const skinLight = '#E8B893';
  const hair = '#3E3933';
  const stroke = '#313D34';
  let clothing = '';

  if (garment === 'Áo dài') {
    clothing = '<g data-layer="garment">' +
      '<path d="M222 174L204 182Q190 185 184 205L167 280L169 324L185 324L190 282L210 222Z" fill="' + primary + '"/>' +
      '<path d="M258 174L276 182Q290 185 296 205L313 280L311 324L295 324L290 282L270 222Z" fill="' + primary + '"/>' +
      '<path d="M219 174Q240 185 261 174L278 187L270 238Q262 273 270 302L291 461Q265 473 241 457Q214 475 188 461L210 302Q218 273 210 238L202 187Z" fill="' + primary + '"/>' +
      '<path d="M219 174V187Q240 195 261 187V174L255 169H225Z" fill="' + primary + '" stroke="' + stroke + '" stroke-opacity=".22" stroke-width="1.4"/>' +
      '<path d="M253 183Q250 205 269 219M270 221L266 248M213 286Q237 294 265 286M239 304L241 457" fill="none" stroke="' + stroke + '" stroke-opacity=".2" stroke-width="1.6"/>' +
      '<path d="M210 303L201 452M270 303L280 451M190 210L176 281M290 211L304 280" fill="none" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M210 304L207 376L194 454M270 304L273 376L285 454" fill="none" stroke="' + stroke + '" stroke-opacity=".12" stroke-width="3"/>' +
      '<g fill="' + accent + '"><circle cx="258" cy="196" r="2.1"/><circle cx="265" cy="207" r="2.1"/><circle cx="269" cy="220" r="2.1"/></g>' +
      '<path d="M175 314H187M294 314H307" stroke="' + secondary + '" stroke-opacity=".7" stroke-width="3"/>' +
      '<path d="M229 365Q215 348 225 333Q236 344 229 365ZM230 366Q247 349 251 359Q244 372 230 366ZM229 367Q223 379 222 391" fill="none" stroke="' + accent + '" stroke-opacity=".55" stroke-width="1.5"/></g>';
  } else if (garment === 'Áo ngũ thân') {
    clothing = '<g data-layer="garment">' +
      '<path d="M216 177L192 185Q180 191 175 214L153 289L158 325L186 325L190 286L212 223Z" fill="' + primary + '"/>' +
      '<path d="M264 177L288 185Q300 191 305 214L327 289L322 325L294 325L290 286L268 223Z" fill="' + primary + '"/>' +
      '<path d="M219 174L195 184L200 264L188 455Q240 468 292 455L280 264L285 184L261 174Z" fill="' + primary + '"/>' +
      '<path d="M220 174V189Q240 197 260 189V174L254 168H226Z" fill="' + primary + '" stroke="' + stroke + '" stroke-opacity=".23" stroke-width="1.5"/>' +
      '<path d="M250 187Q253 209 276 215L274 325M273 325L280 451M208 256L200 451M231 322L226 458M187 211L166 290M293 211L315 290" fill="none" stroke="' + stroke + '" stroke-opacity=".19" stroke-width="1.5"/>' +
      '<path d="M211 199L210 249M207 274L197 440M279 275L287 438" fill="none" stroke="#FFFFFF" stroke-opacity=".15" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M161 312H187M293 312H320M193 444Q239 454 287 444" stroke="' + secondary + '" stroke-opacity=".55" stroke-width="2.5" fill="none"/>' +
      '<g fill="' + accent + '" stroke="' + stroke + '" stroke-opacity=".25" stroke-width=".7"><circle cx="253" cy="192" r="2.7"/><circle cx="264" cy="207" r="2.7"/><circle cx="276" cy="222" r="2.7"/><circle cx="275" cy="245" r="2.7"/><circle cx="274" cy="268" r="2.7"/></g></g>';
  } else {
    clothing = '<g data-layer="garment">' +
      '<path d="M220 176L197 185Q184 190 179 213L159 284L162 325H185L190 281L212 222Z" fill="' + primary + '"/>' +
      '<path d="M260 176L283 185Q296 190 301 213L321 284L318 325H295L290 281L268 222Z" fill="' + primary + '"/>' +
      '<path data-layer="yem" d="M228 178L240 190L252 178L269 218L263 294H217L211 218Z" fill="' + secondary + '"/>' +
      '<path d="M229 178L224 166M251 178L256 166" stroke="' + secondary + '" stroke-width="3"/>' +
      '<path d="M220 174L198 185L204 252L190 439Q205 448 221 437L233 307L218 283L217 233Z" fill="' + primary + '"/>' +
      '<path d="M260 174L282 185L276 252L290 439Q275 448 259 437L247 307L262 283L263 233Z" fill="' + primary + '"/>' +
      '<path d="M220 177L216 234L227 287M260 177L264 234L253 287M209 312L200 430M271 312L280 430M190 211L170 283M290 211L310 283" fill="none" stroke="' + stroke + '" stroke-opacity=".23" stroke-width="1.5"/>' +
      '<path d="M218 287Q240 294 263 286L261 302Q240 309 219 302Z" fill="' + accent + '"/>' +
      '<path d="M234 302L229 388L241 382L246 307L255 370L266 377L256 300Z" fill="' + accent + '"/>' +
      '<path d="M235 299Q216 281 215 294Q216 307 235 299Q254 283 259 294Q257 308 240 301" fill="' + accent + '" stroke="' + stroke + '" stroke-opacity=".2" stroke-width="1.2"/>' +
      '<path d="M164 314H185M295 314H317" stroke="' + secondary + '" stroke-width="2.5" stroke-opacity=".65"/>' +
      '<path d="M230 203Q240 210 250 203M229 213Q240 220 251 213" fill="none" stroke="' + accent + '" stroke-opacity=".45" stroke-width="1.3"/></g>';
  }

  let accessoryMarkup = '';
  if (accessory === 'Túi mini') {
    accessoryMarkup = '<path d="M282 191Q275 250 257 314" fill="none" stroke="' + accent + '" stroke-width="5"/>' +
      '<path d="M249 308Q263 301 278 306L289 336Q272 348 249 340Z" fill="' + accent + '" stroke="' + stroke + '" stroke-opacity=".25" stroke-width="1.3"/>' +
      '<path d="M250 315Q267 323 282 315" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.5"/><rect x="263" y="317" width="7" height="5" rx="1" fill="#EFDDB4"/>';
  } else if (accessory === 'Túi tote') {
    accessoryMarkup = '<path d="M307 329Q297 318 296 345M307 329Q323 319 325 345" fill="none" stroke="' + accent + '" stroke-width="4"/>' +
      '<path d="M290 341L332 341L336 390Q312 398 289 389Z" fill="' + secondary + '" stroke="' + stroke + '" stroke-opacity=".25" stroke-width="1.5"/>' +
      '<path d="M295 347L294 384M327 347L331 385" stroke="' + accent + '" stroke-opacity=".6" stroke-width="1.5"/>' +
      '<path d="M305 374Q299 363 306 360Q312 362 310 371Q318 355 322 362Q323 370 311 375L310 382" fill="none" stroke="' + primary + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (accessory === 'Khăn lụa') {
    accessoryMarkup = '<path d="M306 319Q290 324 294 339L290 375L302 369L306 336L315 365L322 373L318 331Q317 318 306 319Z" fill="' + accent + '"/>' +
      '<path d="M296 334Q308 339 319 329M297 347L295 366M311 341L317 364" fill="none" stroke="' + secondary + '" stroke-opacity=".65" stroke-width="2"/>';
  } else if (accessory === 'Quạt giấy') {
    accessoryMarkup = '<g transform="rotate(-22 174 335)"><path d="M174 335L132 294Q174 251 216 294Z" fill="' + secondary + '" stroke="' + accent + '" stroke-width="2"/>' +
      '<path d="M174 335L143 284M174 335L158 276M174 335L174 273M174 335L190 276M174 335L205 284" stroke="' + accent + '" stroke-opacity=".65" stroke-width="1.3"/>' +
      '<path d="M140 295Q174 265 208 295" fill="none" stroke="' + primary + '" stroke-width="5" stroke-opacity=".65"/><path d="M174 335L174 345" stroke="#9A7756" stroke-width="4" stroke-linecap="round"/></g>';
  } else if (accessory === 'Kẹp tóc') {
    accessoryMarkup = '<g transform="rotate(26 262 116)"><rect x="253" y="112" width="20" height="5" rx="2.5" fill="' + accent + '"/><path d="M256 115H270" stroke="' + secondary + '" stroke-width="1"/><circle cx="269" cy="114" r="3" fill="' + secondary + '"/></g>';
  }

  const lowerGarment = garment === 'Áo tứ thân' ?
    '<g data-layer="skirt"><path d="M216 278H264Q278 355 292 490Q240 503 188 490Q202 355 216 278Z" fill="' + secondary + '"/><path d="M219 320L205 488M229 321L225 496M251 321L255 496M261 320L277 488" stroke="' + stroke + '" stroke-opacity=".14" stroke-width="2"/><path d="M193 482Q240 492 287 482" fill="none" stroke="' + accent + '" stroke-opacity=".45" stroke-width="2"/></g>' :
    '<g data-layer="trousers"><path d="M212 294H268L277 501Q265 507 247 501L241 352L233 501Q217 507 203 501Z" fill="' + secondary + '"/><path d="M223 402L217 496M258 402L263 496" stroke="' + stroke + '" stroke-opacity=".12" stroke-width="2"/></g>';
  const shoes = shoe === 'sneakers' ?
    '<g data-layer="shoes" data-shoe="sneakers"><path d="M205 495H230L234 509Q231 519 195 517Q190 512 197 508Z" fill="#F9F5E9" stroke="#A3A99C" stroke-width="1.2"/><path d="M250 495H275L283 508Q290 517 251 518Q245 514 247 509Z" fill="#F9F5E9" stroke="#A3A99C" stroke-width="1.2"/><path d="M195 513H232M249 513H283" stroke="#D7D7C9" stroke-width="3"/><path d="M209 499L221 503M206 503L218 507M259 499L271 503M262 503L274 507" stroke="' + accent + '" stroke-width="1.5" stroke-linecap="round"/></g>' :
    '<g data-layer="shoes" data-shoe="flats"><path d="M207 496H229L231 510Q218 518 194 514Q193 508 207 496ZM251 496H273Q288 508 286 514Q262 518 249 510Z" fill="#4E4B43" stroke="' + stroke + '" stroke-opacity=".3" stroke-width="1.1"/><path d="M212 496Q220 504 226 497M254 497Q260 504 268 496" fill="none" stroke="' + skinLight + '" stroke-width="6"/><path d="M204 509L218 507M261 507L275 509" stroke="' + secondary + '" stroke-opacity=".7" stroke-width="1.3"/></g>';
  const backHair = avatar === 'Tóc dài' ?
    '<g data-layer="hair-back"><path d="M214 105Q237 88 260 103Q278 113 273 148L279 207Q260 220 252 207L241 172L229 209Q216 218 203 207L209 151Q202 124 214 105Z" fill="' + hair + '"/><path d="M213 148L210 201M267 144L272 202" stroke="#5A5045" stroke-width="2" fill="none"/></g>' :
    '<g data-layer="hair-back"><path d="M212 113Q218 94 242 98Q269 98 271 118L265 148H215Z" fill="' + hair + '"/></g>';
  const frontHair = avatar === 'Tóc dài' ?
    '<path d="M213 126Q208 105 226 101Q251 88 267 111L266 130Q253 124 244 107Q231 123 213 126Z" fill="' + hair + '"/><path d="M219 112Q228 103 239 102" stroke="#625548" stroke-width="2" fill="none" stroke-linecap="round"/>' :
    '<path d="M213 126Q204 118 211 110Q213 97 230 99Q249 88 260 102Q273 104 268 125L261 125L256 110Q236 123 219 118L217 129Z" fill="' + hair + '"/><path d="M219 109Q233 101 247 103" stroke="#615347" stroke-width="2" fill="none" stroke-linecap="round"/>';

  return '<svg xmlns="http://www.w3.org/2000/svg" class="outfit-scene" viewBox="0 0 480 560" width="480" height="560" role="img" aria-labelledby="' + id + '-title" data-garment="' + vprSvgEscape(garment) + '" data-background="' + vprSvgEscape(background) + '" data-avatar="' + vprSvgEscape(avatar) + '" data-accessory="' + vprSvgEscape(accessory) + '" data-shoe="' + shoe + '" style="display:block;width:100%;height:auto;overflow:hidden">' +
    '<title id="' + id + '-title">' + vprSvgEscape('Bản phối minh họa ' + garment + ', nhân vật ' + avatar.toLowerCase() + ', bối cảnh ' + background.toLowerCase() + ', ' + accessory.toLowerCase()) + '</title>' +
    '<defs><radialGradient id="' + id + '-halo"><stop offset="0" stop-color="#FFFDF5" stop-opacity=".73"/><stop offset="1" stop-color="#FFFDF5" stop-opacity="0"/></radialGradient><linearGradient id="' + id + '-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3C5041" stop-opacity=".14"/><stop offset="1" stop-color="#3C5041" stop-opacity=".04"/></linearGradient></defs>' +
    vprSvgBackground(background, id) +
    '<ellipse cx="240" cy="286" rx="174" ry="238" fill="url(#' + id + '-halo)"/>' +
    '<g data-layer="shadow"><ellipse cx="241" cy="518" rx="75" ry="12" fill="url(#' + id + '-ground)"/><ellipse cx="241" cy="517" rx="48" ry="5" fill="#445842" opacity=".09"/></g>' +
    backHair + '<g data-layer="body"><path d="M228 152H252L255 177Q240 188 225 177Z" fill="' + skin + '"/><path d="M229 155Q240 164 252 155L251 168Q239 174 228 166Z" fill="#B57E5B" opacity=".23"/><path d="M208 490H230V507H208ZM250 490H272V507H250Z" fill="' + skinLight + '"/></g>' +
    shoes + lowerGarment + clothing +
    '<g data-layer="face"><ellipse cx="214" cy="134" rx="4.7" ry="7" fill="' + skin + '"/><ellipse cx="266" cy="134" rx="4.7" ry="7" fill="' + skin + '"/><path d="M217 116Q239 103 263 116L262 141Q259 157 240 163Q221 157 218 141Z" fill="' + skinLight + '"/><path d="M218 122Q220 151 240 160Q226 157 221 149Q216 138 218 122Z" fill="' + skin + '" opacity=".65"/><path d="M225 130Q229 127 233 130M248 130Q252 127 256 130" fill="none" stroke="#594739" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="230" cy="134" rx="1.5" ry="1.8" fill="#443E35"/><ellipse cx="251" cy="134" rx="1.5" ry="1.8" fill="#443E35"/><path d="M240 133L238 141L242 142" fill="none" stroke="#BB8566" stroke-width="1" stroke-linecap="round"/><path d="M234 148Q240 152 247 147" fill="none" stroke="#A36355" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="226" cy="143" rx="4.7" ry="2.5" fill="#D99882" opacity=".45"/><ellipse cx="254" cy="143" rx="4.7" ry="2.5" fill="#D99882" opacity=".45"/></g>' +
    '<g data-layer="hair-front">' + frontHair + '</g>' +
    '<g data-layer="hands"><path d="M169 322H182L181 339Q176 347 171 342L167 334Z" fill="' + skinLight + '"/><path d="M299 322H312L314 334L310 342Q305 347 300 339Z" fill="' + skinLight + '"/><path d="M172 330L173 338M309 330L308 338" stroke="#BC8667" stroke-width="1" stroke-linecap="round"/></g>' +
    '<g data-layer="accessories">' + accessoryMarkup + '</g></svg>';
}
