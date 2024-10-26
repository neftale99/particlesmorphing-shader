import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import particlesVertexShader from './Shaders/Particles/vertex.glsl'
import particlesFragmentShader from './Shaders/Particles/fragment.glsl'
import overlayVertexShader from './Shaders/Overlay/vertex.glsl'
import overlayFragmentShader from './Shaders/Overlay/fragment.glsl'


/**
 * Loaders
 */
// Loading
const loaderElement = document.querySelector('.loading')
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        gsap.delayedCall(1, () => {

            loaderElement.style.display = 'none'

            gsap.to(
                overlayMaterial.uniforms.uAlpha, 
                { duration: 1.5, value: 0, delay: 0.5 }
            )

            window.setTimeout(() => {
                if (particles) {
                    particles.points.visible = true
                }
                initGUI()   
            }, 2000)
        })
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => 
    {
        loaderElement.style.display = 'block'
    }
)

const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('./draco/')

const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Base
 */
// Debug
let gui
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    uniforms: {
        uAlpha: new THREE.Uniform(1)
    },
    transparent: true,
    depthWrite: false,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    if(particles)
        particles.material.uniforms.uResolution.value.set(
            sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio
        )

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 2, 7)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
debugObject.clearColor = '#102009'
renderer.setClearColor(debugObject.clearColor)

/**
 * Tweaks
 */
function initGUI()
{
    gui = new GUI({ width: 300 })

    // Render
        gui
            .addColor(debugObject, 'clearColor')
            .name('Clear Color')
            .onChange(() => { renderer.setClearColor(debugObject.clearColor) })

        // Tweaks

        gui.add(particles.material.uniforms.uSize, 'value')
        .min(0).max(0.3).step(0.001).name('Size Particles')
    
        gui.add(particles.material.uniforms.uProgress, 'value')
            .min(0).max(1).step(0.001).name('Progress').listen()

        gui.add(particles.material.uniforms.uNoiseScale, 'value')
            .min(0).max(5).step(0.001).name('Noise Scale')

        gui.addColor(particles, 'colorA').name('Color A')
            .onChange(() => {
                particles.material.uniforms.uColorA.value.set(particles.colorA)
            })

        gui.addColor(particles, 'colorB').name('Color B')
            .onChange(() => {
                particles.material.uniforms.uColorB.value.set(particles.colorB)
            })

        gui.add(particles.material.uniforms.uChangeDuration, 'value')
            .min(0).max(1).step(0.001).name('Transition')

        gui.add(particles, 'morph0').name('Chess')
        gui.add(particles, 'morph1').name('King')
        gui.add(particles, 'morph2').name('Queen')
        gui.add(particles, 'morph3').name('Bishop')
        gui.add(particles, 'morph4').name('Knight')
        gui.add(particles, 'morph5').name('Rook')
        gui.add(particles, 'morph6').name('Pawn')
}

/**
 * Models
 */
let particles = null

gltfLoader.load('./Model/Chess.glb', (glft) =>
{
    // Particles
    particles = {}
    particles.index = 6
        
    // Positions
    const positions = glft.scene.children.map(
        child => child.geometry.attributes.position
    )

    particles.maxCount = 0
    for(const position of positions)
    {
        if(position.count > particles.maxCount)
            particles.maxCount = position.count
    }

    particles.positions = []
    for(const position of positions)
    {
        const originalArray = position.array
        const newArray = new Float32Array(particles.maxCount * 3)

        for(let i = 0; i < particles.maxCount; i ++)
        {
            const i3 = i * 3

            if(i3 < originalArray.length)
            {
                newArray[i3 + 0] = originalArray[i3 + 0]
                newArray[i3 + 1] = originalArray[i3 + 1]
                newArray[i3 + 2] = originalArray[i3 + 2]
            }
            else
            {
                const randomIndex = Math.floor(position.count * Math.random()) * 3
                newArray[i3 + 0] = originalArray[randomIndex + 0]
                newArray[i3 + 1] = originalArray[randomIndex + 1]
                newArray[i3 + 2] = originalArray[randomIndex + 2]
            }
        }

        particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3))
    }

    // Geometry
    const sizesArray = new Float32Array(particles.maxCount)

    for(let i = 0; i < particles.maxCount; i++)
    {
        sizesArray[i] = Math.random()
    }

    particles.geometry = new THREE.BufferGeometry()
    particles.geometry.setAttribute('position', particles.positions[particles.index])
    particles.geometry.setAttribute('aPositionTarget', particles.positions[3])
    particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))

    // Material
    const morphColors = {
        morph0: { colorA: '#491e6c', colorB: '#206317' }, // Rook
        morph1: { colorA: '#0fdb00', colorB: '#f7ef02' }, // Bishop
        morph2: { colorA: '#ff0a0a', colorB: '#0080ff' }, // King
        morph3: { colorA: '#00ffd5', colorB: '#ff00bb' }, // Queen
        morph4: { colorA: '#8930a1', colorB: '#a5973b' }, // Pawn
        morph5: { colorA: '#d442d7', colorB: '#00d5ff' }, // Knight
        morph6: { colorA: '#ff7300', colorB: '#05ff16' }, // Letter
    }

    particles.colorA = morphColors.morph6.colorA
    particles.colorB = morphColors.morph6.colorB


    particles.material = new THREE.ShaderMaterial({
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        uniforms:
        {
            uTime: new THREE.Uniform(0),
            uSize: new THREE.Uniform(0.155),
            uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
            uProgress: new THREE.Uniform(0),
            uNoiseScale: new THREE.Uniform(0.728),
            uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
            uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
            uChangeDuration: new THREE.Uniform(0.4)
        },
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
    })

    // Points
    particles.points = new THREE.Points(particles.geometry, particles.material)
    particles.points.frustumCulled = false
    particles.points.visible = false
    scene.add(particles.points)

    // Pieces morph
    particles.morph0 = () => { particles.morph(6) }
    particles.morph1 = () => { particles.morph(2) }
    particles.morph2 = () => { particles.morph(3) }
    particles.morph3 = () => { particles.morph(1) }
    particles.morph4 = () => { particles.morph(5) }
    particles.morph5 = () => { particles.morph(0) }
    particles.morph6 = () => { particles.morph(4) }

    // Methods
    particles.morph = (index) =>
    {
        // Update attributes
        particles.geometry.attributes.position = particles.positions[particles.index]
        particles.geometry.attributes.aPositionTarget = particles.positions[index]

        // Change color
        const newColorA = new THREE.Color(morphColors[`morph${index}`].colorA)
        const newColorB = new THREE.Color(morphColors[`morph${index}`].colorB)

        // Update particles color properties
        particles.colorA = newColorA 
        particles.colorB = newColorB 

        // Animate color
        gsap.to(particles.material.uniforms.uColorA.value, {
            r: newColorA.r,
            g: newColorA.g,
            b: newColorA.b,
            duration: 3,
            ease: 'linear',
            onUpdate: () =>
            {
               gui.controllers.forEach(controller => {
                if(controller.property === 'colorA') {
                    const hexColor = `#${newColorA.getHexString()}`
                    controller.setValue(hexColor)
                    controller.updateDisplay()
                }
               }) 
            }
        })
    
        gsap.to(particles.material.uniforms.uColorB.value, {
            r: newColorB.r,
            g: newColorB.g,
            b: newColorB.b,
            duration: 3,
            ease: 'linear',
            onUpdate: () =>
            {
                gui.controllers.forEach(controller => {
                    if(controller.property === 'colorB') {
                        const hexColor = `#${newColorB.getHexString()}`
                        controller.setValue(hexColor)
                        controller.updateDisplay()
                    }
                   }) 
            }
        })

        // Animate uProgress
        gsap.fromTo(
            particles.material.uniforms.uProgress,
            { value: 0 },
            { value: 1, duration: 3.8, ease: 'linear'}
        )

        // Save index
        particles.index = index
    }

})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Uniformt time
    if (particles && particles.material) {
        particles.material.uniforms.uTime.value = elapsedTime
    }

    // Render 
    renderer.render(scene, camera)


    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()