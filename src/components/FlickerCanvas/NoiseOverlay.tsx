import { useRef, useEffect } from 'react'

interface NoiseOverlayProps {
  opacity: number
}

// Simple pass-through vertex shader
const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Noise fragment shader
// Uses a pseudo-random generator based on UV coordinates and time
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;

  // Gold Noise function - static-like high frequency noise
  // Optimized for GPU floating point precision
  float random(vec2 uv) {
    float phi = 1.61803398874989484820459;  // Golden Ratio
    float noise = fract(tan(distance(uv * phi, uv) * u_time) * uv.x);
    return noise;
  }
  
  // Alternative Hash based noise for better temporal stability if needed
  float hash(vec2 pixel, float time) {
    vec3 p3  = fract(vec3(pixel.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z + time);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Choose hash for reliable granular static
    float grain = hash(gl_FragCoord.xy, u_time);
    
    // Output grayscale noise
    gl_FragColor = vec4(vec3(grain), 1.0);
  }
`

export function NoiseOverlay({ opacity }: NoiseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Try WebGL first
    let gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) {
      console.warn('WebGL not supported, falling back to 2D noise (static)')
      // Fallback implementation could go here or just leave blank for now since WebGL is widely supported
      return
    }

    // Resize handling (defined AFTER gl initialization to avoid TDZ)
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }
    window.addEventListener('resize', resize)
    resize()

    // Compile shaders
    const createShader = (type: number, source: string) => {
      const shader = gl!.createShader(type)!
      gl!.shaderSource(shader, source)
      gl!.compileShader(shader)
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader))
        gl!.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
    
    if (!vertexShader || !fragmentShader) return

    // Link program
    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Set up full screen quad
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    // Triangle strip covering the screen: (-1,-1), (1,-1), (-1,1), (1,1)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionAttribute = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionAttribute)
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0)

    // Uniforms
    const timeUniform = gl.getUniformLocation(program, 'u_time')
    const resolutionUniform = gl.getUniformLocation(program, 'u_resolution')

    // Initial resolution set
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)

    // Animation Loop
    let isActive = true
    const render = (time: number) => {
      if (!gl || !isActive) return

      // Update resolution if needed (usually handled by resize)
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      
      // Update time (slowed down slightly if needed, or raw ms)
      // Using raw ms / 1000.0 gives seconds. 
      // Adding a large offset ensures high variability.
      gl.uniform1f(timeUniform, (time / 1000.0) + 100.0)
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      
      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      isActive = false
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resize)
      
      // Small delay to ensure render loop has stopped before deleting resources
      // or just handle the error gracefully. For now, we rely on isActive flag.
      if (gl) {
        gl.deleteProgram(program)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        gl.deleteBuffer(positionBuffer)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="visual-noise-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 'var(--z-noise)', // Use the new variable
        mixBlendMode: 'overlay',
        opacity: opacity
      }}
    />
  )
}
