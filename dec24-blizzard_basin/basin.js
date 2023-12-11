import { PriorityQueue } from "@datastructures-js/priority-queue"
// default comparator yields depth-first search (stack)
const DEFAULT_COMPARE = (a, b) => (a.score <= b.score) ? -1 : 1
let stateCount = 0

const printBoard = (grid, blizzards) => {
  const elfX = elves.map(elf => elf.xPos)
  const elfY = elves.map(elf => elf.yPos)
  const xRange = []
  for (let x = Math.min(...elfX); x <= Math.max(...elfX); x++) xRange.push(x)
  const yRange = []
  for (let y = Math.min(...elfY); y <= Math.max(...elfY); y++) yRange.push(y)
  const board = []
  for (const y of yRange) {
    const line = []
    for (const x of xRange) {
      let elf = elves.find(elf => elf.xPos === x && elf.yPos === y)
      const char = (!elf) ? ' .' : (printId) ? String(elf.id).padStart(2) : ' #'
      line.push(char)
    }
    board.push(line.join(' '))
  }
  return board
}

export class PartyState {
  constructor(col = 0, row = -1, path = null) {
    this.col = col
    this.row = row
    // this.path = (path) ? [...path] : []
  }

  move(dir) {
    if (dir === 'up') {
      // this.path.push(`(${this.col},${this.row})     --  move up`)
      this.row--
    }
    if (dir === 'down') {
      // this.path.push(`(${this.col},${this.row})     --  move down`)
      this.row++
    }
    if (dir === 'left') {
      // this.path.push(`(${this.col},${this.row})     --  move left`)
      this.col--
    }
    if (dir === 'right') {
      // this.path.push(`(${this.col},${this.row})     --  move right`)
      this.col++
    }
    if (dir === 'stay') {
      // this.path.push(`(${this.col},${this.row})     --  wait`)
    }
    return this
  }

  toString() {
    return `(${this.col},${this.row}) -- score: ${this.score}`// path: ${this.path.length}, "${this.path.slice(-1)[0]}"`
  }

  /* given a hash of game states and board config, yields the possible next states
   * with appropriate scores
   */
  static nextStates(time, states, { blizzards, basin }) {
    const occupied = blizzards.reduce((obj, b) => Object.assign(obj, { [JSON.stringify(b.pos(time))]: b.dir }), {})
    const next = {}
    for (const [pos, state] of Object.entries(states)) {
      const { col: sCol, row: sRow, path: sPath } = state
      const tPlus1 = ['right', 'down', 'up', 'left', 'stay'].map(dir => new PartyState(sCol, sRow, sPath).move(dir))
      for (const move of tPlus1) {
        const { col, row } = move
        const key = JSON.stringify({ col, row })
        if (Object.keys(basin).includes(key) && !Object.keys(occupied).includes(key)) next[key] = move
      }
    }
    console.log({ time, next: Object.keys(next).length })
    return next
  }
}


// Implements the iterable + iterator protocol
export class Walk {
  constructor(basin, start, config) {
    this.showIntermediate = config.showIntermediate || false
    this.queue = new PriorityQueue(config.compare || DEFAULT_COMPARE)
    this.queue.enqueue(start)
    this.blizzards = basin.blizzards
    this.height = basin.height
    this.width = basin.width
    // this.visited = []
  }

  [Symbol.iterator]() { return this }

  next() {
    const { blizzards, height, width, queue } = this
    if (queue.isEmpty()) return { done: true }
    const node = queue.dequeue()
    if (!node) return { done: true }
    const states = PartyState.nextStates(node, { blizzards, height, width })
    // if (this.showIntermediate) console.log({ node: node.toString(), states: states.length, queue: queue.size() })
    for (const state of states) {
      // this.visited.push(state)
      queue.enqueue(state)
    }
    return { value: node }
  }

  static withQueue({ blizzards, height, width }, config) {
    config.compare = (config.DEPTH_FIRST_SEARCH) ? DEFAULT_COMPARE : (a, b) => (a.path.length <= b.path.length) ? 1 : -1
    if (config.showIntermediate) console.log('config', config)
    const party = new PartyState()
    party.score = 0
    const walk = new Walk({ blizzards, height, width }, party, config)
    return walk
  }
}

export class Blizzard {
  constructor(dir, col, row, width, height) {
    this.dir = dir
    if (/[v^]/.exec(dir)) {
      this.col = col
      this.row = -100 // allow comparisons, but will not match existing rows
      this.idx = row - 1
      this.length = height - 2
    }
    if (/[<>]/.exec(dir)) {
      this.col = -100 // allow comparisons, but will not match existing cols
      this.row = row
      this.idx = col - 1
      this.length = width - 2
    }
  }

  at(time) {
    const doAdd = Boolean(this.dir.match(/[v>]/))
    const add = (a, b) => (a + b) % this.length
    const subtract = (a, b) => (this.length + a - b % this.length) % this.length // yield 0 <= idx < this.length
    return (doAdd) ? add(this.idx, time) : subtract(this.idx, time)
  }

  pos(time) {
    if (/[v^]/.exec(this.dir)) return { col: this.col, row: this.at(time) + 1 }
    else return { col: this.at(time) + 1, row: this.row }
  }
}
