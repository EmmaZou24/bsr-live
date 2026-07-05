import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';


let camera;    
let scene;          
let renderer;  
let wordGroup = null;
let stacks;
let otFont;
let glyphGeometries = {};
let scale;
let wordMetrics;
let wordSet = "brown student radios";

let FONTSIZE = 1000;
let selectedStack = null;

const ORTHO_SIZE = 2600;
let strokeWidth = 7/500 * FONTSIZE * (1 + (.01-FONTSIZE/50000));
const aspect = window.innerWidth / window.innerHeight;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let audioCtx;
let analyser;
let dataArray;
let mediaStreamDest = null;
let mediaRecorder = null;
let recordedChunks = [];

const PARAMS = {
  global: {
    backgroundColor: '#FFFFFF',
    word: "brown student radio",
    fillColor: '#000000',
    secondaryFillColor: '#ff0a4f',
    strokeColor: '#000000',
    showStroke: true,
    fontSize: 1000,
    strength: 1,
    leading: .85,
  },
  selectLabel: 'Press on a letter to control individual parameters',
  letters: [] ,
  audio:{
    styleIntensity: 1.5,
    depthIntensity: 300,
    minStyle:1,
  }

};

function getLines(text) {
  return text.split('\n');
}
function getAllChars(text) {
  return getLines(text).join('');
}

Promise.all([
  fetch('/fonts/MNKYMauriceTRIAL-Bold.otf').then(r => r.arrayBuffer()),
  fetch('/bsr_preset.json').then(r => r.json()).catch(() => null),
]).then(([fontBuffer, preset]) => {
  otFont = opentype.parse(fontBuffer);
  scale = FONTSIZE / otFont.unitsPerEm;
  document.getElementById('loading').style.display = 'none';

  if (preset) {
    wordSet = preset.wordSet;
    Object.assign(PARAMS.global, preset.global);
    Object.assign(PARAMS.audio, preset.audio);
    FONTSIZE = PARAMS.global.fontSize;
    scale = FONTSIZE / otFont.unitsPerEm;
    strokeWidth = 7/500 * FONTSIZE * (1 + (.01 - FONTSIZE/50000));
  }

  buildGeometries(wordSet);
  initLetters(wordSet);
  buildStacks(wordSet);
  shuffleValues();

  if (preset) {
    scene.background = new THREE.Color(PARAMS.global.backgroundColor);
  }

}).catch(err => console.error('Loading failed:', err));


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

renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);


renderer.setAnimationLoop(() => {
  if (!wordGroup || !stacks) return;

  // global styleAmount — used when audio is off
  let styleAmount = PARAMS.global.strength;

  if (analyser) {
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
    const s = (analyser
      ? p.styleAmount
      : styleAmount) * PARAMS.global.strength;

    // rotation scaled by s
    stack.group.rotation.x = p.rotX * s;
    stack.group.rotation.y = p.rotY * s;
    stack.group.rotation.z = p.rotZ * s;

    // depth — audio driven per letter or static fallback
    const depth = (analyser && p.audioDepth)
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

  mediaStreamDest = audioCtx.createMediaStreamDestination();
  analyser.connect(mediaStreamDest);

  dataArray = new Uint8Array(analyser.frequencyBinCount); // 512 values, 0-255
}

function initLetters(word){
  getAllChars(word).split('').forEach(() => {
    PARAMS.letters.push({ rotX: 0, rotY: 0, rotZ: 0, distance: 100, slices: 3, offset: 0, audioDepth: 100, styleAmount: 1.0 });
  });
}

function rebuildLetters(word) {
  PARAMS.letters = [];
  initLetters(word);
  buildStacks(word);
}

function shuffleValues(){

  stacks.forEach((stack, i) => {
    const p = PARAMS.letters[i];
    p.rotX = (Math.random() * 2 - 1) * 0.82;
    p.rotY = (Math.random() * 2 - 1) * 0.7;
    p.rotZ = (Math.random() * 2 - 1) * 0.55;

    p.offset = Math.random() * 2 - 1; 
    p.distance = Math.random() * 200 + 100;
    p.slices = Math.floor(Math.random() * 1) + 3; 

    const dist = p.distance ?? PARAMS.global.distance;
    if (stack.slices.length !== p.slices) {
      stack.slices.forEach(slice => stack.group.remove(slice));
      const newSlices = buildSlices(stack.char, p.slices);
      newSlices.forEach((slice, j) => {
        slice.traverse(obj => {
          if (obj.isMesh) obj.userData.stackIndex = i;
        });
        slice.position.z = j * dist;
        stack.group.add(slice);
      });
      stack.slices = newSlices;
    }
     
    stack.slices.forEach((slice, j) => {
      slice.position.z = (j * dist) - (Math.floor(stack.slices.length / 2* dist) + (p.offset * dist));
    });
  });
}
function buildStacks(text, autoFit = true){ //creats each letter stack and adds to word group (includes all type/kerning calculations)
  
  if (wordGroup) {
    scene.remove(wordGroup);
  }

  wordGroup = new THREE.Group();
  wordGroup.scale.y = -1;
  scene.add(wordGroup);

  const lines = getLines(text);
  const lineHeight = FONTSIZE * PARAMS.global.leading;
  stacks = [];
  let globalIdx = 0;

  lines.forEach((line, lineIdx) => {
    const lineMetrics = computeWordMetrics(line);
    const lineWidth = lineMetrics.reduce((sum, m) => sum + m.advanceWidth + m.kern, 0);
    let currentX = -lineWidth / 2;
    const lineGroup = new THREE.Group();
    lineGroup.position.y = lineIdx * lineHeight;
    wordGroup.add(lineGroup);

    line.split('').forEach((char, charIdx) => {
      const stackGroup = new THREE.Group();
      stackGroup.position.x = currentX + lineMetrics[charIdx].leftBearing + lineMetrics[charIdx].visualWidth / 2;
      lineGroup.add(stackGroup);
      currentX += lineMetrics[charIdx].advanceWidth + lineMetrics[charIdx].kern;

      const slices = buildSlices(char, PARAMS.letters[globalIdx].slices);
      slices.forEach((slice, j) => {
        slice.traverse(obj => {
          if (obj.isMesh) obj.userData.stackIndex = globalIdx;
        });
        slice.position.z = j * PARAMS.letters[globalIdx].distance;
        stackGroup.add(slice);
      });
      stacks.push({ char, group: stackGroup, slices });
      globalIdx++;
    });
  });

  if (autoFit) {
    // auto-fit: shrink if text exceeds visible area
    wordGroup.position.set(0, 0, 0);
    const sizeBox = new THREE.Box3().setFromObject(wordGroup);
    const size = sizeBox.getSize(new THREE.Vector3());
    const visibleWidth = ORTHO_SIZE * (window.innerWidth / window.innerHeight);
    const visibleHeight = ORTHO_SIZE;
    const padding = 0.9;
    const scaleX = (visibleWidth * padding) / size.x;
    const scaleY = (visibleHeight * padding) / size.y;
    const fit = Math.min(scaleX, scaleY, 1);
    wordGroup.scale.set(fit, -fit, fit);
  }

  // center after scaling
  const box = new THREE.Box3().setFromObject(wordGroup);
  const center = box.getCenter(new THREE.Vector3());
  wordGroup.position.x -= center.x;
  wordGroup.position.y -= center.y;
}

function buildSlices(char, count){
  const slices = [];
  for (let i = 0; i < count; i++) {
    const isFront = (i === count - 1);
    const fillColor = isFront ? PARAMS.global.fillColor : PARAMS.global.secondaryFillColor;
    const sliceGroup = new THREE.Group();
    //stroke
    if (PARAMS.global.showStroke) {
      glyphGeometries[char].stroke.forEach(strokeGeo =>{
        const m = new THREE.Mesh(strokeGeo, new THREE.MeshBasicMaterial({color: PARAMS.global.strokeColor, side: THREE.DoubleSide}));
        m.renderOrder = 1;
        m.userData.type = 'stroke';
        sliceGroup.add(m);
      });
    }
    //fill  
    const fill = new THREE.Mesh(
      glyphGeometries[char].fill,
      new THREE.MeshBasicMaterial({color: fillColor, side: THREE.DoubleSide})
    )
    fill.renderOrder = 0;
    fill.userData.type = 'fill';
    fill.position.z -= 0.005;  // <-- comment out for sketchy edges.
    sliceGroup.add(fill);
    
    
    slices.push(sliceGroup);
  }
  return slices;
}


function buildGeometries(text) {
  const loader = new SVGLoader();
  const chars = [...new Set(getAllChars(text))];
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

    //stroke
    const strokePoints = [];
    parsed.paths.forEach(path => {
      path.subPaths.forEach(subPath => {
        const geo = SVGLoader.pointsToStroke(
          subPath.getPoints(),
          {
            strokeWidth: strokeWidth,
          }
        );
          if (geo) {
            strokePoints.push(geo);
          }
      });
    });

    glyphGeometries[char] = {
      fill: geometry,
      stroke: strokePoints
    };
  }
}

function renderSVG() {
  const svgPaths = [];

  
  stacks.forEach(({char, group, slices}) => { //ite rates through stacks
    const glyph = otFont.charToGlyph(char);
    const scale = FONTSIZE / otFont.unitsPerEm;
    
    slices.forEach((slice, j) => { //iterates through slices
      slice.updateWorldMatrix(true,false); //makes sure matrices are up to date

      const bbox = glyph.getBoundingBox();
      const cx = (bbox.x1 + bbox.x2) / 2 * scale;
      const xHeight = otFont.tables.os2.sxHeight * scale;
      const cy = -xHeight/2;

      const worldMatrix = slice.matrixWorld;
      
      const commands = glyph.path.commands;
      let d = '';

      commands.forEach(cmd => { //goes through the curves and points of the glyph
        if (cmd.type === 'M' || cmd.type === 'L') { // move to and line to
          const p = new THREE.Vector3(
            cmd.x * scale - cx,
            -(cmd.y * scale) - cy,
            0
          );
          p.applyMatrix4(worldMatrix);
          const s = worldToSVG(p);
          d += `${cmd.type} ${s.x.toFixed(2)} ${s.y.toFixed(2)} `;
        } else if (cmd.type === 'C') { //cubic bezier 
          const p1 = new THREE.Vector3(cmd.x1 * scale - cx, -(cmd.y1 * scale) - cy, 0).applyMatrix4(worldMatrix);;//creates new vector, scales to match world values, applies world values
          const p2 = new THREE.Vector3(cmd.x2 * scale - cx, -(cmd.y2 * scale) - cy, 0).applyMatrix4(worldMatrix);;
          const p3 = new THREE.Vector3(cmd.x * scale - cx, -(cmd.y * scale) - cy, 0).applyMatrix4(worldMatrix);;

          const s1 = worldToSVG(p1);
          const s2 = worldToSVG(p2);
          const s3 = worldToSVG(p3);

          d += `C ${s1.x.toFixed(2)} ${s1.y.toFixed(2)} ${s2.x.toFixed(2)} ${s2.y.toFixed(2)} ${s3.x.toFixed(2)} ${s3.y.toFixed(2)} `;
        } else if (cmd.type === 'Q') { //quadratic bezier 
          const p1 = new THREE.Vector3(cmd.x1 * scale - cx, -(cmd.y1 * scale) - cy, 0).applyMatrix4(worldMatrix);;
          const p = new THREE.Vector3(cmd.x * scale - cx, -(cmd.y * scale) - cy, 0).applyMatrix4(worldMatrix);;
          
          const s1 = worldToSVG(p1);
          const s = worldToSVG(p);
          
          d += `Q ${s1.x.toFixed(2)} ${s1.y.toFixed(2)} ${s.x.toFixed(2)} ${s.y.toFixed(2)} `;
        } else if (cmd.type === 'Z') { //close path
          d += 'Z ';
        }
      });

      const isFront = (j === slices.length - 1);
      const fillColor = isFront ? PARAMS.global.fillColor : PARAMS.global.secondaryFillColor;
      svgPaths.push(`<path d="${d}" fill="${fillColor}"/>`);
      if (PARAMS.global.showStroke) {
        const worldToPixel = window.innerHeight / ORTHO_SIZE;
        const svgStrokeWidth = strokeWidth * worldToPixel;
        svgPaths.push(`<path d="${d}" fill="none" stroke="${PARAMS.global.strokeColor}" stroke-width="${svgStrokeWidth}"/>`);
      }
      
    });
  });

  const svg = `<svg width="${window.innerWidth}" height="${window.innerHeight}" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" xmlns="http://www.w3.org/2000/svg">
    ${svgPaths.join('\n')}
  </svg>`;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'export.svg';
  a.click();
}

function worldToSVG(point3D) {
  const v = point3D.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * window.innerWidth,
    y: (-v.y * 0.5 + 0.5) * window.innerHeight
  };
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
      const fillColor = isFront ? PARAMS.global.fillColor : PARAMS.global.secondaryFillColor;
      sliceGroup.children.forEach(mesh => {
        if (mesh.userData.type === 'stroke') {
          mesh.material.color.set(PARAMS.global.strokeColor);
        } else {
          mesh.material.color.set(fillColor);
        }
      });
    });
  });
}


const audioElement = document.getElementById('audio');

audioElement.addEventListener('play', () => {
  if (!audioCtx) initAudio(audioElement);
  // AudioContext can get suspended, this resumes it
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

// Browsers block autoplay-with-sound until the user interacts.
// Start the live stream on the first gesture, then stop listening.
function startStream() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  audioElement.play().catch(() => {});
  window.removeEventListener('pointerdown', startStream);
  window.removeEventListener('keydown', startStream);
}
window.addEventListener('pointerdown', startStream);
window.addEventListener('keydown', startStream);

// RECORDING

let _recordMime = 'video/webm';

function startRecording() {
  const canvasStream = renderer.domElement.captureStream(30);
  let combinedStream;
  if (mediaStreamDest) {
    combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...mediaStreamDest.stream.getAudioTracks()
    ]);
  } else {
    combinedStream = canvasStream;
  }
  recordedChunks = [];
  _recordMime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: _recordMime });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start();
}

function stopRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') { resolve(); return; }
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: _recordMime });
      if (_recordMime === 'video/mp4') {
        downloadBlob(blob, 'recording.mp4');
        resolve();
      } else {
        await convertAndDownload(blob);
        resolve();
      }
    };
    mediaRecorder.stop();
  });
}

async function convertAndDownload(webmBlob) {
  const { FFmpeg } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm');
  const { fetchFile } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm');
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  });
  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
  await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
  downloadBlob(mp4Blob, 'recording.mp4');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

//PRESET STUFF

function savePreset() {
  const preset = {
    wordSet,
    global: { ...PARAMS.global },
    audio: { ...PARAMS.audio },
  };
  const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${wordSet}_preset.json`;
  a.click();
}

function loadPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preset = JSON.parse(ev.target.result);

      applyPreset(preset);
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}

function applyPreset(preset) {
  wordSet = preset.wordSet;
  Object.assign(PARAMS.global, preset.global);
  Object.assign(PARAMS.audio, preset.audio);

  FONTSIZE = PARAMS.global.fontSize;
  scale = FONTSIZE / otFont.unitsPerEm;
  buildGeometries(wordSet);
  rebuildLetters(wordSet);
  shuffleValues();

  scene.background = new THREE.Color(PARAMS.global.backgroundColor);
}

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left   = ORTHO_SIZE * aspect / -2;
  camera.right  = ORTHO_SIZE * aspect / 2;
  camera.top    = ORTHO_SIZE / 2;
  camera.bottom = ORTHO_SIZE / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});