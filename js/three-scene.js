import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

const containers = document.querySelectorAll("[data-qmodel]");

if (containers.length) {
  const loader = new GLTFLoader();
  const modelCache = new Map();
  const defaultEdgeAngleByType = {
    hero: 25,
    logo: 10,
  };
  const defaultEdgeModeByType = {
    hero: "edges",
    logo: "edges",
  };

  const getModel = (url) => {
    if (!modelCache.has(url)) {
      modelCache.set(
        url,
        new Promise((resolve, reject) => {
          loader.load(
            url,
            (gltf) => {
              if (!gltf.scene) {
                reject(new Error("No scene found in the GLTF."));
                return;
              }
              resolve(gltf.scene);
            },
            undefined,
            (error) => reject(error)
          );
        })
      );
    }
    return modelCache.get(url);
  };

  const scenes = [];

  const initScene = async (container) => {
    const modelType = container.dataset.qmodel || "hero";
    const modelUrl = container.dataset.model || "assets/model/QU_Model.gltf";
    const edgeAngleValue = Number.parseFloat(container.dataset.edgeAngle);
    const edgeAngle = Number.isFinite(edgeAngleValue)
      ? edgeAngleValue
      : defaultEdgeAngleByType[modelType] || 25;
    const edgeMode = (
      container.dataset.edgeMode ||
      defaultEdgeModeByType[modelType] ||
      "edges"
    ).toLowerCase();
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
      const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.1;
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.position.set(0, 0, distance);
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
    };

    const baseModel = await getModel(modelUrl);
    const model = baseModel.clone(true);
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
      const geometry =
        edgeMode === "wireframe"
          ? new THREE.WireframeGeometry(child.geometry)
          : new THREE.EdgesGeometry(child.geometry, edgeAngle);
      const lines = new THREE.LineSegments(geometry, lineMaterial);
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
    modelGroup.scale.setScalar(0.9);
    fitCameraToModel();

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCameraToModel();
    };

    resize();

    scenes.push({
      renderer,
      scene,
      camera,
      modelGroup,
      resize,
    });
  };

  containers.forEach((container) => {
    initScene(container).catch((error) => {
      console.error("Failed to init Q model scene:", error);
    });
  });

  const clock = new THREE.Clock();
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    scenes.forEach((entry) => {
      entry.modelGroup.rotation.y = elapsed * 0.45;
      entry.renderer.render(entry.scene, entry.camera);
    });
    requestAnimationFrame(animate);
  };

  animate();
  window.addEventListener("resize", () => {
    scenes.forEach((entry) => entry.resize());
  });
}
