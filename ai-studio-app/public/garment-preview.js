(function () {
  'use strict';
  // Stylized outfit diagrams, not historical reconstructions.
  const main = 'var(--pv-fabric, #9DCCBA)';
  const ink = '#506052';
  const gold = '#B58A3E';
  const cream = '#FFF6DF';
  const dark = '#34443D';
  const path = (d, fill = main, extra = '') => `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-opacity=".4" stroke-width="1.2" ${extra}/>`;
  const line = d => path(d, 'none');
  const dots = (coords, radius = 2) => coords.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${gold}"/>`).join('');
  const pants = path('M100 208 H140 L147 349 H124 L120 250 L116 349 H93 Z', cream);
  const shoes = path('M95 347 H115 V355 H91 Q89 351 95 347Z M125 347 H143 Q150 351 149 355 H125Z', dark);
  const legs = path('M103 275 H117 L114 348 H98Z M123 275 H137 L142 348 H126Z', '#DBA681');
  const longSkirt = path('M101 184 H139 L151 346 Q120 353 89 346Z', dark);
  const standCollar = path('M111 101 V96 Q120 100 129 96 V107 Q120 113 111 101Z', main);
  const broadRobe = 'M109 104 L88 111 L48 180 L75 197 L97 158 L88 325 Q120 335 152 325 L143 158 L165 197 L192 180 L152 111 L131 104Z';
  const shortTop = 'M109 103 L92 110 L68 184 L85 190 L101 146 L99 196 Q120 203 141 196 L139 146 L155 190 L172 184 L148 110 L131 103Z';
  const band = (y, width = 42, fill = gold) => path(`M${120-width/2} ${y} H${120+width/2} V${y+6} H${120-width/2}Z`, fill);
  const diamonds = (y, count = 5, step = 8, fill = gold) => Array.from({length:count}, (_, i) => {
    const x = 120 - (count - 1) * step / 2 + i * step;
    return path(`M${x} ${y} l3 4 -3 4 -3 -4Z`, fill);
  }).join('');
  const models = {
    'Áo dài': {
      key: 'ao-dai', note: 'Phom ôm nhẹ, tà dài xẻ hai bên, phối quần suông.',
      svg: pants + path('M110 103 L95 112 L71 192 L85 197 L102 145 L102 199 L86 319 Q104 328 118 321 L120 218 L122 321 Q137 328 154 319 L138 199 L138 145 L155 197 L169 192 L145 112 L130 103Z') + standCollar + line('M129 107 L137 132 L138 194 M120 217 V317') + dots([[132,114],[136,126],[138,139]])
    },
    'Áo ngũ thân': {
      key: 'ngu-than', note: 'Thân áo rộng, cổ đứng, hàng khuy lệch và tà dài.',
      svg: pants + path('M110 103 L88 113 L60 188 L83 197 L99 149 L93 315 Q120 323 148 315 L142 149 L157 197 L180 188 L152 113 L130 103Z') + standCollar + line('M128 107 Q142 116 140 137 L143 306') + dots([[130,109],[137,119],[140,138],[141,159],[142,180]])
    },
    'Áo tứ thân': {
      key: 'tu-than', note: 'Áo khoác mở trước, lớp yếm, váy dài và dải thắt eo.',
      svg: longSkirt + path('M108 105 H132 L138 192 H102Z', '#E8BF72') + path('M108 104 L90 112 L63 184 L81 193 L101 145 L97 200 L76 319 L102 327 L118 209 L115 132Z') + path('M132 104 L150 112 L177 184 L159 193 L139 145 L143 200 L164 319 L138 327 L122 209 L125 132Z') + band(190,44,'#8E5263') + path('M117 195 Q101 211 99 263 L110 259 L123 198 M123 195 Q139 222 139 255 L148 262 L130 196', '#8E5263')
    },
    'Áo Nhật Bình': {
      key: 'nhat-binh', note: 'Phom áo rộng, tay rộng, điểm nhấn cổ hình chữ nhật.',
      svg: pants + path(broadRobe) + path('M107 104 H115 V145 H125 V104 H133 V154 H107Z', cream) + line('M110 107 V151 H130 V107') + path('M49 178 L76 194 L81 184 L55 167Z M159 184 L185 167 L191 178 L164 194Z', cream) + diamonds(285,7,7) + band(307,57)
    },
    'Áo giao lĩnh': {
      key: 'giao-linh', note: 'Cổ giao chéo, tay rộng và lớp áo chồng phía trước.',
      svg: pants + path('M110 103 L84 113 L45 184 L74 202 L97 153 L88 328 H152 L143 153 L166 202 L195 184 L156 113 L130 103Z') + path('M108 104 L133 145 L141 186 L130 190 L101 107Z', cream) + path('M131 104 L139 109 L110 162 L101 157Z', cream) + band(184,46,'#80644A') + line('M111 194 L100 321')
    },
    'Váy xòe': {
      key: 'vay-xoe', note: 'Áo kín eo, váy xòe xếp ly và các dải trang trí hình học.',
      svg: path('M108 104 L91 111 L68 179 L84 186 L102 144 L102 188 H138 L138 144 L156 186 L172 179 L149 111 L132 104Z', cream) + path('M102 187 H138 Q153 230 181 307 Q120 335 59 307 Q88 230 102 187Z') + Array.from({length:11},(_,i)=>line(`M${103+i*3.4} 195 L${66+i*10.8} 307`)).join('') + path('M66 290 Q120 313 174 290 L180 305 Q120 332 60 305Z','#8B4F5F') + diamonds(299,13,8,cream) + band(184,39,gold) + path('M110 105 L120 117 L130 105', '#8B4F5F')
    },
    'Áo cóm và váy dài': {
      key: 'ao-com', note: 'Áo ngắn vừa eo, hàng khuy cách điệu và váy dài dáng thẳng.',
      svg: longSkirt + path(shortTop) + path('M109 104 Q120 120 131 104', cream) + line('M120 118 V194') + [125,138,151,164,177].map(y=>path(`M120 ${y} q-8 -5 -7 1 q0 4 7 1 q8 3 7 -1 q0 -5 -7 -1Z`,cream)).join('') + band(190,42) + path('M91 328 Q120 334 149 328 V340 Q120 347 90 340Z','#728879')
    },
    'Trang phục truyền thống Lô Lô': {
      key: 'lo-lo', note: 'Minh họa sáng tạo với áo phối mảng hình học và váy dài.',
      svg: longSkirt + path(shortTop) + path('M104 111 H116 V155 H104Z M124 111 H136 V155 H124Z','#9A5F4B') + diamonds(118,3,10,cream) + diamonds(139,3,10,'#D5AE53') + band(165,38,'#AE7657') + diamonds(175,4,9,cream) + path('M91 319 H149 V339 H90Z','#AE7657') + diamonds(324,7,7,cream)
    },
    'Trang phục truyền thống Ê Đê': {
      key: 'e-de', note: 'Minh họa áo chui đầu, váy quấn dài và dải dệt ngang.',
      svg: longSkirt + path('M108 104 L87 111 L67 183 L86 190 L100 151 L97 217 H143 L140 151 L154 190 L173 183 L153 111 L132 104Z') + path('M111 105 Q120 121 129 105',cream) + band(128,42,'#A65142') + band(200,46,'#A65142') + diamonds(207,5,8,cream) + path('M124 218 H131 L137 344 H130Z','#A65142') + line('M131 223 L137 342') + band(326,58,'#A65142')
    },
    'Trang phục truyền thống Ba Na': {
      key: 'ba-na', note: 'Minh họa áo tay ngắn, váy quấn và viền dệt hình học.',
      svg: longSkirt + path('M108 104 L89 111 L75 148 L93 157 L101 139 L99 204 H141 L139 139 L147 157 L165 148 L151 111 L132 104Z') + path('M111 105 L120 118 L129 105', cream) + diamonds(125,4,8,cream) + band(187,42,'#B66B48') + diamonds(195,5,7,cream) + path('M95 214 H103 L97 344 H89Z','#B66B48') + path('M91 321 H149 V337 H90Z', '#B66B48') + diamonds(325,7,7,cream)
    },
    'Áo bà ba': {
      key: 'ba-ba', note: 'Áo ngắn cài khuy giữa, hai túi và quần dài suông.',
      svg: pants + path('M110 104 L92 113 L70 187 L87 193 L102 149 L97 227 Q120 232 143 227 L138 149 L153 193 L170 187 L148 113 L130 104Z') + path('M110 104 Q120 119 130 104',cream) + line('M120 117 V227 M103 194 H114 V208 H103Z M126 194 H137 V208 H126Z') + dots([[120,126],[120,145],[120,164],[120,183],[120,202],[120,220]])
    }
  };

  window.VietPhucGarmentPreview = {
    render(name, color) {
      const layer = document.querySelector('#pv-garment-layer');
      const svg = document.querySelector('#pv-mannequin-svg');
      if (!layer || !svg) return;
      const model = models[name];
      svg.style.setProperty('--pv-fabric', color);
      svg.setAttribute('aria-label', `Minh họa phom dáng ${name}`);
      if (layer.dataset.garment !== name) {
        layer.dataset.garment = name;
        layer.innerHTML = legs + shoes + (model ? model.svg : pants);
        const note = document.querySelector('#pv-garment-note');
        if (note) note.textContent = (model?.note || 'Chưa có minh họa phom dáng cho mẫu này.') + ' Hình minh họa, không phải ảnh thử đồ hoặc phục dựng.';
      }
      layer.dataset.preview = model?.key || 'unsupported';
    }
  };
})();
