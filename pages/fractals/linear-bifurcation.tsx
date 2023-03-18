import { MapControls } from '@react-three/drei';
import { Canvas, Dpr } from '@react-three/fiber';
import { ReactElement, StrictMode, useEffect, useState } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div`
	height: 100vh;
    width: 100vw
	background: white;
`

interface PointMeshProps {
    x: number;
    y: number;
}

interface CreatePointsProps {
    r: number;
    x: number;
}

interface Point {
    xCoord: number;
    yCoord: number;
}

const PointMesh = ( { x, y }: PointMeshProps ) => (
    <mesh position={[ ( x * 400 ) - 800, ( y * 400 ) - 200, 0 ]}>
        <planeBufferGeometry args={[ 1, 1 ]} />
        <meshBasicMaterial color="black" />
    </mesh>
);



const accuracyValue = .001;

const fractalFunction = ( r: number, x: number ) => {
    return r * ( 1 - ( r * ( 1 - ( r * ( 1 - x ) * x ) ) * ( r * ( 1 - x ) * x ) ) ) * ( r * ( 1 - ( r * ( 1 - x ) * x ) ) * ( r * ( 1 - x ) * x ) );
    /* return r * ( 1 - ( r * ( 1 - x ) ) ); */
}

// const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : [ 1, 2 ] as Dpr;

const LinearBifurcation = () => {
    const [ points, setPoints ] = useState<Set<ReactElement>>(new Set());

    const tempPoints: Set<ReactElement> = new Set;
    const createPoints = ( r: number ) => {
        console.log( 'CREATING POINTS' );
        for ( let rIncrement = r; rIncrement < 4.0; rIncrement += .0005 ) {
            for ( let xIncrement = .01; xIncrement < 1.0; xIncrement += .0005 ) {
                if ( Math.abs( fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, xIncrement ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) - xIncrement ) < accuracyValue ) {//This determines if the given point is part of the graph, because the output of the recursive function should be equal to the initial value of x.
                    if ( !( ( fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, xIncrement - accuracyValue ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) < xIncrement - accuracyValue ) //The
                         && ( fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, fractalFunction( rIncrement, xIncrement + accuracyValue ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) > xIncrement + accuracyValue ) ) ) {//This determines if the point is part of the graph, because for each iteration only every other intersection for each value of r actually is graphed, and all of those that shouldn't be come from above the line, and exit below
                        const point = { xCoord: rIncrement, yCoord: xIncrement };
                        const mappedPoint = ( <PointMesh key={JSON.stringify( point )} x={point.xCoord} y={point.yCoord} /> );
                        tempPoints.add(mappedPoint);
                    }
                }
            }
        }
        setPoints(tempPoints);
        console.log('SET POINTS');
    }

    useEffect(() => {
        createPoints( 1.1 );
    }, [])

    return (
        <StrictMode>
            <CanvasContainer>
                <Canvas orthographic camera={{ position: [ 0, 0, 500 ], zoom: 10, up: [ 0, 0, 1 ], far: 10000 }}>
                    <MapControls />
                    {points}
                </Canvas>
            </CanvasContainer>
        </StrictMode>
    );
};

export default LinearBifurcation;
