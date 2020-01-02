const fs = require('fs')
const path = require('path')

const pathBlockStates = 'assets/minecraft/blockstates'
const pathBlockModels = 'assets/minecraft/models/block'

const dirBlockStates = fs.readdirSync(pathBlockStates)
const dirBlockModels = fs.readdirSync(pathBlockModels)

let json = { blockstates:{}, models:{} }

dirBlockStates.forEach(fn => {
    let blockStates = JSON.parse(fs.readFileSync(path.join(pathBlockStates, fn), 'utf8'))
    json.blockstates[fn.replace(/\.json/, '')] = blockStates
})
dirBlockModels.forEach(fn => {
    let blockModels = JSON.parse(fs.readFileSync(path.join(pathBlockModels, fn), 'utf8'))
    json.models['block/' + fn.replace(/\.json/, '')] = blockModels
})

fs.writeFileSync('assets.json', JSON.stringify(json))