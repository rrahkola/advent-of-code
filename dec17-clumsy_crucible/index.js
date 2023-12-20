import { strict as assert } from 'assert'
import { inspect } from 'util'
import { PriorityQueue } from "@datastructures-js/priority-queue"

const validNext = { 'up': ['lt', 'up', 'rt'], 'rt': ['up', 'rt', 'dn'], 'dn': ['rt', 'dn', 'lt'], 'lt': ['dn', 'lt', 'up'] }
const compare = (hash) => (a, b) => (a.g + a.h) - (b.g + b.h)
function getPath (node) {
  return (!node.prev) ? [node.id] : [...getPath(node.prev), node.id]
}
const printBoard = (nodes, path) => {
  const [height, width] = ['row', 'col'].map(pos => Math.max(...nodes.map(el => el[pos])) + 1)
  const board = new Array(height).fill(0).map(_ => new Array(width).fill(''))
  const tr = {'rt': '>', 'lt': '<', 'up': '^', 'dn': 'v'}
  nodes.forEach(node => board[node.row][node.col] = node.loss)
  path.forEach(id => {
    const node = nodes.find(el => el.id === id)
    board[node.row][node.col] =  '*'
  })
  return board.map(row => row.join('')).join('\n')
}
const summary = ({ id, row, col, loss, g, h }) => ({ id, row, col, loss, g, h })
/* General rules for finding valid neighbors
 *  - must not go backwards
 *  - max wobble tiles in same direction <= 3 (or for part 2, between 4 and 10)
 *  - must cost <= current neighbor's cost
 *  - must wobble less than current neighbor
 */
const findNeighbors = (condition) => ({ dir, n, ...node }) => {
  const neighbors = validNext[dir]
    .map(out => ({ dir: out, n: (dir === out) ? n+1 : 1, ...node[out] }))
    .filter(el => el.id) // ignore out-of-bounds
    .filter(el => condition(n, el.n))
    .filter(el => el.g >= el.loss + node.g)
    .map(el => ({ ...el, g: el.loss + node.g, prev: node }))
  // console.log(`dir: ${dir}, current: ${node.id}, neighbors:\n`, neighbors.map(summary))
  return neighbors
}

/* Given an array of heat-losing nodes: [{ loss, row, col }, ...],
 * searches through the nodes for the least-loss using A* best-first search
 */
function* searchNodes({ nodes }, config) {
  const { showIntermediate, queue, goal, condition } = config
  let visited = new Map()
  const key = el => `${el.id} dir=${el.dir} n=${el.n}`
  let current
  let snapshot = 0
  while(queue.size() > 0) {
    current = queue.dequeue() // highest priority node
    if (current.id === goal.id) break
    const neighbors = findNeighbors(condition)(current)
      .filter(el => !visited.get(key(el)) && visited.set(key(el), el))
    if (showIntermediate && ++snapshot % 100000 === 0) console.log({ snapshot, current: summary(current), neighbors: neighbors.map(node => summary(node)), queue: queue.size() })
    neighbors.map(node => queue.enqueue(node))
  }
  const path = getPath(current)
  if (showIntermediate) console.log(printBoard(nodes, path))
  yield { current: summary(current), path }
}

/* Given an array of input: ['2413432311323', ...],
 * yields an array of nodes with heat loss:
 *    [{ id, loss, row, col, g, h, wobble, up, dn, lt, rt }, ...]
 * where g is estimated current cost of path and h is estimated future cost of path
 */
function interpret(input) {
  const nodes = input.map((line, row) => [...line].map((char, col) => ({ id: `r${row}c${col}`, loss: Number(char), row, col }))).flat()
  const nodemap = nodes.reduce((obj, node) => Object.assign(obj, { [node.id]: node }), {})
  const [height, width] = [input, input[0]].map(arr => arr.length)
  nodes.forEach((node, i) => {
    const { row, col } = node
    node.g = 9 * (row + col)
    node.h = 1 * (height - row - 1) + (width - col - 1)
    const [up, dn, lt, rt] = [[row-1,col], [row+1,col], [row,col-1], [row,col+1]].map(pos => nodes.find(el => el.row === pos[0] && el.col === pos[1]))
    Object.assign(node, { up, dn, lt, rt })
  })
  // console.log(nodes[0])
  return { nodes, nodemap, height, width }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  const { height, width } = data
  if (config.showIntermediate) yield inspect(data)
  config.queue = new PriorityQueue(compare(data.nodemap))
  // dir: incoming direction, n: count of tiles in that direction, g: current cost, h: estimated remaining cost
  config.queue.enqueue({ ...data.nodes[0], dir: 'dn', n: 0 })
  config.queue.enqueue({ ...data.nodes[0], dir: 'rt', n: 0 })
  config.goal = data.nodes.slice(-1)[0]
  if (config.part === 1) config.condition = (_, n) => n <= 3
  else config.condition = (prev, n) => (n > prev || prev >= 4) && n <= 10
  for (const output of searchNodes(data, config)) yield inspect(output), result = output
  yield inspect({ heatLoss: result.current.g })
}
