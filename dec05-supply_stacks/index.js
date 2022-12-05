import { strict as assert } from 'assert'
import { inspect } from 'util'

// Carries out instructions on the stacks,e.g.
// stacks: [[], ['Z', 'N'], ['M', 'C', 'D'], ['P']]
// steps: [{ top: 1, from: 2, to: 1 }]
function * craneManipulations (data, config) {
  const { showIntermediate, oneAtATime = false } = config
  for (const step of data.steps) {
    let cratesToMove = data.stacks[step.from].slice(0 - step.top)   // ['D']
    if (oneAtATime) cratesToMove.reverse()
    data.stacks[step.to].push(...cratesToMove)                      // ['Z', 'N', 'D']
    data.stacks[step.from].splice(0 - step.top, step.top)           // ['M', 'C']
    if (showIntermediate) yield { step, stacks: data.stacks }
  }
  yield data
}

/* Example input: (stacks are fixed-width lines)
 *     [D]
 * [N] [C]
 * [Z] [M] [P]
 *  1   2   3
 *
 * move 1 from 2 to 1
 * move 3 from 1 to 3
 * move 2 from 2 to 1
 * move 1 from 1 to 2
 *
 * Output:
 * {
 *   stacks: [
 *     [],                  // causes array indexing to match stack IDs
 *     ['N', 'Z'],
 *     ['M', 'C', 'D'],
 *     ['P']
 *   ],
 *   steps: [
 *     { top: 1, from: 2, to: 1 },
 *     { top: 3, from: 1, to: 3 },
 *     { top: 2, from: 2, to: 1 },
 *     { top: 1, from: 1, to: 2 }
 *   ]
 * }
 */
function parseStacks (rawInput) {
  const stackRegex = new RegExp(/\[(\w)\]/, 'g')
  const stepRegex = new RegExp(/^move (?<top>\d+) from (?<from>\d+) to (?<to>\d+)$/)
  const input = rawInput.split('\n')
  const data = { stacks: Array(10).fill('').map(el => []), steps: [] } // guess 100 stacks for now
  for (const line of input) {
    if (line.match(/^\s*\[/)) {                 // matches a stack line
      let match = stackRegex.exec(line)
      while (match) {
        const crate = match[1]
        const stackId = (match.index + 4) / 4   // e.g. '[Z] [M] [P]' has matches on 0, 4, 8
        data.stacks[stackId].unshift(crate)
        match = stackRegex.exec(line)
      }
    }
    if (line.match(/^move/)) {                  // matches a step line
      const match = line.match(stepRegex)
      assert (Boolean(match), `Unable to parse step line ${line}`)
      const stepInfo = {}
      for (const group in match.groups) stepInfo[group] = parseInt(match.groups[group])
      data.steps.push(stepInfo)
    }
  }
  return data
}

export default function * pickPart (input, config) {
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide input as raw, use options "-t raw"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  const data = parseStacks(input)
  if (config.showIntermediate) yield inspect(data)
  let result
  if (part === 1) {
    // Crates are moved one at a time, reversing order
    config.oneAtATime = true
  }
  // Find top crate for each stack, ignoring empty stacks
  for (const value of craneManipulations(data, config)) {
    result = value
    yield inspect(result)
  }
  yield result.stacks.map(arr => arr.pop()).filter(Boolean).join('')
}
