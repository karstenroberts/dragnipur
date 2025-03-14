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

const defaultParams: MandelbrotParams = {
    center: [-0.5, 0],  // Center of the main cardioid
    scale: 1.5,         // Adjusted scale to show more of the set
    maxIterations: 100,
    escapeRadius: 2
}

// Calculate required iterations based on zoom level
function calculateRequiredIterations(scale: number): number {
    // As we zoom in (scale gets smaller), we need more iterations
    // This is a rough approximation - you might want to tune these values
    const baseIterations = 100
    const zoomFactor = Math.max(1, 1 / scale)
    return Math.min(1000, Math.floor(baseIterations * Math.log2(1 + zoomFactor)))
}

export default function MandelbrotPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<MandelbrotGL | null>(null)
    const [params, setParams] = useState<MandelbrotParams>(defaultParams)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null)

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

                <label>
                    Center X:
                    <input
                        type="number"
                        step="0.1"
                        value={params.center[0]}
                        onChange={e => handleParamChange('center', [parseFloat(e.target.value), params.center[1]])}
                    />
                </label>

                <label>
                    Center Y:
                    <input
                        type="number"
                        step="0.1"
                        value={params.center[1]}
                        onChange={e => handleParamChange('center', [params.center[0], parseFloat(e.target.value)])}
                    />
                </label>

                <label>
                    Scale:
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={params.scale}
                        onChange={e => handleParamChange('scale', parseFloat(e.target.value))}
                    />
                </label>

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
                    Escape Radius:
                    <input
                        type="number"
                        step="0.1"
                        min="2"
                        max="10"
                        value={params.escapeRadius}
                        onChange={e => handleParamChange('escapeRadius', parseFloat(e.target.value))}
                    />
                </label>
            </ControlPanel>
        </Container>
    )
} 