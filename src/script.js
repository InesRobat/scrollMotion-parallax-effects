import * as THREE from "three";
import GUI from "lil-gui";
import gsap from "gsap";

/**
 * Debug
 */
const gui = new GUI();
gui.hide();

const parameters = {
  materialColor: "#ffeded",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("./textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

const particlesTexture = textureLoader.load("./textures/particles/9.png");

// Objects
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

// Meshes
const objectsDistance = 4;

const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);
const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
);
const mesh4 = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), material);
const mesh5 = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
const mesh6 = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), material);
const mesh7 = new THREE.Mesh(new THREE.TetrahedronGeometry(1, 0), material);

mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;
mesh4.position.y = -objectsDistance * 3;
mesh5.position.y = -objectsDistance * 4;
mesh6.position.y = -objectsDistance * 5;
mesh7.position.y = -objectsDistance * 6;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;
mesh4.position.x = -2;
mesh5.position.x = 2;
mesh6.position.x = -2;
mesh7.position.x = 2;

const sectionMeshes = [mesh1, mesh2, mesh3, mesh4, mesh5, mesh6, mesh7];
scene.add(mesh1, mesh2, mesh3, mesh4, mesh5, mesh6, mesh7);

// Particles
const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.1,
  alphaMap: particlesTexture,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  //   vertexColors: true,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Lights
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  fullscreenQuad.material.uniforms.u_resolution.value.set(
    sizes.width,
    sizes.height
  );
});

// Camera group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Gradient shaders
const gradientMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_color1: { value: new THREE.Color("#FF9A8B") }, // Light peach
    u_color2: { value: new THREE.Color("#FF6A88") }, // Coral pink
    u_color3: { value: new THREE.Color("#FF99AC") }, // Light pink
    u_resolution: { value: new THREE.Vector2(sizes.width, sizes.height) },
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec2 u_resolution;
      varying vec2 vUv;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        
        // Interpolate between colors based on vertical position
        vec3 color = vec3(0.0);
        
        if (uv.y < 0.55) {
          color = mix(u_color1, u_color2, uv.y / 0.55);
        } else {
          color = mix(u_color2, u_color3, (uv.y - 0.55) / 0.45);
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  side: THREE.DoubleSide,
  depthTest: false,
  depthWrite: false,
});

const fullscreenQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  gradientMaterial
);
fullscreenQuad.material.depthTest = false;
fullscreenQuad.material.depthWrite = false;
fullscreenQuad.frustumCulled = false;

const backgroundScene = new THREE.Scene();
const backgroundCamera = new THREE.Camera();
backgroundScene.add(fullscreenQuad);

// Scroll
let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / sizes.height);

  if (newSection !== currentSection) {
    currentSection = newSection;

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    });
  }
});

// Cursor
const cursor = { x: 0, y: 0 };

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

// Audio
const audio = document.getElementById("backgroundMusic");
const toggleButton = document.getElementById("toggleButton");

toggleButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    toggleButton.style.opacity = 1;
  } else {
    audio.pause();
    toggleButton.style.opacity = 0.5;
  }
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Animate meshes
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // Animate particles
  particles.rotation.y += deltaTime * 0.02;

  // Render background and scene
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(backgroundScene, backgroundCamera);
  renderer.clearDepth();
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
