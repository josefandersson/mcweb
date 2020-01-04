const elPreview = document.getElementById('preview')
const elPreviewHud = document.getElementById('preview_hud')

const TEXTURES_PATH = 'assets_default/minecraft/textures'

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

const coloredVertexShaderText =
`precision mediump float;

attribute vec3 vertPosition2;
attribute vec4 vertColor2;

varying vec4 fragColor2;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main()
{
    fragColor2 = vertColor2;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition2, 1.0);
}
`

const coloredFragmentShaderText =
`precision mediump float;

varying vec4 fragColor2;

void main()
{
    gl_FragColor = fragColor2;
}`

class Display {
    constructor(webgl, context2d) {
        this.gl = webgl
        this.ctx = context2d // for hud

        this.shaderPrograms = {} // name:{ program:gl.Program, vertexShader:gl.Shader, fragmentShader:gl.Shader, buffers:{ name:gl.Buffer } }
        this.textures = {} // src:gl.Texture

        this.worldMatrix = new Float32Array(16)
        this.viewMatrix = new Float32Array(16)
        this.projMatrix = new Float32Array(16)

        glMatrix.mat4.identity(this.worldMatrix)
        glMatrix.mat4.lookAt(this.viewMatrix, [0, 1, 10], [0, 0, 0], [0, 1, 0])
        glMatrix.mat4.perspective(this.projMatrix, Math.PI/4, this.gl.canvas.width / this.gl.canvas.height, 0.1, 1e3)
        
        this.running = false
        this.spinning = true
        this.radius = 15
        this.angleOffsetX = Math.PI/2
        this.angleOffsetY = Math.PI/6
        this.lastFrameTime = 0
        this.currentFrameTime = 0
        this.frameLength = 0

        this.resetWebGLSettings()
    }

    start() {
        if (this.running !== true) {
            this.running = true
            loop()
        }
    }

    stop() {
        this.running = false
    }

    resetWebGLSettings() {
        this.ctx.font = '10px Roboto'
        this.ctx.fillStyle = 'red'
        this.gl.clearColor(0, 0, 0, 0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
        this.gl.frontFace(this.gl.CCW)
        this.gl.cullFace(this.gl.BACK)
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    }

    createShader(srcText, type) {
        let shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, srcText)
        this.gl.compileShader(shader)
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Could not compile shader', this.gl.getShaderInfoLog(shader))
            return null
        }
        return shader
    }

    createShaderProgram(name, vertexShader, fragmentShader) {
        let program = this.gl.createProgram()
        this.gl.attachShader(program, vertexShader)
        this.gl.attachShader(program, fragmentShader)
        this.gl.linkProgram(program)
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Could not link program', this.gl.getProgramInfoLog(program))
            return null
        }
        this.gl.validateProgram(program)
        if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
            console.error('Could not validate program', this.gl.getProgramInfoLog(program))
            return null
        }
        this.shaderPrograms[name] = { program, vertexShader, fragmentShader, buffers:{} }
        return program
    }

    createTexture(src, callback) {
        let image = new Image()
        image.addEventListener('load', ev => {
            let texture = this.gl.createTexture()
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
            this.textures[src] = texture
            callback(null, texture)
        })
        image.src = src
    }

    getTexture(src, callback) {
        if (this.textures[src] == null) {
            this.createTexture(src, (err, texture) => {
                this.textures[src] = texture
                callback(null, texture)
            })
        } else {
            callback(null, this.textures[src])
        }
    }

    applyMatricesToShaderProgram(programName) {
        let program = this.shaderPrograms[programName].program
        this.gl.useProgram(program)

        const matWorldUniformLocation = this.gl.getUniformLocation(program, 'mWorld')
        const matViewUniformLocation = this.gl.getUniformLocation(program, 'mView')
        const matProjUniformLocation = this.gl.getUniformLocation(program, 'mProj')

        this.gl.uniformMatrix4fv(matWorldUniformLocation, this.gl.FALSE, this.worldMatrix)
        this.gl.uniformMatrix4fv(matViewUniformLocation, this.gl.FALSE, this.viewMatrix)
        this.gl.uniformMatrix4fv(matProjUniformLocation, this.gl.FALSE, this.projMatrix)

        this.shaderPrograms[programName].matViewUniformLocation = matViewUniformLocation
    }

    createArrayBuffer(programName, attributeName, size, type, normalized, stride, offset) {
        this.gl.useProgram(this.shaderPrograms[programName].program)
        let buffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
        let location = this.gl.getAttribLocation(this.shaderPrograms[programName].program, attributeName)
        this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset)
        this.gl.enableVertexAttribArray(location)
        this.shaderPrograms[programName].buffers[attributeName] = { location, buffer }
        return buffer
    }

    enableArrayBuffer(programName) {
        // enabledVertexAttribArray(location)
        // applyMatricesToShaderProgram
        // bindBufferData
    }

    createElementArrayBuffer(programName, name) {
        this.gl.useProgram(this.shaderPrograms[programName].program)
        let buffer = this.gl.createBuffer()
        this.shaderPrograms[programName].buffers[name] = { buffer }
        return buffer
    }

    bindBufferData(programName, name, type, srcData, usage=this.gl.STATIC_DRAW) {
        // this.gl.useProgram(this.shaderPrograms[programName].program) TODO: may need this
        this.gl.bindBuffer(type, this.shaderPrograms[programName].buffers[name].buffer)
        this.gl.bufferData(type, srcData, usage)
    }

    loadModel(model) {
        this.currentModel = model
        this.radius = model.radius

        this.bindBufferData('block', 'vertPosition', this.gl.ARRAY_BUFFER, new Float32Array(model.vertices))
        this.bindBufferData('block', 'vertTexCoord', this.gl.ARRAY_BUFFER, new Float32Array(model.texCoords))
        this.bindBufferData('block', 'indices', this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices))

        model.textureIndices.forEach(obj => {
            this.getTexture(`${TEXTURES_PATH}/${obj.textureName}.png`, () => {})
        })

        this.gl.activeTexture(this.gl.TEXTURE0)
    }

    draw() {        
        // HUD
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.fillText(`${Math.round(1000 / this.frameLength)} FPS`, 20, 30)

        // Webthis.gl
        this.gl.clearColor(0, 0, 0, 0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        
        let angleX = this.angleOffsetX
        let angleY = this.angleOffsetY
        if (this.spinning === true) angleX += this.currentFrameTime / 1000 / 6 * Math.PI

        let offset = this.currentModel.centerOffset
        let eyes = [Math.cos(angleX) * Math.cos(angleY) * this.radius + offset[0], Math.sin(angleY) * this.radius + offset[1], Math.sin(angleX) * Math.cos(angleY) * this.radius + offset[2]]
        glMatrix.mat4.lookAt(this.viewMatrix, eyes, offset, [0, 1, 0])

        for (const programName in this.shaderPrograms) {
            let programData = this.shaderPrograms[programName]
            this.gl.useProgram(programData.program)
            this.gl.uniformMatrix4fv(programData.matViewUniformLocation, this.gl.FALSE, this.viewMatrix)

            if (programName === 'block') {
                for (const key in this.currentModel.textureIndices) {
                    let obj = this.currentModel.textureIndices[key]
                    this.getTexture(`${TEXTURES_PATH}/${obj.textureName}.png`, (err, texture) => {
                        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
                        this.gl.drawElements(this.gl.TRIANGLES, obj.length, this.gl.UNSIGNED_SHORT, obj.start)
                    })
                }
            }
        }

        this.lastFrameTime = this.currentFrameTime
    }

    update() {
        this.currentFrameTime = performance.now()
        this.frameLength = this.currentFrameTime - this.lastFrameTime

        let fraction = this.frameLength / 50
        if (keys.q.down) this.radius += fraction
        if (keys.e.down) this.radius -= fraction
        if (keys.a.down) this.angleOffsetX += fraction / 6
        if (keys.d.down) this.angleOffsetX -= fraction / 6
        if (keys.w.down) this.angleOffsetY += fraction / 6
        if (keys.s.down) this.angleOffsetY -= fraction / 6
        this.angleOffsetY = Math.max(Math.min(Math.PI / 2 - .1, this.angleOffsetY), -Math.PI / 2 + .1)
        this.radius = Math.max(1.8, this.radius)
    }
}

const display = new Display(elPreview.getContext('webgl2'), elPreviewHud.getContext('2d'))
display.createShaderProgram('block',
    display.createShader(vertexShaderText, display.gl.VERTEX_SHADER),
    display.createShader(fragmentShaderText, display.gl.FRAGMENT_SHADER))
display.applyMatricesToShaderProgram('block')
display.createArrayBuffer('block', 'vertPosition', 3, display.gl.FLOAT, display.gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0)
display.createArrayBuffer('block', 'vertTexCoord', 2, display.gl.FLOAT, display.gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0)
display.createElementArrayBuffer('block', 'indices')

// display.createShaderProgram('color',
//     display.createShader(coloredVertexShaderText, display.gl.VERTEX_SHADER),
//     display.createShader(coloredFragmentShaderText, display.gl.FRAGMENT_SHADER))
// display.applyMatricesToShaderProgram('color')
// display.createArrayBuffer('color', 'vertPosition2', 3, display.gl.FLOAT, display.gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0)
// display.createArrayBuffer('color', 'vertColor2', 4, display.gl.FLOAT, display.gl.FALSE, 4 * Float32Array.BYTES_PER_ELEMENT, 0)

// display.bindBufferData('color', 'vertPosition2', display.gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 10, 0, 0]))
// display.bindBufferData('color', 'vertColor2', display.gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 1, 1, 0, 0, 1]))

function loop() {
    if (display.running === true) {
        display.update()
        display.draw()

        requestAnimationFrame(loop)
    }
}