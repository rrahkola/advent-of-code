import { strict as assert } from 'assert'
import { inspect } from 'util'

const move = { up: [0, -1], dn: [0, 1], lt: [-1, 0], rt: [1, 0] }
function nextPos(node, dir, amt = 1) {
  return ['col', 'row']
    .map((pos, dim) => ({ [pos]: node[pos] + amt * move[dir][dim] }))
    .reduce((obj, pos) => ({ ...obj, ...pos }), {})
}

/*  Given a 2D-array of lagoon outline: [[{ col: 0, row: 0, char: '#'}, ...], ...]
 *  and a starting point inside the lagoon: { col: 1, row: 1 },
 *  fills the interior using BFS w/ simple queue
 */
function* fillBoard({ board, startFill }, config) {
  const { showIntermediate } = config
  const notQueued = node => !queue.some(el => el.row === node.row && el.col === node.col)
  const queue = [startFill]
  if (showIntermediate) console.log(`border:\n${board.map(el => el.join('')).join('\n')}`)
  while (queue.length > 0) {
    const current = queue.shift()
    board[current.row][current.col] = '#'
    const neighbors = ['up', 'dn', 'lt', 'rt']
      .map(dir => nextPos(current, dir))
      .filter(notQueued)
      .filter(el => board[el.row][el.col] !== '#')
    neighbors.forEach(el => queue.push(el))
  }
  if (showIntermediate) console.log(`filled:\n${board.map(el => el.join('')).join('\n')}`)
  yield board.flat()
}

/*  Given the corners of the lagoon as an array of coordinates: [{ col, row }, ...], with origin at start and end,
 *  uses shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula) to calculate area
 *  of an irregular polygon: 1/2 * (|(x1,y1) (x2, y2)| + ... + |(xn, yn) (x1, y1)|)
 *  where determinant |(xi, yi) (xj, yj)| = xi * yj - yi * xj
 *  NOTE: adding 1/2 * edges and origin seems to work, something to do with Pick's Theorem
 */
function* shoelaceArea({ lagoon }, config) {
  const { showIntermediate } = config
  const sums = [0, 0, 0]
  let prev = lagoon.shift()
  for (const vertex of lagoon) {
    sums[0] += prev.col * vertex.row
    sums[1] += prev.row * vertex.col
    sums[2] += Math.abs(vertex.row + vertex.col - prev.row - prev.col) // assume only 1-D movement
    if (showIntermediate) console.log({ sums, prev, vertex })
    prev = vertex
  }
  yield { area: .5 * Math.abs(sums[0] - sums[1] + sums[2]) + 1 }
}

/*  Given an array of input: ['R 7 (#32c140)', ...],
 *  yields board, startFill, and instructions:
 *    - board: [[{ id, col, row, char }, ...], ...] // organized by rows, then columns
 *    - startFill: { col, row }
 *    - instructions: [{ dir, num, hex }, ...]
 *    - height
 *    - width
 */
function interpret(input, { part }) {
  const tr = { R: 'rt', L: 'lt', U: 'up', D: 'dn' }
  const hexToDir = { '0': 'rt', '1': 'dn', '2': 'lt', '3': 'up' }
  const instructions = input
    .map(line => /^(?<dig>[RUDL]) (?<num>\d+) \(#(?<hex>\w{5})(?<dir>\w)\)/.exec(line).groups)
    .map(match => (part === 1)
          ? { dir: tr[match.dig], num: parseInt(match.num) }
          : { dir: hexToDir[match.dir], num: parseInt(match.hex, 16) })
          // : { dir: tr[match.dig], num: parseInt(match.num) })
  let current = { col: 0, row: 0, char: '#' }
  const lagoon = [current]
  for (const step of instructions) {
    const edge = (part === 1)
      ? new Array(step.num).fill(step.dir).map((dir, idx) => nextPos(current, dir, idx+1))
      : [nextPos(current, step.dir, step.num)]
    lagoon.push(...edge)
    current = edge.slice(-1)[0]
  }
  if (part === 2) return { lagoon }
  const [rangeCol, rangeRow] = ['col', 'row'].map(pos => [Math.max(...lagoon.map(el => el[pos])) + 1, Math.min(...lagoon.map(el => el[pos]))])
  const [width, height] = [rangeCol, rangeRow].map(([max, min]) => max - min)
  const startFill = { col: lagoon[1].col - rangeCol[1], row: lagoon[1].row - rangeRow[1] + 1 } // assumes first instruction is 'R ...'
  const board = new Array(height).fill(0).map(_ => new Array(width).fill('.'))
  for (const node of lagoon) board[node.row - rangeRow[1]][node.col - rangeCol[1]] = '#'
  return { board, instructions, lagoon, startFill, height, width }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input, config)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of fillBoard(data, config)) yield inspect(output), result = output
    const numFilled = result.filter(char => char === '#').length
    yield inspect({ numFilled })
  } else {
    // Find answer for part 2
    for (const output of shoelaceArea(data, config)) yield inspect(output), result = output
  }
}
