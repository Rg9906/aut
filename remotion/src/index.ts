import '@fontsource/lilita-one/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {continueRender, delayRender, registerRoot} from 'remotion';
import {Root} from './Root';

// Make sure bundled fonts are ready before any frame is captured.
const handle = delayRender('fonts');
Promise.all([
  document.fonts.load('48px "Lilita One"'),
  document.fonts.load('500 48px "Fredoka"'),
  document.fonts.load('600 48px "Fredoka"'),
  document.fonts.load('700 48px "Fredoka"'),
  document.fonts.load('500 40px "JetBrains Mono"'),
  document.fonts.load('700 40px "JetBrains Mono"'),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

registerRoot(Root);
