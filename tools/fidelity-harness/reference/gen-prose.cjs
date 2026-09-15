// styles.js typography di-require di sini, tempat require('tailwindcss/colors') resolve ke v3 (hex).
const styles = require('./typography-styles.cjs')
const out = []
for (const [cls, theme] of [['prose', 'gray'], ['prose-slate', 'slate']]) {
  const vars = Object.entries(styles[theme].css).filter(([k]) => k.startsWith('--tw-prose-'))
  out.push(`  .${cls} {\n${vars.map(([k, v]) => `    ${k}: ${v};`).join('\n')}\n  }`)
}
require('fs').writeFileSync('prose-v3-vars.css', out.join('\n'))
console.log(out.join('\n').split('\n').slice(0, 8).join('\n'), '\n  ...', out.join('\n').split('\n').length, 'baris')
