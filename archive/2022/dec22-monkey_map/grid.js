import { strict as assert } from 'node:assert'

/* Minimally-functional linked GridPoint class:
 *  - raster-style append-only (new GridPoint(...) across, then point.link(...) to align xPos with above row)
 *  - moveUp, moveRight, moveDown, moveLeft takes int arg and yields the destination point
 *  - clean will self-remove if point is empty, yielding xNext point
 *  - walls prevent movement in any direction, yields the point prior to hitting wall
 */
export class GridPoint {
  constructor (char, xPos, yPos, xPrev = null) {
    this.isWall = (char === '#')
    this.isEmpty = (char === ' ')
    this.xPos = xPos
    this.yPos = yPos
    this.direction = null
    if (xPrev) {
      xPrev.push(this)
    } else { // A linked list of size 1
      this.xPrev = this
      this.xNext = this
    }
    this.yPrev = this
    this.yNext = this
  }

  push (next) {
    this.xNext.xPrev = next
    next.xNext = this.xNext
    next.xPrev = this
    this.xNext = next
  }

  // Given an array of grid points, links up to the one with the same xPos
  link (...points) {
    const yPrev = points.find(el => el.xPos === this.xPos)
    if (yPrev) {
      yPrev.yNext.yPrev = this
      this.yNext = yPrev.yNext
      this.yPrev = yPrev
      yPrev.yNext = this
      // console.warn({ x: this.xPos, y: this.yPos, prev: `${this.yPrev.xPos},${this.yPrev.yPos}`})
    } else {
      // console.warn({ x: this.xPos, y: this.yPos, msg: 'unknown gridpoint'})
    }
  }

  // optionally removes self if empty
  clean () {
    if (!this.isEmpty) return this
    this.xNext.xPrev = this.xPrev
    this.xPrev.xNext = this.xNext
    this.yNext.yPrev = this.yPrev
    this.yPrev.yNext = this.yNext
    return null
  }

  status () {
    const status = { x: this.xPos + 1, y: this.yPos + 1, facing: this.facing() }
    if (this.isWall) status.isWall = true
    return status
  }

  next() {
    return {
      moveUp: this.yPrev,
      moveRight: this.xNext,
      moveDown: this.yNext,
      moveLeft: this.xPrev
    }[this.direction]
  }

  moveUp (n = 1, force = false) {
    const next = this.next()
    if (next.isWall && !force) return this
    next.direction = 'moveUp'
    return next.walk(n - 1)
  }

  moveDown (n = 1, force = false) {
    const next = this.next()
    if (next.isWall && !force) return this
    next.direction = 'moveDown'
    return next.walk(n - 1)
  }

  moveLeft (n = 1, force = false) {
    const next = this.next()
    if (next.isWall && !force) return this
    next.direction = 'moveLeft'
    return next.walk(n - 1)
  }

  moveRight (n = 1, force = false) {
    const next = this.next()
    if (next.isWall && !force) return this
    next.direction = 'moveRight'
    return next.walk(n - 1)
  }

  walk (n = 1, force = false) {
    assert(Number.isInteger(n) && n >= 0, 'argument must be a non-negative integer')
    if (n === 0) return this
    // console.log('walking', { ...this.status(), n })
    const next = this[this.direction](n, force)
    return next
  }

  turn (rls) {
    this.direction = {
      moveUp: { L: 'moveLeft', R: 'moveRight' },
      moveLeft: { L: 'moveDown', R: 'moveUp' },
      moveRight: { L: 'moveUp', R: 'moveDown' },
      moveDown: { L: 'moveRight', R: 'moveLeft' }
    }[this.direction][rls] || this.direction
    return this.direction
  }

  facing () {
    return {
      moveRight: 0,
      moveDown: 1,
      moveLeft: 2,
      moveUp: 3
    }[this.direction]
  }
}