import { strict as assert } from 'assert'
import { inspect } from 'util'

function toString({ nodes, height, width }) {
  const board = new Array(height).fill(0).map(_ => new Array(width).fill(null))
  for (const node of Object.values(nodes)) board[node.row][node.col] = node.char
  return board.map(row => row.join(' ')).join('\n')
}

function guessChar (up, down, left, right) {
  let char = '7LFJ|-'
  char = (!right || /[|FL.]/.exec(right.char)) ? char.replace(/[FL-]/g, '') : char
  char = (!down || /[-7F.]/.exec(down.char)) ? char.replace(/[F7|]/g, '') : char
  char = (!left || /[|7J.]/.exec(left.char)) ? char.replace(/[7J-]/g, '') : char
  char = (!up || /[-LJ.]/.exec(up.char)) ? char.replace(/[LJ|]/g, '') : char
  return char
}

/* Given a map of nodes: [{ id, char, row, col, up, down, left, right, next, prev }]
 */
function* walkPipe({ nodes, start }, config) {
  const { showIntermediate } = config
  const path = []
  let dir = (/[FL-]/.exec(start.char)) ? 'right' : 'down'
  let node = start
  while (!path.includes(start)) {
    if (showIntermediate) console.log('node:', node.id)
    switch(node.char) {
      case '7':
        dir = (node.prev === node.left) ? 'down' : 'left'
        break
      case 'F':
        dir = (node.prev === node.down) ? 'right' : 'down'
        break
      case 'L':
        dir = (node.prev === node.up) ? 'right' : 'up'
        break
      case 'J':
        dir = (node.prev === node.left) ? 'up' : 'left'
        break
      case '|':
        dir = (node.prev === node.up) ? 'down' : 'up'
        break
      case '-':
        dir = (node.prev === node.left) ? 'right' : 'left'
        break
    }
    node[dir].prev = node
    node.next = node[dir]
    node.dir = dir
    node = node.next
    path.push(node)
  }
  yield path
}

/* Given:
 *  - a map of nodes: [{ id, char, row, col, up, down, left, right, next, prev }]
 *  - a looping path
 * yields the number of nodes enclosed by the path.
 * Scans the nodes (in insertion order) and toggles inside/outside based on odd/even # of paths crossed.
 * Keeps track of entries (++) / exits (--) above.
 */
function* scanBoard({ nodes, path, height, width }, config) {
  const { showIntermediate } = config
  let toggle = 0
  for (const node of Object.values(nodes)) {
    if (node.col === 0) toggle = 0
    if (path.includes(node)) {
      switch(node.char) {
        case 'L':
          (node.dir === 'right') ? toggle++ : toggle--
          break
        case '|':
          (node.dir === 'down') ? toggle++ : toggle--
          break
        case 'J':
          (node.dir === 'left') ? toggle++ : toggle--
          break
        default:
          break
      }
    }
    else node.char = (toggle % 2 ) ? 'I' : 'O'
  }
  if (showIntermediate) console.log(toString({ nodes, height, width }))
  const enclosed = Object.values(nodes).filter(el => el.char === 'I').length
  const outside = Object.values(nodes).filter(el => el.char === 'O').length
  const total = height * width
  yield { enclosed, path: path.length, outside, total }
}


/* Given an array of input: ['..F7.', ...], yield:
 *  - pipes, an indexed object of nodes w/ chars and empty next/prev: [{ row, col, char, next, prev }, ...]
 *  - start, the node containing 'S'
 */
function interpret(input) {
  const width = input[0].length
  const height = input.length
  const nodes = {}
  let start = null
  input.forEach((line, row) => line.split('').forEach((char, col) => {
    const id = `${row},${col}`
    nodes[id] = { id, row, col, char, next: null, prev: null }
    if (char === 'S') {
      start = nodes[id]
      start['start'] = true
    }
  }))
  // 2nd pass-- add up, down, left, right (and char for start)
  for (const node of Object.values(nodes)) {
    const { row, col, char } = node
    const [up, down, left, right] = [[row-1,col], [row+1,col], [row,col-1], [row,col+1]].map(([r,c]) => nodes[`${r},${c}`])
    Object.assign(node, { up, down, left, right })
    if (node === start) node.char = guessChar(up, down, left, right)
  }
  return { nodes, start, height, width }
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
  for (const output of walkPipe(data, config)) yield inspect(output), result = output
  data.path = result
  if (config.part === 1) yield inspect({ furthestAway: data.path.length / 2 })
  else {
    // Find answer for part 2
    for (const output of scanBoard(data, config)) yield inspect(output), result = output
  }
}
