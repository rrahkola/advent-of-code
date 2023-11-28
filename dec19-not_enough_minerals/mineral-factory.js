import { PriorityQueue } from "@datastructures-js/priority-queue"
const initialResources = { ore: 0, cla: 0, obs: 0, geo: 0 }
const initialBots = { ore: 1, cla: 0, obs: 0, geo: 0 }
const DEFAULT_REMAINING = 24
// default comparator yields depth-first search (stack)
const DEFAULT_COMPARE = (a, b) => (a.score <= b.score) ? 1 : -1
let stateCount = 0

// various helper functions dealing with states
const stateString = (a) => `(${String(a.remaining).padStart(2,' ')}min): [${Object.values(a.resources)}] / [${Object.values(a.bots)}]`
const sum = (a, b) => ({
  ore: a.ore + (b.ore || 0),
  cla: a.cla + (b.cla || 0),
  obs: a.obs + (b.obs || 0),
  geo: a.geo + (b.geo || 0)
})
const diff = (a, b) => ({
  ore: a.ore - (b.ore || 0),
  cla: a.cla - (b.cla || 0),
  obs: a.obs - (b.obs || 0),
  geo: a.geo - (b.geo || 0)
})
const prod = (a, scalar) => ({
  ore: (a.ore || 0) * scalar,
  cla: (a.cla || 0) * scalar,
  obs: (a.obs || 0) * scalar,
  geo: (a.geo || 0) * scalar
})
const timeToBuildKey = (a, key) => {
  const { resources } = a
  const cost = a.blueprint[key] // { ore, cla, obs }
  const oreTime = Math.ceil(((cost.ore || 0) - a.resources.ore) / a.bots.ore)
  const claTime = (!cost.cla) ? 0 : (a.bots.cla) ? Math.ceil(((cost.cla || 0) - a.resources.cla) / (a.bots.cla)) : Infinity
  const obsTime = (!cost.obs) ? 0 : (a.bots.obs) ? Math.ceil(((cost.obs || 0) - a.resources.obs) / (a.bots.obs)) : Infinity
  return 1 + Math.max(0, oreTime, claTime, obsTime)
}
const timeToBuild = (a) => ({
  geoTime: timeToBuildKey(a, 'geoCost'),
  obsTime: timeToBuildKey(a, 'obsCost'),
  claTime: timeToBuildKey(a, 'claCost'),
  oreTime: timeToBuildKey(a, 'oreCost')
})
const addOreBot = (a, time = 1) => ({
  resources: sum(diff(a.resources, a.blueprint.oreCost), prod(a.bots, time)),
  bots: sum(a.bots, { ore: 1 }),
  remaining: a.remaining - time,
  path: a.path
})
const addClaBot = (a, time = 1) => ({
  resources: sum(diff(a.resources, a.blueprint.claCost), prod(a.bots, time)),
  bots: sum(a.bots, { cla: 1 }),
  remaining: a.remaining - time,
  path: a.path
})
const addObsBot = (a, time = 1) => ({
  resources: sum(diff(a.resources, a.blueprint.obsCost), prod(a.bots, time)),
  bots: sum(a.bots, { obs: 1 }),
  remaining: a.remaining - time,
  path: a.path
})
const addGeoBot = (a, time = 1) => ({
  resources: sum(diff(a.resources, a.blueprint.geoCost), prod(a.bots, time)),
  bots: sum(a.bots, { geo: 1 }),
  remaining: a.remaining - time,
  path: a.path
})
const addResources = (a, time = 1) => ({
  resources: sum(a.resources, prod(a.bots, time)),
  bots: { ...a.bots },
  remaining: a.remaining - time,
  path: a.path
})


class Node {
  constructor (blueprint, config, state = null, action = 'initial') {
    this.blueprint = blueprint
    this.config = config
    this.resources = (state) ? { ...state.resources } : { ...initialResources }
    this.bots = (state) ? { ...state.bots } : { ...initialBots }
    this.remaining = (state) ? state.remaining : (config.remaining ? config.remaining : DEFAULT_REMAINING)
    this.path = (state) ? [...state.path] : []
    this.path.push(`${stateString(this)} -- ${action}`)
    this.score = 0
  }

  // Return a list of next states based on blueprint and current state
  nextStates () {}
}

class CumulativeNode extends Node {
  constructor (blueprint, config, state = null, action = 'initial') {
    super(blueprint, config, state, action)
    this.score = stateCount++
  }

  nextStates () {
    const next = []
    const { oreCost, claCost, obsCost, geoCost } = this.blueprint
    let remaining = this.remaining
    if (remaining-- <= 0) return next
    next.push(new CumulativeNode(this.blueprint, this.config, addResources(this), 'waiting'))
    if (this.resources.ore >= oreCost.ore) {
      next.push(new CumulativeNode(this.blueprint, this.config, addOreBot(this), 'added OreBot'))
    }
    if (this.resources.ore >= claCost.ore) {
      next.push(new CumulativeNode(this.blueprint, this.config, addClaBot(this), 'added ClaBot'))
    }
    if (this.resources.ore >= obsCost.ore && this.resources.cla >= obsCost.cla) {
      next.push(new CumulativeNode(this.blueprint, this.config, addObsBot(this), 'added ObsBot'))
    }
    if (this.resources.ore >= geoCost.ore && this.resources.obs >= geoCost.obs) {
      next.push(new CumulativeNode(this.blueprint, this.config, addGeoBot(this), 'added GeoBot'))
    }
    return next
  }
}

class SmartNode extends Node {
  constructor (blueprint, config, state = null, action = 'initial') {
    super(blueprint, config, state, action)
    this.score = this.resources.geo + this.bots.geo * this.remaining
  }

  /* Optimizations considered but not implemented: https://www.reddit.com/r/adventofcode/comments/zpy5rm/2022_day_19_what_are_your_insights_and/
   * - stop if current node could not crack enough geodes even if a geode bot was produced every minute
   * - don't build a bot if current resources would not be exhausted even if building the most expensive bot every minute
   * - manually configured upper-bound on time remaining for each type of bot.
   */
  shouldBuildGeoBots (node) {
    const { maxRemaining } = node.config
    return node.bots.obs > 0                  // can't build geo bots w/o obs bots
      && node.remaining >= maxRemaining.geo   // need at least 1min to gather resources
  }

  shouldBuildObsBots (node) {
    const { maxCosts, maxRemaining } = node.config
    return node.bots.cla > 0                  // can't build obs bots w/o cla bots
      && node.bots.obs <= maxCosts.obs        // no need to build more obs bots than are needed to gather enough resources in 1min
      && node.remaining >= maxRemaining.obs
  }

  shouldBuildClaBots (node) {
    const { maxCosts, maxRemaining } = node.config
    return node.bots.cla <= maxCosts.cla      // no need to build more cla bots than are needed to gather enough resources in 1min
      && node.remaining >= maxRemaining.cla
  }

  shouldBuildOreBots (node) {
    const { maxCosts, maxRemaining } = node.config
    return node.bots.ore <= maxCosts.ore       // no need to build more ore bots than are needed to gather enough resources in 1min
     && node.remaining >= maxRemaining.ore
  }

  shouldAddResources (node) {
    return node.bots.geo > 0 && node.remaining >= 0
  }

  nextStates () {
    const next = []
    const { remaining } = this
    const { MIN_SCORES } = this.config
    // shortcut exit if this is a dead-end node
    if (remaining <= 0) return next
    // if (remaining in MIN_SCORES && this.resources.geo < MIN_SCORES[remaining]) return next
    const buildTimes = timeToBuild(this)
    const nextNodes = {
      resources: new SmartNode(this.blueprint, this.config, addResources(this), 'waiting'),
      oreBot: new SmartNode(this.blueprint, this.config, addOreBot(this, buildTimes.oreTime), 'added OreBot'),
      claBot: new SmartNode(this.blueprint, this.config, addClaBot(this, buildTimes.claTime), 'added ClaBot'),
      obsBot: new SmartNode(this.blueprint, this.config, addObsBot(this, buildTimes.obsTime), 'added ObsBot'),
      geoBot: new SmartNode(this.blueprint, this.config, addGeoBot(this, buildTimes.geoTime), 'added GeoBot')
    }
    if (this.shouldAddResources(nextNodes.resources)) next.push(nextNodes.resources)
    if (this.shouldBuildOreBots(nextNodes.oreBot)) next.push(nextNodes.oreBot)
    if (this.shouldBuildClaBots(nextNodes.claBot)) next.push(nextNodes.claBot)
    if (this.shouldBuildObsBots(nextNodes.obsBot)) next.push(nextNodes.obsBot)
    if (this.shouldBuildGeoBots(nextNodes.geoBot)) next.push(nextNodes.geoBot)
    return next
  }
}

const fitness = ({ resources, bots, remaining }) =>
  1000000 * (resources.geo + bots.geo * remaining)
  + 10000 * bots.obs
  +   100 * bots.cla
  +     1 * bots.ore
  + resources.obs + resources.cla + resources.ore


// Implements the iterable + iterator protocol
export class Factory {
  constructor (config, node) {
    this.showIntermediate = config.showIntermediate || false
    this.queue = new PriorityQueue(config.compare || DEFAULT_COMPARE)
    this.queue.enqueue(node)
    // this.visited = []
  }

  [Symbol.iterator]() { return this }

  next () {
    if (this.queue.isEmpty()) return { done: true }
    const node = this.queue.dequeue()
    if (!node) return { done: true }
    const states = node.nextStates()
    for (const state of states) {
      // this.visited.push(state)
      this.queue.enqueue(state)
    }
    return { value: node }
  }

  static withQueue (blueprint, config) {
    const compare = (config.DEPTH_FIRST_SEARCH) ? DEFAULT_COMPARE : (a, b) => (a.score <= b.score) ? -1 : 1
    if (config.showIntermediate) console.log('config', config)
    const node = (config.PRUNE_NODES) ? new SmartNode(blueprint, config) : new CumulativeNode(blueprint, config)
    const factory = new Factory(config, node)
    return factory
  }
}