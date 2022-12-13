import { strict as assert } from 'assert'
import { inspect } from 'util'

function* monkeyBusiness(monkeys, config) {
  const { showIntermediate, numRounds, relief, inspectRounds } = config
  for (let round = 1; round <= numRounds; round++) {
    let idx = 0
    for (const monkey of monkeys) {
      const { label: source, items} = monkey
      assert(source === idx++, 'Monkey label does not match index')
      while(items.length > 0) {
        const item = items.shift()
        const original = { ...item }
        monkey.inspect(item, relief)
        const target = monkey.throw(item)
        monkeys[target].items.push(item)
        if (showIntermediate) yield { target, source, inspections: monkey.inspections, item, original }
      }
    }
    if (showIntermediate || inspectRounds.includes(round)) yield monkeys.map(el => ({
      round,
      monkey: el.label,
      items: el.items.map(el2 => el2.worry),
      inspections: el.inspections
    }))
  }
  yield monkeys
}

/**
 * Given:
 * [[
 *     'Monkey 0:',
 *     'Starting items: 79, 98',
 *     'Operation: new = old * 19',
 *     'Test: divisible by 23',
 *     'If true: throw to monkey 2',
 *     'If false: throw to monkey 3'
 *   ],...
 *  ]
 * Returns parsed scenarios:
 * [{ label: 0, items: [{worry: 79}, {worry: 98}], ... }, ...]
 */
function parseScenarios(input) {
  const result = []
  for (const description of input) {
    const scenario = { items: [], test: { decision: [ null, null ] }, inspections: 0, description }
    for (const line of description) {
      if (line.includes('Monkey ')) {
        scenario.label = parseInt(line.replace('Monkey ', ''))
      } else if (line.includes('Starting items: ')) {
        scenario.items = line.replace('Starting items: ', '').split(/,\s+/).map(el => ({
          worry: parseInt(el),
          inspected: 0,
          thrown: 0
        }))
      } else if (line.includes('Operation: ')) {
        scenario.opsExp = line.replace(/^Operation:\s+new = /, '')
        // performs both inspection and '/3' relief
        scenario.inspect = (item, relief) => {
          const old = item.worry
          item.worry = relief(eval(scenario.opsExp))
          item.inspected += 1
          scenario.inspections += 1
        }
      } else if (line.includes('Test: ')) {
        scenario.test.divisible = parseInt(line.replace('Test: divisible by ', ''))
      } else if (line.includes('If true: ')) {
        scenario.test.decision[1] = parseInt(line.replace('If true: throw to monkey ', ''))
      } else if (line.includes('If false: ')) {
        scenario.test.decision[0] = parseInt(line.replace('If false: throw to monkey ', ''))
      } else {
        assert(!line, `Unable to parse non-empty line: ${line}`)
      }
    }
    scenario.throw = (item) => {
      const { divisible, decision } = scenario.test
      item.thrown += 1
      return (item.worry % divisible === 0) ? decision[1] : decision[0]
    }
    result.push(scenario)
  }
  return result
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0 && Array.isArray(input[0]) && input[0].length > 0
    && (typeof input[0][0] === 'string' || input[0][0] instanceof String),
    'Must provide data as array of lists of strings, use options "-t arrays"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = parseScenarios(input)
  if (config.showIntermediate) yield inspect(data, { maxArrayLength: null, depth: 3 })
  if (config.part === 1) {
    config.numRounds = 20
    config.relief = (worry) => Math.floor(worry / 3)
    config.inspectRounds = [1, 20]
  } else {
    const modulo = data.reduce((acc, el) => acc * el.test.divisible, 1)
    config.numRounds = 10000
    config.relief = (worry) => worry % modulo
    config.inspectRounds = [1, 20, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
  }
  // Find the level of monkey business for shenanigans
  for (const output of monkeyBusiness(data, config)) yield inspect(output, { maxArrayLength: null, depth: 3 }), result = output
  const totalBusiness = result.map(el => el.inspections).sort((a, b) => b - a)
  yield inspect({ monkeyBusiness: totalBusiness[0] * totalBusiness[1] })
}
