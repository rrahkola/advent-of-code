import { strict as assert } from 'node:assert'

export class Link {
  constructor (value, prev = null) {
    this.value = value
    if (prev) {
      prev.push(this)
    } else { // A linked list of size 1
      this.prev = this
      this.next = this
    }
  }

  toArray () {
    const arr = [this.value]
    for (let next = this.next; next !== this; next = next.next) arr.push(next.value)
    return arr
  }

  size () {
    return this.toArray().length
  }

  peek (n) {
    let link = this
    new Array(n).fill(0).forEach(_ => link = link.next)
    return link.value
  }

  // Given a non-negative integer n, moves this element forward in the linked list n places
  shiftForward (n = 1) {
    assert(Number.isInteger(n), 'Argument is not an integer')
    assert(n >= 0, 'Argument provided is not positive')
    if (n === 0) return // do nothing
    this.next.prev = this.prev
    this.prev.next = this.next
    new Array(n).fill(1).forEach(_ => this.next = this.next.next)
    this.next.unshift(this)
  }
  // Given a non-negative integer n, moves this element backward in the linked list n places
  shiftBackward (n = 1) {
    assert(Number.isInteger(n), 'Argument is not an integer')
    assert(n >= 0, 'Argument provided is not positive')
    if (n === 0) return // do nothing
    this.next.prev = this.prev
    this.prev.next = this.next
    new Array(n).fill(1).forEach(_ => this.prev = this.prev.prev)
    this.prev.push(this)
  }

  // inserts a link prior to this position
  unshift (prev) {
    this.prev.next = prev
    prev.prev = this.prev
    prev.next = this
    this.prev = prev
  }

  // inserts a link after this position
  push (next) {
    this.next.prev = next
    next.next = this.next
    next.prev = this
    this.next = next
  }
}