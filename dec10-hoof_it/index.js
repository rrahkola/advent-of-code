import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

const RANK_SCORE = Symbol('score')
const RANK_RATING = Symbol('rating')
const coord = ({ col, row }) => `${col},${row}`
const mv = {
  up: ({ col, row }) => `${col},${row - 1}`,
  rt: ({ col, row }) => `${col + 1},${row}`,
  dn: ({ col, row }) => `${col},${row + 1}`,
  lt: ({ col, row }) => `${col - 1},${row}`
}
const dirs = ['up', 'rt', 'dn', 'lt']

// Yield an array of paths leading to height 9
function walk(path, map) {
  const { col, row, height } = path.slice(-1)[0]
  if (height === 9) return [path]
  const opts = dirs
    .map(dir => mv[dir]({ col, row }))
    .filter(pos => map[pos] && map[pos].height === height + 1)
  // console.log({ msg: 'Found options', path, opts })
  return opts.flatMap(pos => walk([...path, map[pos]], map))
}

/*  Given a topographical map of coords,
 *  yields a
 */
function* part1({ map, trailheads }, config) {
  const paths = []
  const { showIntermediate, rank = RANK_SCORE } = config
  for (const start of trailheads) {
    const routes = walk([start], map)
    if (showIntermediate) yield { start, routes: routes.length }
    if (rank === RANK_SCORE) {
      const score = new Set(routes.map(route => route.slice(-1)[0]))
      paths.push({ start, rank: score.size })
    } else {
      paths.push({ start, rank: routes.length })
    }
  }
  yield paths
}

/*  Given an array of input: ['89010123', '78121874', ...],
 *  yields coordinates with topography data
 */
function interpret(input) {
  const map = {}
  const trailheads = []
  let row = 0
  for (const line of input) {
    line.split('').forEach((char, col) => {
      const height = Number.parseInt(char, 0)
      map[coord({ col, row })] = { col, row, height }
      if (height === 0) trailheads.push({ col, row, height })
    })
    row++
  }
  return { map, trailheads }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  config.rank = (config.part === 1) ? RANK_SCORE : RANK_RATING
  for (const output of part1(data, config)) yield inspect(output), result = output
  yield `Total score: ${result.reduce((acc, { rank }) => acc + rank, 0)}`
}
