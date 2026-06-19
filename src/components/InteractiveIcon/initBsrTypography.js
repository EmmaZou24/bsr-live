import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import opentype from 'opentype.js';
import fontUrl from '../../assets/interactive-icon/MNKYMauriceTRIAL-Bold.otf?url';
import defaultPreset from '../../assets/interactive-icon/bsr_preset.json';

export function initBsrTypography({ container, audioElement, onReady }) {
let camera;    
let scene;          
let renderer;  
let wordGroup = null;
let stacks;
let otFont;
let glyphGeometries = {};
let scale;
let wordMetrics;
let wordSet = "bsr";

let FONTSIZE = 1000;

const ORTHO_SIZE = 2600;
let strokeWidth = 7/500 * FONTSIZE * (1 + (.01-FONTSIZE/50000));

function getContainerSize() {
  return {
    width: container.clientWidth,
    height: container.clientHeight,
  };
}

let { width: containerWidth, height: containerHeight } = getContainerSize();
let aspect = containerWidth / containerHeight || window.innerWidth / window.innerHeight;

let audioCtx;
let analyser;
let dataArray;

const PARAMS = {
  global: {
    backgroundColor: '#FFFFFF',
    word: "bsr",
    coreColor: '#000000',
    secondaryColor: '#CCCCCC',
    fontSize: 1000,
    strength: 1,
  },
  letters: [],
  audio:{
    audioReactive: false,
    styleIntensity: 1.5,
    depthIntensity: 300,
    minStyle:1
  }

};

let disposed = false;

async function bootstrap() {
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`);
    otFont = opentype.parse(await response.arrayBuffer());
  } catch (err) {
    console.error('Failed to load font:', err);
    onReady?.();
    return;
  }

  if (disposed) return;

  scale = FONTSIZE / otFont.unitsPerEm;
  onReady?.();

  void (async () => {
    try {
      const face = new FontFace('MNKYMaurice', `url(${fontUrl})`, { weight: '700' });
      await face.load();
      if (!disposed) document.fonts.add(face);
    } catch (err) {
      console.warn('CSS font registration failed; kerning may be approximate:', err);
    }
  })();

  if (disposed) return;

  try {
    initLetterParams(wordSet);
    wordMetrics = computeWordMetrics(wordSet);
    buildGeometries(wordSet);
    rebuildLetters(wordSet);
    buildStacks(wordSet);
    applyPreset(defaultPreset);
  } catch (err) {
    console.error('Failed to initialize typography:', err);
  }
}

bootstrap();


camera = new THREE.OrthographicCamera(
    ORTHO_SIZE * aspect / -2,  // left
    ORTHO_SIZE * aspect / 2,   // right
    ORTHO_SIZE / 2,            // top
    ORTHO_SIZE / -2,           // bottom
    1, 10000  
  );
camera.position.set(0, 0, 4000);

scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(containerWidth, containerHeight, false);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.display = 'block';
renderer.shadowMap.enabled = true;

container.appendChild(renderer.domElement);


renderer.setAnimationLoop(() => {
  if (wordGroup && stacks) {
  // global styleAmount — used when audio is off
  let styleAmount = PARAMS.global.strength;

  if (PARAMS.audio.audioReactive && analyser) {
    analyser.getByteFrequencyData(dataArray);

    const level = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    styleAmount = level * PARAMS.audio.styleIntensity * 1.5;

    // per-letter styleAmount driven by each letter's frequency band
    stacks.forEach((stack, i) => {
      const freqIndex = Math.floor((i / stacks.length) * (dataArray.length / 4));
      const freqEnergy = dataArray[freqIndex] / 255;
      const letterTriggered = Math.max(0, freqEnergy - (1-PARAMS.audio.minStyle + .001)) / (1 - (1-PARAMS.audio.minStyle + .001));
      PARAMS.letters[i].audioDepth = 15 + letterTriggered * PARAMS.audio.depthIntensity;
      PARAMS.letters[i].styleAmount = letterTriggered * PARAMS.audio.styleIntensity *1.5 ;
    });
  }

  stacks.forEach((stack, i) => {
    const p = PARAMS.letters[i];
    if (!p) return;

    // s = the final per-letter style scale
    // uses per-letter audio value if audio is on, global styleAmount otherwise
    // multiplied by strength as a master scale on top
    const s = ((PARAMS.audio.audioReactive && analyser)
      ? p.styleAmount
      : styleAmount) * PARAMS.global.strength;

    // rotation scaled by s
    stack.group.rotation.x = p.rotX * s;
    stack.group.rotation.y = p.rotY * s;
    stack.group.rotation.z = p.rotZ * s;

    // depth — audio driven per letter or static fallback
    const depth = (PARAMS.audio.audioReactive && analyser && p.audioDepth)
      ? p.audioDepth
      : p.distance;

    // when s > 1, add extra slices
    const sliceAdd = s > 1
      ? Math.floor(THREE.MathUtils.lerp(1, 3, s - 1))
      : 0;

    const targetSlices = p.slices + sliceAdd;

    if (stack.slices.length !== targetSlices) {
      stack.slices.forEach(slice => stack.group.remove(slice));
      const newSlices = buildSlices(stack.char, targetSlices);
      newSlices.forEach((slice) => {
        slice.traverse(obj => { if (obj.isMesh) obj.userData.stackIndex = i; });
        stack.group.add(slice);
      });
      stack.slices = newSlices;
    }

    // when s > 1, spread slices further apart
    const depthMultiplier = s > 1
      ? THREE.MathUtils.lerp(1, 1.2, s - 1)
      : 1;

    stack.slices.forEach((slice, j) => {
      const centered = (j * depth * depthMultiplier) 
        - Math.floor(stack.slices.length / 2) * depth * depthMultiplier + (p.offset * depth);;
      slice.position.z = centered * s;
    });
  });
  }

  renderer.render(scene, camera);
});

function initAudio(){
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;        // 512 usable bins
  analyser.smoothingTimeConstant = 0.8; // 0 = snappy, 1 = sluggish

  const source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination); // still hear the audio

  dataArray = new Uint8Array(analyser.frequencyBinCount); // 512 values, 0-255
}

function initLetterParams(word) {
  PARAMS.letters = word.split('').map(() => ({
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    distance: 100,
    slices: 4,
    offset: 0,
    audioDepth: 100,
    styleAmount: 1.0,
  }));
}

function rebuildLetters(word) {
  initLetterParams(word);
  buildStacks(word);
}
function buildStacks(word){ //creats each letter stack and adds to word group (includes all type/kerning calculations)
  
  if (wordGroup) {
    scene.remove(wordGroup);
  }

  wordGroup = new THREE.Group();
  wordGroup.scale.y = -1;
  scene.add(wordGroup);
  let currentX = 0;
  
 
  stacks = word.split('').map((char, i) => {

    const stackGroup = new THREE.Group();
    
    stackGroup.position.x = currentX + wordMetrics[i].leftBearing + wordMetrics[i].visualWidth / 2;
    wordGroup.add(stackGroup);
   
    currentX += wordMetrics[i].advanceWidth + wordMetrics[i].kern;
  
    const slices = buildSlices(char, PARAMS.letters[i].slices);
    slices.forEach((slice, j) => {
      slice.traverse(obj => {
        if (obj.isMesh) obj.userData.stackIndex = i; 
      });
      slice.position.z = j * PARAMS.letters[i].distance;
      stackGroup.add(slice);
    });
    return {char, group: stackGroup, slices};
  });
  const box = new THREE.Box3().setFromObject(wordGroup);
  const center = box.getCenter(new THREE.Vector3());
  wordGroup.position.x -= center.x;
  wordGroup.position.y -= center.y;
  

  
}

function buildSlices(char, count){
  const slices = [];
  for (let i = 0; i < count; i++) {
    const isFront = (i === count - 1);
    const color = isFront ? PARAMS.global.coreColor : PARAMS.global.secondaryColor;
    const sliceGroup = new THREE.Group();
    const fill = new THREE.Mesh(
      glyphGeometries[char].fill,
      new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide})
    );
    sliceGroup.add(fill);
    slices.push(sliceGroup);
  }
  return slices;
}


function buildGeometries(chars) {
  const loader = new SVGLoader();
  let i = 0;
  for (const char of chars) {
    //need to revisit when using visualwidth and advancewidth
    const glyph = otFont.charToGlyph(char);
    const bbox = glyph.getBoundingBox();
    const cx = (bbox.x1 + bbox.x2) / 2 * scale;
    const xHeight = otFont.tables.os2.sxHeight * scale;
    const cy = -xHeight/2;
 
    const path = glyph.getPath(-cx, -cy, FONTSIZE);
    const parsed = loader.parse(`<svg><path d="${path.toPathData()}"/></svg>`);
    
    //fill
    const shapes = parsed.paths.flatMap(p => SVGLoader.createShapes(p));
    const geometry = new THREE.ShapeGeometry(shapes);

    glyphGeometries[char] = { fill: geometry };
    i++;
  }
}

function computeWordMetrics(word) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${FONTSIZE}px MNKYMaurice`;
 
  return word.split('').map((char, i) => {
    const nextChar = word[i + 1] ?? null;
    const glyph = otFont.charToGlyph(char);
    const bbox = glyph.getBoundingBox();
    const kern = nextChar
      ? ctx.measureText(char + nextChar).width - ctx.measureText(char).width - ctx.measureText(nextChar).width
      : 0;
 
    return {
      char,
      advanceWidth: glyph.advanceWidth * scale,
      leftBearing: bbox.x1 * scale,
      rightBearing: (glyph.advanceWidth - bbox.x2) * scale,
      visualWidth: (bbox.x2 - bbox.x1) * scale,
      adjustedRightBearing: (glyph.advanceWidth - bbox.x2) * scale + kern,
      kern  // kern to NEXT char
    };
  });
}

function updateColors() {
  if (!stacks) return;
  stacks.forEach(({ slices }) => {
    slices.forEach((sliceGroup, j) => {
      const isFront = (j === slices.length - 1);
      const color = isFront ? PARAMS.global.coreColor : PARAMS.global.secondaryColor;
      sliceGroup.children.forEach(mesh => {
        mesh.material.color.set(color);
      });
    });
  });
}


const onAudioPlay = () => {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
};
audioElement.addEventListener('play', onAudioPlay, { once: true });

function applyPreset(preset) {
  wordSet = preset.wordSet;
  Object.assign(PARAMS.global, preset.global);
  if (preset.global.strokeColor) PARAMS.global.coreColor = preset.global.strokeColor;
  if (preset.global.fillColor) PARAMS.global.secondaryColor = preset.global.fillColor;
  Object.assign(PARAMS.audio, preset.audio);

  FONTSIZE = PARAMS.global.fontSize;
  scale = FONTSIZE / otFont.unitsPerEm;
  wordMetrics = computeWordMetrics(wordSet);
  buildGeometries(wordSet);
  rebuildLetters(wordSet);

  preset.letters.forEach((l, i) => {
    if (PARAMS.letters[i]) Object.assign(PARAMS.letters[i], l);
  });

  scene.background = new THREE.Color(PARAMS.global.backgroundColor);
  updateColors();
}

let resizeRaf = 0;

function onResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    const size = getContainerSize();
    if (!size.width || !size.height) return;
    containerWidth = size.width;
    containerHeight = size.height;
    aspect = containerWidth / containerHeight;
    camera.left   = ORTHO_SIZE * aspect / -2;
    camera.right  = ORTHO_SIZE * aspect / 2;
    camera.top    = ORTHO_SIZE / 2;
    camera.bottom = ORTHO_SIZE / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight, false);
  });
}

const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(container);
onResize();

return () => {
  disposed = true;
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeObserver.disconnect();
  audioElement.removeEventListener('play', onAudioPlay);
  renderer.setAnimationLoop(null);
  if (renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
  renderer.dispose();
  if (audioCtx) audioCtx.close();
};
}