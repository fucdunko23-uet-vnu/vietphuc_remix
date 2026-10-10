(function(root){
  'use strict';
  // Curated outfit choices, not an exhaustive catalogue of each community's dress.
  const garments={
    'Váy xòe':{guide:'A modest coordinated outfit inspired by Hmong pleated flared skirts: opaque long-sleeved top, covered waist, calf-length densely pleated flared skirt, restrained geometric textile detailing. Not an ao dai, ao tu than or generic Chinese costume. Do not mix Dao red headdresses or ceremonial regalia into this outfit.',outfit:'Váy xòe xếp ly {main}, áo dài tay kín đáo {secondary}, điểm nhấn dệt {accent}.',keep:'Bản phối váy xòe lấy cảm hứng từ trang phục H’Mông; không phải phục dựng hay đại diện cho mọi cộng đồng ở Sa Pa.'},
    'Áo cóm và váy dài':{guide:'A fashion interpretation of Vietnamese Thai women’s ao com: modest fitted long-sleeve blouse with a small row of butterfly-shaped fastenings, fully covered waist and long straight dark skirt. No Hmong flared skirt, no ao dai panels.',outfit:'Áo cóm {main}, váy dài {secondary}, điểm nhấn {accent}.',keep:'Bản phối lấy cảm hứng từ áo cóm và váy dài; hình AI không xác nhận độ chính xác của từng hoa văn địa phương.'},
    'Trang phục truyền thống Lô Lô':{guide:'A modest contemporary interpretation inspired by Lo Lo geometric patchwork textiles: covered long-sleeved top and full-length skirt, clear small geometric fabric panels. Do not mix Hmong, Dao or ceremonial symbols.',outfit:'Áo phối mảng hình học {main}, váy dài {secondary}, chi tiết {accent}.',keep:'Bản phối sáng tạo lấy cảm hứng từ mảng ghép hình học; không coi đây là trang phục Lô Lô nguyên bản.'},
    'Áo Nhật Bình':{guide:'Vietnamese Nhat Binh inspired robe: broad rectangular framed collar, loose long robe with wide sleeves, opaque inner layers and full-length trousers. No cheongsam or Chinese hanfu substitution, no invented rank insignia or imperial crown.',outfit:'Áo Nhật Bình {main}, lớp trong và quần dài {secondary}, viền cổ {accent}.',keep:'Giữ cổ chữ nhật và phom áo rộng; bản thử AI không phục dựng phẩm phục hoặc cấp bậc lịch sử.'},
    'Áo giao lĩnh':{guide:'Vietnamese giao linh inspired cross-collar robe, loose long sleeves, overlapping diagonal collar and opaque full-length lower layers. A modern interpretation, no invented royal regalia or foreign costume substitution.',outfit:'Áo giao lĩnh {main}, lớp trong {secondary}, đai vải {accent}.',keep:'Bản phối lấy cảm hứng từ cổ áo giao nhau; không phải phục dựng một triều đại cụ thể.'},
    'Trang phục truyền thống Ê Đê':{guide:'A modest fashion interpretation inspired by Ede textiles: dark opaque pullover top with restrained red and yellow woven bands, full-length wrap skirt. No generic Hmong flared skirt, no invented sacred motifs.',outfit:'Áo chui đầu {main}, váy quấn dài {secondary}, dải dệt {accent}.',keep:'Bản phối lấy cảm hứng từ dệt Ê Đê; không gán ý nghĩa tín ngưỡng cho hoa văn do AI tạo.'},
    'Trang phục truyền thống Ba Na':{guide:'A modest fashion interpretation inspired by Bahnar woven textiles: opaque simple top and long wrap skirt, restrained geometric woven border. No Hmong skirt or invented ceremonial ornaments.',outfit:'Áo {main}, váy quấn dài {secondary}, viền dệt {accent}.',keep:'Bản phối lấy cảm hứng từ dệt Ba Na; không đại diện cho mọi nhóm địa phương.'},
    'Áo bà ba':{guide:'Vietnamese ao ba ba: modest long-sleeved button-front hip-length blouse and loose full-length trousers. No long ao dai panels and no fitted cheongsam.',outfit:'Áo bà ba {main}, quần dài suông {secondary}, điểm nhấn {accent}.',keep:'Giữ áo ngắn cài khuy và quần dài; màu sắc và phụ kiện là lựa chọn đương đại.'}
  };
  const common=['Túi mini','Túi tote','Khăn lụa','Quạt giấy','Kẹp tóc','Không dùng phụ kiện'];
  const places={
    general:{name:'Phối đồ tự do',icon:'🌐',tagline:'Toàn cảnh trang phục dân tộc',garments:['Áo dài','Áo ngũ thân','Áo tứ thân'],scenes:['Phố cổ','Sân trường','Sân vườn'],accent:'#264f40',note:'Chọn một địa điểm để mở tủ đồ và phong cảnh riêng.'},
    laocai:{name:'Sa Pa',icon:'⛰️',tagline:'Mây trắng Mường Hoa & Fansipan',garments:['Váy xòe'],scenes:['Thung lũng Mường Hoa','Bản Cát Cát','Núi Fansipan'],accent:'#416b66',note:'Tủ đồ Sa Pa: váy xòe xếp ly H’Mông.',source:'https://www.vietnam.travel/places-to-go/northern-vietnam/sapa'},
    bacninh:{name:'Bắc Ninh',icon:'🏮',tagline:'Cội nguồn dân ca & Kinh Bắc',garments:['Áo tứ thân'],scenes:['Đình làng Diềm','Không gian hội Lim'],accent:'#92503b',note:'Phối áo tứ thân trong khung cảnh Kinh Bắc.',accessories:['Nón quai thao','Quạt giấy',...common]},
    hanoi:{name:'Hà Nội',icon:'🏛️',tagline:'Thăng Long ngàn năm văn hiến',garments:['Áo giao lĩnh','Áo ngũ thân','Áo dài'],scenes:['Hoàng thành Thăng Long','Phố cổ Hà Nội','Hồ Hoàn Kiếm'],accent:'#80633b',note:'Chọn cổ phục hoặc áo dài và một góc Hà Nội.'},
    sonla:{name:'Mộc Châu',icon:'🍵',tagline:'Đồi chè xanh ngát & điệu xòe',garments:['Áo cóm và váy dài'],scenes:['Đồi chè Mộc Châu','Thung lũng mận Nà Ka','Rừng thông Bản Áng'],accent:'#54734d',note:'Phối áo cóm và váy dài trong cảnh núi đồi Mộc Châu.',accessories:['Khăn Piêu',...common]},
    hagiang:{name:'Hà Giang',icon:'🌄',tagline:'Cao nguyên đá & hoa tam giác mạch',garments:['Trang phục truyền thống Lô Lô'],scenes:['Cao nguyên đá Đồng Văn','Đèo Mã Pí Lèng','Thung lũng hoa tam giác mạch'],accent:'#626254',note:'Phối trang phục truyền thống Lô Lô cùng phong cảnh Hà Giang.'},
    tthue:{name:'Huế',icon:'🏯',tagline:'Cố đô di sản & sông Hương dạ khúc',garments:['Áo Nhật Bình','Áo ngũ thân','Áo dài'],scenes:['Đại Nội Huế','Bờ sông Hương','Nhà vườn Huế'],accent:'#756084',note:'Tủ đồ Huế với Nhật Bình, ngũ thân và áo dài.',source:'https://vietnam.travel/vi/places-to-go/central-vietnam/hue'},
    quangnam:{name:'Hội An',icon:'🏮',tagline:'Phố cổ rêu phong & hoa đăng',garments:['Áo ngũ thân','Áo dài'],scenes:['Phố cổ Hội An','Bờ sông Hoài','Góc đèn lồng Hội An'],accent:'#a77d27',note:'Tông tường vàng và cảnh phố Hội cho bản phối của bạn.'},
    daklak:{name:'Buôn Ma Thuột',icon:'🏕️',tagline:'Thủ phủ cà phê & sử thi Đam San',garments:['Trang phục truyền thống Ê Đê'],scenes:['Buôn Ako Dhông','Thác Dray Nur','Đồi cà phê Buôn Ma Thuột'],accent:'#76543e',note:'Phối trang phục truyền thống Ê Đê cùng phong cảnh Đắk Lắk.'},
    gialai:{name:'Pleiku',icon:'🌲',tagline:'Biển Hồ sóng sánh & nhà rông',garments:['Trang phục truyền thống Ba Na'],scenes:['Biển Hồ T’Nưng','Hàng thông Pleiku','Không gian nhà rông Gia Lai'],accent:'#576d47',note:'Phối trang phục truyền thống Ba Na cùng phong cảnh Gia Lai.'},
    hcm:{name:'Sài Gòn',icon:'🏙️',tagline:'Đô thị phồn hoa & tà áo bà ba',garments:['Áo bà ba','Áo dài'],scenes:['Bưu điện Sài Gòn','Phố đi bộ Nguyễn Huệ','Góc phố Sài Gòn'],accent:'#b16f4c',note:'Áo bà ba hoặc áo dài trong nhịp phố Sài Gòn.'},
    cantho:{name:'Cần Thơ',icon:'🛶',tagline:'Gạo trắng nước trong & chợ nổi',garments:['Áo bà ba','Áo dài'],scenes:['Bến Ninh Kiều','Chợ nổi Cái Răng','Vườn cây Cần Thơ'],accent:'#40766d',note:'Phối đồ cùng cảnh sông nước và miệt vườn Cần Thơ.'}
  };
  const lighting=['Ánh sáng tự nhiên','Sáng sớm','Hoàng hôn','Trời nhiều mây'];
  const api={places,garments,lighting,common};
  if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
  root.VietPhucDestination=api;

  const init=()=>{
    const form=document.querySelector('#styling-form');if(!form)return;
    const garment=form.elements.namedItem('Loại trang phục'),scene=form.elements.namedItem('Bối cảnh'),accessory=form.elements.namedItem('Phụ kiện yêu thích');

    // Find or create destination elements
    let room=form.querySelector('.destination-room');
    if(!room){
      room=document.createElement('section');
      room.className='destination-room';
      room.setAttribute('aria-labelledby','destination-title');
      const step1=form.querySelector('#step-panel-1');
      if(step1){
        step1.prepend(room);
      }else{
        form.prepend(room);
      }
    }

    let select=form.querySelector('#destination-select');
    let titleEl=form.querySelector('#destination-title');
    let noteEl=form.querySelector('#destination-note');
    let scenesBox=form.querySelector('#destination-scenes');
    let lights=form.querySelector('#scene-light');
    let detailInput=form.querySelector('#scene-detail');

    if(!select){
      room.innerHTML='<div class="destination-heading"><span class="eyebrow">TỦ ĐỒ THEO ĐỊA ĐIỂM</span><h2 id="destination-title"></h2><p id="destination-note"></p></div><label for="destination-select">Địa điểm thử đồ</label><select id="destination-select" name="Địa điểm"></select><div id="destination-scenes" class="destination-scenes" aria-label="Chọn phong cảnh"></div><div class="destination-custom"><label for="scene-light">Ánh sáng</label><select id="scene-light" name="Ánh sáng"></select><label for="scene-detail">Tùy chỉnh phong cảnh</label><textarea id="scene-detail" name="Chi tiết phong cảnh" maxlength="300" rows="2" placeholder="Ví dụ: ruộng bậc thang xanh, sương nhẹ, ít người, góc chụp rộng"></textarea><small>Điều chỉnh thời tiết, mùa, ánh sáng hoặc góc chụp trong địa điểm đã chọn. Cảnh do AI minh họa.</small></div>';
      select=room.querySelector('#destination-select');
      titleEl=room.querySelector('#destination-title');
      noteEl=room.querySelector('#destination-note');
      scenesBox=room.querySelector('#destination-scenes');
      lights=room.querySelector('#scene-light');
      detailInput=room.querySelector('#scene-detail');
    }

    const fill=(el,values,value)=>{
      if(!el)return;
      el.replaceChildren(...values.map(v=>new Option(v,v)));
      el.value=values.includes(value)?value:values[0];
      el.dispatchEvent(new Event('change',{bubbles:true}));
    };

    if(select&&select.options.length===0){
      select.replaceChildren(...Object.entries(places).map(([key,p])=>new Option(p.name,key)));
    }
    if(lights&&lights.options.length===0){
      fill(lights,lighting);
    }

    const paintScene=()=>{
      if(!scenesBox)return;
      scenesBox.querySelectorAll('[data-scene]').forEach(b=>{
        b.setAttribute('aria-pressed',String(b.dataset.scene===scene.value));
        b.classList.toggle('is-active',b.dataset.scene===scene.value);
      });
      if(window.updateLivePreview)window.updateLivePreview();
    };

    let appliedDestination;
    const apply=(key,preferred={})=>{
      if(!Object.hasOwn(places,key))key='general';
      if(appliedDestination===key&&Object.keys(preferred).length===0)return;
      appliedDestination=key;
      const p=places[key];
      if(select)select.value=key;
      form.style.setProperty('--destination-accent',p.accent);
      room.style.setProperty('--destination-accent',p.accent);
      if(titleEl)titleEl.textContent=key==='general'?'Phòng thử đồ Việt phục':'Phòng thử đồ · '+p.name;
      if(noteEl)noteEl.textContent=p.note;

      const hero=document.querySelector('[data-page="thu-do"] .hero h1');
      if(hero)hero.textContent=key==='general'?'Đổi sắc áo. Giữ nét riêng.':'Diện nét riêng giữa '+p.name+'.';
      const desc=document.querySelector('[data-page="thu-do"] .hero-desc');
      if(desc)desc.textContent=key==='general'?'Từ ảnh của bạn, khám phá hai cách phối Việt phục theo màu sắc, phụ kiện và bối cảnh.':`Thử ${p.garments.join(' hoặc ').toLowerCase()} trên ảnh của bạn, giữa phong cảnh ${p.name}. Chọn một cảnh và tùy chỉnh ánh sáng, thời tiết hoặc góc chụp.`;
      const intro=document.querySelector('#intro h2');
      if(intro)intro.textContent=key==='general'?'Truyền thống gặp gỡ gu đương đại':p.garments.join(' · ')+' giữa '+p.name;

      fill(garment,p.garments,preferred['Loại trang phục']);
      fill(scene,p.scenes,preferred['Bối cảnh']);
      fill(accessory,p.accessories||common,preferred['Phụ kiện yêu thích']);

      if(detailInput){
        detailInput.value='';
        detailInput.placeholder=key==='laocai'?'Ví dụ: ruộng bậc thang xanh, sương nhẹ, ít người, góc chụp rộng':`Ví dụ: góc chụp rộng tại ${p.scenes[0]}, ánh sáng dịu, ít người`;
      }
      if(lights)lights.value=lighting[0];

      if(scenesBox){
        scenesBox.replaceChildren(...p.scenes.map((name,i)=>{
          const button=document.createElement('button');
          button.type='button';
          button.dataset.scene=name;
          button.className='destination-scene';
          const label=document.createElement('span');
          label.className='destination-scene-name';
          label.textContent=name;
          const status=document.createElement('span');
          status.className='destination-scene-status';
          status.textContent='✓ Đang chọn';
          status.setAttribute('aria-hidden','true');
          button.append(label,status);
          button.style.setProperty('--scene-index',i);
          button.addEventListener('click',()=>{
            scene.value=name;
            scene.dispatchEvent(new Event('change',{bubbles:true}));
          });
          return button;
        }));
      }
      paintScene();

      // Highlight corresponding visual destination card in Step 1
      form.querySelectorAll('.dest-card').forEach(card=>{
        const isMatch=card.dataset.destKey===key;
        card.classList.toggle('is-selected',isMatch);
        card.setAttribute('aria-pressed',String(isMatch));
      });
      const chosenLabel=document.querySelector('#step1-chosen-label');
      if(chosenLabel)chosenLabel.textContent=p.name;

      const preview=document.querySelector('#preview');
      if(preview) {
        const textSpan = preview.querySelector('.btn-text');
        const textVal = key==='general' ? 'Chiêm ngưỡng bản phối' : 'Khám phá thẻ di sản';
        if (textSpan) textSpan.textContent = textVal;
        else preview.textContent = textVal;
      }

      const url=new URL(location.href);
      if(key==='general')url.searchParams.delete('dia-diem');
      else url.searchParams.set('dia-diem',key);
      history.replaceState(null,'',url);

      const resultsEl=document.querySelector('#results');
      if(resultsEl)resultsEl.hidden=true;
      window.clearTryOnResults?.();

      if(typeof window!=='undefined'&&window.setScenicTheme){
        window.setScenicTheme(key);
      }
      if(typeof window!=='undefined'&&window.updateLivePreview){
        window.updateLivePreview();
      }
    };

    api.apply=apply;
    api.resolve=name=>Object.keys(places).find(k=>k!=='general'&&(places[k].name===name||name?.includes(places[k].name)))||({'Vùng Tây Bắc':'laocai','Cố Đô Huế & Duyên Hải Miền Trung':'tthue','Vùng Bắc Bộ':'bacninh','Tây Nguyên Đại Ngàn':'daklak','Nam Bộ':'cantho'}[name])||'general';

    if(select)select.addEventListener('change',()=>apply(select.value));
    if(scene)scene.addEventListener('change',paintScene);
    if(lights)lights.addEventListener('change',()=>{if(window.updateLivePreview)window.updateLivePreview();});

    // Wire visual destination cards in Step 1
    form.querySelectorAll('.dest-card').forEach(card=>{
      card.addEventListener('click',e=>{
        e.preventDefault();
        const destKey=card.dataset.destKey;
        if(destKey)apply(destKey);
      });
    });

    apply(new URL(location.href).searchParams.get('dia-diem')||'general');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
