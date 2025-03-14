'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { MandelbrotGL, MandelbrotParams } from './MandelbrotGL'

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    background: #121212;
    position: relative;
    overflow: hidden;
    display: flex;
`

const Canvas = styled.canvas`
    width: 100%;
    height: 100%;
`

const ControlPanel = styled.div`
    position: absolute;
    top: clamp(60px, 10vh, 105px);
    right: clamp(10px, 3vw, 20px);
    background: rgba(30, 30, 30, 0.9);
    padding: clamp(12px, 3vw, 20px);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: clamp(6px, 2vw, 10px);
    width: clamp(200px, 90vw, 300px);
    backdrop-filter: blur(5px);
    color: white;

    input, select {
        width: 100%;
        padding: 4px 8px;
        font-size: clamp(12px, 2vw, 14px);
        background: rgba(45, 45, 45, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 4px;
    }

    label {
        font-size: clamp(12px, 2vw, 14px);
        color: white;
    }
`

const Button = styled.button`
    padding: clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px);
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: clamp(12px, 2vw, 14px);
    width: 100%;
    
    &:hover {
        background: #357abd;
    }
`

const BackButton = styled(Button)`
    position: absolute;
    top: clamp(10px, 3vh, 20px);
    left: clamp(10px, 3vw, 20px);
    width: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 30, 30, 0.9);
    color: #4a90e2;
    backdrop-filter: blur(5px);
    
    &:hover {
        background: rgba(45, 45, 45, 0.95);
    }
`

const PsychedelicButton = styled(Button)<{ active: boolean }>`
    background: ${props => props.active ? '#e42d9f' : '#4a90e2'};
    
    &:hover {
        background: ${props => props.active ? '#c41d8a' : '#357abd'};
    }
`

const defaultParams: MandelbrotParams = {
    center: [-0.5, 0],
    scale: 1.5,
    maxIterations: 100,
    escapeRadius: 2,
    baseColor: [0.5, 0.8, 1.0],  // Initial HSV color
    colorCycles: 3.0,            // Number of color cycles
    colorOffset: 0.0,            // Color phase offset
    brightness: 1.0,             // Overall brightness
    contrast: 1.0                // Color contrast
}

// Calculate required iterations based on zoom level
function calculateRequiredIterations(scale: number): number {
    // As we zoom in (scale gets smaller), we need more iterations
    // This is a rough approximation - you might want to tune these values
    const baseIterations = 100
    const zoomFactor = Math.max(1, 1 / scale)
    return Math.min(1000, Math.floor(baseIterations * Math.log2(1 + zoomFactor)))
}

// Add these helper functions at the top of the file
function hsvToHex([h, s, v]: [number, number, number]): string {
    // Convert HSV to RGB
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    let r, g, b
    switch (i % 6) {
        case 0: [r, g, b] = [v, t, p]; break
        case 1: [r, g, b] = [q, v, p]; break
        case 2: [r, g, b] = [p, v, t]; break
        case 3: [r, g, b] = [p, q, v]; break
        case 4: [r, g, b] = [t, p, v]; break
        case 5: [r, g, b] = [v, p, q]; break
        default: [r, g, b] = [0, 0, 0]
    }

    // Convert to hex
    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsv(hex: string): [number, number, number] {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    const s = max === 0 ? 0 : d / max
    const v = max

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h /= 6
    }

    return [h, s, v]
}

export default function MandelbrotPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<MandelbrotGL | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [params, setParams] = useState<MandelbrotParams>(defaultParams)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null)
    const [isPsychedelic, setIsPsychedelic] = useState(false)
    const animationFrameRef = useRef<number>()

    // Initialize audio with FLAC/MP3 fallback
    useEffect(() => {
        const initAudio = async () => {
            // Try FLAC first
            const flacAudio = new Audio('/sounds/hypnotoad.flac')
            try {
                // Check if browser can play FLAC
                const canPlayFlac = flacAudio.canPlayType('audio/flac') !== ''
                
                if (canPlayFlac) {
                    audioRef.current = flacAudio
                } else {
                    // Fallback to MP3
                    audioRef.current = new Audio('/sounds/hypnotoad.mp3')
                }
                
                audioRef.current.loop = true
            } catch (error) {
                console.log("Audio initialization failed:", error)
            }
        }

        initAudio()
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Handle audio playback with psychedelic mode
    useEffect(() => {
        if (isPsychedelic && audioRef.current) {
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio playback failed:", error)
                })
            }
        } else if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }, [isPsychedelic])

    // Add color animation effect
    useEffect(() => {
        if (isPsychedelic) {
            const animate = () => {
                setParams(prev => ({
                    ...prev,
                    colorOffset: (prev.colorOffset + 0.01) % 1
                }))
                animationFrameRef.current = requestAnimationFrame(animate)
            }
            animationFrameRef.current = requestAnimationFrame(animate)
        } else if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isPsychedelic])

    // Convert screen coordinates to complex coordinates
    const screenToComplex = useCallback((x: number, y: number): [number, number] => {
        if (!canvasRef.current) return [0, 0]
        
        const rect = canvasRef.current.getBoundingClientRect()
        const aspectRatio = rect.width / rect.height
        
        // Convert to [-1, 1] range
        const normalizedX = ((x - rect.left) / rect.width - 0.5) * 2
        const normalizedY = ((y - rect.top) / rect.height - 0.5) * -2
        
        // Apply aspect ratio correction and current scale/center
        const complexX = params.center[0] + normalizedX * params.scale * (aspectRatio > 1 ? aspectRatio : 1)
        const complexY = params.center[1] + normalizedY * params.scale * (aspectRatio < 1 ? 1/aspectRatio : 1)
        
        return [complexX, complexY]
    }, [params.center, params.scale])

    // Handle mouse wheel for zooming
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault()
        
        const zoomFactor = 1.2
        const delta = e.deltaY > 0 ? zoomFactor : 1 / zoomFactor
        
        // Get complex coordinates of mouse position
        const [mouseX, mouseY] = screenToComplex(e.clientX, e.clientY)
        
        setParams(prev => {
            const newScale = prev.scale * delta
            
            // Calculate new center to zoom towards mouse position
            const newCenter: [number, number] = [
                mouseX - (mouseX - prev.center[0]) / delta,
                mouseY - (mouseY - prev.center[1]) / delta
            ]
            
            return {
                ...prev,
                scale: newScale,
                center: newCenter,
                maxIterations: calculateRequiredIterations(newScale)
            }
        })
    }, [screenToComplex])

    // Handle mouse drag for panning
    const handleMouseDown = useCallback((e: MouseEvent) => {
        setIsDragging(true)
        setLastMousePos({ x: e.clientX, y: e.clientY })
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !lastMousePos || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const aspectRatio = rect.width / rect.height
        
        // Calculate delta in complex plane coordinates
        const dx = (e.clientX - lastMousePos.x) / rect.width * params.scale * 2 * (aspectRatio > 1 ? aspectRatio : 1)
        const dy = (e.clientY - lastMousePos.y) / rect.height * params.scale * -2 * (aspectRatio < 1 ? 1/aspectRatio : 1)
        
        setParams(prev => ({
            ...prev,
            center: [prev.center[0] - dx, prev.center[1] - dy]
        }))
        
        setLastMousePos({ x: e.clientX, y: e.clientY })
    }, [isDragging, lastMousePos, params.scale])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        setLastMousePos(null)
    }, [])

    // Initialize renderer and event listeners
    useEffect(() => {
        if (!canvasRef.current) return

        const renderer = new MandelbrotGL(canvasRef.current)
        rendererRef.current = renderer

        const canvas = canvasRef.current
        const updateSize = () => {
            const container = canvas.parentElement
            if (!container) return

            const { width, height } = container.getBoundingClientRect()
            setSize({ width, height })
            renderer.setSize(width, height)
            renderer.render(params)
        }

        // Add event listeners
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('resize', updateSize)

        updateSize()

        return () => {
            canvas.removeEventListener('wheel', handleWheel)
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('resize', updateSize)
            renderer.dispose()
        }
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

    // Re-render when params change
    useEffect(() => {
        if (!rendererRef.current) return
        rendererRef.current.render(params)
    }, [params])

    const handleParamChange = (key: keyof MandelbrotParams, value: any) => {
        setParams(prev => {
            const newParams = { ...prev }
            if (key === 'center') {
                newParams.center = value
            } else {
                newParams[key] = value
            }
            return newParams
        })
    }

    const handleReset = () => {
        setParams(defaultParams)
    }

    const togglePsychedelic = () => {
        setIsPsychedelic(prev => !prev)
    }

    return (
        <Container>
            <Canvas ref={canvasRef} />
            
            <BackButton onClick={() => window.location.href = '/'}>
                ← Back
            </BackButton>

            <ControlPanel>
                <Button onClick={handleReset}>
                    Reset to Default
                </Button>

                <PsychedelicButton 
                    active={isPsychedelic} 
                    onClick={togglePsychedelic}
                >
                    {isPsychedelic ? 'Disable' : 'Enable'} Party Mode
                </PsychedelicButton>

                <label>
                    Max Iterations:
                    <input
                        type="number"
                        step="10"
                        min="10"
                        max="1000"
                        value={params.maxIterations}
                        onChange={e => handleParamChange('maxIterations', parseInt(e.target.value))}
                    />
                </label>

                <label>
                    Color Cycles:
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={params.colorCycles}
                        onChange={e => handleParamChange('colorCycles', parseFloat(e.target.value))}
                    />
                </label>

                <label>
                    Color Offset:
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={params.colorOffset}
                        onChange={e => handleParamChange('colorOffset', parseFloat(e.target.value))}
                        disabled={isPsychedelic}
                    />
                </label>

                <label>
                    Brightness:
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={params.brightness}
                        onChange={e => handleParamChange('brightness', parseFloat(e.target.value))}
                    />
                </label>

                <label>
                    Contrast:
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={params.contrast}
                        onChange={e => handleParamChange('contrast', parseFloat(e.target.value))}
                    />
                </label>

                <label>
                    Base Color:
                    <input
                        type="color"
                        value={hsvToHex(params.baseColor)}
                        onChange={e => handleParamChange('baseColor', hexToHsv(e.target.value))}
                    />
                </label>
            </ControlPanel>
        </Container>
    )
} 