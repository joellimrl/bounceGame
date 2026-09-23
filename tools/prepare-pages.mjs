import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

// Keep reference documentation intact while replacing the generated game files.
await mkdir('docs', { recursive: true });
for (const folder of ['assets', 'levels']) {
  await rm(`docs/${folder}`, { recursive: true, force: true });
  await cp(`dist/${folder}`, `docs/${folder}`, { recursive: true });
}
await cp('dist/index.html', 'docs/index.html');
await writeFile('docs/.nojekyll', '');
console.log('Pages files ready in docs/. Commit these files before pushing.');
