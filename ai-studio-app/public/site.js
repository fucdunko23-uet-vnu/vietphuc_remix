(()=>{
const pages=[...document.querySelectorAll('[data-page]')];
const names={'ban-do':'Bản đồ Di sản','thu-do':'Phòng thử đồ','trang-chu':'Trang chủ','kham-pha':'Khám phá Việt phục','huong-dan':'Hướng dẫn','gioi-thieu':'Về dự án'};
const toggle=document.querySelector('#menu-toggle'),nav=document.querySelector('#site-nav');
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();const page=pages.find(p=>!p.hidden);page.focus();page.scrollIntoView();});
function closeMenu(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');const mapMenu=document.querySelector('#map-site-menu');if(mapMenu)mapMenu.open=false;}
let routeFrame;
let activeRoute;
function route(focus=true){let key=location.hash.slice(1)||'ban-do';if(!names[key]){key='ban-do';history.replaceState(null,'','#ban-do');}
if(key==='thu-do'){
 const requested=new URL(location.href).searchParams.get('dia-diem')||'general';
 const destination=Object.hasOwn(window.VietPhucDestination?.places||{},requested)?requested:'general';
 if(document.querySelector('#destination-select')?.value!==destination)window.VietPhucDestination?.apply?.(destination);
 window.setScenicTheme?.(destination);
}
if(activeRoute===key){closeMenu();return;}
activeRoute=key;
window.VietPhucMusic?.setPage(key);
// Reset scroll before changing layout; avoid forcing a synchronous layout of the newly opened room.
window.scrollTo({top:0,behavior:'instant'});
pages.forEach(p=>{p.hidden=p.dataset.page!==key;p.inert=p.hidden;p.setAttribute('aria-hidden',String(p.hidden));});document.body.classList.toggle('is-map-fullscreen',key==='ban-do');document.querySelectorAll('#site-nav a').forEach(a=>{if(a.hash==='#'+key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
if(key==='thu-do')window.refreshTryOnConnection?.();
// A warmed room should not keep participating in layout on every other page.
if(key!=='ban-do')pages.find(p=>p.dataset.page==='thu-do')?.classList.remove('is-room-prepared');
document.title=names[key]+' — Việt phục Remix';closeMenu();cancelAnimationFrame(routeFrame);if(focus)routeFrame=requestAnimationFrame(()=>{const page=pages.find(p=>!p.hidden);const target=page?.querySelector('#destination-title')||page;target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});});}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const mapSummary=document.activeElement.closest('#map-site-menu')?.querySelector('summary');const inNav=document.activeElement.closest('#site-nav');closeMenu();if(mapSummary)mapSummary.focus();else if(inNav)toggle.focus();}});
document.addEventListener('click',e=>{const menu=document.querySelector('#map-site-menu');if(menu?.open&&!menu.contains(e.target))menu.open=false;});
window.addEventListener('popstate',()=>{if((location.hash.slice(1)||'ban-do')===activeRoute)route(false);});
const transitionCopy={
 'ban-do':['NON SÔNG GẤM VÓC','Khám phá bản đồ di sản văn hóa Việt Nam'],
 'thu-do':['PHÒNG THỬ ĐỒ','Chọn Việt phục, phối phong cảnh theo gu của bạn'],
 'trang-chu':['VIỆT PHỤC REMIX','Nét Việt, theo cách của bạn'],
 'kham-pha':['BỘ SƯU TẬP','Tìm cảm hứng từ những bản phối Việt phục'],
 'huong-dan':['HƯỚNG DẪN','Bắt đầu hành trình khám phá và thử Việt phục'],
 'gioi-thieu':['VỀ DỰ ÁN','Truyền thống gặp gỡ sáng tạo đương đại']
};
function transitionTo(key,onHalfway){
 const copy=transitionCopy[key]||transitionCopy['ban-do'];
 closeMenu();
 if(window.triggerSceneTransition)window.triggerSceneTransition({title:copy[0],subtitle:copy[1],onHalfway});
 else onHalfway();
}
// Navigation links wait for the curtains to close before changing the route.
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href]');
 if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
 const url=new URL(link.href,location.href),key=url.hash.slice(1);
 if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!names[key])return;
 event.preventDefault();
 if(key===(location.hash.slice(1)||'ban-do')){closeMenu();return;}
 transitionTo(key,()=>{location.hash=key;route();});
});
// Back/forward and programmatic navigation also animate. Map transitions already own a curtain.
window.addEventListener('hashchange',()=>{
 const key=location.hash.slice(1)||'ban-do';
 const active=pages.find(page=>!page.hidden)?.dataset.page;
 if(active===key||document.querySelector('#scene-transition-curtain')?.classList.contains('is-transitioning'))route();
 else transitionTo(key,()=>route());
});route(false);
document.querySelectorAll('.back-to-map-btn').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();if(window.triggerSceneTransition){window.triggerSceneTransition({title:'NON SÔNG GẤM VÓC',subtitle:'Trở về Bản Đồ Di Sản Văn Hóa Việt Nam',onHalfway:()=>{location.hash='ban-do';window.zoomOutToNational?.();}});}else{location.hash='ban-do';}});});
// Lay out the fitting room while the visitor explores the map, then reuse it on entry.
const warmRoom=()=>{const room=pages.find(p=>p.dataset.page==='thu-do');if(activeRoute==='ban-do'&&room?.hidden&&document.visibilityState==='visible')room.classList.add('is-room-prepared');};
if('requestIdleCallback' in window)requestIdleCallback(warmRoom,{timeout:2000});else setTimeout(warmRoom,700);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let count=0;
  const filterVal=button.dataset.filter;
  document.querySelectorAll('[data-page="kham-pha"] .collection-card').forEach(card=>{
    const match=filterVal==='Tất cả'||card.dataset.garment===filterVal||(card.dataset.garmentGroup&&card.dataset.garmentGroup===filterVal);
    card.hidden=!match;
    if(!card.hidden)count++;
  });
  const countEl=document.querySelector('#collection-count');
  if(countEl)countEl.textContent=count+' bản phối di sản gợi ý';
}));
let presets;
document.querySelectorAll('[data-preset], [data-lore-preset]').forEach(button=>button.addEventListener('click',async()=>{
  try{
    if(!presets){const r=await fetch('/presets.json');if(!r.ok)throw new Error();presets=await r.json();}
    const form=document.querySelector('#styling-form');
    const idx = button.dataset.preset !== undefined ? Number(button.dataset.preset) : Number(button.dataset.lorePreset);
    const p=presets[idx];
    if(p&&form){
      const dest=p['Địa điểm']||'general';
      window.VietPhucDestination?.apply?.(dest,p);
      for(const [name,value]of Object.entries(p)){
        if(name==='Địa điểm')continue;
        const field=form.elements.namedItem(name);
        if(field){
          if(field.tagName==='SELECT'&&!Array.from(field.options).some(o=>o.value===value))continue;
          field.value=value;
          field.dispatchEvent(new Event('input',{bubbles:true}));
          field.dispatchEvent(new Event('change',{bubbles:true}));
        }
      }
    }
    location.hash='thu-do';
    const note=document.querySelector('#message');
    if(note)note.textContent='Đã chọn bản phối di sản. Hãy thêm ảnh của bạn để bắt đầu ướm thử!';
  }catch{button.textContent='Chưa tải được bản phối — bấm để thử lại';}
}));

// Tương tác cẩm nang: Hiểu chiếc áo bạn chọn
document.querySelectorAll('[data-lore-tab]').forEach(tab=>tab.addEventListener('click',()=>{
  const targetKey=tab.dataset.loreTab;
  document.querySelectorAll('[data-lore-tab]').forEach(t=>{
    const active=t===tab;
    t.classList.toggle('is-active',active);
    t.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('[data-lore-panel]').forEach(panel=>{
    panel.hidden=panel.dataset.lorePanel!==targetKey;
  });
}));

// Nút nhảy nhanh từ thẻ bộ sưu tập xuống phần giải mã áo
document.querySelectorAll('[data-jump-lore]').forEach(btn=>btn.addEventListener('click',e=>{
  e.preventDefault();
  const targetKey=btn.dataset.jumpLore;
  const tab=document.querySelector(`[data-lore-tab="${targetKey}"]`);
  if(tab){
    tab.click();
    const loreSection=document.querySelector('#hieu-chiec-ao');
    if(loreSection)loreSection.scrollIntoView({behavior:'smooth',block:'start'});
  }
}));
})();
