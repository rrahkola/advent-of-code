import { strict as assert } from 'assert'
import { inspect } from 'util'
import { checkAlignment } from '../../../util/cycles.js'

const PULSE_REGEX = /^(?<emit>\w+) -(?<level>(high|low))-> (?<rec>\w+)$/ // 'a -high-> b'

/*  Given a state of relays and rules,
 *  issues pulses to the broadcaster module and propagates them through the system.
 */
function* applyPulses({ state, rules, tracker }, config) {
  const { showIntermediate, numPulses } = config
  const counts = { high: 0, low: 0 }
  const msgs = []
  const log = []
  for (let i = 0; i < numPulses; i++) {
    msgs.push('button -low-> broadcaster')
    while (msgs.length) {
      const msg = msgs.shift()
      log.push(msg)
      msg.includes('-low->') ? counts.low++ : counts.high++
      if (msg.includes(`high-> ${tracker.name}`)) {
        if (showIntermediate) console.log({ i, msg })
        const { groups: { emit } } = msg.match(PULSE_REGEX)
        tracker[emit].push(i)
      }
      const results = rules.flatMap(rule => rule(msg, state, counts))
      if (showIntermediate) yield { msg, results }
      msgs.push(...results)
    }
  }
  yield { log, counts, tracker }
}

/*  Given an array of input: ['', ...],
 *  yields
 */
function interpret(input) {
  // module states, e.g. { 'a': { in: null, out: false }, 'con': { in: { a: true }, out: false }, ... }
  const state = {}
  const connections = {}
  // module rules: (msg, state) => [msg, ...]
  const rules = []
  const moduleRegex = /^(?<type>(%|&|))(?<module>\w+) -> (?<output>.*)$/
  for (const line of input) {
    const { groups: { type, module, output } } = (line.match(moduleRegex))
    const out = output.split(/,\s*/)
    connections[module] = out
    switch (type) {
      case '%': // flip-flop module
        state[module] = { in: null, out: false }
        rules.push((msg, relay = {}) => {
          const { groups: pulse } = msg.match(PULSE_REGEX)
          if (pulse.rec !== module) return [] // exit early if rule doesn't apply
          if (pulse.level === 'low') {
            relay[module].out = !relay[module].out
            return out.map(rec => `${module} -${relay[module].out ? 'high' : 'low'}-> ${rec}`)
          } else return []
        })
        break
      case '&': // conjunction module
        state[module] = { in: {}, out: false }
        rules.push((msg, relay = {}) => {
          const { groups: pulse } = msg.match(PULSE_REGEX)
          if (pulse.rec !== module) return [] // exit early if rule doesn't apply
          relay[module].in[pulse.emit] = pulse.level === 'high'
          const result = (Object.values(relay[module].in).every(Boolean)) ? false : true
          relay[module].out = result
          return out.map(rec => `${module} -${result ? 'high' : 'low'}-> ${rec}`)
        })
        break
      case '': // broadcaster module
        rules.push((msg, _) => {
          const { groups: pulse } = msg.match(PULSE_REGEX)
          if (pulse.rec !== module) return [] // exit early if rule doesn't apply
          return out.map(rec => `${module} -${pulse.level}-> ${rec}`)
        })
        break
      default:
        throw new Error(`Unrecognized input: ${line}`)
    }
  }
  // Invert the connections map: { 'rec': ['emit1', 'emit2', ...], ... }
  const invConnections = {}
  Object.entries(connections).forEach(([src, targets]) => {
    targets.forEach(tgt => invConnections[tgt] = invConnections[tgt] ? [...invConnections[tgt], src] : [src])
  })
  // Map connections to conjunction modules
  Object.entries(invConnections).forEach(([rec, emitters]) => {
    if (state[rec]?.in)
      state[rec].in = emitters.reduce((acc, e) => ({ ...acc, [e]: false }), {})
  })
  // Part 2: Identify the final conjunction module and its inputs
  const [finalEmitter] = invConnections['rx'] || invConnections['output']
  const tracker = invConnections[finalEmitter].reduce((acc, e) => ({ ...acc, [e]: [] }), {})
  Object.defineProperty(tracker, 'name', { enumerable: false, writable: true })
  tracker.name = finalEmitter
  return { state, rules, tracker }
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
  config.numPulses = 1000
  if (config.part === 1) {
    // Find answer for part 1
    config.numPulses = 1000
    for (const output of applyPulses(data, config)) yield inspect(output), result = output
    yield `Counts: ${inspect(result.counts)} => ${result.counts.high * result.counts.low}`
  } else {
    // Find answer for part 2
    config.numPulses = 10000
    for (const output of applyPulses(data, config)) yield inspect(output), result = output
    yield checkAlignment(...Object.values(result.tracker))
  }
}
