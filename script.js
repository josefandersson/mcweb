class GenerateForm {
    constructor(parentElement) {
        this.elements = {
            container: parentElement,
            toggle: parentElement.querySelector('.toggle'),
            form: parentElement.querySelector('form'),
            vertical: parentElement.querySelector('.vertical'),
            type: parentElement.querySelector('.type')
        }

        this.elements.toggle.addEventListener('click', () => { this.toggle() })
        this.elements.form.addEventListener('submit', ev => { this.submit(ev) })
        this.elements.type.addEventListener('change', () => { this.updateForm() })
    }
    
    toggle() {
        this.elements.form.classList.toggle('open')
        this.updateHeight()
    }

    submit(ev) {
        if (ev) ev.preventDefault()
        if (!this.elements.form.classList.contains('open')) return

        let formData = new FormData(this.elements.form)

        let struct = new Structure(
            formData.get('width'),
            formData.get('height'),
            formData.get('depth'))

        if (formData.get('type') === 'box') {
            struct.fill(`minecraft:${formData.get('block')}`)
            if (!formData.get('fill') && struct.isSizeLargerThanOrEqualTo(3, 3, 3)) {
                struct.fill('minecraft:air', 1, 1, 1, struct.width - 2, struct.height - 2, struct.depth - 2)
            }
        }

        if (formData.get('type') === 'sphere') {
            // let center = struct.getCenter()
            // // Math.cos(angle), Math.sin(angle) -> Math.acos(x)=angleX
            // // Math.cos(angleX)*Math.cos(angleY) * distanceX, Math.sin(angleY) * distanceY, Math.sin(angleX)*Math.cos(angleY) * distanceZ

            // //   size: 10, 10, 10
            // // center:  5,  5,  5
            // //  point:  0,  5,  5 -> -1, 0, 0
            // //  point:  5,  5,  0 -> 0, 0, -1
            // struct.forEach((x, y, z) => {
            //     let nx = center[0]
            //     let ny = center[1]
            //     let nz = center[2]
            //     // let distance = Math.round(Math.sqrt(Math.pow(x, 2), Math.pow(y, 2), Math.pow(z, 2)))
            //     let angleX = Math.acos(nx / center[0])
            //     let angleY = Math.asin(ny / center[1])
            //     let point = [
            //         Math.cos(angleX) * Math.cos(angleY) * struct.width,
            //         Math.sin(angleY) * struct.height,
            //         Math.sin(angleX)*Math.cos(angleY) * struct.depth]
                
            // })
            let center = struct.getCenter()
            center[0]--
            center[1]--
            center[2]--
            for (let angleX = -Math.PI; angleX < Math.PI; angleX += .001) {
                for (let angleY = -Math.PI; angleY < Math.PI; angleY += .001) {
                    let point = [
                        Math.round(Math.cos(angleX) * Math.cos(angleY) * center[0] + center[0]),
                        Math.round(Math.sin(angleY) * center[1] + center[1]),
                        Math.round(Math.sin(angleX)*Math.cos(angleY) * center[2] + center[2])]
                    struct.setBlock(new Block(point[0], point[1], point[2], 'minecraft:stone_bricks'))
                }
            }
        }

        if (formData.get('type') === 'helix') {
            let distanceX = struct.width / 2
            let distanceZ = struct.depth / 2
            let angle = 0
            let stepY = Math.min(1, formData.get('step'))
            let stepAngle = Math.atan((1 - stepY) / Math.min(distanceX, distanceZ)) - .001
            let y = 0
            while (y <= struct.height - 1 - stepY) {
                let x = Math.floor(Math.cos(angle) * distanceX + distanceX)
                let z = Math.floor(Math.sin(angle) * distanceZ + distanceZ) 
                struct.setBlock(new Block(x, Math.floor(y), z, 'minecraft:stone_bricks'))
                angle += stepAngle
                y += stepY
            }
        }

        structure = struct
        updateInfo()
    }

    updateForm() {
        for (const element of this.elements.vertical.children) {
            if (element.dataset.for != null) {
                if (element.dataset.for.indexOf(this.elements.type.value) === -1) {
                    element.classList.remove('show')
                } else {
                    element.classList.add('show')
                }
            }
        }
        this.updateHeight()
    }

    updateHeight() {
        this.elements.form.style.height = 0
        if (this.elements.form.classList.contains('open')) {
            this.elements.form.style.height = this.elements.vertical.scrollHeight + 'px'
        }
    }
}

let gf = new GenerateForm(document.querySelector('.generate_container'))


const elFileInput = document.getElementById('file_input')
const elDropFile = document.getElementById('drop_file')
const elBackground = document.querySelector('body > div.background')
const elText = document.querySelector('#drop_file > p')
const elSizeX = document.getElementById('size_x')
const elSizeY = document.getElementById('size_y')
const elSizeZ = document.getElementById('size_z')
const elDownload = document.getElementById('download')

elFileInput.addEventListener('change', ev => {
    if (elFileInput.files && elFileInput.files.length > 0) {
        processFile(elFileInput.files[0])
    }
})

elDropFile.addEventListener('dragenter', ev => {
    ev.preventDefault()
    ev.stopPropagation()
    if (ev.fromElement == elDropFile) return
    elDropFile.classList.add('dragover')
})

elDropFile.addEventListener('dragleave', ev => {
    ev.preventDefault()
    ev.stopPropagation()
    if (ev.fromElement == elDropFile) return
    if (ev.fromElement.parentElement == elDropFile) return
    elDropFile.classList.remove('dragover')
})

elDropFile.addEventListener('drop', ev => {
    ev.preventDefault()
    if (ev.dataTransfer.items) {
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === 'file') {
                let file = ev.dataTransfer.items[i].getAsFile()
                fileDropped(file)
            }
        }
    } else {
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            let file = ev.dataTransfer.files[i]
            fileDropped(file)
        }
    }
    elDropFile.classList.remove('dragover')
    return false
})

window.addEventListener('dragover', ev => {
    ev.preventDefault()
})

window.addEventListener('drop', ev => {
    ev.preventDefault()
})

elDownload.addEventListener('click', ev => {
    download()
})

function fileDropped(file) {
    elDropFile.classList.add('fileselected')
    elText.innerText = file.name
    processFile(file)
}

let structure
let mesh
let triangleVertices

function updateInfo() {
    if (structure) {
        elSizeX.value = structure.width
        elSizeY.value = structure.height
        elSizeZ.value = structure.depth

        display.loadModel(structure.toWebGL())
        display.start()

        elDownload.removeAttribute('disabled')
    } else {
        elDownload.setAttribute('disabled', true)
    }
}

function processFile(file) {
    let reader = new FileReader()

    reader.onload = () => {
        if (/\.nbt$/.test(file.name)) {
            nbt.parse(reader.result, (err, nbtData) => {
                if (err) throw err // TODO: handle
                structure = Structure.fromNBT(nbtData)
                display.loadModel(structure.toWebGL())
            })
        } else if (/\.stl$/.test(file.name)) {
            let stlReader = new StlReader()
            let res = stlReader.read(reader.result)
            // console.log(res.vn)
            console.log(res.vertices)
            triangleVertices = res.vertices
            // mesh = Mesh.fromVerticesArray(res.vertices)
        } else if (/\.litematic$/.test(file.name)) {
            nbt.parse(reader.result, (err, nbtData) => {
                if (err) throw err // TODO: handle
                structure = Structure.fromLitematic(nbtData)
                display.loadModel(structure.toWebGL())
            })
        } else if (/\.schematic$/.test(file.name)) {
            nbt.parse(reader.result, (err, nbtData) => {
                if (err) throw err // TODO: handle
                console.log(nbtData)
                structure = Structure.fromSchematic(nbtData)
            })
        } else if (/\.dat/.test(file.name)) {
            nbt.parse(reader.result, (err, nbtData) => {
                if (err) throw err
                console.log(nbtData)
            })
        }
        updateInfo()
    }

    reader.readAsArrayBuffer(file)
}

function download() {
    if (!structure) return
    let newNbtData = structure.toNBT()
    console.log('Attempting to write...')
    let blob = new Blob([new Uint8Array(pako.gzip(nbt.writeUncompressed(newNbtData)))])
    saveAs(blob, 'download.nbt')
}

let keys = { w:{}, a:{}, s:{}, d:{}, q:{}, e:{} }
document.addEventListener('keydown', ev => {
    if (keys[ev.key] == null) {
        keys[ev.key] = {}
    }

    keys[ev.key].time = performance.now()
    keys[ev.key].down = true
})
document.addEventListener('keyup', ev => {
    if (keys[ev.key] == null) {
        keys[ev.key] = {}
        keys[ev.key].time = 0
    }

    keys[ev.key].down = false
})