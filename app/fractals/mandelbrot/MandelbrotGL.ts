export interface MandelbrotParams {
    center: [number, number]
    scale: number
    maxIterations: number
    escapeRadius: number
    baseColor: [number, number, number]  // HSV color
    colorCycles: number
    colorOffset: number
    brightness: number
    contrast: number
}

// Import shaders as raw text
import vertexShaderSource from './shaders/mandelbrot.vert'
import fragmentShaderSource from './shaders/mandelbrot.frag'

export class MandelbrotGL {
    private gl: WebGL2RenderingContext
    private program: WebGLProgram
    private vertexBuffer: WebGLBuffer
    private uniforms: {
        center: WebGLUniformLocation
        scale: WebGLUniformLocation
        maxIterations: WebGLUniformLocation
        escapeRadius: WebGLUniformLocation
        resolution: WebGLUniformLocation
        baseColor: WebGLUniformLocation
        colorCycles: WebGLUniformLocation
        colorOffset: WebGLUniformLocation
        brightness: WebGLUniformLocation
        contrast: WebGLUniformLocation
    }

    constructor(canvas: HTMLCanvasElement) {
        // Request WebGL 2.0 context specifically
        const gl = canvas.getContext('webgl2')
        if (!gl) {
            throw new Error('WebGL 2 not supported')
        }
        this.gl = gl

        // Create shader program
        this.program = this.createProgram()
        gl.useProgram(this.program)

        // Create vertex buffer (full-screen quad)
        this.vertexBuffer = this.createVertexBuffer()

        // Get uniform locations
        this.uniforms = {
            center: gl.getUniformLocation(this.program, 'center')!,
            scale: gl.getUniformLocation(this.program, 'scale')!,
            maxIterations: gl.getUniformLocation(this.program, 'maxIterations')!,
            escapeRadius: gl.getUniformLocation(this.program, 'escapeRadius')!,
            resolution: gl.getUniformLocation(this.program, 'resolution')!,
            baseColor: gl.getUniformLocation(this.program, 'baseColor')!,
            colorCycles: gl.getUniformLocation(this.program, 'colorCycles')!,
            colorOffset: gl.getUniformLocation(this.program, 'colorOffset')!,
            brightness: gl.getUniformLocation(this.program, 'brightness')!,
            contrast: gl.getUniformLocation(this.program, 'contrast')!
        }

        // Set up vertex attributes
        const positionLocation = gl.getAttribLocation(this.program, 'position')
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)
        if (!shader) throw new Error('Failed to create shader')

        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader)
            this.gl.deleteShader(shader)
            throw new Error('Shader compilation error: ' + info)
        }

        return shader
    }

    private createProgram(): WebGLProgram {
        const vertexShader = this.createShader(
            this.gl.VERTEX_SHADER,
            vertexShaderSource
        )
        const fragmentShader = this.createShader(
            this.gl.FRAGMENT_SHADER,
            fragmentShaderSource
        )

        const program = this.gl.createProgram()
        if (!program) throw new Error('Failed to create program')

        this.gl.attachShader(program, vertexShader)
        this.gl.attachShader(program, fragmentShader)
        this.gl.linkProgram(program)

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program)
            this.gl.deleteProgram(program)
            throw new Error('Program linking error: ' + info)
        }

        return program
    }

    private createVertexBuffer(): WebGLBuffer {
        // Create a buffer for a full-screen quad
        const buffer = this.gl.createBuffer()
        if (!buffer) throw new Error('Failed to create buffer')

        const vertices = new Float32Array([
            -1, -1,  // Bottom left
            1, -1,   // Bottom right
            -1, 1,   // Top left
            1, 1,    // Top right
        ])

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)

        return buffer
    }

    public setSize(width: number, height: number) {
        const gl = this.gl
        const canvas = gl.canvas as HTMLCanvasElement
        
        // Set display size
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'

        // Set actual size in pixels (accounting for device pixel ratio)
        const pixelWidth = width * window.devicePixelRatio
        const pixelHeight = height * window.devicePixelRatio
        
        // Only update if the size has actually changed
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth
            canvas.height = pixelHeight
            gl.viewport(0, 0, pixelWidth, pixelHeight)
        }
    }

    public render(params: MandelbrotParams) {
        const gl = this.gl
        const canvas = gl.canvas as HTMLCanvasElement

        // Clear the canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Set uniforms
        gl.uniform2f(this.uniforms.center, params.center[0], params.center[1])
        gl.uniform1f(this.uniforms.scale, params.scale)
        gl.uniform1i(this.uniforms.maxIterations, params.maxIterations)
        gl.uniform1f(this.uniforms.escapeRadius, params.escapeRadius)
        gl.uniform2f(
            this.uniforms.resolution,
            canvas.width,
            canvas.height
        )
        gl.uniform3f(this.uniforms.baseColor, ...params.baseColor)
        gl.uniform1f(this.uniforms.colorCycles, params.colorCycles)
        gl.uniform1f(this.uniforms.colorOffset, params.colorOffset)
        gl.uniform1f(this.uniforms.brightness, params.brightness)
        gl.uniform1f(this.uniforms.contrast, params.contrast)

        // Draw the full-screen quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    public dispose() {
        const gl = this.gl
        gl.deleteProgram(this.program)
        gl.deleteBuffer(this.vertexBuffer)
    }
} 