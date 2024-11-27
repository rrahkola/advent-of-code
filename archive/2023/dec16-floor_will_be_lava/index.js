import { strict as assert } from 'assert'
import { inspect } from 'util'
const summary = ({ char, row, col, paths }) => ({ char, row, col, paths })
const goUp = (node) => ({ dir: 'up', node: node.up })
const goDn = (node) => ({ dir: 'dn', node: node.dn })
const goLt = (node) => ({ dir: 'lt', node: node.lt })
const goRt = (node) => ({ dir: 'rt', node: node.rt })
const updateChar = node => {
  const { paths } = node
  node.char = (/[-|/\\]/.exec(node.char))
    ? node.char
    : (paths.length === 0)
      ? node.char
      : (paths.length > 1)
        ? String(paths.length)
        : {'up': '^', 'dn': 'v', 'lt': '<', 'rt': '>' }[paths[0]]
  return node.char
}

const printBoard = (nodes) => {
  const [height, width] = ['row', 'col'].map(pos => Math.max(...nodes.map(el => el[pos])) + 1)
  const board = new Array(height).fill(0).map(_ => new Array(width).fill(0))
  nodes.forEach(node => board[node.row][node.col] = node.char)
  return board.map(arr => arr.join(' ')).join('\n')
}

/* Given an array of linked nodes with mirrors/splitters: [{ char, row, col, paths = [] }, ...],
 *  applies rightward-bound light to the top-left node and propagates until light leaves nodes or is cycled.
 */
function energizeNodes({ nodes }, config) {
  const { showIntermediate, light } = config
  while (light.length > 0) {
    const { dir, node } = light.shift()
    // Light exited board or entered a cycle
    if (!node || node.paths.includes(dir)) continue
    node.paths.push(dir)
    switch(node.char) {
      case '/':
        [['rt', goUp], ['lt', goDn], ['up', goRt], ['dn', goLt]]
          .map(([inX, fn]) => (dir === inX) ? light.push(fn(node)) : null)
        break
      case '\\':
        [['lt', goUp], ['rt', goDn], ['dn', goRt], ['up', goLt]]
          .map(([inX, fn]) => (dir === inX) ? light.push(fn(node)) : null)
        break
      case '|':
        (dir === 'rt' || dir === 'lt') ? light.push(goUp(node), goDn(node)) : light.push({ dir, node: node[dir] })
        break
      case '-':
        (dir === 'up' || dir === 'dn') ? light.push(goLt(node), goRt(node)) : light.push({ dir, node: node[dir] })
        break
      default:
        light.push({ dir, node: node[dir] })
        break
    }
  }
  if (showIntermediate) {
    nodes.forEach(node => updateChar(node))
    console.log(`with paths:\n${printBoard(nodes)}`)
    nodes.forEach(node => node.char = (node.paths.length > 0) ? '#' : '.')
    console.log(`energized:\n${printBoard(nodes)}`)
  }
  const energized = nodes.filter(node => node.paths.length > 0)
  return energized.map(node => summary(node))
}

function* maxEnergy({ nodes, height, width }, config) {
  const { showIntermediate } = config
  const starts = nodes.filter(el => el.row === 0).map(node => ({ dir: 'dn', node }))
  starts.push(...nodes.filter(el => el.col === 0).map(node => ({ dir: 'rt', node })))
  starts.push(...nodes.filter(el => el.row === height - 1).map(node => ({ dir: 'up', node })))
  starts.push(...nodes.filter(el => el.col === width - 1).map(node => ({ dir: 'lt', node })))
  let maxTiles = 0
  for (const start of starts) {
    const light = [start]
    const tiles = energizeNodes({ nodes }, { ...config, light }).length
    if (tiles > maxTiles) maxTiles = tiles
    nodes.forEach(node => node.paths = [])
  }
  yield { maxTiles }
}

/* Given an array of input: ['>|<<<\....', ...],
 * yields an array of 2d-linked nodes:
 *    [{ char, row, col, paths = [] }, ...]
 */
function interpret(input) {
  const nodes = input.map((line, row) => line.split('').map((char, col) => ({ char, row, col, paths: [] }))).flat()
  const [height, width] = [input, input[0]].map(arr => arr.length)
  nodes.forEach((node, i) => {
    const { row, col } = node
    const [up, dn, lt, rt] = [[row-1,col], [row+1,col], [row,col-1], [row,col+1]].map(pos => nodes.find(el => el.row === pos[0] && el.col === pos[1]))
    Object.assign(node, { up, dn, lt, rt })
  })
  // console.log(nodes[0])
  return { nodes, height, width }
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
    // Find answer for part 1
    config.light = [{ dir: 'rt', node: data.nodes[0] }]
    result = energizeNodes(data, config)
    yield inspect({ energized: result.length })
  } else {
    // Find answer for part 2
    for (const output of maxEnergy(data, config)) yield inspect(output), result = output
  }
}
