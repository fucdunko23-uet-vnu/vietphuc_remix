from pathlib import Path
p=Path('ai-studio-app/public/index.html')
s=p.read_text(encoding='utf-8')
a=s.index('      <div class="results-actions-bar">')
b=s.index('      <div id="cards"',a)
actions=s[a:b]
s=s[:a]+s[b:]
a=s.index('  </main>',s.index('<section id="results"'))
section='''    <section id="outfit-card-section" class="outfit-card-section" hidden aria-labelledby="outfit-card-title">
      <span class="eyebrow">LƯU GIỮ BẢN PHỐI</span>
      <h2 id="outfit-card-title">Thẻ trang phục trong ngày</h2>
      <p>Chọn ảnh thử đồ vừa tạo để đóng khung, ghép dải ảnh hoặc so sánh trước và sau.</p>
'''+actions+'''      <div id="outfit-card-looks" class="outfit-card-looks"></div>
    </section>
'''
s=s[:a]+section+s[a:]
s=s.replace('Tạo Thẻ OOTD & Ghép Photobooth','Đóng khung & ghép dải ảnh').replace('Dải ảnh 4 ô thời thượng, Before/After & Thẻ OOTD Story','Dải ảnh 4 ô, so sánh trước và sau, thẻ dọc 9:16').replace('Tải Thẻ OOTD Nhanh','Tạo thẻ trang phục trong ngày').replace('Studio Đóng Khung Photobooth & Thẻ OOTD','Đóng khung ảnh & thẻ trang phục trong ngày').replace('Thẻ OOTD Heritage (9:16)','Thẻ trang phục trong ngày (9:16)')
p.write_text(s,encoding='utf-8')
p=Path('ai-studio-app/public/app.js')
s=p.read_text(encoding='utf-8')
s=s.replace("  $('#cards').replaceChildren();", "  resetOutfitCards();\n  $('#cards').replaceChildren();",1)
a=s.index('    // Button to make OOTD card')
b=s.index('    card.append(body);',a)
s=s[:a]+'''    body.append(swatches, element('p', look.outfit, 'look-outfit'), dl, reasonBox);
'''+s[b:]
needle="  const source = element(data.heritage.url"
pos=s.index(needle)
s=s[:pos]+'''  if (hasGeneratedPhotos()) {
    const lookActions = $('#outfit-card-looks');
    data.looks.forEach((look, index) => {
      const button = element('button', 'Đóng khung phương án ' + (index + 1), 'btn-card-ootd');
      button.type = 'button';
      button.addEventListener('click', () => openPhotoboothStudio('ootd', index));
      lookActions.append(button);
    });
    $('#outfit-card-section').hidden = false;
  }

'''+s[pos:]
pos=s.index('function showResults(')
s=s[:pos]+'''function hasGeneratedPhotos() {
  const result = window.currentResultsData;
  return result?.mode === 'flow' && result.data?.images?.length >= 2 &&
    result.data.images.every(image => /^image\\/(png|jpeg|webp)$/.test(image.mimeType) && typeof image.data === 'string' && image.data.length > 0);
}

function resetOutfitCards() {
  $('#outfit-card-section').hidden = true;
  $('#outfit-card-looks').replaceChildren();
  closePhotoboothStudio();
  window.currentResultsData = null;
  photoboothRenderVersion++;
}

'''+s[pos:]
s=s.replace("  if (!res || !res.data) return;", "  if (!hasGeneratedPhotos()) return;",1)
s=s.replace("function openPhotoboothStudio(preferredLayout = 'strip', focusIndex = 0) {", "function openPhotoboothStudio(preferredLayout = 'strip', focusIndex = 0) {\n  if (!hasGeneratedPhotos() || busy) return;",1)
s=s.replace("      startLoadingLounge('demo');", "      resetOutfitCards();\n      startLoadingLounge('demo');",1).replace("      startLoadingLounge('flow');", "      resetOutfitCards();\n      startLoadingLounge('flow');",1)
s=s.replace('Thẻ OOTD / Photobooth','thẻ trang phục trong ngày và dải ảnh').replace('Thẻ OOTD Di Sản','Thẻ trang phục trong ngày').replace('bức ảnh OOTD','bức ảnh trang phục trong ngày').replace('Tạo Thẻ OOTD & Ghép Photobooth','Đóng khung & ghép dải ảnh').replace('#ootd','#trangphuctrongngay')
s=s.replace("drawRoundedRect(ctx, imgX + 30, imgY + 30, 240, 48, 12);", "drawRoundedRect(ctx, imgX + 30, imgY + 30, 340, 48, 12);").replace("ctx.fillText('OOTD · DI SẢN ĐƯƠNG ĐẠI', imgX + 150, imgY + 60);", "ctx.fillText('TRANG PHỤC TRONG NGÀY', imgX + 200, imgY + 60);")
s=s.replace('viet-phuc-ootd-', 'viet-phuc-trang-phuc-trong-ngay-').replace('viet-phuc-ootd.png','viet-phuc-trang-phuc-trong-ngay.png')
p.write_text(s,encoding='utf-8')
