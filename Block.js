class Block {
    constructor(x, y, z, type, properties=null, data=null) {
        this.x = x
        this.y = y
        this.z = z
        this.type = type
        this.properties = properties
        this.data = data // for blocks with inventory, etc.

        this.hasAssets = null
        this.assets = null
        this.assetsType = null
        this.assetsProperties = null
    }

    copy() {
        return new Block(this.x, this.y, this.z, this.type, this.properties, this.data)
    }

    getRelative(xOffset, yOffset, zOffset, ignoreAir=undefined) {
        if (this.structure != null) {
            return this.structure.getBlock(this.x + xOffset, this.y + yOffset, this.z + zOffset, ignoreAir)
        } else {
            return null
        }
        
    }

    neighbors(ignoreAir=undefined) {
        return {
            south:this.south(ignoreAir),
            north:this.north(ignoreAir),
            east:this.east(ignoreAir),
            west:this.west(ignoreAir),
            above:this.above(ignoreAir),
            below:this.below(ignoreAir)
        }
    }

    south(ignoreAir=undefined) {
        return this.getRelative(0, 0, 1, ignoreAir)
    }

    north(ignoreAir=undefined) {
        return this.getRelative(0, 0, -1, ignoreAir)
    }

    east(ignoreAir=undefined) {
        return this.getRelative(1, 0, 0, ignoreAir)
    }

    west(ignoreAir=undefined) {
        return this.getRelative(-1, 0, 0, ignoreAir)
    }

    above(ignoreAir=undefined) {
        return this.getRelative(0, 1, 0, ignoreAir)
    }

    below(ignoreAir=undefined) {
        return this.getRelative(0, -1, 0, ignoreAir)
    }

    setPosition(x, y, z, replace=false) {
        if (!(this.x === x && this.y === y && this.z === z) && this.structure.positionInBounds(x, y, z)) {
            if (replace) {
                let oldBlock = this.structure.getBlock(x, y, z)
                oldBlock.setPosition(this.x, this.y, this.z)
            } else {
                this.structure.setBlock(new Block(this.x, this.y, this.z, 'minecraft:air'))
            }

            this.x = x
            this.y = y
            this.z = z
            this.structure.setBlock(this)
            return true
        }
        return false
    }

    getAssets() {
        if (this.assets == null || this.assetsType != this.type || this.assetsProperties != this.properties) {
            this.assets = MinecraftAssets.getBlockAssets(this)
            this.assetsType = this.type
            this.assetsProperties = cloneObject(this.properties)
            this.hasAssets = this.assets != null
        }
        return this.assets
    }

    hasObscureModel() {
        if (this.getAssets() != null) {
            if (this.assets == null || this.assets.length > 1 || this.assets[0].model.elements.length > 1) {
                return true
            }
            let from = this.assets[0].model.elements[0].from
            let to = this.assets[0].model.elements[0].to
            if (from[0] !== 0 || from[1] !== 0 || from[2] !== 0 || to[0] !== 16 || to[1] !== 16 || to[2] !== 16) {
                return true
            }
        }
        return !this.hasAssets
    }

}