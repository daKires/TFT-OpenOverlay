// Copia os arquivos estáticos do pacote Overwolf (overwolf/) para o build da UI
// (dist/), que é o diretório carregado no cliente Overwolf via
// "Load unpacked extension". Node puro, sem dependências (fs/path, não shell),
// então funciona igual no Windows/macOS/Linux.
//
// Uso: node scripts/copy-overwolf.mjs   (ou via `npm run overwolf:build`)

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // .../scripts
const projectRoot = join(here, '..');
const overwolfDir = join(projectRoot, 'overwolf');
const distDir = join(projectRoot, 'dist');

const FILES = ['manifest.json', 'background.html', 'background.js', 'icon.png'];

// Auto-cura: num clone novo o ícone pode não existir ainda em overwolf/.
// Se faltar, copia o ícone do Tauri (mesmo binário, sem gerar arte nova).
const iconPath = join(overwolfDir, 'icon.png');
const iconSource = join(projectRoot, 'src-tauri', 'icons', '128x128.png');
if (!existsSync(iconPath) && existsSync(iconSource)) {
  mkdirSync(overwolfDir, { recursive: true });
  copyFileSync(iconSource, iconPath);
  console.log('overwolf/icon.png criado a partir de src-tauri/icons/128x128.png');
}

mkdirSync(distDir, { recursive: true });

let copied = 0;
for (const file of FILES) {
  const from = join(overwolfDir, file);
  if (!existsSync(from)) {
    console.warn(`AVISO: overwolf/${file} não encontrado — pulando.`);
    continue;
  }
  copyFileSync(from, join(distDir, file));
  copied += 1;
}

console.log(`Overwolf: ${copied}/${FILES.length} arquivo(s) copiado(s) para dist/.`);
