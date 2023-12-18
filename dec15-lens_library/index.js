import { strict as assert } from 'assert'
import { inspect } from 'util'
const toHash = str => str.split('').reduce((acc, char) => ((acc + char.charCodeAt(0)) * 17) % 256, 0)

/* Given an array of input: ['', ...]
 */
function* addLenses(data, config) {
  const { showIntermediate, numBoxes } = config
  const { sequence, focalLengths } = data
  const boxes = new Array(numBoxes).fill(0).map(el => [0])
  for (const step of sequence) {
    const { lens, op } = /(?<lens>\w+)(?<op>(=|-))/.exec(step).groups
    const box = boxes[toHash(lens)]
    const idx = box.indexOf(lens)
    if (idx < 0) {
      (op === '-') ? null : box.push(lens)
    } else {
      (op === '-') ? box.splice(idx, 1) : null
    }
    if (showIntermediate) yield { step, lens, op, idx, box }
  }
  const lenses = {}
  boxes.forEach((box, bIdx) => box.forEach((lens, lIdx) => {
    const power = { box: bIdx+1, slot: lIdx, focal: focalLengths[lens] }
    lenses[lens] = { ...power, power: power.box*power.slot*power.focal }
  }))
  yield lenses
}

/* Given an array of input: ['rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7', ...],
 * yields an initialization sequence:
 *  ['rn=1', 'cm-', 'qp=3', ...]
 */
function interpret(input) {
  const sequence = input.join('').split(',')
  const focalLengths = sequence.filter(step => /=/.exec(step))
    .map(step => step.split('='))
    .reduce((obj, arr) => Object.assign(obj, { [arr[0]]: parseInt(arr[1]) }), {})
  focalLengths[0] = 0
  return { sequence, focalLengths}
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  config.numBoxes = 256
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    const sum = data.sequence.map(toHash).reduce((acc, val) => acc + val, 0)
    yield inspect({ sum })
  } else {
    // Find answer for part 2
    for (const output of addLenses(data, config)) yield inspect(output), result = output
    const sumPower = Object.values(result).reduce((acc, obj) => acc + obj.power, 0)
    yield inspect({ sumPower })
  }
}
