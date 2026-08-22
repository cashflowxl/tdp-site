import * as THREE from './vendor/three.module.min.js';

const earthStages = document.querySelectorAll('[data-lingdi-earth]');

const canUseWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }))
    );
  } catch {
    return false;
  }
};

const initEarth = async (stage) => {
  if (!canUseWebGL()) {
    stage.dataset.earthFallback = 'webgl-unavailable';
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = window.matchMedia('(max-width: 720px)');
  const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
  const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const compact = compactViewport.matches || lowMemory || lowCpu || saveData;
  const textureSize = compact ? '1k' : '2k';
  const textureRoot = '/assets/earth';
  const texturePaths = {
    day: `${textureRoot}/earth-day-${textureSize}.jpg`,
    night: `${textureRoot}/earth-night-${textureSize}.jpg`,
    clouds: `${textureRoot}/earth-clouds-${textureSize}.jpg`,
    normal: `${textureRoot}/earth-normal-${textureSize}.jpg`,
    specular: `${textureRoot}/earth-specular-${textureSize}.jpg`,
  };

  let renderer;
  let frameId = 0;
  let inView = true;
  let destroyed = false;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !compact,
      depth: true,
      powerPreference: compact ? 'low-power' : 'high-performance',
      premultipliedAlpha: true,
      stencil: false,
    });
  } catch {
    stage.dataset.earthFallback = 'renderer-failed';
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.3 : 1.75));
  renderer.domElement.className = 'earth-canvas';
  renderer.domElement.setAttribute('role', 'presentation');
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
  const cameraOrigin = new THREE.Vector3(0, 0.02, 4.25);
  camera.position.copy(cameraOrigin);
  camera.lookAt(0, -0.02, 0);

  const loader = new THREE.TextureLoader();
  let textures;
  try {
    textures = await Promise.all(
      Object.values(texturePaths).map((path) => loader.loadAsync(path))
    );
  } catch (error) {
    console.warn('Lingdi Earth textures could not be loaded; using the static fallback.', error);
    renderer.dispose();
    renderer.domElement.remove();
    stage.dataset.earthFallback = 'texture-load-failed';
    return;
  }

  if (destroyed) return;

  const [dayMap, nightMap, cloudMap, normalMap, specularMap] = textures;
  [dayMap, nightMap, cloudMap].forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  });
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  textures.forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(maxAnisotropy, compact ? 2 : 6);
  });

  const geometry = new THREE.SphereGeometry(1, compact ? 64 : 96, compact ? 48 : 72);
  const earthGroup = new THREE.Group();
  earthGroup.rotation.order = 'YXZ';
  earthGroup.rotation.x = 0.03;
  earthGroup.rotation.y = -1.72;
  earthGroup.rotation.z = -0.23;
  scene.add(earthGroup);

  const surfaceMaterial = new THREE.MeshPhongMaterial({
    map: dayMap,
    normalMap,
    normalScale: new THREE.Vector2(0.62, 0.62),
    specularMap,
    specular: new THREE.Color(0x6f9eaa),
    shininess: 10,
  });
  const earthSurface = new THREE.Mesh(geometry, surfaceMaterial);
  earthSurface.rotation.y = 0.08;
  earthGroup.add(earthSurface);

  const sunDirection = new THREE.Vector3(-4.2, 1.5, 1.9).normalize();
  const nightMaterial = new THREE.ShaderMaterial({
    uniforms: {
      nightMap: { value: nightMap },
      lightDirection: { value: sunDirection },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D nightMap;
      uniform vec3 lightDirection;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        float lightLevel = dot(normalize(vWorldNormal), normalize(lightDirection));
        float nightMask = smoothstep(0.16, -0.34, lightLevel);
        vec3 cityLight = texture2D(nightMap, vUv).rgb;
        float luminance = dot(cityLight, vec3(0.2126, 0.7152, 0.0722));
        float sparkle = smoothstep(0.035, 0.82, luminance);
        vec3 color = cityLight * mix(0.82, 1.58, sparkle);
        gl_FragColor = vec4(color, nightMask * clamp(luminance * 1.72, 0.0, 0.92));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nightLights = new THREE.Mesh(geometry, nightMaterial);
  nightLights.scale.setScalar(1.002);
  nightLights.rotation.copy(earthSurface.rotation);
  earthGroup.add(nightLights);

  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudMap,
    alphaMap: cloudMap,
    color: new THREE.Color(0xf3fbfa),
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const clouds = new THREE.Mesh(geometry, cloudMaterial);
  clouds.scale.setScalar(1.012);
  clouds.rotation.y = 0.13;
  earthGroup.add(clouds);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x5ed5cd) },
      signalColor: { value: new THREE.Color(0xc8ff3d) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform vec3 signalColor;
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 3.0);
        vec3 color = mix(glowColor, signalColor, rim * 0.2);
        gl_FragColor = vec4(color, rim * 0.46);
      }
    `,
    side: THREE.FrontSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.048);
  earthGroup.add(atmosphere);

  scene.add(new THREE.AmbientLight(0x173a31, 0.62));
  const sunLight = new THREE.DirectionalLight(0xe6fff7, 1.92);
  sunLight.position.copy(sunDirection).multiplyScalar(6);
  scene.add(sunLight);
  const edgeLight = new THREE.DirectionalLight(0x4bbfb8, 0.34);
  edgeLight.position.set(3.6, -0.8, -2.4);
  scene.add(edgeLight);

  const starCount = compact ? 70 : 120;
  const starPositions = new Float32Array(starCount * 3);
  let seed = 20260820;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (random() - 0.5) * 8;
    starPositions[index * 3 + 1] = (random() - 0.5) * 4.4;
    starPositions[index * 3 + 2] = -1.2 - random() * 2.2;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xd8f3eb,
      size: compact ? 0.012 : 0.015,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    })
  );
  scene.add(stars);

  const resize = () => {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (reducedMotion.matches || !inView) renderer.render(scene, camera);
  };

  let lastFrameTime = performance.now();
  let elapsed = 0;
  const renderFrame = (now) => {
    if (destroyed || !inView || document.hidden || reducedMotion.matches) {
      frameId = 0;
      stage.dataset.earthMotion = reducedMotion.matches ? 'static' : 'paused';
      return;
    }
    const delta = Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.05);
    lastFrameTime = now;
    elapsed += delta;
    earthGroup.rotation.y += delta * 0.0208;
    clouds.rotation.y += delta * 0.0104;
    stars.rotation.z = Math.sin(elapsed * 0.035) * 0.012;
    camera.position.x = cameraOrigin.x + Math.sin(elapsed * 0.105) * 0.026;
    camera.position.y = cameraOrigin.y + Math.cos(elapsed * 0.083) * 0.017;
    camera.lookAt(0, -0.02, 0);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(renderFrame);
  };

  const start = () => {
    if (destroyed || frameId || document.hidden || !inView || reducedMotion.matches) return;
    lastFrameTime = performance.now();
    stage.dataset.earthMotion = 'running';
    frameId = requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    stage.dataset.earthMotion = 'paused';
  };

  const renderStill = () => {
    stop();
    stage.dataset.earthMotion = 'static';
    camera.position.copy(cameraOrigin);
    camera.lookAt(0, -0.02, 0);
    renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry && entry.isIntersecting);
      if (inView) {
        if (reducedMotion.matches) renderStill();
        else start();
      } else {
        stop();
      }
    },
    { rootMargin: '120px 0px', threshold: 0.02 }
  );
  intersectionObserver.observe(stage);

  const handleVisibility = () => {
    if (document.hidden) stop();
    else if (reducedMotion.matches) renderStill();
    else start();
  };
  document.addEventListener('visibilitychange', handleVisibility);

  const handleMotionPreference = () => {
    if (reducedMotion.matches) renderStill();
    else start();
  };
  reducedMotion.addEventListener('change', handleMotionPreference);

  renderer.domElement.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      destroyed = true;
      stop();
      stage.removeAttribute('data-earth-ready');
      stage.dataset.earthFallback = 'context-lost';
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    },
    { once: true }
  );

  resize();
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  stage.dataset.earthProfile = textureSize;
  stage.setAttribute('data-earth-ready', '');
  if (!reducedMotion.matches) start();
};

earthStages.forEach((stage) => {
  requestAnimationFrame(() => {
    initEarth(stage).catch((error) => {
      stage.dataset.earthFallback = 'initialization-failed';
      console.warn('Lingdi Earth initialization failed; using the static fallback.', error);
    });
  });
});
