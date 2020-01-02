class Point {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    addSelf(otherPoint) {
        this.x += otherPoint.x
        this.y += otherPoint.y
        this.z += otherPoint.z
        return this
    }

    distanceTo(otherPoint) {
        return Math.sqrt(Math.pow(this.x - otherPoint.x, 2) + Math.pow(this.y - otherPoint.y, 2) + Math.pow(this.z - otherPoint.z, 2))
    }

    copy() {
        return new Point(this.x, this.y, this.z)
    }

    toArray() {
        return [ this.x, this.y, this.z ]
    }

    ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z))
    }

    ceilSelf() {
        this.x = Math.ceil(this.x)
        this.y = Math.ceil(this.y)
        this.z = Math.ceil(this.z)
        return this
    }

    multiplySelf(factor) {
        this.x *= factor
        this.y *= factor
        this.z *= factor
        return this
    }

    divideSelf(divisor) {
        this.x /= divisor
        this.y /= divisor
        this.z /= divisor
        return this
    }

    subtract(otherPoint) {
        return new Point(this.x - otherPoint.x, this.y - otherPoint.y, this.z - otherPoint.z)
    }

    isPointWithinVoxel(x, y, z) {
        return Math.ceil(this.x) == x && Math.ceil(this.y) == y && Math.ceil(this.z) == z
    }

}

class Vertex extends Point {
    constructor(x, y, z) {
        super(x, y, z)
    }

    toPoint() {
        return new Point(this.x, this.y, this.z)
    }
}