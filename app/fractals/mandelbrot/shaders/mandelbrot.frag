#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
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

in vec2 vUv;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Calculate aspect ratio
    float aspectRatio = resolution.x / resolution.y;
    
    // Convert UV to complex coordinates with aspect ratio correction
    vec2 uv = vUv - 0.5;
    uv.x *= aspectRatio;
    vec2 c = center + uv * scale * 2.0;
    
    // Initialize iteration variables
    vec2 z = vec2(0.0);
    vec2 zPrev = vec2(0.0);
    float escapeRadiusSq = escapeRadius * escapeRadius;
    float i = 0.0;
    
    // Main iteration loop with periodicity checking
    for (int iter = 0; iter < 1000; iter++) {
        if (iter >= maxIterations) break;
        
        // Store previous z for periodicity check
        zPrev = z;
        
        // z = z^2 + c
        float x = z.x * z.x - z.y * z.y + c.x;
        float y = 2.0 * z.x * z.y + c.y;
        
        z = vec2(x, y);
        float magnitudeSq = dot(z, z);
        
        // Periodicity check (every 20 iterations)
        if (iter > 0 && mod(float(iter), 20.0) == 0.0) {
            if (distance(z, zPrev) < 1e-6) {
                // Point is in a periodic cycle
                fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
            }
        }
        
        if (magnitudeSq > escapeRadiusSq) {
            // Smooth coloring formula with improved precision
            float smooth_i = float(iter) + 1.0 - log(log(magnitudeSq) / log(escapeRadiusSq)) / log(2.0);
            smooth_i = smooth_i / float(maxIterations);
            
            // Apply color transformation
            float hue = fract(smooth_i * colorCycles + colorOffset);
            vec3 hsv = vec3(hue, baseColor.y, baseColor.z);
            vec3 rgb = hsv2rgb(hsv);
            
            // Apply brightness and contrast
            rgb = (rgb - 0.5) * contrast + 0.5;
            rgb *= brightness;
            
            fragColor = vec4(rgb, 1.0);
            return;
        }
        
        i += 1.0;
    }
    
    // Point is in the set
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
} 