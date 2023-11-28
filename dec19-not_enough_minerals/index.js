import { strict as assert } from 'assert'
import { inspect } from 'util'
import { Factory } from './mineral-factory.js'

const stateString = ({ resources, bots, remaining, score }) =>
  `(${remaining}m left) Resources: ${JSON.stringify(resources)}, Bots: ${JSON.stringify(bots)}, Score: ${score}`
const findMax = (key, {oreCost, claCost, obsCost, geoCost}) => Math.max(...[oreCost, claCost, obsCost, geoCost].map(el => el[key] || 0))

/* Given an array of blueprint objects (see interpret):
 *  - calculate the maximum # of geodes produced by each blueprint
 *  - sum the quality level (id # * max geodes) for all blueprints
 */
function* bestGeodeNode(data, config) {
  const { showIntermediate } = config
  config.DEPTH_FIRST_SEARCH = true
  config.PRUNE_NODES = true
  config.MIN_SCORES = {}
  const results = {}
  for (const blueprint of data) {
    config.maxCosts = { ore: findMax('ore', blueprint), cla: findMax('cla', blueprint), obs: findMax('obs', blueprint) }
    let snapshot = 0
    let bestNode = { resources: { geo: 0 } }
    for (const node of Factory.withQueue(blueprint, config)) {
      if (showIntermediate && snapshot++ % 1000000 === 0) console.log(`${snapshot} -- ${stateString(node)}`)
      if (node.resources.geo > bestNode.resources.geo) {
        config.MIN_SCORES[node.remaining] = node.resources.geo
        if (showIntermediate) console.log(`=== Found new best: ===\n${JSON.stringify(node.path, null, 2)}\n${stateString(node)}`)
        bestNode = node
      }
    }
    const result = (({ blueprint, resources, bots, score }) => ({ blueprint, resources, bots, score }))(bestNode)
    results[blueprint.id] = result
    if (showIntermediate) yield { result }
    // Remove pruning scores for next blueprint
    Object.keys(config.MIN_SCORES).forEach(remaining => delete config.MIN_SCORES[remaining])
  }
  yield results
}

/* Given a list of instructions, e.g.:
 * Blueprint 1:  Each ore robot costs 4 ore.  Each clay robot costs 2 ore.  Each obsidian robot costs 3 ore and 14 clay.  Each geode robot costs 2 ore and 7 obsidian.
 * Yields a list of blueprint objects: {
 *  id: 1,
 *  oreCost: { ore: 4 },
 *  claCost: { ore: 2 },
 *  obsCost: { ore: 3, cla: 14 },
 *  geoCost: { ore: 2, obs: 7 }
 * }
 */
function interpret(input) {
  const data = []
  for (const line of input) {
    const blueprint = { id: parseInt(/Blueprint (\d+):/.exec(line)[1]) }
    const oreCost = { ore: parseInt(/ore robot costs (\d+) ore/.exec(line)[1]) }
    const claCost = { ore: parseInt(/clay robot costs (\d+) ore/.exec(line)[1]) }
    const obsCost = { .../obsidian robot costs (?<ore>\d+) ore and (?<cla>\d+) clay/.exec(line).groups }
    const geoCost = { .../geode robot costs (?<ore>\d+) ore and (?<obs>\d+) obsidian/.exec(line).groups }
    // translate obsCost and geoCost to integers
    Object.entries(obsCost).forEach(([ key, value ]) => obsCost[key] = parseInt(value))
    Object.entries(geoCost).forEach(([ key, value ]) => geoCost[key] = parseInt(value))
    data.push({ ...blueprint, oreCost, claCost, obsCost, geoCost })
  }
  return data
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
    config.remaining = 24
    config.maxRemaining = { ore: 15, cla: 5, obs: 2, geo: 1 }
    for (const output of bestGeodeNode(data, config)) yield inspect(output), result = output
    const quality = Object.entries(result).reduce((acc, [key, state]) => acc + key * state.resources.geo, 0)
    yield inspect({ quality })
  } else {
    // Find answer for part 2
    config.remaining = 32
    config.maxRemaining = { ore: 19, cla: 9, obs: 5, geo: 1 }
    for (const output of bestGeodeNode(data.slice(0,3), config)) yield inspect(output), result = output
    const product = Object.entries(result).reduce((acc, [key, value]) => acc * value.resources.geo, 1)
    yield inspect ({ product })
  }
}
