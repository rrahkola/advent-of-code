import { strict as assert } from 'assert'
import { inspect } from 'util'

const printRocks = ({ rocks, height = 10, width = 10 }) => {
  const board = new Array(height).fill(0).map(_ => new Array(width).fill('.'))
  rocks.forEach(rock => board[rock.row][rock.col] = 'O')
  const weight = rocks.reduce((acc, rock) => acc + (height - rock.row), 0)
  return board.map(arr => arr.join('')).join('\n') + `\nweight: ${weight}`
}

// General memoizing function, with .cache property for inspection
function memoize(fn) {
  const cache = {}
  function memo(dir, board, rocks) {
    const key = `${dir} ${board}`
    if (cache[key] !== undefined) return cache[key]
    const result = fn(dir, rocks)
    cache[key] = result
    return result
  }
  memo.cache = cache
  return memo
}

const sortRolls = {
  'up': (a, b) => a.row - b.row,
  'dn': (a, b) => b.row - a.row,
  'lt': (a, b) => a.col - b.col,
  'rt': (a, b) => b.col - a.col
}
/* Given an array of nodes: [{ char, row, col, up, dn, lt, rt }, ...],
 * yields a memoized function which rolls rocks along each node, starting with nearest
 */
const rollEm = memoize((dir, rocks) => {
  const nextRocks = []
  const filled = []
  const roll = (rock) => {
    let next = rock.node
    while(next[dir] && !next[dir].isWall && !filled.includes(next[dir].key)) next = next[dir]
    nextRocks.push({ node: next, row: next.row, col: next.col })
    filled.push(next.key)
  }
  rocks.sort(sortRolls[dir])
  rocks.forEach(rock => roll(rock, dir))
  return nextRocks
})

function* cycleRolls(data, config) {
  const { showIntermediate, numCycles, singleRoll = false } = config
  let rocks = data.rocks
  let board = printRocks({ ...data, rocks })
  let boards = {}
  let i = 0
  while(i++ < numCycles && !Object.keys(boards).includes(board)) {
    boards[board] = rocks
    rocks = rollEm('up', board, rocks)
    if (singleRoll) break
    rocks = rollEm('lt', board, rocks)
    rocks = rollEm('dn', board, rocks)
    rocks = rollEm('rt', board, rocks)
    board = printRocks({ ...data, rocks })
    if (showIntermediate) yield `i = ${i}:\n${board}`
  }
  const cycleStart = Object.keys(boards).indexOf(board)
  const cycleLength = --i - cycleStart
  const idx = ((numCycles - cycleStart) % cycleLength) + cycleStart
  board = Object.keys(boards)[idx]
  if (showIntermediate) yield { cycleStart, cycleLength, board, idx }
  yield { board, rocks: boards[board] }
}

/* Given an array of input: ['O....#....', ...],
 * yields a board (array of nodes) and an array of round rocks:
 *    - board: [{ key, row, col, isWall = false, up, dn, lt, rt }, ...]
 *    - rocks: [{ node, row, col }, ...]
 * nodes without rocks will have null
 */
function interpret(input) {
  const rocks = []
  const makeNode = ({ char, row, col }) => {
    const node = { key: `${row},${col}`, row, col, isWall: (char === '#') }
    const rock = { node, row, col }
    if (char === 'O') rocks.push(rock)
    return node
  }
  const nodes = input.map((line, row) => line.split('').map((char, col) => makeNode({ char, row, col }))).flat()
  const [height, width] = [input, input[0]].map(arr => arr.length)
  nodes.forEach((node, i) => {
    const { row, col } = node
    const [up, dn, lt, rt] = [[row-1,col], [row+1,col], [row,col-1], [row,col+1]].map(pos => nodes.find(el => el.row === pos[0] && el.col === pos[1]))
    Object.assign(node, { up, dn, lt, rt })
  })
  return { nodes, rocks, height, width }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  const { height } = data
  config.numCycles = 1000000000
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) config.singleRoll = true
  for (const output of cycleRolls(data, config)) yield inspect(output), result = output
  const weight = result.rocks.reduce((acc, rock) => acc + (height - rock.row), 0)
  yield inspect({ weight })
}
