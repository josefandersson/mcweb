const MinecraftAssets = {
    loadFromFile: function(filename) { // TODO: if there is a previous asset, override old with all new values (leave some untouched)
        return fetch(filename).then(r => r.json()).then(json => {
            return this.assets = json
        })
    },

    loadFromString: function(string) {
        // TODO: client can load their own resource pack
    },

    getBlockAssets: function(block) {
        if (block != null && block.type !== 'minecraft:air') {
            let blockstates = this.blockstatesForBlockType(block.type)
            if (blockstates != null) {
                let variant

                if (blockstates.multipart != null) {
                    let variant = blockstates.multipart.filter(part => {
                        if (part.when != null) {
                            if (block.properties == null) {
                                return false
                            }
                            for (const key in part.when) {
                                if (block.properties[key] != part.when[key]) {
                                    return false
                                }
                            }
                            return true
                        }
                        return true
                    })[0] // TODO: merge models
                    return variant
                } else {
                    let key = ''
                    if (block.properties != null) {
                        if (block.properties.facing != null)
                            key += `,facing=${block.properties.facing}`
                        if (block.properties.attachment != null)
                            key += `,attachment=${block.properties.attachment}`
                        if (block.properties.east != null)
                            key += `,facing=${block.properties.east}`
                        if (block.properties.north != null)
                            key += `,facing=${block.properties.north}`
                        if (block.properties.south != null)
                            key += `,facing=${block.properties.south}`
                        if (block.properties.up != null)
                            key += `,facing=${block.properties.up}`
                        if (block.properties.west != null)
                            key += `,facing=${block.properties.west}`
                        if (block.properties.type != null)
                            key += `,type=${block.properties.type}`
                        if (block.properties.half != null)
                            key += `,half=${block.properties.half}`
                        if (block.properties.shape != null)
                            key += `,shape=${block.properties.shape}`
                        key = key.substring(1)
                    }
                    if (blockstates.variants[key] == null) {
                        variant = Object.values(blockstates.variants)[0] // fallback to first variant?
                    } else {
                        variant = blockstates.variants[key]
                    }
                }

                if (variant != null) {
                    if (variant instanceof Array) {
                        let i = Math.floor(Math.random() * variant.length)
                        variant = variant[i]
                    }

                    variant.model = this.getModelFromName(variant.model)
                    return variant
                } else {
                    console.warn('Found no model variant for block', block)
                }
            }
        }
        return null
    },

    blockstatesForBlockType: function(blockType) {
        let name = blockType.replace(/minecraft:/, '')
        if (this.assets && this.assets.blockstates[name] != null) {
            return cloneObject(this.assets.blockstates[name])
        }
        return null
    },

    getModelFromName: function(modelName) {
        let out = { ambientocclusion:true, textures:{}, elements:[] }
        let model = cloneObject(this.assets.models[modelName])
        while (model != null) {
            if (model.ambientocclusion != null) {
                out.ambientocclusion = model.ambientocclusion
            }

            if (model.textures != null) {
                let textures = model.textures
                for (const key in textures) {
                    let val = textures[key]
                    out.textures[key] = val
                    if (val.startsWith('#')) {
                        if (out.textures[val.substring(1)] != null) {
                            out.textures[key] = out.textures[val.substring(1)]
                        }
                    }
                }
            }

            if (model.elements != null) {
                out.elements.push(...model.elements.map(element => {
                    let outElement = element
                    for (const key in outElement) {
                        let val = outElement[key]
                        if (typeof val === 'object') {
                            for (const key in val) {
                                let val1 = val[key]
                                if (val1.texture != null) {
                                    if (val1.texture.startsWith('#')) {
                                        let tex = out.textures[val1.texture.substring(1)]
                                        if (tex != null) {
                                            val[key].texture = tex
                                        }
                                    }
                                }
                            }
                        }
                        outElement[key] = val
                    }
                    return outElement
                }))
            }

            if (this.assets.models[model.parent] == null) {
                model = null
            } else {
                model = cloneObject(this.assets.models[model.parent])
            }
        }
        if (out.elements.length === 0) {
            return null
        }
        return out
    }
}

// load default
MinecraftAssets.loadFromFile('assets.json')

function cloneObject(obj) {
    if (obj == null) {
        return null
    }

    if (typeof obj === 'boolean' || typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'bigint') {
        return obj
    }

    if (obj instanceof Array) {
        return obj.map(e => cloneObject(e))
    }

    if (typeof obj === 'object') {
        let objOut = {}
        Object.entries(obj).forEach(entry => {
            objOut[entry[0]] = cloneObject(entry[1])
        })
        return objOut
    }

    console.warn('cloneObject cant handle object type', typeof obj)
    return null
}