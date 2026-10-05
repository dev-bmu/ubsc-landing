import fs from 'node:fs'
import postcss from 'postcss'
const [, , file, prop] = process.argv
postcss.parse(fs.readFileSync(file, 'utf8')).walkDecls((d) => {
  if (d.prop === prop || d.prop === prop.replace(/^-webkit-/, '')) {
    let p = d.parent, chain = []
    while (p && p.type !== 'root') { chain.unshift(p.type === 'rule' ? p.selector : `@${p.name} ${p.params}`); p = p.parent }
    console.log(`${d.prop}: ${d.value}  <=  ${chain.join(' > ').slice(0, 160)}`)
  }
})
