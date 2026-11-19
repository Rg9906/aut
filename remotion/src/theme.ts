// Brand kit. Swap these to rebrand the whole channel.
export const theme = {
  bg: '#0B0F1A',
  bg2: '#121A2E',
  card: '#151D33',
  text: '#F3F6FF',
  dim: '#8FA0C4',
  accent: '#5EEAD4', // teal  (Byte)
  accent2: '#A78BFA', // violet
  amber: '#FBBF24', // (Compy)
  good: '#4ADE80',
  bad: '#FB7185',
  warn: '#FBBF24',
  mono: '"JetBrains Mono", "DejaVu Sans Mono", Menlo, Consolas, monospace',
  sans: '"Inter", "DejaVu Sans", "Helvetica Neue", Arial, sans-serif',
};

export const speakerColor = {byte: theme.accent, compy: theme.amber} as const;

// Shorts safe zones (px, 1080x1920): leave room for YouTube UI.
export const safe = {top: 230, bottom: 430, side: 70};
