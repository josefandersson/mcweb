const elPreview = document.getElementById('preview')
const gl = elPreview.getContext('webgl2')

const vertexShaderText =
`precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;

varying vec2 fragTexCoord;
varying vec3 fragNormal;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform vec3 vertOffset;

void main()
{
    fragTexCoord = vertTexCoord;
    fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;

    gl_Position = mProj * mView * mWorld * vec4(vertPosition + vertOffset, 1.0);
}`

const fragmentShaderText =
`precision mediump float;

varying vec2 fragTexCoord;
varying vec3 fragNormal;

uniform sampler2D sampler;

void main()
{
    gl_FragColor = texture2D(sampler, fragTexCoord);
}`

gl.clearColor(0, 0, 0, 0)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
gl.enable(gl.DEPTH_TEST)
gl.enable(gl.CULL_FACE)
gl.enable(gl.BLEND)
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
gl.frontFace(gl.CCW)
gl.cullFace(gl.BACK)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

const vertexShader = gl.createShader(gl.VERTEX_SHADER)
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

gl.shaderSource(vertexShader, vertexShaderText)
gl.shaderSource(fragmentShader, fragmentShaderText)

gl.compileShader(vertexShader)
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
}

gl.compileShader(fragmentShader)
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader))
}

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ERROR linking program!', gl.getProgramInfoLog(program))
}
gl.validateProgram(program)
if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('ERROR validating program!', gl.getProgramInfoLog(program))
}

function createBufferObject(target, srcData, usage) {
    let bufferObject = gl.createBuffer()
    return bindBufferData(bufferObject, target, srcData, usage)
}

function bindBufferData(bufferObject, target, srcData, usage) {
    gl.bindBuffer(target, bufferObject)
    gl.bufferData(target, srcData, usage)
    return bufferObject
}

function bindVertexAttrib(bufferObject, attribName, size, type, normalized, stride, offset) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject)

    let loc = gl.getAttribLocation(program, attribName)
    gl.vertexAttribPointer(loc, size, type, normalized, stride, offset)
    gl.enableVertexAttribArray(loc)
}

let modelVertexBufferObject = gl.createBuffer() // createBufferObject(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW)
let modelIndexBufferObject = gl.createBuffer() // createBufferObject(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW)
let modelNormalBufferObject = gl.createBuffer() // createBufferObject(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW)
let modelTexCoordBufferObject = gl.createBuffer() // createBufferObject(gl.ARRAY_BUFFER, new Float32Array(model.texCoords), gl.STATIC_DRAW)

bindVertexAttrib(modelVertexBufferObject, 'vertPosition', 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0)
bindVertexAttrib(modelNormalBufferObject, 'vertNormal', 3, gl.FLOAT, gl.TRUE, 3 * Float32Array.BYTES_PER_ELEMENT, 0)
bindVertexAttrib(modelTexCoordBufferObject, 'vertTexCoord', 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0)

gl.useProgram(program)

const textures = {} // src:texture

function createTexture(textureName, callback) {
    let image = new Image()
    image.addEventListener('load', ev => {
        let texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        callback(null, texture)
    })
    image.src = `assets/minecraft/textures/${textureName}.png`
}

function getTexture(textureName, callback) {
    if (textures[textureName] == null) {
        createTexture(textureName, (err, texture) => {
            textures[textureName] = texture
            callback(null, texture)
        })
    } else {
        callback(null, textures[textureName])
    }
}

const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
const matViewUniformLocation = gl.getUniformLocation(program, 'mView')
const matProjUniformLocation = gl.getUniformLocation(program, 'mProj')
const vertOffsetUniformLocation = gl.getUniformLocation(program, 'vertOffset')

let worldMatrix = new Float32Array(16)
let viewMatrix = new Float32Array(16)
let projMatrix = new Float32Array(16)
glMatrix.mat4.identity(worldMatrix)
glMatrix.mat4.lookAt(viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0])
glMatrix.mat4.perspective(projMatrix, Math.PI/4, elPreview.width / elPreview.height, 0.1, 1e3)

gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix)
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix)
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix)

let currentModel

function init(model) {
    currentModel = model

    radius = model.radius

    let offsetVector = new Float32Array(glMatrix.vec3.negate([], model.centerOffset))
    gl.uniform3fv(vertOffsetUniformLocation, offsetVector)
    
    bindBufferData(modelVertexBufferObject, gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW)
    bindBufferData(modelIndexBufferObject, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW)
    bindBufferData(modelNormalBufferObject, gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW)
    bindBufferData(modelTexCoordBufferObject, gl.ARRAY_BUFFER, new Float32Array(model.texCoords), gl.STATIC_DRAW)

    model.textureIndices.forEach(obj => {
        getTexture(obj.textureName, () => {}) // create gl texture for texture name if not exists
    })

    gl.activeTexture(gl.TEXTURE0)
}

let identityMatrix = new Float32Array(16)
glMatrix.mat4.identity(identityMatrix)
let angle = 0
let radius = 15
let eyesY = 1
function draw() {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    if (angle >= 0)
        angle = performance.now() / 1000 / 6 * Math.PI
    let eyes = [Math.cos(angle) * radius, eyesY, Math.sin(angle) * radius]
    glMatrix.mat4.lookAt(viewMatrix, eyes, [0, 0, 0], [0, 1, 0])
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix)

    currentModel.textureIndices.forEach(obj => {
        getTexture(obj.textureName, (err, texture) => {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.drawElements(gl.TRIANGLES, obj.length, gl.UNSIGNED_SHORT, obj.start)
        })
    })
}

let running = true
function loop() {
    if (!running) return

    draw()

    requestAnimationFrame(loop)
}