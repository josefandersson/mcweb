class Triangle {
    constructor(v0, v1, v2) {
        this.vertices = [v0, v1, v2]
        this.v0 = v0
        this.v1 = v1
        this.v2 = v2
    }

    isLineWithinVoxel(x, y, z) {
        let l0 = new Line(this.v0, this.v1)
        if (l0.isLineWithinVoxel(x, y, z)) return true
        let l1 = new Line(this.v1, this.v2)
        if (l1.isLineWithinVoxel(x, y, z)) return true
        let l2 = new Line(this.v2, this.v0)
        if (l2.isLineWithinVoxel(x, y, z)) return true
        return false
        
    }

    isWithinVoxel(x, y, z) {
        // TODO: check plane, not just lines
    }

}

class Line {
    constructor(v0, v1) {
        this.v0 = v0
        this.v1 = v1
    }

    isLineWithinVoxel(x, y, z) {
        let length = this.length()
        let vector = this.v1.subtract(this.v0).divideSelf(length)
        let v0 = this.v0.copy().addSelf(new Point(-0.5, -0.5, -0.5))
        for (let i = 0; i <= length; i++) {
            if (v0.isPointWithinVoxel(x, y, z)) {
                return true
            }
            v0.addSelf(vector)
        }
        return false
    }

    length() {
        return this.v0.distanceTo(this.v1)
    }
}