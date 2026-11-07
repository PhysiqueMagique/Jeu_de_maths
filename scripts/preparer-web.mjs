// Copie les fichiers du jeu (HTML, CSS, JS) dans dist/, le dossier que Tauri
// emballe dans l'application Windows. Lancé automatiquement par « tauri build ».
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(racine, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const element of ['index.html', 'css', 'js', 'activites']) {
  cpSync(join(racine, element), join(dist, element), { recursive: true });
}
console.log('Fichiers du jeu copiés dans dist/');
