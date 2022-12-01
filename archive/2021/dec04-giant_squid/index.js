import { strict as assert } from 'assert'
import { inspect } from 'util'

const sum = arr => arr.reduce((acc, el) => acc + el, 0)

function * winningBingo (data, config) {
  const { showIntermediate } = config
  const { balls, boards } = data
  const games = boards.map(createGameBoard)
  for (const game of games) {
    if (showIntermediate) yield inspect(game)
  }
  while (true) {
    const nextBall = balls.shift()
    for (const game of games) {
      playBingoBall(nextBall, game)
      if (showIntermediate) yield `ball: ${nextBall}\ngame: ${inspect(game)}`
      if (checkWinner(game)) {
        yield `Winning Score: ${bingoScore(nextBall, game)}`
        return
      }
    }
  }
}

function * losingBingo (data, config) {
  const { showIntermediate } = config
  const { balls, boards } = data
  const games = boards.map(createGameBoard)
  for (const game of games) {
    if (showIntermediate) yield inspect(game)
  }
  let winners = []
  while (true) {
    const nextBall = balls.shift()
    for (const game of games) {
      playBingoBall(nextBall, game)
      if (showIntermediate) yield `ball: ${nextBall}\ngame: ${inspect(game)}`
      if (checkWinner(game)) {
        winners = [...new Set([...winners, game.idx])]
        if (winners.length >= games.length) {
          yield `Losing score: ${bingoScore(nextBall, game)}`
          return
        }
      }
    }
  }
}

function createGameBoard (board, idx) {
  const size = board.length
  const values = board.flatMap(el => el)
  const combos = board.map(line => [...line])
  const columns = [...Array(size).keys()]
  columns.forEach(col => combos.push(board.map(line => line[col])))
  return { idx, board, values, combos }
}

// adjust game accordingly
function playBingoBall (nextBall, game) {
  const { values, combos } = game
  const removeBall = (el) => el !== nextBall
  game.values = values.filter(removeBall)
  game.combos = combos.map(combo => combo.filter(removeBall))
}

function checkWinner (game) {
  // check for any zero-length combinations; return matching game
  const isWinner = arr => arr.length === 0
  return (game.combos.find(isWinner)) ? true : false
}

function bingoScore (nextBall, game) {
  return nextBall * sum(game.values)
}

function parseBingoBoard (bingoArr) {
  assert(bingoArr.length === 5, 'Expecting 5x5 array')
  const bingoBoard = bingoArr.map(line =>
    line.split(/\s+/).map(el => parseInt(el))
  )
  for (const line of bingoBoard) {
    assert(line.length === 5, ' Expecting line to have 5 elements')
  }
  return bingoBoard
}

/**
 * 1,2,3,4,5,6,7...
 *
 *  1  2  3  4  5
 * 10 20  9 15 38
 * ...
 *
 *  5  3 10 25  2
 * ...
 */
function interpret (input) {
  const lines = input.split('\n').map(el => el.trim())
  const balls = lines.shift()
  const boards = []
  lines.reduce((board, line) => {
    if (Boolean(line)) {
      if (!board) return [line]
      board.push(line)
      return board
    } else {
      if (board) boards.push(board) // skip before first board
      return undefined
    }
  }, undefined)
  return {
    balls: balls.split(',').map(el => parseInt(el)),
    boards: boards.map(parseBingoBoard)
  }
}

export default function * pickPart (input, config) {
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide data as a string, use options "-t raw"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 2) {
    for (const result of losingBingo(data, config)) yield result
  } else {
    for (const result of winningBingo(data, config)) yield result
  }
}
