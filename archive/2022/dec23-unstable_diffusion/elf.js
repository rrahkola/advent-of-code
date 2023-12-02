import { strict as assert } from 'node:assert'
let elfId = 1

export class Elf {
  constructor (xPos, yPos, elves) {
    this.id = elfId++
    this.xPos = xPos
    this.yPos = yPos
    this.elves = elves
  }

  checkSurroundings () {
    const nearby = this.elves.filter(elf => elf !== this
      && elf.xPos >= this.xPos - 1
      && elf.xPos <= this.xPos + 1
      && elf.yPos >= this.yPos - 1
      && elf.yPos <= this.yPos + 1)
    return {
      north: !(nearby.find(elf => elf.yPos < this.yPos)),
      east: !(nearby.find(elf => elf.xPos > this.xPos)),
      south: !(nearby.find(elf => elf.yPos > this.yPos)),
      west: !(nearby.find(elf => elf.xPos < this.xPos))
    }
  }

  moveTo (coord) {
    if (this.xPos === coord.xPos && this.yPos === coord.yPos) return true
    assert( Math.abs(this.xPos - coord.xPos) ^ Math.abs(this.yPos - coord.yPos), 'will not move diagonally')
    this.xPos = coord.xPos
    this.yPos = coord.yPos
    return true
  }

  decide (round) {
    const available = this.checkSurroundings()
    // if (this.id === 12) {
    //   console.log(this.status())
    //   console.log(round.dir, round.next.dir, round.next.next.dir, round.next.next.next.dir)
    // }
    if (available.north && available.south && available.east && available.west) return this.next('stay')
    if (available[round.dir]) return this.next(round.dir)
    if (available[round.next.dir]) return this.next(round.next.dir)
    if (available[round.next.next.dir]) return this.next(round.next.next.dir)
    if (available[round.next.next.next.dir]) return this.next(round.next.next.next.dir)
    return this.next('stay')
  }

  next (dir) {
    return {
      north: { xPos: this.xPos, yPos: this.yPos - 1 },
      south: { xPos: this.xPos, yPos: this.yPos + 1 },
      east: { xPos: this.xPos + 1, yPos: this.yPos },
      west: { xPos: this.xPos - 1, yPos: this.yPos },
      stay: { xPos: this.xPos, yPos: this.yPos }
    }[dir]
  }

  status () {
    return { x: this.xPos, y: this.yPos, ...this.checkSurroundings() }
  }
}

function createDecisionWheel(arr) {
  arr.reverse()
  const orig = { dir: arr[0] }
  let head = orig
  for (const el of arr.slice(1)) head = { dir: el, next: head }
  orig.next = head
  return head
}
export const choice = createDecisionWheel(['north', 'south', 'west', 'east'])