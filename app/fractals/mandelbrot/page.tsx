'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import * as THREE from 'three'
import styled from 'styled-components'
import { createPortal } from 'react-dom'

const CanvasContainer = styled.div`
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    background: #121212;
    position: relative;
    overflow: hidden;

    & > div:first-child {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }
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
    max-height: 90vh;
    overflow-y: auto;
    backdrop-filter: blur(5px);
    color: white;
    z-index: 1000;
    pointer-events: auto;

    @media (max-width: 768px) {
        top: auto;
        bottom: clamp(10px, 3vh, 20px);
        right: 50%;
        transform: translateX(50%);
        max-height: 60vh;
    }

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
    pointer-events: auto;
    
    &:hover {
        background: rgba(45, 45, 45, 0.95);
    }
`

const LoadingOverlay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(30, 30, 30, 0.9);
    padding: clamp(12px, 3vw, 20px);
    border-radius: 8px;
    font-size: clamp(14px, 2.5vw, 18px);
    text-align: center;
    backdrop-filter: blur(5px);
    white-space: nowrap;
    color: white;
    z-index: 1000;
`

const CoordinateTooltip = styled.div<{ x: number; y: number }>`
    position: absolute;
    left: ${props => props.x + 15}px;
    top: ${props => props.y + 15}px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: clamp(10px, 1.5vw, 12px);
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;
    backdrop-filter: blur(5px);
`

const TooltipContainer = styled.div`
    position: relative;
    display: inline-block;
    width: 100%;
`

const Tooltip = styled.div`
    position: fixed;
    padding: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    width: 200px;
    font-size: clamp(10px, 1.5vw, 12px);
    text-align: left;
    pointer-events: none;
    z-index: 10000;

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

const SelectionBox = styled.div<{ start: { x: number; y: number }, current: { x: number; y: number }, complexSize: number, rect: DOMRect }>`
    position: absolute;
    border: 2px solid #4a90e2;
    background: rgba(74, 144, 226, 0.1);
    pointer-events: none;
    ${props => {
        // Calculate the pixel size based on the complex size and viewport
        const pixelSize = (props.complexSize / 3) * props.rect.width;
        const left = props.start.x;
        const top = props.start.y;
        
        return `
            left: ${left}px;
            top: ${top}px;
            width: ${pixelSize}px;
            height: ${pixelSize}px;
        `;
    }}
    z-index: 1000;
`

interface MandelbrotParams {
    maxIterations: number;
    resolution: 'low' | 'medium' | 'high' | 'custom';
    customResolution?: number;
    colorScheme: 'classic' | 'smooth' | 'psychedelic';
    escapeRadius: number;
    zoomRegion?: {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };
}

const defaultParams: MandelbrotParams = {
    maxIterations: 1000,
    resolution: 'low',
    customResolution: 2048,
    colorScheme: 'classic',
    escapeRadius: 2.0
}

function MandelbrotSet({ imageData }: { imageData: ImageData | null }) {
    const meshRef = useRef<THREE.Mesh>(null)
    const textureRef = useRef<THREE.Texture | null>(null)

    useEffect(() => {
        if (!imageData || !meshRef.current) return

        if (textureRef.current) {
            textureRef.current.dispose()
        }

        const texture = new THREE.DataTexture(
            imageData.data,
            imageData.width,
            imageData.height,
            THREE.RGBAFormat
        )
        texture.needsUpdate = true
        textureRef.current = texture

        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
            meshRef.current.material.map = texture
            meshRef.current.material.needsUpdate = true
        }
    }, [imageData])

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[3, 3]} />
            <meshBasicMaterial />
        </mesh>
    )
}

function ControlWithTooltip({ label, tooltip, children }: { label: string, tooltip: string, children: React.ReactNode }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const labelRef = useRef<HTMLLabelElement>(null);

    const updatePosition = useCallback(() => {
        if (labelRef.current) {
            const rect = labelRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + rect.height / 2,
                left: rect.left - 10
            });
        }
    }, []);

    useEffect(() => {
        if (showTooltip) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [showTooltip, updatePosition]);

    return (
        <TooltipContainer>
            <label
                ref={labelRef}
                onMouseEnter={() => {
                    updatePosition();
                    setShowTooltip(true);
                }}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {label}
                {children}
            </label>
            {showTooltip && typeof document !== 'undefined' && createPortal(
                <Tooltip
                    style={{
                        transform: 'translateY(-50%)',
                        top: position.top,
                        left: position.left - 200,
                        opacity: 1,
                        zIndex: 10000
                    }}
                >
                    {tooltip}
                </Tooltip>,
                document.body
            )}
        </TooltipContainer>
    );
}

export default function Mandelbrot() {
    const [params, setParams] = useState<MandelbrotParams>(defaultParams)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [imageData, setImageData] = useState<ImageData | null>(null)
    const [mousePos, setMousePos] = useState<{ x: number; y: number; real: number; imag: number } | null>(null)
    const workerRef = useRef<Worker>()
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const [camera, setCamera] = useState<THREE.OrthographicCamera | null>(null)
    const [selecting, setSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number; complexSize: number; rect: DOMRect } | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<MandelbrotParams['zoomRegion'] | null>(null);

    const handleReset = useCallback(() => {
        // Reset parameters
        setParams(defaultParams);
        // Reset selection state
        setSelectedRegion(null);

        // Calculate optimal zoom to fit the set
        if (canvasContainerRef.current && camera) {
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const viewportAspectRatio = rect.width / rect.height;
            
            // Increase the view area by extending the dimensions
            const setWidth = 4;    // Wider view (-2.5 to 1.5)
            const setHeight = 4;   // Taller view (-2 to 2)
            const setAspectRatio = setWidth / setHeight;

            // Calculate zoom based on which dimension is limiting
            const zoom = viewportAspectRatio > setAspectRatio
                ? rect.height / setHeight  // height limited
                : rect.width / setWidth;   // width limited

            camera.zoom = zoom;
            camera.position.set(0, 0, 1);
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    // Effect to handle initial zoom
    useEffect(() => {
        if (camera && canvasContainerRef.current) {
            handleReset();
        }
    }, [camera, handleReset]);

    const screenToComplexCoords = useCallback((x: number, y: number) => {
        if (!canvasContainerRef.current || !camera) return null;

        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Convert screen coordinates to normalized device coordinates (-1 to 1)
        const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((y - rect.top) / rect.height) * 2 + 1;

        // Account for camera zoom and position
        const zoom = camera.zoom;
        const cameraX = camera.position.x;
        const cameraY = camera.position.y;

        // Convert to complex plane coordinates
        // The view spans from -2 to 1 on x-axis and -1.5 to 1.5 on y-axis
        const viewWidth = 3; // Total width of view (-2 to 1 = 3 units)
        const viewHeight = 3; // Total height of view (-1.5 to 1.5 = 3 units)
        
        const real = -2 + (ndcX + 1) * viewWidth / 2 - (cameraX * viewWidth / 3);
        const imag = (ndcY * viewHeight / 2) - (cameraY * viewHeight / 3);

        return { real, imag };
    }, [camera]);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        // Prevent context menu from appearing during selection
        e.preventDefault();
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        // Only handle right mouse button (button === 2)
        if (e.button !== 2) return;
        
        const target = e.target as HTMLElement;
        if (target.closest('.controls-overlay') !== null) return;

        const coords = screenToComplexCoords(e.clientX, e.clientY);
        if (coords) {
            setSelecting(true);
            setSelectionStart({ x: e.clientX, y: e.clientY });
            setSelectionCurrent({ x: e.clientX, y: e.clientY, complexSize: 0, rect: new DOMRect() });
            setSelectedRegion(null);
        }
    }, [screenToComplexCoords]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!canvasContainerRef.current) return;

        const target = e.target as HTMLElement;
        const isOverControls = target.closest('.controls-overlay') !== null;

        if (isOverControls) {
            setMousePos(null);
            return;
        }

        const coords = screenToComplexCoords(e.clientX, e.clientY);
        if (coords) {
            setMousePos({
                x: e.clientX,
                y: e.clientY,
                ...coords
            });

            if (selecting && selectionStart) {
                const startCoords = screenToComplexCoords(selectionStart.x, selectionStart.y);
                if (startCoords) {
                    // Calculate size in complex coordinates
                    const width = Math.abs(coords.real - startCoords.real);
                    const height = Math.abs(coords.imag - startCoords.imag);
                    const complexSize = Math.max(width, height);

                    setSelectionCurrent({
                        x: e.clientX,
                        y: e.clientY,
                        complexSize,
                        rect: canvasContainerRef.current.getBoundingClientRect()
                    });
                }
            }
        }
    }, [screenToComplexCoords, selecting, selectionStart]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        // Only handle right mouse button (button === 2)
        if (e.button !== 2) return;

        if (selecting && selectionStart && selectionCurrent) {
            const startCoords = screenToComplexCoords(selectionStart.x, selectionStart.y);
            const endCoords = screenToComplexCoords(e.clientX, e.clientY);

            if (startCoords && endCoords) {
                // Calculate the width and height in complex coordinates
                const width = Math.abs(endCoords.real - startCoords.real);
                const height = Math.abs(endCoords.imag - startCoords.imag);
                const size = Math.max(width, height);

                // Determine the direction of selection to adjust the square accordingly
                const isRightward = endCoords.real >= startCoords.real;
                const isDownward = endCoords.imag >= startCoords.imag;

                // Calculate the corners of the square
                const minX = isRightward ? startCoords.real : startCoords.real - size;
                const maxX = isRightward ? startCoords.real + size : startCoords.real;
                const minY = isDownward ? startCoords.imag : startCoords.imag - size;
                const maxY = isDownward ? startCoords.imag + size : startCoords.imag;

                setSelectedRegion({
                    centerX: (minX + maxX) / 2,
                    centerY: (minY + maxY) / 2,
                    width: size,
                    height: size
                });
            }
        }
        setSelecting(false);
    }, [selecting, selectionStart, selectionCurrent, screenToComplexCoords]);

    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        container.addEventListener('contextmenu', handleContextMenu);
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);
        return () => {
            container.removeEventListener('contextmenu', handleContextMenu);
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleContextMenu, handleMouseDown, handleMouseMove, handleMouseUp]);

    const calculateSet = useCallback((newParams: MandelbrotParams) => {
        setLoading(true)
        setProgress(0)
        setImageData(null)

        if (workerRef.current) {
            workerRef.current.terminate()
        }

        workerRef.current = new Worker(new URL('./worker.ts', import.meta.url))
        
        workerRef.current.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'chunk') {
                const imageData = new ImageData(
                    new Uint8ClampedArray(e.data.buffer),
                    e.data.width,
                    e.data.height
                )
                setImageData(imageData)
                setProgress(e.data.progress)
            } else if (e.data.type === 'complete') {
                const imageData = new ImageData(
                    new Uint8ClampedArray(e.data.buffer),
                    e.data.width,
                    e.data.height
                )
                setImageData(imageData)
                setLoading(false)
            }
        }

        workerRef.current.postMessage(newParams)
    }, [])

    useEffect(() => {
        calculateSet(params)
        return () => workerRef.current?.terminate()
    }, [params, calculateSet])

    const handleParamChange = (key: keyof MandelbrotParams, value: any) => {
        setParams(prev => ({ ...prev, [key]: value }))
    }

    const renderSelectedRegion = useCallback(() => {
        if (!selectedRegion) return;

        setParams(prev => ({
            ...prev,
            resolution: params?.resolution,
            zoomRegion: selectedRegion
        }));
    }, [selectedRegion, params?.resolution]);

    return (
        <CanvasContainer ref={canvasContainerRef}>
            <div className="controls-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000 }}>
                <BackButton onClick={() => window.location.href = '/'}>
                    ← Back
                </BackButton>

                <ControlPanel style={{ pointerEvents: 'auto' }}>
                    <Button onClick={handleReset}>
                        Reset to Default
                    </Button>

                    <ControlWithTooltip 
                        label="Resolution:"
                        tooltip="Controls the quality of the rendering. Higher resolutions show more detail but take longer to calculate."
                    >
                        <select 
                            value={params.resolution}
                            onChange={e => handleParamChange('resolution', e.target.value)}
                        >
                            <option value="low">Low (2048px)</option>
                            <option value="medium">Medium (4096px)</option>
                            <option value="high">High (5120px)</option>
                            <option value="custom">Custom</option>
                        </select>
                    </ControlWithTooltip>

                    {params.resolution === 'custom' && (
                        <ControlWithTooltip 
                            label="Custom Resolution:"
                            tooltip="Set your own resolution (width in pixels). Higher values give more detail but take longer to render. Values above 8192 may cause performance issues."
                        >
                            <input 
                                type="number"
                                min="512"
                                max="8192"
                                step="512"
                                value={params.customResolution}
                                onChange={e => handleParamChange('customResolution', parseInt(e.target.value))}
                            />
                        </ControlWithTooltip>
                    )}

                    <ControlWithTooltip 
                        label="Color Scheme:"
                        tooltip="Different ways to visualize the escape-time of each point. Classic uses rainbow colors, Smooth adds more gradual transitions, and Psychedelic creates repeating color patterns."
                    >
                        <select 
                            value={params.colorScheme}
                            onChange={e => handleParamChange('colorScheme', e.target.value)}
                        >
                            <option value="classic">Classic</option>
                            <option value="smooth">Smooth</option>
                            <option value="psychedelic">Psychedelic</option>
                        </select>
                    </ControlWithTooltip>

                    <ControlWithTooltip 
                        label="Max Iterations:"
                        tooltip="Maximum number of iterations to determine if a point is in the set. Higher values give more detailed boundaries but increase calculation time."
                    >
                        <input 
                            type="number"
                            min="100"
                            max="2000"
                            step="100"
                            value={params.maxIterations}
                            onChange={e => handleParamChange('maxIterations', parseInt(e.target.value))}
                        />
                    </ControlWithTooltip>

                    <ControlWithTooltip 
                        label="Escape Radius:"
                        tooltip="The radius at which a point is considered to have escaped the set. Standard value is 2, but larger values can create interesting effects in the coloring."
                    >
                        <input 
                            type="number"
                            min="2"
                            max="20"
                            step="0.5"
                            value={params.escapeRadius}
                            onChange={e => handleParamChange('escapeRadius', parseFloat(e.target.value))}
                        />
                    </ControlWithTooltip>
                </ControlPanel>

                {selectedRegion && (
                    <Button 
                        style={{ 
                            position: 'absolute', 
                            bottom: '20px', 
                            left: '50%', 
                            transform: 'translateX(-50%)',
                            width: 'auto',
                            pointerEvents: 'auto',
                            zIndex: 1000
                        }}
                        onClick={renderSelectedRegion}
                    >
                        Render Selected Region in High Resolution
                    </Button>
                )}

                {selecting && selectionStart && selectionCurrent && (
                    <SelectionBox 
                        start={selectionStart} 
                        current={selectionCurrent}
                        complexSize={(selectionCurrent as any).complexSize}
                        rect={(selectionCurrent as any).rect}
                    />
                )}
            </div>

            <Canvas
                orthographic
                camera={{ 
                    position: new THREE.Vector3(0, 0, 1),
                    zoom: 150,
                    up: [0, 1, 0],
                    far: 1000,
                    near: 0.1,
                    left: -2,
                    right: 1,
                    top: 1.5,
                    bottom: -1.5
                }}
                style={{ position: 'relative', zIndex: 1 }}
                onCreated={({ camera }) => {
                    setCamera(camera as THREE.OrthographicCamera);
                    (camera as THREE.OrthographicCamera).lookAt(new THREE.Vector3(0, 0, 0));
                    camera.updateProjectionMatrix();
                }}
            >
                <MapControls 
                    maxZoom={5000}
                    minZoom={50}
                    enableRotate={false}
                    screenSpacePanning={true}
                />
                <MandelbrotSet imageData={imageData} />
            </Canvas>

            {loading && (
                <LoadingOverlay>
                    Rendering Mandelbrot set... {Math.round(progress * 100)}%
                    <div style={{ fontSize: '0.8em', marginTop: '8px', opacity: 0.8 }}>
                        {progress < 1 ? 'Partial render visible during calculation' : 'Finalizing...'}
                    </div>
                </LoadingOverlay>
            )}

            {mousePos && (
                <CoordinateTooltip x={mousePos.x} y={mousePos.y}>
                    c = {mousePos.real.toFixed(6)} + {mousePos.imag.toFixed(6)}i
                </CoordinateTooltip>
            )}
        </CanvasContainer>
    )
} 