from pathlib import Path
import re

path = Path(__file__).parent / 'ai-studio-app/public/style.css'
source = path.read_text(encoding='utf-8')
start = source.index('/* Layered backdrop children */')
end = source.index('   SCENIC SELECTION RIBBON', start)
section = source[start:end]
palettes = {
    'hue': ('#EAE3EF', '#F7EEE8', '#FFF7E8', {'36153b':'D7CADF', '220b28':'C8B6D1', '14051a':'A994B4'}),
    'bacbo': ('#E4ECE3', '#F4EFDF', '#FFF8EC', {'223831':'C5D5C5', '172824':'B4C7B5', '0f1a18':'94AD9B'}),
    'taybac': ('#DFEDEB', '#EDF3EB', '#FFF6E4', {'193233':'B9D3CD', '112324':'A6C4B7', '223f38':'C1D3B7', '0b1718':'8DAE9E'}),
    'taynguyen': ('#F0E6D7', '#F8ECDD', '#FFF6E8', {'38120d':'DCC7AE', '240a07':'C9B496', '140503':'AF9778'}),
    'nambo': ('#DDEEEA', '#EDF4E7', '#FFF6DE', {'13383a':'B7D5C7', '0b2427':'A6C9BA', '061517':'88AF9E'}),
}
for theme, (top, mid, bottom, inks) in palettes.items():
    pattern = r'(\[data-scenic-theme="' + theme + r'"\] \.scenic-sky \{\s*background: )[^;]+;'
    section, count = re.subn(pattern, lambda m: m[1] + f'linear-gradient(180deg, {top} 0%, {mid} 48%, {bottom} 100%);', section)
    assert count == 1, theme
    # Recolor the existing regional SVG silhouettes, preserving their shapes.
    theme_start = section.index(f'[data-scenic-theme="{theme}"] .scenic-sky')
    next_theme = section.find('/* ------------------------------------------------------------', theme_start)
    if next_theme < 0:
        next_theme = len(section)
    chunk = section[theme_start:next_theme]
    for old, new in inks.items():
        chunk = chunk.replace('%23' + old, '%23' + new)
    chunk = re.sub(r'background: radial-gradient\(circle, [^;]+;', 'background: radial-gradient(circle, #FFFAE9 0%, rgba(255, 247, 218, 0.65) 38%, rgba(255, 250, 235, 0) 72%);', chunk)
    chunk = re.sub(r'box-shadow: 0 0 \d+px rgba\([^;]+;', 'box-shadow: none;', chunk)
    section = section[:theme_start] + chunk + section[next_theme:]
section = section.replace('height: 52%;\n  opacity: 0.55;', 'height: 48%;\n  opacity: 0.65;')
section = section.replace('height: 40%;\n  opacity: 0.75;', 'height: 34%;\n  opacity: 0.7;')
section = section.replace('height: 28%;\n  opacity: 0.95;', 'height: 24%;\n  opacity: 0.6;')
section = section.replace('background: radial-gradient(ellipse at center 40%, rgba(14, 25, 20, 0.62) 0%, rgba(10, 18, 14, 0.82) 80%);', '''/* Warm daylight keeps the center readable without darkening the scenery. */
  background:
    radial-gradient(ellipse at 48% 35%, rgba(255, 253, 246, 0.78) 0%, rgba(255, 253, 246, 0.3) 58%, transparent 100%),
    linear-gradient(180deg, rgba(255, 253, 246, 0.12), transparent 65%, rgba(255, 250, 237, 0.32));''')
source = source[:start] + section + source[end:]
source = source.replace('/* Layered backdrop children */', '''/* Daylight landscape: ivory paper, regional watercolor silhouettes and soft sunlight. */
.tryon-scenic-backdrop::after {
  content: "";
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(150, 119, 64, 0.16);
  border-radius: 28px;
  pointer-events: none;
}

/* Layered backdrop children */''', 1)
# Keep foreground surfaces crisp; moving landscapes do not need live glass blur.
source = source.replace('/* KÍNH MỜ GLASSMORPHISM CHO PHÒNG THỬ ĐỒ DI SẢN (XUYÊN THẤU DANH LAM THẮNG CẢNH) */', '/* Ivory surfaces over the daylight landscape; no live backdrop blur. */')
source = source.replace('[data-page="thu-do"] .workspace > .intro {\n  backdrop-filter: blur(18px) saturate(160%) !important;\n  -webkit-backdrop-filter: blur(18px) saturate(160%) !important;\n  background-color: rgba(255, 254, 250, 0.82) !important;', '''[data-page="thu-do"] .workspace > .intro,
[data-page="thu-do"] .stepper-silk-nav,
[data-page="thu-do"] .workspace-steps-col {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background-color: #FFFCF6 !important;''')
path.write_text(source, encoding='utf-8')
print('Updated daylight fitting room backdrop and ivory surfaces.')
