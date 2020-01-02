const elFileInput = document.getElementById('file_input')
const elDropFile = document.getElementById('drop_file')
const elBackground = document.querySelector('body > div.background')
const elText = document.querySelector('#drop_file > p')
const elSizeX = document.getElementById('size_x')
const elSizeY = document.getElementById('size_y')
const elSizeZ = document.getElementById('size_z')
const elDownload = document.getElementById('download')
// const elPreview = document.getElementById('preview')

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
                init(structure.toWebGL())
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
                init(structure.toWebGL())
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

// let image = new Image()
// image.src = 'stone_bricks.png'
// image.addEventListener('load', console.log)

// let program, gl, running, radius = 13
// function draw() {
//     if (running == true) {
//         running = false
//         return
//     }

//     if (program != null) {
//         gl.deleteProgram(program)
//     } else {
//         gl = elPreview.getContext('webgl')
//     }

//     running = true

//     const vertexShaderText =
//     `precision mediump float;

//     attribute vec3 vertPosition;
//     attribute vec2 vertTexCoord;
//     attribute vec3 vertNormal;

//     varying vec2 fragTexCoord;
//     varying vec3 fragNormal;

//     uniform mat4 mWorld;
//     uniform mat4 mView;
//     uniform mat4 mProj;
//     uniform vec3 vertOffset;

//     void main()
//     {
//         fragTexCoord = vertTexCoord;
//         fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;

//         gl_Position = mProj * mView * mWorld * vec4(vertPosition + vertOffset, 1.0);
//     }`

//     const fragmentShaderText =
//     `precision mediump float;

//     varying vec2 fragTexCoord;
//     varying vec3 fragNormal;

//     uniform sampler2D sampler;

//     void main()
//     {
//         gl_FragColor = texture2D(sampler, fragTexCoord);
//     }`

//     // elPreview.width = window.innerWidth
//     // elPreview.height = window.innerHeight
//     // window.addEventListener('resize', () => {
//     //     elPreview.width = window.innerWidth
//     //     elPreview.height = window.innerHeight
//     //     gl.viewport(0, 0, window.innerWidth, window.innerHeight)
//     // })

//     gl.clearColor(0, 0, 0, 0)
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
//     gl.enable(gl.DEPTH_TEST)
//     gl.enable(gl.CULL_FACE)
//     gl.frontFace(gl.CCW)
//     gl.cullFace(gl.BACK)

//     let vertexShader = gl.createShader(gl.VERTEX_SHADER)
//     let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

//     gl.shaderSource(vertexShader, vertexShaderText)
//     gl.shaderSource(fragmentShader, fragmentShaderText)

//     gl.compileShader(vertexShader)
//     if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
// 		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
// 		return
//     }

//     gl.compileShader(fragmentShader)
//     if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
// 		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader))
// 		return
// 	}

//     program = gl.createProgram()
//     gl.attachShader(program, vertexShader)
//     gl.attachShader(program, fragmentShader)
//     gl.linkProgram(program)
//     if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
// 		console.error('ERROR linking program!', gl.getProgramInfoLog(program))
// 		return
// 	}
//     gl.validateProgram(program)
//     if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
// 		console.error('ERROR validating program!', gl.getProgramInfoLog(program))
// 		return
// 	}
    
//     let model = structure.toWebGL()
//     console.log(model)

//     radius = model.radius + 10
    
//     let modelVertexBufferObject = gl.createBuffer()
//     let modelIndexBufferObject = gl.createBuffer()
//     let modelNormalBufferObject = gl.createBuffer()
//     let modelTexCoordBufferObject = gl.createBuffer()

//     gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBufferObject)
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW)

//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBufferObject)
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW)

//     gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalBufferObject)
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW)
    
//     gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBufferObject)
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texCoords), gl.STATIC_DRAW)

//     let positionAttribLoc = gl.getAttribLocation(program, 'vertPosition')
//     let texCoordAttribLoc = gl.getAttribLocation(program, 'vertTexCoord')
//     let normalAttribLoc = gl.getAttribLocation(program, 'vertNormal')
    
//     gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBufferObject)
//     gl.vertexAttribPointer(
//             positionAttribLoc,
//             3,
//             gl.FLOAT,
//             gl.FALSE,
//             3 * Float32Array.BYTES_PER_ELEMENT,
//             0)
//     gl.enableVertexAttribArray(positionAttribLoc)
        
//     gl.bindBuffer(gl.ARRAY_BUFFER, modelTexCoordBufferObject)
//     gl.vertexAttribPointer(
//             texCoordAttribLoc,
//             2,
//             gl.FLOAT,
//             gl.FALSE,
//             2 * Float32Array.BYTES_PER_ELEMENT,
//             0)
//     gl.enableVertexAttribArray(texCoordAttribLoc)

//     gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalBufferObject)
//     gl.vertexAttribPointer(
//             normalAttribLoc,
//             3,
//             gl.FLOAT,
//             gl.TRUE,
//             3 * Float32Array.BYTES_PER_ELEMENT,
//             0)
//     gl.enableVertexAttribArray(normalAttribLoc)

//     let texture = gl.createTexture()
//     gl.bindTexture(gl.TEXTURE_2D, texture)
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
//     // gl.bindTexture(gl.TEXTURE_2D, null)

//     gl.useProgram(program)

//     let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
//     let matViewUniformLocation = gl.getUniformLocation(program, 'mView')
//     let matProjUniformLocation = gl.getUniformLocation(program, 'mProj')
//     let vertOffsetUniformLocation = gl.getUniformLocation(program, 'vertOffset')

//     let worldMatrix = new Float32Array(16)
//     let viewMatrix = new Float32Array(16)
//     let projMatrix = new Float32Array(16)
//     glMatrix.mat4.identity(worldMatrix)

//     // let translateMatrix = new Float32Array(16)
//     // glMatrix.mat4.identity(translateMatrix)
//     // glMatrix.mat4.translate(translateMatrix, translateMatrix, [20, 1, 2])
//     // glMatrix.mat4.mul(worldMatrix, translateMatrix, worldMatrix)
//     // radius = 20
//     // glMatrix.mat4.lookAt(viewMatrix, [-10, 5, -20], [0, 0, 0], [0, 1, 0])
//     glMatrix.mat4.perspective(projMatrix, Math.PI/4, elPreview.width / elPreview.height, 0.1, 1e3)

//     let offsetVector = new Float32Array(glMatrix.vec3.negate([], model.centerOffset))

//     gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix)
//     gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix)
//     gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix)
//     gl.uniform3fv(vertOffsetUniformLocation, offsetVector)

// 	let ambientUniformLocation = gl.getUniformLocation(program, 'ambientLightIntensity');
// 	let sunlightDirUniformLocation = gl.getUniformLocation(program, 'sun.direction');
// 	let sunlightIntUniformLocation = gl.getUniformLocation(program, 'sun.color');

//     gl.uniform3f(ambientUniformLocation, 0.8, 0.8, 0.8);
// 	gl.uniform3f(sunlightDirUniformLocation, 3.0, 4.0, -2.0);
// 	gl.uniform3f(sunlightIntUniformLocation, 0.9, 0.9, 0.9);

//     // let xRotationMatrix = new Float32Array(16)
//     // let yRotationMatrix = new Float32Array(16)

//     let identityMatrix = new Float32Array(16)
//     glMatrix.mat4.identity(identityMatrix)
//     let angle = 0
//     function loop() {
//         angle = performance.now() / 1000 / 6 * Math.PI
//         // glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0])
//         // glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0])
//         // glMatrix.mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix)
//         // glMatrix.mat4.rotate(worldMatrix, identityMatrix, angle, [0, 1, 0])
//         // gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix)
//         let eyes = [Math.cos(angle) * radius, 5, Math.sin(angle) * radius]
//         glMatrix.mat4.lookAt(viewMatrix, eyes, [0, 0, 0], [0, 1, 0])

//         gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix)

//         gl.clearColor(0, 0, 0, 0)
//         gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

// 		gl.bindTexture(gl.TEXTURE_2D, texture)
// 		gl.activeTexture(gl.TEXTURE0)

//         gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0)
        
//         if (running) {
//             requestAnimationFrame(loop)
//         } else {
//             draw()
//         }
//     }
//     requestAnimationFrame(loop)
// }