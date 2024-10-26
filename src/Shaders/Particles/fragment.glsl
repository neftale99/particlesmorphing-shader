uniform float uTime;

varying vec3 vColor;
varying vec3 vPosition;

void main()
{
    // Stripes
    float stripesX = mod((vPosition.x + uTime * 0.01) * 15.0, 1.0);
    stripesX = pow(stripesX, 1.0);

    float stripesY = mod((vPosition.y + uTime * 0.01) * 15.0, 1.0);
    stripesY = pow(stripesY, 1.0);

    float stripesXY = stripesX * stripesY;
    stripesXY = smoothstep(0.1, 0.5, stripesXY);

    // Points
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));
    distanceToCenter += stripesXY;

    float alpha = 1.0 - smoothstep(0.2, 0.5, distanceToCenter);

    gl_FragColor = vec4(vColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}