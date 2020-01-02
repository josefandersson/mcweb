class Structure {
    constructor(width, height, depth) {
        this.width = width // x/east(+)-west(-)
        this.height = height // y
        this.depth = depth // z/south(+)-north(-)
        this.blocks = []
        for (let x = 0; x < this.width; x++) {
            let yAxis = []
            for (let y = 0; y < this.height; y++) {
                let zAxis = []
                for (let z = 0; z < this.depth; z++) {
                    zAxis[z] = null
                }
                yAxis[y] = zAxis
            }
            this.blocks[x] = yAxis
        }

        this.ignoreAir = false
    }


    forEach(callback, xLimit=this.width, yLimit=this.height, zLimit=this.depth) {
        if (callback) {
            for (let x = 0; x < xLimit; x++) {
                for (let y = 0; y < yLimit; y++) {
                    for (let z = 0; z < zLimit; z++) {
                        callback(x, y, z)
                    }
                }
            }
        }
    }

    forEachBlock(callback, ignoreAir=this.ignoreAir, xLimit=this.width, yLimit=this.height, zLimit=this.depth) {
        if (callback) {
            this.forEach((x, y, z) => {
                let block = this.getBlock(x, y, z, ignoreAir)
                if (block != null) {
                    callback(block)
                }
            }, xLimit, yLimit, zLimit)
        }
    }

    flipY() {
        this.forEachBlock(block => {
            block.setPosition(block.x, this.height - block.y - 1, block.z, true)
        }, this.width, Math.floor(this.height / 2))
        this.forEachBlock(block => {
            if (block.properties && block.properties.half) {
                if (block.properties.half === 'bottom') {
                    block.properties.half = 'top'
                } else {
                    block.properties.half = 'bottom'
                }
            }
        })
    }

    positionInBounds(x, y, z) {
        return  0 <= x && x < this.width &&
                0 <= y && y < this.height &&
                0 <= z && z < this.depth
    }

    setBlockAir(x, y, z) {
        if (this.positionInBounds(x, y, z)) {
            return this.setBlock(new Block(x, y, z, 'minecraft:air'))
        }
        return null
    }

    setBlock(block) { // TODO: remember previous blocks so a revert/undo is possible
        if (block && this.positionInBounds(block.x, block.y, block.z)) {
            this.blocks[block.x][block.y][block.z] = block
            block.structure = this
            return block
        }
        return null
    }

    replaceBlockType(oldBlockType, newBlockType, removeProperties=true, removeData=true) {
        this.forEachBlock(block => {
            if (block.type === oldBlockType) {
                block.type = newBlockType
                if (removeProperties === true) {
                    block.properties = null
                }
                if (removeData === true) {
                    block.data = null
                }
            }
        }, oldBlockType !== 'minecraft:air')
        return this
    }

    fill(x0, y0, z0, x1, y1, z1, type='minecraft:air') { // TODO: change type to block?
        if (this.positionInBounds(x0, y0, z0) && this.positionInBounds(x1, y1, z1)) {
            let xo = Math.min(x0, x1)
            let yo = Math.min(y0, y1)
            let zo = Math.min(z0, z1)
            this.forEach((x, y, z) => {
                this.setBlock(new Block(x + xo, y + yo, z + zo, type))
            }, Math.abs(x0 - x1) + 1, Math.abs(y0 - y1) + 1, Math.abs(z0 - z1) + 1)
            return this
        }
        return null
    }

    getBlock(x, y, z, ignoreAir=this.ignoreAir) {
        if (this.positionInBounds(x, y, z)) {
            let block = this.blocks[x][y][z]

            if (block == null) {
                if (ignoreAir !== true) {
                    block = this.setBlockAir(x, y, z)
                }
            } else {
                if (ignoreAir === true && block.type === 'minecraft:air') {
                    block = null
                }
            }

            return block
        }
        return null
    }
    
    getBlockList(ignoreAir=this.ignoreAir) {
        let blockList = []
        let i = 0
        this.forEach((x, y, z) => {
            blockList[i++] = this.getBlock(x, y, z, ignoreAir)
        })
        return blockList
    }

    hasBlockAt(x, y, z, ignoreAir=this.ignoreAir) {
        if (this.positionInBounds(x, y, z)) {
            if (this.blocks[x][y][z] != null) {
                if (ignoreAir === true) {
                    if (this.blocks[x][y][z].type !== 'minecraft:air') {
                        return true
                    }
                } else {
                    return true
                }
            }
        }
        return false
    }

    // TODO: count how many were added
    merge(otherStructure, overwriteOther=true) {
        let struct = new Structure(
                Math.max(this.width, otherStructure.width),
                Math.max(this.height, otherStructure.height),
                Math.max(this.depth, otherStructure.depth))
        
        struct.forEach((x, y, z) => {
            let block
            if (overwriteOther === true) {
                block = this.getBlock(x, y, z, true) || otherStructure.getBlock(x, y, z, true)
            } else {
                block = otherStructure.getBlock(x, y, z, true) || this.getBlock(x, y, z, true)
            }

            if (block != null) {
                struct.setBlock(block.copy())
            }
        })

        return struct
    }

    // TODO: count how many were subtracted
    subtract(otherStructure) {
        let struct = new Structure(this.width, this.height, this.depth)

        struct.forEach((x, y, z) => {
            if (otherStructure.getBlock(x, y, z, true) == null) {
                struct.setBlock(this.getBlock(x, y, z, false).copy())
            } else {
                struct.setBlockAir(x, y, z)
            }
        })

        return struct
    }

    toWebGL() {
        let textures = {}

        let push = (textureName, block, asset, x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3, n, m, o, uv=null) => {
            if (textures[textureName] == null) {
                textures[textureName] = { vertices:[], indices:[], normals:[], texCoords:[] }
            }

            let p0 = [x0, y0, z0]
            let p1 = [x1, y1, z1]
            let p2 = [x2, y2, z2]
            let p3 = [x3, y3, z3]

            if (asset.x != null) {
                let angle = Math.PI / 180 * (-asset.x)
                glMatrix.vec3.rotateX(p0, p0, [8, 8, 8], angle)
                glMatrix.vec3.rotateX(p1, p1, [8, 8, 8], angle)
                glMatrix.vec3.rotateX(p2, p2, [8, 8, 8], angle)
                glMatrix.vec3.rotateX(p3, p3, [8, 8, 8], angle)
            }
            if (asset.y != null) {
                let angle = Math.PI / 180 * (-asset.y)
                glMatrix.vec3.rotateY(p0, p0, [8, 8, 8], angle)
                glMatrix.vec3.rotateY(p1, p1, [8, 8, 8], angle)
                glMatrix.vec3.rotateY(p2, p2, [8, 8, 8], angle)
                glMatrix.vec3.rotateY(p3, p3, [8, 8, 8], angle)
            }

            if (uv == null) {
                uv = [0,0,1,1]
            } else {
                uv = uv.map(v => v/16)
            }

            let i = textures[textureName].vertices.length / 3
            textures[textureName].vertices.push(
                block.x + p0[0] / 16, block.y + p0[1] / 16, block.z + p0[2] / 16,
                block.x + p1[0] / 16, block.y + p1[1] / 16, block.z + p1[2] / 16,
                block.x + p2[0] / 16, block.y + p2[1] / 16, block.z + p2[2] / 16,
                block.x + p3[0] / 16, block.y + p3[1] / 16, block.z + p3[2] / 16)
            textures[textureName].indices.push(
                i, i + 1, i + 2,
                i, i + 2, i + 3)
            textures[textureName].normals.push(
                n, m, o,
                n, m, o,
                n, m, o,
                n, m, o)
            textures[textureName].texCoords.push(
                uv[2], uv[1],
                uv[2], uv[3],
                uv[0], uv[3],
                uv[0], uv[1])
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth; z++) {
                    let block = this.getBlock(x, y, z, true)
                    if (block == null) {
                        continue
                    }

                    let assets = block.getAssets()
            
                    if (assets == null) {
                        console.warn('Block', block, 'does not have any assets. Is no resource pack loaded?')
                        continue
                    }
            
                    if (block.hasObscureModel()) {
                        // render all as the model says (model.elements[i].faces)
                        assets.forEach(asset => {
                            asset.model.elements.forEach(element => {
                                let f = element.from
                                let t = element.to
                                if (element.faces.north != null) {
                                    push(element.faces.north.texture, block, asset,
                                        f[0], f[1], f[2], f[0], t[1], f[2], t[0], t[1], f[2], t[0], f[1], f[2], 0, 0, 1, element.faces.north.uv)
                                }if (element.faces.south != null) {
                                    push(element.faces.south.texture, block, asset,
                                        t[0], f[1], t[2], t[0], t[1], t[2], f[0], t[1], t[2], f[0], f[1], t[2], 0, 0, -1, element.faces.south.uv)
                                }
                                if (element.faces.west != null) {
                                    push(element.faces.west.texture, block, asset,
                                        f[0], f[1], t[2], f[0], t[1], t[2], f[0], t[1], f[2], f[0], f[1], f[2], 1, 0, 0, element.faces.west.uv)
                                }
                                if (element.faces.east != null) {
                                    push(element.faces.east.texture, block, asset,
                                        t[0], f[1], f[2], t[0], t[1], f[2], t[0], t[1], t[2], t[0], f[1], t[2], -1, 0, 0, element.faces.east.uv)
                                }
                                if (element.faces.up != null) {
                                    push(element.faces.up.texture, block, asset,
                                        f[0], t[1], f[2], f[0], t[1], t[2], t[0], t[1], t[2], t[0], t[1], f[2], 0, 1, 0, element.faces.up.uv)
                                }
                                if (element.faces.down != null) {
                                    push(element.faces.down.texture, block, asset,
                                        f[0], f[1], f[2], t[0], f[1], f[2], t[0], f[1], t[2], f[0], f[1], t[2], 0, -1, 0, element.faces.down.uv)
                                }
                            })
                        })
                    } else {
                        let neighbors = block.neighbors(true)
                        let faces = assets[0].model.elements[0].faces
                        if (neighbors.north == null || neighbors.north.hasObscureModel()) {
                            push(faces.north.texture, block, assets[0], 0, 0, 0, 0, 16, 0, 16, 16, 0, 16, 0, 0, 0, 0, 1, faces.north.uv)
                        }
                        if (neighbors.south == null || neighbors.south.hasObscureModel()) {
                            push(faces.south.texture, block, assets[0], 16, 0, 16, 16, 16, 16, 0, 16, 16, 0, 0, 16, 0, 0, -1, faces.south.uv)
                        }
                        if (neighbors.west == null || neighbors.west.hasObscureModel()) {
                            push(faces.west.texture, block, assets[0], 0, 0, 16, 0, 16, 16, 0, 16, 0, 0, 0, 0, 1, 0, 0, faces.west.uv)
                        }
                        if (neighbors.east == null || neighbors.east.hasObscureModel()) {
                            push(faces.east.texture, block, assets[0], 16, 0, 0, 16, 16, 0, 16, 16, 16, 16, 0, 16, -1, 0, 0, faces.east.uv)
                        }
                        if (neighbors.above == null || neighbors.above.hasObscureModel()) {
                            push(faces.up.texture, block, assets[0], 16, 16, 16, 16, 16, 0, 0, 16, 0, 0, 16, 16, 0, 1, 0, faces.up.uv)
                        }
                        if (neighbors.below == null || neighbors.below.hasObscureModel()) {
                            push(faces.down.texture, block, assets[0], 16, 0, 0, 16, 0, 16, 0, 0, 16, 0, 0, 0, 0, -1, 0, faces.down.uv)
                        }
                    }
                }
            }
        }
        // this.forEachBlock(block => {
        // }, true)

        let vertices = []
        let indices = []
        let normals = []
        let texCoords = []
        let textureIndices = []

        for (const key in textures) {
            let texture = textures[key]
            let iOffset = vertices.length / 3
            let startOffset = indices.length
            vertices = vertices.concat(texture.vertices)
            indices = indices.concat(texture.indices.map(i => i + iOffset))
            normals = normals.concat(texture.normals)
            texCoords = texCoords.concat(texture.texCoords)
            // vertices.push(...texture.vertices)
            // indices.push(...texture.indices.map(i => i + iOffset))
            // normals.push(...texture.normals)
            // texCoords.push(...texture.texCoords)
            textureIndices.push({ textureName:key, start:startOffset * Uint16Array.BYTES_PER_ELEMENT, length:texture.indices.length })
        }
        // Object.entries(textures).forEach(entry => {
        //     let iOffset = vertices.length / 3
        //     let startOffset = indices.length
        //     vertices.push(...entry[1].vertices)
        //     indices.push(...entry[1].indices.map(i => i + iOffset))
        //     normals.push(...entry[1].normals)
        //     texCoords.push(...entry[1].texCoords)
        //     textureIndices.push({ textureName:entry[0], start:startOffset * Uint16Array.BYTES_PER_ELEMENT, length:entry[1].indices.length })
        // })
        
        return { vertices, indices, normals, texCoords, textureIndices, centerOffset:[ this.width/2, this.height/2, this.depth/2 ], radius:Math.max(this.width, this.height, this.depth) + 5 }
    }

    // returns object for writing with 'nbt' module
    toNBT() {
        let nbt = { name:'', value:{} }

        let w = this.width, h = this.height, d = this.depth

        if (w > 32 || h > 32 || d > 32) {
            // TODO: alert user
            console.log('To be able to load large model in minecraft size parameter is being spoofed. Beware: the preview box showing up from structure blocks will not be accurate. The loaded model will be larger than the box.')
            w = Math.min(w, 32)
            h = Math.min(h, 32)
            d = Math.min(d, 32)
        }

        nbt.value.DataVersion = { type:'int', value:1976 }
        nbt.value.size = { type:'list', value:{ type:'int', value:[ w, h, d ] } }
        nbt.value.entities = { type:'list', value: { type:'end', value:[] } }

        let states = []
        let blocks = []

        this.forEachBlock(block => {
            let state = states.findIndex(s => s.type === block.type && JSON.stringify(s.properties) === JSON.stringify(block.properties)) // TODO: instead of JSON, make general method for comparing objects

            if (state < 0) {
                state = states.push({ type:block.type, properties:block.properties }) - 1
            }

            blocks.push({
                pos:{ type:'list', value:{ type:'int', value:[block.x, block.y, block.z] } },
                state:{ type:'int', value:state }
            })
        })

        states = states.map(stateData => {
            let out = { Name:{ type:'string', value:stateData.type }}
            if (stateData.properties) {
                out.Properties = { type:'compound', value:{} }
                Object.entries(stateData.properties).forEach(entry => {
                    out.Properties.value[entry[0]] = { type:'string', value:entry[1] }
                })
            }
            return out
        })

        nbt.value.blocks = { type:'list', value:{ type:'compound', value:blocks } }
        nbt.value.palette = { type:'list', value:{ type:'compound', value:states } }

        return nbt
    }

    // nbt: object returned from 'nbt' module parse function
    static fromNBT(nbt) {
        let data = shrinkNBT(nbt)

        let struct = new Structure(data.size[0], data.size[1], data.size[2])

        let palette = data.palette.map(mat => {
            let out = { name:mat.Name }
            if (mat.Properties) {
                out.properties = mat.Properties
            }
            return out
        })

        data.blocks.forEach(obj => {
            let mat = palette[obj.state]
            let blockData = obj.nbt
            let block = new Block(
                    obj.pos[0],
                    obj.pos[1],
                    obj.pos[2],
                    mat.name,
                    mat.properties,
                    blockData)
            struct.setBlock(block)
        })
        
        return struct
    }

    // nbt: object returned from 'nbt' module parse function
    static fromLitematic(nbt) {
        let obj = shrinkNBT(nbt)
        console.log(obj)

        // TODO: check MinecraftDataVersion?

        let numRegions = Object.keys(obj.Regions).length

        if (numRegions > 1) {
            console.log('Regions will be merged (not revertable)')
            // TODO: tell user
        }

        let struct = new Structure(obj.Metadata.EnclosingSize.x, obj.Metadata.EnclosingSize.y, obj.Metadata.EnclosingSize.z)

        Object.entries(obj.Regions).forEach(entry => {
            if (entry[1].Size.x < 0) {
                entry[1].Position.x += entry[1].Size.x + 1
                entry[1].Size.x *= -1
            }
            if (entry[1].Size.y < 0) {
                entry[1].Position.y += entry[1].Size.y + 1
                entry[1].Size.y *= -1
            }
            if (entry[1].Size.z < 0) {
                entry[1].Position.z += entry[1].Size.z + 1
                entry[1].Size.z *= -1
            }

            let palette = entry[1].BlockStatePalette.map(mat => {
                let out = { name:mat.Name }
                if (mat.Properties) {
                    out.properties = mat.Properties
                }
                return out
            })

            let xo = entry[1].Position.x, yo = entry[1].Position.y, zo = entry[1].Position.z

            let numBits = Math.max(2, Math.ceil(Math.log2(entry[1].BlockStatePalette.length)))
            let compareTo = Math.pow(2, numBits) - 1
            let i = 0
            console.log('numBits:', numBits)
            for (let y = 0; y < entry[1].Size.y; y++) {
                for (let z = 0; z < entry[1].Size.z; z++) {
                    for (let x = 0; x < entry[1].Size.x; x++) {
                        let state = 0
                        for (let bit = 0; bit < numBits; bit++) {
                            let bitIndex = i * numBits + bit
                            state = state ^ ((entry[1].BlockStates[Math.floor(bitIndex / 64)][1 - Math.floor(bitIndex % 64 / 32)] >> (bitIndex % 32) & 1) << bit)
                            // console.log('i', i, 'ii', bitIndex, 'bitIndex:', bitIndex % 32, 'i0:', Math.floor(bitIndex/64), 'i1:', 1 - Math.floor(bitIndex % 64 / 32),
                            //         'state:', state.toString(2))
                        }

                        let mat = palette[state]
                        let block = new Block(
                                x + xo,
                                y + yo,
                                z + zo,
                                mat.name,
                                mat.properties,
                                undefined) // TODO: blockdata (chests, etc.)
                        struct.setBlock(block)
                        i++
                    }
                }
            }
        })

        return struct.replaceBlockType('minecraft:cave_air', 'minecraft:air')
    }

    // nbt: object returned from 'nbt' module parse function
    static fromSchematic(nbt) {
        let obj = shrinkNBT(nbt)

        console.log('Shrinked Schematic', obj)

        let struct = new Structure(obj.Width, obj.Height, obj.Length)

        // TODO: data IDs (eg. minecraft:orange_wool from 35:14)

        let i = 0
        for (let x = 0; x < struct.width; x++) {
            for (let y = 0; y < struct.height; y++) {
                for (let z = 0; z < struct.depth; z++) {
                    let properties
                    let data
                    let block = new Block(
                            x,
                            y,
                            z,
                            MinecraftIDs.numberToString(obj.Blocks[i]),
                            properties,
                            data)
                    struct.setBlock(block)
                    i++
                }
            }    
        }

        return struct.replaceBlockType('minecraft:cave_air', 'minecraft:air')
    }
}

function shrinkNBT(nbtData) {
    if (nbtData.value == null) return null

    if (typeof nbtData.value === 'string' || typeof nbtData.value === 'number') return nbtData.value
    
    if (nbtData.type === 'byteArray') return nbtData.value.map(b => b & 0xff)

    if (nbtData.type === 'longArray') return nbtData.value.map(v => [v[0] , v[1]])

    if (nbtData.type === 'list') {
        if (nbtData.value.type === 'compound') {
            return nbtData.value.value.map(obj => shrinkNBT({value:obj}))
        } else {
            return nbtData.value.value
        }
    }

    let out = {}
    Object.entries(nbtData.value).forEach(entry => {
        out[entry[0]] = shrinkNBT(entry[1])
    })
    
    return out
}