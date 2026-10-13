// Import Three.js, OrbitControls, and GLTFLoader
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Check if user is opening via file:// protocol
if (window.location.protocol === "file:") {
  console.warn(
    "AtlasLife Notice: 3D models (GLTF) cannot be loaded over file:// due to browser CORS restrictions. Please run a local web server (e.g. `python3 -m http.server 8000` or VS Code Live Server)."
  );
}

const container = document.getElementById("container3D");
if (!container) {
  console.error("dna.js: Container #container3D not found in document.");
}

// 1. Scene, Camera, and Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 36);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// 2. Interactive OrbitControls (Rotation only - No Zoom, No Pan)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Zoom disabled as requested
controls.enablePan = false;  // Keep the model anchored in position

// 3. Multi-directional Lighting for the 3D model
const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(15, 25, 20);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x6f9bd1, 1.2);
fillLight.position.set(-20, -10, 10);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xd87ae8, 1.0);
rimLight.position.set(0, -20, -15);
scene.add(rimLight);

// 4. Model Group and GLTF Loading
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let object;
let mixer;

const loader = new GLTFLoader();
loader.load(
  "./models/dna/scene.gltf",
  function (gltf) {
    object = gltf.scene;

    // Center the model geometry inside modelGroup so it rotates around its true center (0, 0, 0)
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());

    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;

    modelGroup.add(object);

    // Play built-in rotation animation ("Take 001") if available
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(object);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    updateLayout();
    console.log("DNA model loaded and centered successfully!");
  },
  function (xhr) {
    if (xhr.total > 0) {
      console.log(((xhr.loaded / xhr.total) * 100).toFixed(1) + "% loaded");
    }
  },
  function (error) {
    console.error("Error loading DNA model:", error);
  }
);

// 5. Responsive layout positioning (Offset to the left of the screen)
function updateLayout() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  camera.aspect = width / height;

  const isMobile = width < 760;
  if (!isMobile) {
    // Offsets the camera view so the model is placed on the left side (~24vw, matching AtlasLife layout)
    const xOffset = width * 0.26;
    camera.setViewOffset(width, height, xOffset, 0, width, height);
  } else {
    camera.clearViewOffset();
  }

  camera.updateProjectionMatrix();

  const scale = isMobile ? 0.7 : 1.0;
  modelGroup.scale.setScalar(scale);

  // Update guide line position properties if present
  const hxPx = (isMobile ? 0.5 : 0.24) * width;
  const stopEl = document.querySelector(".stop-link");
  const textLeft = stopEl ? stopEl.getBoundingClientRect().left : width * 0.42;
  const gl = hxPx + 60;
  const gw = Math.max(0, textLeft - 20 - gl);
  document.documentElement.style.setProperty("--hx", `${hxPx}px`);
  document.documentElement.style.setProperty("--gl", `${gl}px`);
  document.documentElement.style.setProperty("--gw", `${gw}px`);
}

window.addEventListener("resize", updateLayout);

// 6. Scroll interaction
let scrollProgress = 0;
let targetScrollProgress = 0;

window.addEventListener("scroll", function () {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  targetScrollProgress = window.pageYOffset / maxScroll;
});

// 7. Render and Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Play GLTF internal animation loop
  if (mixer) mixer.update(delta);

  // Smooth scroll-driven helix rotation
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.1;
  modelGroup.rotation.y = scrollProgress * Math.PI * 4;

  // OrbitControls damping and update
  controls.update();

  renderer.render(scene, camera);
}

animate();