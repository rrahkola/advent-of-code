import { strict as assert } from 'assert'
import path from 'path'
import { inspect } from 'util'
// inspect.defaultOptions.compact = 100
// inspect.defaultOptions.breakLength = 300
// inspect.defaultOptions.maxArrayLength = null
// inspect.defaultOptions.depth = null
const REVISITED = 'revisited'

function walk (cave, rules = [], path = [], key) {
  const visited = [...path, key]
  if (/[a-z]+/.test(key) && path.includes(key)) visited.unshift(REVISITED)
  const node = cave[key]
  // Check the rules for every node
  if (rules.every(rule => rule(node, path))) {
    const allPaths = node.to.flatMap(next => walk(cave, rules, visited, next))
    return allPaths.filter(possible => possible.slice(-1)[0] === 'end')
  }
  return [visited]
}

/*  Given a cave system,
 *  yields the list of paths from 'start' to 'end'
 */
function* walkCave(data, config) {
  const { showIntermediate, rules } = config
  const paths = walk(data, rules, [], 'start')
  yield paths
}

/*  Given an array of input: ['fs-end', 'he-DX', ...],
 *  yields a map of nodes w/ connections
 */
function interpret(input) {
  const cave = {}
  for (const line of input) {
    const [from, to] = line.split('-')
    const fromTo = cave[from]?.to || []
    const toFrom = cave[to]?.to || []
    cave[from] = { key: from, to: [...fromTo, to] }
    cave[to] = { key: to, to: [...toFrom, from] }
  }
  return cave
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: null, maxArrayLength: null })
  if (config.part === 1) {
    // Find answer for part 1
    config.rules = [
      (node, _) => node.key !== 'end',
      (node, path) => /[A-Z]+/.test(node.key) || !path.includes(node.key),
    ]
    for (const output of walkCave(data, config)) yield inspect(output), result = output
    yield result.length
  } else {
    // Find answer for part 2
    config.rules = [
      (node, path) => node.key !== 'start' || path.length === 0,
      (node, _) => node.key !== 'end',
      (node, path) => path[0] !== (REVISITED) || /[A-Z]+/.test(node.key) || !path.includes(node.key),
    ]
    for (const output of walkCave(data, config)) yield inspect(output), result = output
    yield result.length
  }
}
