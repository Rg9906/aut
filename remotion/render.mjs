// Usage: node render.mjs <props.json> <out.mp4> [--still <seconds> <out.png>]
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const [propsPath, outPath, ...rest] = process.argv.slice(2);
const inputProps = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
const browserExecutable = process.env.CHROME_BIN || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

const serveUrl = await bundle({
  entryPoint: path.join(here, 'src/index.ts'),
  publicDir: path.join(here, 'public'),
});

const composition = await selectComposition({serveUrl, id: 'Short', inputProps, browserExecutable});

if (rest[0] === '--still') {
  const sec = Number(rest[1]);
  await renderStill({composition, serveUrl, output: rest[2], frame: Math.round(sec * composition.fps), inputProps, browserExecutable});
  console.log('still ->', rest[2]);
} else {
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
    browserExecutable,
    concurrency: 2,
    crf: 20,
    onProgress: ({progress}) => {
      if (Math.round(progress * 100) % 20 === 0) process.stdout.write(`\rrender ${Math.round(progress * 100)}%`);
    },
  });
  console.log('\nvideo ->', outPath);
}
