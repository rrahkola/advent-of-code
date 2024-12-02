import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given a molecule and an array of replacements: [{ start, replace }, ...],
 *  yields a set of
 */
function* calibrateMachine({ molecule, replacements}, config) {
  const results = new Set()
  const { showIntermediate } = config
  for (const match of molecule.matchAll(/[A-Z][a-z]?/g)) {
    const { 0: el, index} = match
    const toDelete = el.length
    replacements.filter(({ start }) => start === el).forEach(({ replace }) => {
      const nextMolecule = molecule.slice(0, match.index) + replace + molecule.slice(match.index + toDelete)
      if (showIntermediate) console.log({ el, index, toDelete, replace })
      results.add(nextMolecule)
    })
  }
  yield Array.from(results)
}

/* Given a molecule and an array of replacements: [{ start, replace }, ...],
 * yields the steps to derive the molecule from a single 'e'
 */
function* buildMolecule({ molecule, replacements }, config) {
  const { showIntermediate } = config
  yield 'Howdy'
}

/*  Given an array of input: ['H => HO', 'H => OH', ...],
 *  yields an array of replacements: [{ start, replace }, ...]
 *  representing the allowable transitions.
 */
function interpret(input) {
  let molecule
  const replacements = []
  const repRegex = /^(?<start>\w+) => (?<replace>\w+)$/
  for (const line of input) {
    const match = line.match(repRegex)
    if (!Boolean(match)) {
      console.log(`Reading molecule:\n${line}`)
      molecule = line
      continue
    }
    const { start, replace } = match.groups
    replacements.push({ start, replace })
  }
  return { molecule, replacements }
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
    for (const output of calibrateMachine(data, config)) yield inspect(output), result = output
    yield `Number of distinct molecules: ${result.length}`
  } else {
    // Find answer for part 2
    for (const output of calibrateMachine(data, config)) yield inspect(output), result = output
  }
}
