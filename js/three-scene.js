import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

const container = document.getElementById("three-container");

if (container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1b1b1b, 1.2);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(5, 10, 6);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
  fillLight.position.set(-4, 3, 6);
  scene.add(hemiLight, keyLight, fillLight);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let modelMaxDim = null;

  const fitCameraToModel = () => {
    if (!modelMaxDim) {
      return;
    }
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitHeightDistance = modelMaxDim / (2 * Math.tan(fov * 0.5));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.3;
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  };

  const loader = new GLTFLoader();
  loader.load(
    "assets/QU_Model.gltf",
    (gltf) => {
      const model = gltf.scene;
      if (!model) {
        console.error("No scene found in the GLTF.");
        return;
      }
      modelGroup.clear();
      modelGroup.add(model);

      const wireframeGroup = new THREE.Group();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xdadada,
        transparent: true,
        opacity: 0.85,
      });

      model.traverse((child) => {
        if (!child.isMesh || !child.geometry) {
          return;
        }
        const edges = new THREE.EdgesGeometry(child.geometry, 25);
        const lines = new THREE.LineSegments(edges, lineMaterial);
        lines.position.copy(child.position);
        lines.rotation.copy(child.rotation);
        lines.scale.copy(child.scale);
        wireframeGroup.add(lines);
        child.visible = false;
      });

      modelGroup.add(wireframeGroup);

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      model.position.sub(center);
      modelMaxDim = Math.max(size.x, size.y, size.z) || 1;
      fitCameraToModel();
    },
    undefined,
    (error) => {
      console.error("Failed to load GLTF model:", error);
    }
  );

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCameraToModel();
  };

  const clock = new THREE.Clock();
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    modelGroup.rotation.y = elapsed * 0.45;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  resize();
  animate();
  window.addEventListener("resize", resize);
}
