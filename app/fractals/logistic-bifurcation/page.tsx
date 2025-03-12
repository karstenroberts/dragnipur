'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import * as THREE from 'three'
import styled from 'styled-components'

const CanvasContainer = styled.div`
    height: 100vh;
    width: 100vw;
    background: white;
    position: relative;
`

const ControlPanel = styled.div`
    position: absolute;
    top: 105px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 300px;
`

const TooltipContainer = styled.div`
    position: relative;
    display: inline-block;
    width: 100%;

    &:hover .tooltip {
        visibility: visible;
        opacity: 1;
    }
`

const Tooltip = styled.div`
    visibility: hidden;
    position: absolute;
    z-index: 1;
    top: 50%;
    right: calc(100% + 10px);
    transform: translateY(-50%);
    padding: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    width: 200px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
    text-align: left;

    &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 100%;
        transform: translateY(-50%);
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
    }
`

const LoadingOverlay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    font-size: 18px;
`

const Crosshair = styled.div<{ x: number; y: number }>`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    pointer-events: none;
    z-index: 10;

    &::before, &::after {
        content: '';
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
    }

    &::before {
        left: -10px;
        right: -10px;
        height: 1px;
        top: 0;
    }

    &::after {
        top: -10px;
        bottom: -10px;
        width: 1px;
        left: 0;
    }
`

const CoordinateTooltip = styled.div<{ x: number; y: number }>`
    position: absolute;
    left: ${props => props.x + 15}px;
    top: ${props => props.y + 15}px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10;
    white-space: nowrap;
`

const Button = styled.button`
    padding: 8px 16px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
        background: #357abd;
    }
`

const LegendContainer = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 15px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    margin-bottom: 10px;
`

const LegendGradient = styled.div`
    width: 200px;
    height: 20px;
    border-radius: 4px;
    position: relative;
`

const LegendLabels = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
`

interface Point {
    x: number
    y: number
    iterations: number
}

interface FractalParams {
    startR: number
    endR: number
    resolution: 'low' | 'medium' | 'high'
    accuracyValue: number
    maxIterations: number
    warmupIterations: number
}

const defaultParams: FractalParams = {
    startR: 1.1,
    endR: 4.0,
    resolution: 'low',
    accuracyValue: 0.001,
    maxIterations: 100,
    warmupIterations: 250
}

function PointCloud({ points }: { points: Point[] }) {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
    const tempObject = useRef(new THREE.Object3D())
    const tempColor = useRef(new THREE.Color())

    useEffect(() => {
        if (!instancedMeshRef.current || !points.length) return

        // Find max iterations for color normalization using reduce
        const maxIterations = points.reduce((max, point) => 
            point.iterations > max ? point.iterations : max, 0)
        const minIterations = points.reduce((min, point) => 
            point.iterations < min ? point.iterations : min, maxIterations)

        // Calculate logarithmic scale parameters
        const logMin = Math.log(minIterations || 1)
        const logMax = Math.log(maxIterations)
        const logRange = logMax - logMin

        points.forEach((point, i) => {
            const x = (point.x * 400) - 1000
            const y = (point.y * 400) - 200
            
            tempObject.current.position.set(x, y, 0)
            tempObject.current.scale.set(0.3, 0.3, 1)
            tempObject.current.updateMatrix()
            
            instancedMeshRef.current?.setMatrixAt(i, tempObject.current.matrix)

            // Color based on logarithmic iteration depth
            const logValue = Math.log(point.iterations)
            const normalizedValue = (logValue - logMin) / logRange

            // Enhanced color palette
            // Start at purple (0.75), go through blue, cyan, green, yellow, and end at red (0)
            const hue = 0.75 - (normalizedValue * 0.75)
            // Higher saturation for extreme values, slightly lower for middle range
            const saturation = 0.9 - Math.sin(normalizedValue * Math.PI) * 0.2
            // Brighter for middle values, darker for extremes
            const lightness = 0.5 + Math.sin(normalizedValue * Math.PI) * 0.2

            instancedMeshRef.current?.setColorAt(i, tempColor.current.setHSL(hue, saturation, lightness))
        })

        instancedMeshRef.current.instanceMatrix.needsUpdate = true
        if (instancedMeshRef.current.instanceColor) 
            instancedMeshRef.current.instanceColor.needsUpdate = true
    }, [points])

    if (!points.length) return null

    return (
        <instancedMesh
            ref={instancedMeshRef}
            args={[undefined, undefined, points.length]}
        >
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial />
        </instancedMesh>
    )
}

function ControlWithTooltip({ label, tooltip, children }: { label: string, tooltip: string, children: React.ReactNode }) {
    return (
        <TooltipContainer>
            <label>
                {label}
                {children}
            </label>
            <Tooltip className="tooltip">{tooltip}</Tooltip>
        </TooltipContainer>
    )
}

interface ColorLegendProps {
    minIterations: number;
    maxIterations: number;
}

function ColorLegend({ minIterations, maxIterations }: ColorLegendProps) {
    // Generate the same color gradient as used in the visualization
    const stops = Array.from({ length: 10 }, (_, i) => {
        const normalizedValue = i / 9  // 0 to 1
        const hue = 0.75 - (normalizedValue * 0.75)
        const saturation = 0.9 - Math.sin(normalizedValue * Math.PI) * 0.2
        const lightness = 0.5 + Math.sin(normalizedValue * Math.PI) * 0.2
        
        const color = new THREE.Color()
        color.setHSL(hue, saturation, lightness)
        return `${color.getStyle()} ${i * 11.11}%`
    }).join(', ')

    return (
        <LegendContainer>
            <div>Iteration Depth</div>
            <LegendGradient
                style={{
                    background: `linear-gradient(to right, ${stops})`
                }}
            />
            <LegendLabels>
                <span>{minIterations}</span>
                <span>{Math.round((maxIterations + minIterations) / 2)}</span>
                <span>{maxIterations}</span>
            </LegendLabels>
        </LegendContainer>
    )
}

export default function LogisticBifurcation() {
    const [points, setPoints] = useState<Point[]>([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [params, setParams] = useState<FractalParams>(defaultParams)
    const [mousePos, setMousePos] = useState<{ x: number; y: number; r: number; value: number } | null>(null)
    const workerRef = useRef<Worker>()
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const [iterationBounds, setIterationBounds] = useState<{ min: number; max: number } | null>(null)

    // Convert screen coordinates to fractal coordinates
    const screenToFractalCoords = useCallback((x: number, y: number) => {
        if (!canvasContainerRef.current) return null

        const rect = canvasContainerRef.current.getBoundingClientRect()
        const relativeX = x - rect.left
        const relativeY = y - rect.top

        // Convert to normalized coordinates (-1 to 1)
        const normalizedX = (relativeX / rect.width) * 2 - 1
        const normalizedY = -((relativeY / rect.height) * 2 - 1)  // Flip Y axis

        // Convert to fractal coordinates
        const r = ((normalizedX + 1) * (params.endR - params.startR) / 2) + params.startR
        const value = ((normalizedY + 1) / 2)

        return { r, value }
    }, [params.startR, params.endR])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!canvasContainerRef.current) return

        // Check if mouse is over any control elements
        const target = e.target as HTMLElement
        const isOverControls = target.closest('.controls-overlay') !== null

        if (isOverControls) {
            setMousePos(null)
            return
        }

        const coords = screenToFractalCoords(e.clientX, e.clientY)
        if (coords) {
            setMousePos({
                x: e.clientX,
                y: e.clientY,
                r: coords.r,
                value: coords.value
            })
        }
    }, [screenToFractalCoords])

    const handleMouseLeave = useCallback(() => {
        setMousePos(null)
    }, [])

    useEffect(() => {
        const container = canvasContainerRef.current
        if (!container) return

        container.addEventListener('mousemove', handleMouseMove)
        container.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            container.removeEventListener('mousemove', handleMouseMove)
            container.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [handleMouseMove, handleMouseLeave])

    const calculatePoints = useCallback((newParams: FractalParams) => {
        setLoading(true)
        setProgress(0)
        setPoints([])
        setIterationBounds(null)

        // Terminate existing worker if it exists
        if (workerRef.current) {
            workerRef.current.terminate()
        }

        // Create new worker
        workerRef.current = new Worker(new URL('./worker.ts', import.meta.url))
        
        workerRef.current.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'chunk') {
                const newPoints = e.data.points
                setPoints(prev => {
                    const allPoints = [...prev, ...newPoints]
                    
                    // Calculate new bounds
                    if (allPoints.length > 0) {
                        const bounds = allPoints.reduce((acc, point) => ({
                            min: Math.min(acc.min, point.iterations),
                            max: Math.max(acc.max, point.iterations)
                        }), { min: allPoints[0].iterations, max: allPoints[0].iterations })
                        
                        // Update bounds in next tick to avoid state update during render
                        setTimeout(() => setIterationBounds(bounds), 0)
                    }
                    
                    return allPoints
                })
                setProgress(e.data.progress)
            } else if (e.data.type === 'complete') {
                setLoading(false)
            }
        }

        workerRef.current.postMessage(newParams)
    }, [])

    useEffect(() => {
        calculatePoints(params)
        return () => workerRef.current?.terminate()
    }, [params, calculatePoints])

    const handleParamChange = (key: keyof FractalParams, value: any) => {
        setParams(prev => ({ ...prev, [key]: value }))
    }

    const handleReset = () => {
        setParams(defaultParams)
    }

    return (
        <CanvasContainer ref={canvasContainerRef}>
            <Canvas
                orthographic
                camera={{ 
                    position: [0, 0, 500],
                    zoom: 2,
                    up: [0, 0, 1], 
                    far: 10000 
                }}
            >
                <MapControls 
                    maxZoom={50}
                    minZoom={1}
                    enableRotate={false}
                />
                <PointCloud points={points} />
            </Canvas>
            
            {mousePos && (
                <>
                    <Crosshair x={mousePos.x} y={mousePos.y} />
                    <CoordinateTooltip x={mousePos.x} y={mousePos.y}>
                        r: {mousePos.r.toFixed(3)}, x: {mousePos.value.toFixed(3)}
                    </CoordinateTooltip>
                </>
            )}

            <div className="controls-overlay">
                {!loading && iterationBounds && (
                    <ColorLegend 
                        minIterations={iterationBounds.min}
                        maxIterations={iterationBounds.max}
                    />
                )}

                <ControlPanel>
                    <Button onClick={handleReset}>
                        Reset to Default
                    </Button>

                    <ControlWithTooltip 
                        label="Resolution:"
                        tooltip="Controls the density of points. Higher resolution means more detail but slower calculation."
                    >
                        <select 
                            value={params.resolution}
                            onChange={e => handleParamChange('resolution', e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </ControlWithTooltip>
                    
                    <ControlWithTooltip 
                        label="Start R:"
                        tooltip="The starting value for the bifurcation parameter. Lower values show simpler behavior, while higher values (near 4.0) show chaos."
                    >
                        <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="4"
                            value={params.startR}
                            onChange={e => handleParamChange('startR', parseFloat(e.target.value))}
                        />
                    </ControlWithTooltip>

                    <ControlWithTooltip 
                        label="Warmup Iterations:"
                        tooltip="Number of iterations to discard before plotting. Higher values give more accurate results but take longer to calculate."
                    >
                        <input 
                            type="number"
                            step="50"
                            min="50"
                            max="1000"
                            value={params.warmupIterations}
                            onChange={e => handleParamChange('warmupIterations', parseInt(e.target.value))}
                        />
                    </ControlWithTooltip>

                    <ControlWithTooltip 
                        label="Max Iterations:"
                        tooltip="Number of points to plot for each R value. Higher values show more detail in the attractor structure."
                    >
                        <input 
                            type="number"
                            step="10"
                            min="10"
                            max="500"
                            value={params.maxIterations}
                            onChange={e => handleParamChange('maxIterations', parseInt(e.target.value))}
                        />
                    </ControlWithTooltip>

                    <ControlWithTooltip 
                        label="Accuracy:"
                        tooltip="Step size between R values. Smaller values give smoother results but increase calculation time."
                    >
                        <input 
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            max="0.01"
                            value={params.accuracyValue}
                            onChange={e => handleParamChange('accuracyValue', parseFloat(e.target.value))}
                        />
                    </ControlWithTooltip>
                </ControlPanel>
            </div>

            {loading && (
                <LoadingOverlay>
                    Calculating bifurcation diagram... {Math.round(progress * 100)}%
                </LoadingOverlay>
            )}
        </CanvasContainer>
    )
}
