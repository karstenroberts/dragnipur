#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 center;
uniform float scale;
uniform int maxIterations;
uniform float escapeRadius;
uniform vec2 resolution;
uniform vec3 baseColor;      // Base color in HSV
uniform float colorCycles;   // Number of color cycles
uniform float colorOffset;   // Color offset/phase
uniform float brightness;    // Overall brightness
uniform float contrast;      // Color contrast

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Calculate aspect ratio and scaling factors
    float aspectRatio = resolution.x / resolution.y;
    float viewScale = scale;
    
    // Adjust scale based on aspect ratio to fit view
    if (aspectRatio > 1.0) {
        viewScale *= aspectRatio;
    } else {
        viewScale /= aspectRatio;
    }
    
    // Convert pixel coordinates to complex plane coordinates
    vec2 uv = (gl_FragCoord.xy / resolution - 0.5) * 2.0;  // Map to [-1, 1]
    if (aspectRatio > 1.0) {
        uv.x *= aspectRatio;
    } else {
        uv.y /= aspectRatio;
    }
    uv *= viewScale;
    vec2 c = center + uv;
    
    // Mandelbrot iteration
    vec2 z = vec2(0.0);
    float escapeRadiusSq = escapeRadius * escapeRadius;
    
    // Main iteration loop with smooth coloring
    float smoothIter = 0.0;
    int iter;
    
    for(int i = 0; i < 1000; i++) {
        if(i >= maxIterations) break;
        
        // z = z^2 + c
        float x = z.x * z.x - z.y * z.y + c.x;
        float y = 2.0 * z.x * z.y + c.y;
        
        // Early bailout optimization
        float mag2 = x * x + y * y;
        if(mag2 > escapeRadiusSq) {
            // Smooth iteration count
            smoothIter = float(i) - log2(log2(mag2)) + 4.0;
            iter = i;
            break;
        }
        
        z = vec2(x, y);
        iter = i;
    }
    
    // Color the point based on iteration count
    if(iter >= maxIterations - 1) {
        // Point is in the set - color it black
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Enhanced smooth coloring
        float t = smoothIter / float(maxIterations);
        
        // Apply contrast
        t = pow(t, contrast);
        
        // Create a more detailed color gradient
        vec3 hsv = vec3(
            fract(baseColor.x + colorOffset + colorCycles * t),  // Rotating hue
            baseColor.y * (0.8 + 0.2 * cos(t * 6.28318)),       // Varying saturation
            baseColor.z * brightness * pow(t, 0.4)               // Adjusted brightness
        );
        
        vec3 rgb = hsv2rgb(hsv);
        gl_FragColor = vec4(rgb, 1.0);
    }
} 