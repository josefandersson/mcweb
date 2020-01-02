const  fs = require('fs')
const Schematic = require('minecraft-schematic')
const nbt = require('nbt')

let data = fs.readFileSync('my_gate.nbt')
// let data = fs.readFileSync('Small1_vanilla.nbt')

// Schematic.loadSchematic(data, (err, build) => {
//     if (err) throw err
//     console.log(build.getWidth(), '*', build.getLength(), '*', build.getHeight())
// })

// nbt.parse(data, (err, outp) => {
//     if (err) throw err
//     console.log(outp)
//     fs.writeFile('output.json', JSON.stringify(outp), err => console.log)
//     // console.log(data.value.palette.value.value[0])
//     // console.log(data.value.blocks.value.value[21].pos.value.value)

//     console.log('Writing...')
//     let dat = Buffer.from(nbt.writeUncompressed(outp))
//     console.log('dat', dat)
//     fs.writeFileSync('output.nbt', dat)
// })
