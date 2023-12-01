import { strict as assert } from 'node:assert'

const edgeUp = (edge, size) => new Array(size).fill(0).map((_, idx) => `${edge}${idx}`)
const edgeDown = (edge, size) => [...edgeUp(edge, size)].reverse()

/* Instructions for edge-folding:
 *    - start from upper left of cube, facing right
 *    - walk clockwise around the cube map, identify edge+idx, update fn to re-orient (Right, Left, Straight)
 */
export const foldInput = [
  ['Start', edgeUp('A', 50), { moveUp: 'moveRight' }],
  ['S', edgeUp('B', 50), { moveUp: 'moveUp' }],
  ['R', edgeUp('C', 50), { moveRight: 'moveLeft' }],
  ['R', edgeUp('D', 50), { moveDown: 'moveLeft' }],
  ['L', edgeDown('D', 50), { moveRight: 'moveUp' }],
  ['S', edgeDown('C', 50), { moveRight: 'moveLeft' }],
  ['R', edgeUp('E', 50), { moveDown: 'moveLeft' }],
  ['L', edgeDown('E', 50), { moveRight: 'moveUp' }],
  ['R', edgeDown('B', 50), { moveDown: 'moveDown' }],
  ['R', edgeDown('A', 50), { moveLeft: 'moveDown' }],
  ['S', edgeUp('F', 50), { moveLeft: 'moveRight' }],
  ['R', edgeUp('G', 50), { moveUp: 'moveRight' }],
  ['L', edgeDown('G', 50), { moveLeft: 'moveDown' }],
  ['S', edgeDown('F', 50), { moveLeft: 'moveRight'}]
]

export const foldExample = [
  ['Start', edgeUp('A', 4), { moveUp: 'moveDown' }],
  ['R', edgeUp('B', 4), { moveRight: 'moveLeft' }],
  ['S', edgeUp('C', 4), { moveRight: 'moveDown' }],
  ['L', edgeDown('C', 4), { moveUp: 'moveLeft' }],
  ['R', edgeDown('B', 4), { moveRight: 'moveLeft' }],
  ['R', edgeUp('D', 4), { moveDown: 'moveRight' }],
  ['S', edgeUp('E', 4), { moveDown: 'moveUp' }],
  ['R', edgeUp('F', 4), { moveLeft: 'moveUp' }],
  ['L', edgeDown('F', 4), { moveDown: 'moveRight' }],
  ['S', edgeDown('E', 4), { moveDown: 'moveUp' }],
  ['R', edgeDown('D', 4), { moveLeft: 'moveUp' }],
  ['R', edgeDown('A', 4), { moveUp: 'moveDown' }],
  ['S', edgeUp('G', 4), { moveUp: 'moveRight' }],
  ['L', edgeDown('G', 4), { moveLeft: 'moveDown' }]
]

const link = (first, second, key) => ({
  moveUp:  () => first.yPrev = second,
  moveRight: () => first.xNext = second,
  moveDown: () => first.yNext = second,
  moveLeft: () => first.xPrev = second
}[key]())
const translate = (node, key) => ({
  moveUp: node.yPrev,
  moveRight: node.xNext,
  moveDown: node.yNext,
  moveLeft: node.xPrev
}[key])
const prepareToContinue = (node) => {
  const next = {
    moveRight: node.xNext,
    moveDown: node.yNext,
    moveLeft: node.xPrev,
    moveUp: node.yPrev
  }[node.direction]
  next.direction = node.direction
  return next
}
const prepareToTurnLeft = (node) => {
  const next = {
    moveRight: node.xNext.yPrev,
    moveDown: node.yNext.xNext,
    moveLeft: node.xPrev.yNext,
    moveUp: node.yPrev.xPrev
  }[node.direction]
  next.direction = node.direction
  return next
}
export function walkFolds (grid, instructions) {
  let node = grid[0]
  node.direction = 'moveRight'
  // Pass #1 -- Add edge values (can be empty or array of 1, 2, or 3 values)
  for (const [turn, edgeValues] of instructions) {
    let startWalking = false
    if (turn === 'L') node = prepareToTurnLeft(node)
    if (turn === 'S') node = prepareToContinue(node)
    node.turn(turn)
    // console.log('starting', { ...node.status(), direction: node.direction })
    for (const edge of edgeValues) {
      node = (startWalking) ? node.walk(1, true) : node
      node.edges = [...(node.edges || []), edge]
      // console.log({ ...node.status(), turn, edges: JSON.stringify(node.edges) })
      startWalking = true
    }
  }
  assert(node === grid[0], `Did not end up where we started from! ${JSON.stringify(node.status())}`)
  // Pass #2 -- Link nodes & add translation
  node = grid[0]
  node.direction = 'moveRight'
  for (const [turn, edgeValues, translation] of instructions) {
    let startWalking = false
    const [origDirection, newDirection] = Object.entries(translation)[0]
    if (turn === 'L') node = prepareToTurnLeft(node)
    if (turn === 'S') node = prepareToContinue(node)
    node.turn(turn)
    // console.log('starting', { ...node.status(), direction: node.direction })
    for (const edge of edgeValues) {
      node = (startWalking) ? node.walk(1, true) : node
      const connected = grid.find(el => el !== node && el.edges && el.edges.includes(edge))
      link(node, connected, origDirection)
      // console.log({ ...node.status(), turn, edges: node.edges, next: JSON.stringify(translate(node, origDirection).status()) })
      // Re-define 'moveUp', 'moveDown', 'moveLeft', or 'moveRight' on current node
      node[origDirection] = function (n = 1, force = false) {
        const next = translate(this, origDirection)
        console.log('translating', { ...this.status(), origDirection, newDirection, n, next: JSON.stringify(next.status()) })
        if (next.isWall && !force) return this
        next.direction = newDirection
        return next.walk(n - 1, force)
      }
      startWalking = true
    }
  }
}