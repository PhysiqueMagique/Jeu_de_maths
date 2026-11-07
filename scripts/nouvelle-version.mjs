// Change le numéro de version partout : node scripts/nouvelle-version.mjs 0.2.0
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const v = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(v || '')) {
  console.error('Usage : node scripts/nouvelle-version.mjs 0.2.0');
  process.exit(1);
}
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const modifier = (fichier, f) => {
  const p = join(racine, fichier);
  writeFileSync(p, f(readFileSync(p, 'utf8')));
};
modifier('src-tauri/tauri.conf.json', (s) => s.replace(/"version": "[^"]+"/, `"version": "${v}"`));
modifier('package.json', (s) => s.replace(/"version": "[^"]+"/, `"version": "${v}"`));
modifier('src-tauri/Cargo.toml', (s) => s.replace(/^version = "[^"]+"/m, `version = "${v}"`));
console.log(`Version ${v}. Ensuite :`);
console.log(`  1. Ajouter une section « ## ${v} » en haut de NOUVEAUTES.md`);
console.log(`  2. git commit -am "Version ${v}" && git push`);
console.log('  GitHub construit et publie la nouvelle version tout seul.');
