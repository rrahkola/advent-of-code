import { strict as assert } from 'assert'
import { inspect } from 'util'

// Rock:     A (X) = 1
// Paper:    B (Y) = 2
// Scissors: C (Z) = 3
// Win             = 6
// Draw            = 3
// Lose            = 0
const roundScores = [
  ['A X', 4], ['A Y', 8], ['A Z', 3],
  ['B X', 1], ['B Y', 5], ['B Z', 9],
  ['C X', 7], ['C Y', 2], ['C Z', 6],
].reduce((obj, el) => Object.assign(obj, { [el[0]]: el[1] }), {}) // e.g. { 'A X': 4 }

// Convert strategy guide to roundScores
// X --> need to lose
// Y --> need to draw
// Z --> need to win
const roundStrategy = [
  ['A X', 'A Z'], ['A Y', 'A X'], ['A Z', 'A Y'],
  ['B X', 'B X'], ['B Y', 'B Y'], ['B Z', 'B Z'],
  ['C X', 'C Y'], ['C Y', 'C Z'], ['C Z', 'C X'],
].reduce((obj, el) => Object.assign(obj, { [el[0]]: el[1] }), {}) // e.g. { 'A X': 'A Z' }

function* sumRounds(data, config) {
  const { showIntermediate } = config
  const scores = data.map(round => roundScores[round])
  yield scores
  yield scores.reduce((acc, score) => acc + score, 0)
}

function convertToRoundScores(input) { return input.map(round => roundStrategy[round]) }

export default function* pickPart(input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  if (config.showIntermediate) yield inspect(data)
  if (part === 1) {
    // Find the total score of the rounds if X=Rock, Y=Paper, Z=Scissors
    for (const result of sumRounds(input, config)) yield result
  } else {
    // Find the total score of the rounds if X=Lose, Y=Draw, Z=Win
    const data = convertToRoundScores(input)
    for (const result of sumRounds(data, config)) yield result
  }
}
