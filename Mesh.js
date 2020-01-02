class Mesh {
    constructor(triangles) {
        this.triangles = triangles

        this.calculateCorners()
    }

    calculateCorners() {
        this.c1 = this.triangles[0].v0.toPoint() // small
        this.c2 = this.c1.copy() // big

        this.triangles.forEach(triangle => {
            triangle.vertices.forEach(vertex => {
                if (vertex.x < this.c1.x) this.c1.x = vertex.x
                if (vertex.y < this.c1.y) this.c1.y = vertex.y
                if (vertex.z < this.c1.z) this.c1.z = vertex.z
                if (vertex.x > this.c2.x) this.c2.x = vertex.x
                if (vertex.y > this.c2.y) this.c2.y = vertex.y
                if (vertex.z > this.c2.z) this.c2.z = vertex.z
            })
        })
    }

    multiplySelf(factor) {
        this.triangles.forEach(triangle => {
            triangle.vertices.forEach(vertex => {
                vertex.multiplySelf(factor)
            })
        })
        this.calculateCorners()
        return this
    }

    size() {
        return this.c2.subtract(this.c1).ceilSelf().toArray()
    }

    verticesToStructure(blockType='minecraft:stone') {
        let size = this.size()
        let newStructure = new Structure(size[0], size[1], size[2])
        this.triangles.forEach(triangle => {
            triangle.vertices.forEach(vertex => {
                let x = Math.floor(vertex.x)
                let y = Math.floor(vertex.y)
                let z = Math.floor(vertex.z)
                if (!newStructure.hasBlockAt(x, y, z)) {
                    let block = new Block(x, y, z, blockType)
                    newStructure.setBlock(block)
                }
            })
        })
        return newStructure
    }

    triangleLinesToStructure(blockType='minecraft:stone') {
        let size = this.size()
        let newStructure = new Structure(size[0] + 1, size[1] + 1, size[2] + 1)
        newStructure.forEach((x, y, z) => {
            if (!newStructure.hasBlockAt(x, y, z)) {
                this.triangles.find(triangle => {
                    if (triangle.isLineWithinVoxel(x, y, z)) {
                        let block = new Block(x, y, z, blockType)
                        newStructure.setBlock(block)
                        return true
                    }
                })
            }
        })
        return newStructure
    }

    trianglesToStructure(blocktype='minecraft:stone') {
        return null
    }

    // for .stl
    static fromVerticesArray(verticesArray) {
        let triangles = []

        for (let i = 0; i < verticesArray.length; i += 9) {
            //TODO: sort vertices
            var v0 = new Vertex(verticesArray[i + 1], verticesArray[i + 2], verticesArray[i + 0])
            var v1 = new Vertex(verticesArray[i + 4], verticesArray[i + 5], verticesArray[i + 3])
            var v2 = new Vertex(verticesArray[i + 7], verticesArray[i + 8], verticesArray[i + 6])
            triangles.push(new Triangle(v0, v1, v2))
        }

        return new Mesh(triangles)
    }
}