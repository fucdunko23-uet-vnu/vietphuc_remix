from pathlib import Path
p=Path('build-full-site.cjs');s=p.read_text(encoding='utf-8').replace('<a href="#kham-pha" class="solid-link">Khám phá bản phối ↗</a>','<a href="#kham-pha" class="solid-link page-action-explore btn-silk">Khám phá bản phối ↗</a>');p.write_text(s,encoding='utf-8')
