import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

const containers = document.querySelectorAll("[data-qmodel]");

if (containers.length) {
  const loader = new GLTFLoader();
  const modelCache = new Map();
  const spinSpeed = 0.45;
  const spinReturnSpeed = 2.4;
  const cameraReturnDelay = 0;
  const cameraReturnSpeed = 2.2;
  const cameraReturnEpsilon = 0.0005;
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
  let animationFrameId = null;
  const clock = new THREE.Clock();

  const initScene = async (container) => {
    const modelType = container.dataset.qmodel || "hero";
    const modelUrl = container.dataset.model || "assets/model/QU_Webring.gltf";
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
    renderer.domElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.7;
    controls.minDistance = camera.position.z;
    controls.maxDistance = camera.position.z;
    controls.target.set(0, 0, 0);
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    let isUserInteracting = false;
    let lastInteractionEnd = null;
    let isCameraResetting = false;
    const defaultCameraPosition = new THREE.Vector3();
    const defaultCameraQuaternion = new THREE.Quaternion();
    const defaultTarget = new THREE.Vector3();
    const storeDefaultCameraState = () => {
      defaultCameraPosition.copy(camera.position);
      defaultCameraQuaternion.copy(camera.quaternion);
      defaultTarget.copy(controls.target);
    };
    controls.addEventListener("start", () => {
      isUserInteracting = true;
      isCameraResetting = false;
      lastInteractionEnd = null;
    });
    controls.addEventListener("end", () => {
      isUserInteracting = false;
      lastInteractionEnd = clock.getElapsedTime();
    });
    storeDefaultCameraState();

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCameraToModel();
      controls.target.set(0, 0, 0);
      controls.update();
      if (!isUserInteracting) {
        storeDefaultCameraState();
      }
    };

    resize();

    scenes.push({
      renderer,
      scene,
      camera,
      modelGroup,
      resize,
      lineMaterial,
      controls,
      isUserInteracting: () => isUserInteracting,
      lastInteractionEnd: () => lastInteractionEnd,
      setLastInteractionEnd: (value) => {
        lastInteractionEnd = value;
      },
      isCameraResetting: () => isCameraResetting,
      setCameraResetting: (value) => {
        isCameraResetting = value;
      },
      defaultCameraPosition,
      defaultCameraQuaternion,
      defaultTarget,
      wasInteracting: false,
      spinOffset: 0,
    });
  };

  containers.forEach((container) => {
    initScene(container).catch((error) => {
      console.error("Failed to init Q model scene:", error);
    });
  });

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    const delta = Math.max(0, elapsed - (animate.lastElapsed || 0));
    animate.lastElapsed = elapsed;
    scenes.forEach((entry) => {
      const isInteracting = entry.isUserInteracting && entry.isUserInteracting();
      if (isInteracting) {
        entry.wasInteracting = true;
        if (entry.setCameraResetting) {
          entry.setCameraResetting(false);
        }
        if (entry.setLastInteractionEnd) {
          entry.setLastInteractionEnd(null);
        }
      } else {
        const targetAngle = elapsed * spinSpeed;
        if (entry.wasInteracting) {
          entry.spinOffset = entry.modelGroup.rotation.y - targetAngle;
          entry.wasInteracting = false;
        }
        if (Math.abs(entry.spinOffset) > 0.0001) {
          const decay = Math.exp(-spinReturnSpeed * delta);
          entry.spinOffset *= decay;
        } else {
          entry.spinOffset = 0;
        }
        entry.modelGroup.rotation.y = targetAngle + entry.spinOffset;

        if (
          entry.lastInteractionEnd &&
          entry.lastInteractionEnd() !== null &&
          elapsed - entry.lastInteractionEnd() >= cameraReturnDelay
        ) {
          entry.setCameraResetting(true);
        }

        if (entry.isCameraResetting && entry.isCameraResetting()) {
          const lerpFactor = 1 - Math.exp(-cameraReturnSpeed * delta);
          entry.camera.position.lerp(entry.defaultCameraPosition, lerpFactor);
          entry.camera.quaternion.slerp(
            entry.defaultCameraQuaternion,
            lerpFactor
          );
          if (entry.controls && entry.defaultTarget) {
            entry.controls.target.lerp(entry.defaultTarget, lerpFactor);
          }

          const positionClose =
            entry.camera.position.distanceTo(entry.defaultCameraPosition) <
            cameraReturnEpsilon;
          const targetClose =
            !entry.controls ||
            entry.controls.target.distanceTo(entry.defaultTarget) <
              cameraReturnEpsilon;
          const quaternionClose =
            1 -
              Math.abs(
                entry.camera.quaternion.dot(entry.defaultCameraQuaternion)
              ) <
            cameraReturnEpsilon;

          if (positionClose && targetClose && quaternionClose) {
            entry.camera.position.copy(entry.defaultCameraPosition);
            entry.camera.quaternion.copy(entry.defaultCameraQuaternion);
            if (entry.controls) {
              entry.controls.target.copy(entry.defaultTarget);
            }
            entry.setCameraResetting(false);
            entry.setLastInteractionEnd(null);
          }
        }
      }
      if (entry.controls) {
        entry.controls.update();
      }
      entry.renderer.render(entry.scene, entry.camera);
    });
    animationFrameId = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    scenes.forEach((entry) => entry.resize());
  };

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    window.removeEventListener("resize", handleResize);

    scenes.forEach((entry) => {
      entry.renderer.dispose();
      entry.renderer.forceContextLoss();

      if (entry.controls) {
        entry.controls.dispose();
      }

      if (entry.lineMaterial) {
        entry.lineMaterial.dispose();
      }

      entry.scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    });

    scenes.length = 0;

    modelCache.clear();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else if (scenes.length > 0 && !animationFrameId) {
      animate();
    }
  });

  window.addEventListener("pagehide", cleanup);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.scrollTo(0, 0);
    }
    if (event.persisted && scenes.length === 0) {
      containers.forEach((container) => {
        const oldCanvas = container.querySelector("canvas");
        if (oldCanvas) {
          oldCanvas.remove();
        }
        initScene(container).catch((error) => {
          console.error("Failed to re-init Q model scene:", error);
        });
      });
      setTimeout(() => {
        if (scenes.length > 0 && !animationFrameId) {
          animate();
        }
      }, 100);
    }
  });

  animate();
  window.addEventListener("resize", handleResize);
}
