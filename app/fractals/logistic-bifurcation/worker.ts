interface Point {
    x: number
    y: number
}

const accuracyValue = 0.0001
const maxIterations = 100
const warmupIterations = 250

function getInitialX(r: number): number {
    // For r < 3, the attractor is at x = (r-1)/r
    if (r <= 3) {
        return (r - 1) / r
    }
    // For r > 3, start near the middle of the interval
    return 0.5
}

function calculatePoints(startR: number): Point[] {
    const points: Point[] = []
    
    // Adaptive step size - use smaller steps in interesting regions
    for (let r = startR; r < 4.0;) {
        // Use finer resolution in the chaotic region and near bifurcation points
        const stepSize = r > 3 ? 0.0002 : (r > 2.8 ? 0.0001 : 0.0005)
        r += stepSize

        // Adaptive x sampling - use finer resolution near the attractor
        const initialX = getInitialX(r)
        const xRange = r > 3 ? 0.4 : 0.2  // Narrower range for non-chaotic regions
        
        // Decreased step size for x to get more points
        const xStepSize = r > 3 ? 0.0002 : 0.0003
        for (let xOffset = -xRange; xOffset <= xRange; xOffset += xStepSize) {
            const x = initialX + xOffset
            if (x <= 0 || x >= 1) continue  // Skip points outside valid range
            
            let currentX = x
            
            // Warmup iterations
            for (let i = 0; i < warmupIterations; i++) {
                currentX = r * currentX * (1 - currentX)
            }
            
            const baseX = currentX
            let isPartOfCycle = false
            currentX = r * currentX * (1 - currentX)
            
            // Early exit if we detect stability quickly
            if (Math.abs(currentX - baseX) < accuracyValue) {
                points.push({ x: r, y: baseX })
                continue
            }
            
            for (let i = 0; i < maxIterations; i++) {
                if (Math.abs(currentX - baseX) < accuracyValue) {
                    isPartOfCycle = true
                    break
                }
                currentX = r * currentX * (1 - currentX)
            }
            
            if (isPartOfCycle) {
                points.push({ x: r, y: baseX })
            }
        }
    }
    
    return points
}

self.onmessage = (e: MessageEvent) => {
    const startR = e.data.startR
    const points = calculatePoints(startR)
    self.postMessage(points)
} 