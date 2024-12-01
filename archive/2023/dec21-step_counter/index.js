import { strict as assert } from 'assert'
import { inspect } from 'util'
import plotGrid from '../../../util/plotGrid.js'

const toKey = ({ x, y }) => `(${x},${y})`
const move = (garden = {}) => ({
  'up': ({ x, y }) => garden[toKey({ x, y: y - 1 })],
  'dn': ({ x, y }) => garden[toKey({ x, y: y + 1 })],
  'lt': ({ x, y }) => garden[toKey({ x: x - 1, y })],
  'rt': ({ x, y }) => garden[toKey({ x: x + 1, y })],
})

function walkGarden (garden = {}, start = [], maxSteps, showIntermediate = false) {
  let nSteps = 0
  const walk = move(garden)
  start.forEach(pos => pos.steps = nSteps)
  let nPlots = [...start]
  const reached = new Set(nPlots)
  while (nSteps++ < maxSteps) {
    const nextPlots = new Set(nPlots
      .flatMap(pos => ['up', 'dn', 'lt', 'rt'].flatMap(dir => walk[dir](pos) || []))
      .filter(pos => pos.char !== '#' && !reached.has(pos)))
    if (showIntermediate) console.log({ nSteps, reached: reached.size, nPlots: nPlots.length, nextPlots: nextPlots.size })
    nPlots = Array.from(nextPlots)
    nPlots.forEach(pos => pos.steps = nSteps)
    nPlots.forEach(pos => reached.add(pos))
  }
  return reached
}

function* part1({ garden }, config) {
  const { showIntermediate, maxSteps } = config
  const start = Object.values(garden).find(el => el.char === 'S')
  const reached = walkGarden(garden, [start], maxSteps, showIntermediate)
  yield reached
}

function*  part2({ garden, width}, config) {
  const { showIntermediate, maxSteps, stepsFromCorners, stepsFromStart } = config
  const toCorners = (max) => ['(0,0)', `(${max},0)`, `(0,${max})`, `(${max},${max})`].map(key => garden[key])
  let start = toCorners(width - 1)
  if (showIntermediate) yield ({ start, width, maxSteps, stepsFromCorners, stepsFromStart })
  const corners = walkGarden(garden, start, stepsFromCorners, showIntermediate)
  start = Object.values(garden).filter(el => el.char === 'S')
  const map =walkGarden(garden, start, stepsFromStart, showIntermediate)
  // if (showIntermediate) {
  //   const visited = Object.values(garden).map(pos => ({ ...pos, char: (map.has(pos)) ? 'v' : pos.char }))
  //   plotGrid(visited)
  // }
  /* IMPORTANT: since oddCorners are getting subtracted, we can't assume [(0,0), (0,130), (130,0), (130,130)] as start
   * Instead, we need to filter the corners using the center as start.
   * In practice, I found oddCorners.length changed from 3553 to 3556.
   */
  const oddCorners = [...map].filter(pos => pos.steps % 2 === 1 && pos.steps > (stepsFromStart - stepsFromCorners))
  const evenCorners = [...corners].filter(pos => pos.steps % 2 === 0)
  const oddMap = [...map].filter(pos => pos.steps % 2 === 1)
  const evenMap = [...map].filter(pos => pos.steps % 2 === 0)
  if (showIntermediate) yield { oddCorners: oddCorners.length, evenCorners: evenCorners.length, oddMap: oddMap.length, evenMap: evenMap.length }

  const radius = (maxSteps + (width + 1)/2) / width
  if (showIntermediate) console.log(`n = ${radius}; n^2 * ${oddMap.length} - n * ${oddCorners.length} + (n-1)^2 * ${evenMap.length} + (n-1) * ${evenCorners.length}`)
  const accessible =
    Math.pow(radius, 2) * oddMap.length
    - radius * oddCorners.length
    + Math.pow(radius - 1, 2) * evenMap.length
    + (radius - 1) * evenCorners.length
  yield accessible
}
/* Guesses include:
 * 598699054068631 (too high)
 * 598003268203566 (wrong)
 * 598044246091826 (correct) -- why?


/* Given an array of input: ['...........', '.....###.#.', ...],
 * yields a garden map of nodes w/ coord keys:
 *  - garden: { '(0,0)': { key: '(0,0)', x: 0, y: 0, char: '.' }, ... }
 */
function interpret(input) {
  const [height, width] = [input.length, input[0].length]
  const garden = input
    .map((line, y) => [...line].map((char, x) => ({ x, y, char })))
    .flat()
    .reduce((obj, node) => Object.assign(obj, { [toKey(node)]: { key: toKey(node), ...node } }), {})
  const start = Object.values(garden).find(el => el.char === 'S')
  return { garden, height, width, start }
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
  if (config.part === 1) {
    config.maxSteps = (data.start.key == '(5,5)') ? 6 : 64
    // for (const output of evolveSteps(data, config)) yield inspect(output), result = output
    for (const output of part1(data, config)) yield inspect(output), result = output
    yield Array.from(result).filter(pos => pos.steps % 2 === 0).length
  } else {
    if (data.start.key == '(5,5)') {
      Object.assign(config, { maxSteps: 500, stepsFromCorners: 6, stepsFromStart: 11 })
    } else {
      Object.assign(config, { maxSteps: 26501365, stepsFromCorners: 64, stepsFromStart: 130 })
    }
    for (const output of part2(data, config)) yield inspect(output), result = output
  }
}
