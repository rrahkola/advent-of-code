import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Sorting rules:
 * - integers compared numerically
 * - arrays compared via contents; shortest array first
 * - arrays vs. integer compared as array vs. [integer]
 */
function sortArrays(arr1, arr2) {
  assert(Array.isArray(arr1) && Array.isArray(arr2), `Comparing non-array(s) ${arr1} vs. ${arr2}`)
  let el1 = arr1.shift()
  let el2 = arr2.shift()
  let result
  // console.log({ el1, el2, arr1, arr2 })
  // Deal with end-of-array
  if (typeof el1 === 'undefined') return (typeof el2 === 'undefined') ? 0 : -1
  if (typeof el2 === 'undefined') return 1
  // Deal with integer vs. integer
  if (Number.isInteger(el1) && Number.isInteger(el2)) {
    result = el1 - el2
  } else {
    // Deal with array vs. integer
    if (!Array.isArray(el1)) el1 = [el1]
    if (!Array.isArray(el2)) el2 = [el2]
    result = sortArrays([...el1], [...el2])
  }
  return (result === 0) ? sortArrays(arr1, arr2) : result
}

function sortPackets(original) {
  const parsed = original.map(el => eval(el)).sort((el1, el2) => sortArrays([...el1], [...el2]))
  const sorted = parsed.map(el => inspect(el, { depth: null }).replace(/\s/g, ''))
  return { sorted, original }
}

/**
 * Given an array of pairs of strings, e.g.:
 * [ ['[1,1,3,1,1]','[1,1,5,1,1]'], ... ],
 * Returns:
 * [ { pair: 1, original: ['[1,1,3,1,1]','[1,1,5,1,1]'] }, ...]
 */
function interpret(input) {
  const data = [0]
  input.forEach(original => data.push({ pair: data.length, original }))
  data.shift()
  return data
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0 && Array.isArray(input[0]) && input[0].length > 0
    && (typeof input[0][0] === 'string' || input[0][0] instanceof String),
    'Must provide data as array of lists of strings, use options "-t arrays"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: null })
  if (config.part === 1) {
    // Find sum of indices of pairs in the correct order
    const correct = []
    for (const { pair, original } of data) {
      const { sorted } = sortPackets(original)
      const isCorrect = (sorted.join(',') === original.join(','))
      if (config.showIntermediate) yield inspect({ pair, isCorrect, sorted, original })
      if (isCorrect) correct.push({ pair, isCorrect, sorted, original })
    }
    yield inspect({ alreadySorted: correct.reduce((acc, el) => acc + el.pair, 0) })
  } else {
    // Find indices of divider packets in sorted distress signal
    const dividers = ['[[2]]', '[[6]]']
    const allPackets = [...data.map(el => el.original).flat(), ...dividers]
    const { sorted } = sortPackets(allPackets)
    if (config.showIntermediate) yield inspect({ sorted, allPackets })
    sorted.unshift(0)
    yield inspect({ decoder: sorted.indexOf(dividers[0]) * sorted.indexOf(dividers[1]) })
  }
}
