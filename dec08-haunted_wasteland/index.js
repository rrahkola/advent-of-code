import { strict as assert } from 'assert'
import { inspect } from 'util'
let step = 0
function gcd (a, b) {
  for (let temp = b; b !== 0;) {
    b = a % b
    a = temp
    temp = b
  }
  return a
}
function lcm (a, ...num) {
  const b = (num.length === 1) ? num[0] : lcm(...num)
  const gcdValue = gcd(a, b)
  return (a * b) / gcdValue
}

/* Given a map representation, { nodes, path },
 * returns the number of steps to get to node 'ZZZ'
 */
function* walkToZZZ({ nodes, path }, config) {
  const { showIntermediate } = config
  let node = nodes['AAA']
  let end = nodes['ZZZ']
  for (const dir of path) {
    if (showIntermediate) yield { node, dir, step }
    node = node[dir]
    if (node === end) break
  }
  yield { step }
}

/* Given a map representation, { nodes, path },
 * returns an object of 'paths', labeled by starting node id:
 *    { '11A': [{ step: 2, node: '11Z' }, { step: 4 end: true }], ... }
 * where 'step' indicates the step number where path reaches a possible 'end node' (one ending with Z).
 * Could allow for cycles among '*Z' nodes.
 */
function* walkToOnlyZ({ nodes, path }, config) {
  const { showIntermediate, maxSteps = 100000 } = config
  let startNodes = Object.values(nodes).filter(({ id }) => /A$/.exec(id))
  const paths = {}
  for (let node of startNodes) {
    step = 0
    const { id } = node
    const ends = []
    for (const dir of path) {
      node = node[dir]
      if (/Z$/.exec(node.id)) {
        if (ends.map(el => el.node).includes(node.id)) break
        ends.push({ step, node: node.id })
      }
      if (step > maxSteps) break
    }
    ends.push({ step, end: true })
    if (showIntermediate) yield { node: node.id, ends }
    paths[id] = ends
  }
  // Looks like each is a cycle which repeats itself; uses the following line to check this
  const patterns = Object.entries(paths).reduce((obj, [key, value]) => Object.assign(obj, { [key]: value.length }), {})
  if (showIntermediate) console.log(patterns)
  yield paths
}

/* Given an array of input: ['RL', 'AAA = (BBB, CCC)', ...], yields:
 *  - nodes, an object of linked nodes:
 *      { 'AAA': { id: 'AAA', left: <BBB>, right: <CCC> }, ... }
 *  - path, an iterator with next() functionality
 */
function interpret(input) {
  const map = { nodes: {} }
  for (const line of input) {
    if (line.includes('=')) {
      // 1st pass-- just use strings
      const { id, left, right } = /^(?<id>\w+) = \((?<left>\w+), (?<right>\w+)\)/.exec(line).groups
      map.nodes[id] = { id, left, right }
    } else {
      const modulo = line.length
      const pattern = line.split('').map(rl => (rl === 'R') ? 'right' : 'left')
      const path = {
        next() { return { value: [...pattern][step++ % modulo] } },
        [Symbol.iterator]() { return this }
      }
      map.path = path
    }
  }
  // 2nd pass -- populate 'left' and 'right' with node objects
  for (const value of Object.values(map.nodes)) {
    value.left = map.nodes[value.left]
    value.right = map.nodes[value.right]
  }
  return map
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
    for (const output of walkToZZZ(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of walkToOnlyZ(data, config)) yield inspect(output), result = output
    // Look at the shortest cycle encompassing each path's cycle
    const lcmPaths = lcm(...Object.values(result).map(path => path[0].step))
    yield inspect({ lcmPaths })
  }
}
