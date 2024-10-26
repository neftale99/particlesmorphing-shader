uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
uniform float uNoiseScale;
uniform float uChangeDuration;

uniform vec3 uColorA;
uniform vec3 uColorB;

attribute vec3 aPositionTarget;
attribute float aSize;

varying vec3 vColor;
varying vec3 vPosition;

#include ../Includes/simplexNoise3d.glsl

void main()
{
    // Mixed position
    float noiseOrigin = simplexNoise3d(position * uNoiseScale);
    float noiseTarget = simplexNoise3d(aPositionTarget * uNoiseScale);

    float noise = mix(noiseOrigin, noiseTarget, uProgress);
    noise = smoothstep(- 1.0, 1.0, noise);

    float duration = uChangeDuration;
    float delay = (1.0 - duration) * noise;
    float end = delay + duration;

    float progress = smoothstep(delay, end, uProgress);
    vec3 mixedPosition = mix(position, aPositionTarget, progress);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = aSize * (uSize / 2.0) * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = mix(uColorA, uColorB, noise);
    vPosition = modelPosition.xyz;
}