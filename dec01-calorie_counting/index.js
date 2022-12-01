import { strict as assert } from 'assert'

function* findSums(data, config) {
  const { showIntermediate } = config
  const elfCalories = data.map((calories, idx) => ({
    elf: idx + 1,
    totalCalories: calories.reduce((acc, el) => acc + el)
  }))
  if (showIntermediate) yield JSON.stringify(elfCalories, null, 2)
  yield elfCalories.map(({ totalCalories }) => totalCalories)
}

export default function* pickPart(data, config) {
  assert(
    Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0 && Number.isInteger(data[0][0]),
    'Must provide data as array of lists of integers, use options "-t arrays -t integer"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  // Grab the last output from findSums for further processing
  let result
  for (const output of findSums(data, config)) {
    result = output
    yield output
  }
  if (part === 1) {
    // Find the most calories carried by an elf
    yield Math.max(...result)
  } else {
    // Find the total calories carried by the top three elves
    yield result.sort((a,b) => b - a).slice(0, 3).reduce((acc, elfCalories) => acc + elfCalories)
  }
}
