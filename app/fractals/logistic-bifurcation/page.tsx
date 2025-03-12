'use client'

import { useRef, useEffect, useState } from 'react'
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

interface Point {
    x: number
    y: number
}

const accuracyValue = 0.0001
const maxIterations = 300
// const warmupIterations = 500
const warmupIterations = 100


function PointCloud({ points }: { points: Point[] }) {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
    const tempObject = useRef(new THREE.Object3D())
    const tempColor = useRef(new THREE.Color())

    useEffect(() => {
        if (!instancedMeshRef.current || !points.length) return

        points.forEach((point, i) => {
            const x = (point.x * 400) - 800
            const y = (point.y * 400) - 200
            
            tempObject.current.position.set(x, y, 0)
            tempObject.current.scale.set(0.3, 0.3, 1)
            tempObject.current.updateMatrix()
            
            instancedMeshRef.current?.setMatrixAt(i, tempObject.current.matrix)
            instancedMeshRef.current?.setColorAt(i, tempColor.current.setHSL(point.x / 4, 1, 0.5))
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

export default function LogisticBifurcation() {
    const [points, setPoints] = useState<Point[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const worker = new Worker(new URL('./worker.ts', import.meta.url))
        
        worker.onmessage = (e: MessageEvent) => {
            setPoints(e.data)
            setLoading(false)
        }

        worker.postMessage({ startR: 1.1 })

        return () => worker.terminate()
    }, [])

    return (
        <CanvasContainer>
            <Canvas
                orthographic
                camera={{ position: [0, 0, 500], zoom: 10, up: [0, 0, 1], far: 10000 }}
            >
                <MapControls />
                <PointCloud points={points} />
            </Canvas>
            {loading && (
                <LoadingOverlay>
                    Calculating bifurcation diagram...
                </LoadingOverlay>
            )}
        </CanvasContainer>
    )
}
