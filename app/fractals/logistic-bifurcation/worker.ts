interface LogisticPoint {
    x: number
    y: number
    iterations: number
}

interface LogisticWorkerParams {
    startR: number
    endR: number
    resolution: 'low' | 'medium' | 'high'
    accuracyValue: number
    maxIterations: number
    warmupIterations: number
}

const LOGISTIC_CHUNK_SIZE = 0.1 // Calculate in 0.1 r-value chunks

function getStepSizes(resolution: 'low' | 'medium' | 'high', r: number) {
    const baseMultiplier = resolution === 'low' ? 4 : resolution === 'medium' ? 2 : 1
    
    const rStepSize = r > 3 
        ? 0.0002 * baseMultiplier 
        : (r > 2.8 ? 0.0001 * baseMultiplier : 0.0005 * baseMultiplier)
    
    const xStepSize = r > 3 
        ? 0.0002 * baseMultiplier 
        : 0.0003 * baseMultiplier

    return { rStepSize, xStepSize }
}

function getInitialX(r: number): number {
    // For r < 3, the attractor is at x = (r-1)/r
    if (r <= 3) {
        return (r - 1) / r
    }
    // For r > 3, start near the middle of the interval
    return 0.5
}

function calculateLogisticChunk(params: LogisticWorkerParams, chunkStart: number, chunkEnd: number): LogisticPoint[] {
    const points: LogisticPoint[] = []
    const { resolution, accuracyValue, maxIterations, warmupIterations } = params
    
    for (let r = chunkStart; r < chunkEnd;) {
        const { rStepSize, xStepSize } = getStepSizes(resolution, r)
        r += rStepSize

        if (r >= chunkEnd) break

        const initialX = getInitialX(r)
        const xRange = r > 3 ? 0.4 : 0.2

        for (let xOffset = -xRange; xOffset <= xRange; xOffset += xStepSize) {
            const x = initialX + xOffset
            if (x <= 0 || x >= 1) continue

            let currentX = x
            
            // Warmup iterations
            for (let i = 0; i < warmupIterations; i++) {
                currentX = r * currentX * (1 - currentX)
            }
            
            const baseX = currentX
            let isPartOfCycle = false
            let iterationCount = 0
            currentX = r * currentX * (1 - currentX)
            iterationCount++
            
            if (Math.abs(currentX - baseX) < accuracyValue) {
                points.push({ x: r, y: baseX, iterations: iterationCount })
                continue
            }
            
            for (let i = 0; i < maxIterations; i++) {
                if (Math.abs(currentX - baseX) < accuracyValue) {
                    isPartOfCycle = true
                    break
                }
                currentX = r * currentX * (1 - currentX)
                iterationCount++
            }
            
            if (isPartOfCycle) {
                points.push({ x: r, y: baseX, iterations: iterationCount })
            }
        }
    }
    
    return points
}

self.onmessage = (e: MessageEvent) => {
    const params: LogisticWorkerParams = e.data
    const { startR, endR } = params

    // Calculate in chunks and stream results
    for (let chunkStart = startR; chunkStart < endR; chunkStart += LOGISTIC_CHUNK_SIZE) {
        const chunkEnd = Math.min(chunkStart + LOGISTIC_CHUNK_SIZE, endR)
        const points = calculateLogisticChunk(params, chunkStart, chunkEnd)
        
        self.postMessage({
            type: 'chunk',
            points,
            progress: (chunkEnd - startR) / (endR - startR)
        })
    }

    self.postMessage({ type: 'complete' })
} 