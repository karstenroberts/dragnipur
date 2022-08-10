import { Canvas, Dpr, extend, useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import styled from 'styled-components';
import { FirstPersonControls } from '@react-three/drei';

const CanvasContainer = styled.div`
	height: 90vh;
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

const PointMesh = ({x, y}: PointMeshProps) => (
	<mesh position={[(x*400)-800, (y*400)-200, 0]}>
		<planeBufferGeometry args={[1,1]} />
		<meshBasicMaterial color="white" />
	</mesh>
);

const getAllPoints = ({r, x}: CreatePointsProps) => {
	const points = createPoints(r);
	return points.map((e) => (
		<PointMesh key={JSON.stringify(e)} x={e.xCoord} y={e.yCoord} />
	))
}

const UsableCoordinates = () => (
	<mesh>
		<planeBufferGeometry args={[1600, 400]} />
		<meshStandardMaterial color="red" />
	</mesh>
)

const accuracyValue=.001

const fractalFunction = (r: number, x: number) => {
	//	return r * (1-(r*(1-x)))
	return r*(1-(r*(1-(r*(1-x)*x))*(r*(1-x)*x)))*(r*(1-(r*(1-x)*x))*(r*(1-x)*x));
}

const createPoints = (r: number) => {
	let points:Point[] = [];
	for (let rIncrement = r; rIncrement < 4.0; rIncrement+=.0005) {
		for (let xIncrement = .01; xIncrement < 1.0; xIncrement += .0005) {
			if(Math.abs(fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,xIncrement)))))))))))))))))))))))))))))))) - xIncrement) < accuracyValue){//This determines if the given point is part of the graph, because the output of the recursive function should be equal to the initial value of x.
				if(!((fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,xIncrement-accuracyValue))))))))))))))))))))))))))))))))<xIncrement-accuracyValue) //The
				  && (fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement, fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,fractalFunction(rIncrement,xIncrement+accuracyValue))))))))))))))))))))))))))))))))>xIncrement+accuracyValue))){//This determines if the point is part of the graph, because for each iteration only every other intersection for each value of r actually is graphed, and all of those that shouldn't be come from above the line, and exit below 
					const point = {xCoord: rIncrement, yCoord: xIncrement};
					points.push(point);
					//					console.log(JSON.stringify(point))
				}
			}
		}
	}
	return points;
}

const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : [1, 2] as Dpr;

const LinearBifurcation = (props: unknown) => {
	return (
		<CanvasContainer>
			<Canvas dpr={dpr} orthographic >
				<FirstPersonControls />
				{getAllPoints({r: 1.1, x:0})}
			</Canvas>
		</CanvasContainer>
	)
}

export default LinearBifurcation;
