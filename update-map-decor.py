from pathlib import Path

root = Path(__file__).parent
extra = '''
      <!-- Static ornamental accents; decorative, not geographic features. -->
      <g class="map-extra-ornaments" fill="none" stroke="#A67C32" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
        <g class="map-lotus-ornament" transform="translate(440, 765)" opacity="0.7">
          <path d="M0 0 C-16 -14 -13 -30 0 -43 C13 -30 16 -14 0 0Z" fill="#E4CCA0"/>
          <path d="M0 0 C-26 -4 -34 -18 -30 -32 C-10 -29 -2 -16 0 0Z M0 0 C26 -4 34 -18 30 -32 C10 -29 2 -16 0 0Z" fill="#F2E7D2"/>
          <path d="M0 0 C-29 5 -43 -3 -48 -18 C-26 -20 -10 -11 0 0Z M0 0 C29 5 43 -3 48 -18 C26 -20 10 -11 0 0Z"/>
          <path d="M-58 9 Q-30 3 0 9 T58 9 M-38 17 Q0 12 38 17" opacity="0.65"/>
          <circle cx="0" cy="25" r="2" fill="#A67C32" stroke="none"/>
        </g>
        <g class="map-bird-ornament" transform="translate(465, 330)" opacity="0.65">
          <path d="M-35 -12 Q-14 -24 0 -4 Q12 -22 38 -15 Q14 -11 0 2 Q-16 -11 -35 -12Z" fill="#DDC69B"/>
          <path d="M0 2 L-4 12 L7 5 L15 4 M-14 -29 Q-2 -37 9 -24 Q18 -37 34 -31"/>
        </g>
        <g class="map-wave-ornament" transform="translate(470, 585)" opacity="0.42">
          <path d="M0 0 Q9 -7 18 0 T36 0 T54 0 T72 0 T90 0 M12 9 Q21 2 30 9 T48 9 T66 9 T84 9 M30 18 Q39 11 48 18 T66 18"/>
        </g>
      </g>
'''

for path in [root / 'ai-studio-app/public/map.js', root / 'Xem-truoc-ghep-trang-phuc.html']:
    source = path.read_text(encoding='utf-8')
    if 'id="vietnam-decor-foreground"' in source:
        print('Already updated:', path.name)
        continue
    start = source.index('      <!-- ANTIQUE MAP CARTOUCHE')
    end = source.index('      <!-- CARTOGRAPHIC DECORATION LAYER', start)
    decor = source[start:end]
    decor = decor.replace('width="170" height="48"', 'width="190" height="48"', 1)
    decor = decor.replace('width="164" height="42"', 'width="184" height="42"', 1)
    decor = decor.replace('fill="rgba(255, 253, 248, 0.94)"', 'fill="#FFFDF8"', 1)
    decor = decor.replace(' stroke-width="1.4" filter="url(#vpr-pin-glow)"', ' stroke-width="1.4"', 1)
    source = source[:start] + source[end:]
    insert = source.rfind('      <!--', 0, source.index('      <g class="sacred-islands">'))
    foreground = '      <!-- Foreground ornaments: above geography, below island labels and interactive pins. -->\n      <g id="vietnam-decor-foreground" pointer-events="none" aria-hidden="true">\n' + decor + extra + '      </g>\n\n'
    source = source[:insert] + foreground + source[insert:]
    path.write_text(source, encoding='utf-8')
    print('Updated:', path.name)
