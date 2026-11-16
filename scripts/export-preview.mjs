import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
let html = await readFile(path.join(dist, 'index.html'), 'utf8');
const jsFile = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
const cssFile = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/)?.[1];
if (!jsFile || !cssFile) throw new Error('Build the application before exporting the preview.');
let js = await readFile(path.join(dist, jsFile), 'utf8');
const css = await readFile(path.join(dist, cssFile), 'utf8');
for (const name of ['clinic', 'team', 'logo', 'hero-video-first', 'hero-video-last']) {
  const asset = await readFile(path.join(dist, 'images', `${name}.webp`));
  js = js.replaceAll(`./images/${name}.webp`, `data:image/webp;base64,${asset.toString('base64')}`);
}
const video = await readFile(path.join(dist, 'media', 'hero-smile.mp4'));
js = js.replaceAll('./media/hero-smile.mp4', `data:video/mp4;base64,${video.toString('base64')}`);
const favicon = await readFile(path.join(dist, 'favicon.svg'));
html = html.replace(/(?:\.\/|\/)favicon\.svg/, `data:image/svg+xml;base64,${favicon.toString('base64')}`);
html = html.replace(/<link[^>]*href="[^"]+\.css"[^>]*>/, () => `<style>${css}</style>`);
html = html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
const output = path.resolve(process.argv[2] ?? '../DVT-Denta-preview.html');
await writeFile(output, html);
console.log(`Standalone preview: ${output}`);
