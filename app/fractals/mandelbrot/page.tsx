'use client'

import { useRef, useEffect, useState } from 'react'
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

export default function MandelbrotPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<MandelbrotGL | null>(null)
    const [params, setParams] = useState<MandelbrotParams>(defaultParams)
    const [size, setSize] = useState({ width: 0, height: 0 })

    // Initialize renderer
    useEffect(() => {
        if (!canvasRef.current) return

        const renderer = new MandelbrotGL(canvasRef.current)
        rendererRef.current = renderer

        const updateSize = () => {
            const container = canvasRef.current?.parentElement
            if (!container) return

            const { width, height } = container.getBoundingClientRect()
            setSize({ width, height })
            renderer.setSize(width, height)
            renderer.render(params)
        }

        updateSize()
        window.addEventListener('resize', updateSize)

        return () => {
            window.removeEventListener('resize', updateSize)
            renderer.dispose()
        }
    }, [])

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