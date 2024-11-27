import { strict as assert } from 'assert'
import { inspect } from 'util'

function toString ({ universe }) {
  return universe.map(row => row.join(' ')).join('\n')
}

/* Given an array of input: ['', ...]
 */
function* findShortestPaths({ galaxies }, config) {
  const { showIntermediate } = config
  const pairs = []
  galaxies.forEach((g, idx) => {
    if (idx+1 === galaxies.length) return
    for (const h of galaxies.slice(idx+1)) pairs.push([g, h])
  })
  const minPaths = pairs.map(([a, b]) => {
    const across = Math.abs(b.col - a.col)
    const down = Math.abs(b.row - a.row)
    return { path: `${a.id} --> ${b.id}`, across, down, dist: across + down }
  })
  yield minPaths
}

/* Given an array of input: ['...#......', ...],
 * performs an 'expanded universe' of space '.' and galaxies ('#' --> '1')
 * where every empty col or row is doubled.
 * Yields an array of galaxies:
 *   - [{ id, row, col }]
 */
function interpret(input, { spacing, showIntermediate }) {
  const galaxies = []
  let universe = input.map(line => line.split(''))
  // 1st pass: collect galaxies
  universe.forEach((slice, row) => slice.forEach((char, col) => {
    const id = galaxies.length + 1
    if (char === '#') {
      galaxies.push({ id, row, col, oRow: row, oCol: col })
      slice[col] = id
    }
  }))
  if (showIntermediate) console.log(toString({ universe }))
  // 2nd pass: expand the universe
  for (let j = 0; j < universe[0].length; j++) {
    const slice = universe.map(row => row[j]).join('')
    if (/\d+/.exec(slice)) continue
    if (showIntermediate) console.log('Found empty col:', j)
    galaxies.filter(({ oCol }) => oCol > j).forEach(el => el.col += spacing)
  }
  for (let i = 0; i < universe.length; i++) {
    const slice = universe[i].join('')
    if (/\d+/.exec(slice)) continue
    if (showIntermediate) console.log('Found empty row:', i)
    galaxies.filter(({ oRow }) => oRow > i).forEach(el => el.row += spacing)
  }
  return { galaxies }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  config.spacing = (config.part === 1) ? 1 : 999999
  const data = interpret(input, config)
  if (config.showIntermediate) yield inspect(data)
  for (const output of findShortestPaths(data, config)) yield inspect(output), result = output
  const sumDistances = result.reduce((sum, { dist }) => sum + dist, 0)
  yield inspect({ sumDistances })
}
