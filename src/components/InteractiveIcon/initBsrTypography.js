import * as THREE from 'three';
import { Pane } from 'tweakpane';
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
let folders = [];
let selectedStack = null;
let selectLabel;

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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
  selectLabel: 'Press on a letter to control individual parameters',
  letters: [] ,
  audio:{
    audioReactive: false,
    styleIntensity: 1.5,
    depthIntensity: 300,
    minStyle:1
  }

};

const pane = new Pane();
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
    buildUI(wordSet);
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

renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(containerWidth, containerHeight);
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

function buildUI(word){ 
 const descFolder = pane.addFolder({ title: 'description' });
  const descEl = document.createElement('div');
  const cssStuff = `
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    color: var(--lbl-fg);
    flex: 1;
    -webkit-hyphens: auto;
    hyphens: auto;
    
    padding-left: 4px;
    padding-right: 16px;
    padding-bottom: 4px;
  `;
  
  descEl.style.cssText = cssStuff;
  descEl.textContent = 'In progress custom tool created for the new Brown Student Radio visual identity.';
  descEl.style.marginBottom = '4px';
  const descEl2 = document.createElement('div');
  descEl2.style.cssText = cssStuff;
  
  descEl2.textContent = 'Music sourced from the Brown Student Radio live audio stream.';

  const content = descFolder.element.querySelector('.tp-fldv_c');
  content.appendChild(descEl);
  content.appendChild(descEl2);
  const globalFolder = pane.addFolder({ title: 'global' });
  
  
  

  globalFolder.addBinding(PARAMS.global, 'word', {label: 'Word'});

  globalFolder.addButton({ title: 'Update' }).on('click', () => {
  wordSet = PARAMS.global.word;
  scale = FONTSIZE / otFont.unitsPerEm;
  wordMetrics = computeWordMetrics(wordSet);
  buildGeometries(wordSet);
  rebuildLetters(wordSet); 
   
});
  
  globalFolder.addBinding(PARAMS.global, 'fontSize', { min: 100, max: 2000, label: 'Font Size' })
  .on('change', () => {
    FONTSIZE = PARAMS.global.fontSize;
    scale = FONTSIZE / otFont.unitsPerEm;
    strokeWidth = 7/500 * FONTSIZE * (1 + (.01 - FONTSIZE/50000));
    wordMetrics = computeWordMetrics(wordSet);
    buildGeometries(wordSet);  
    buildStacks(wordSet);       
  });
   globalFolder.addBinding(PARAMS.global, 'backgroundColor', { label: 'Background Color' })
  .on('change', () => {
    scene.background = new THREE.Color(PARAMS.global.backgroundColor);
  });

  globalFolder.addBinding(PARAMS.global, 'coreColor', { label: 'Core Color' })
  .on('change', () => { updateColors(); });

  globalFolder.addBinding(PARAMS.global, 'secondaryColor', { label: 'Secondary Color' })
  .on('change', () => { updateColors(); });

  globalFolder.addBinding(PARAMS.global, 'strength', { min: 0, max: 1.5, label: 'Strength' });

  globalFolder.addButton({ title: 'Shuffle' }).on('click', () => {
    shuffleValues();
  });
 
  folders.push(globalFolder);
  
  selectLabel = pane.addFolder({title: 'Select a letter to edit', expanded: false});
  word.split('').forEach((char, i) => {
    const letterParams = { rotX: 0, rotY: 0, rotZ: 0, distance: 100, slices: 4, offset: 0 , audioDepth: 100, styleAmount: 1.0};
    PARAMS.letters.push(letterParams);

    const folder = pane.addFolder({ title: `Selected Letter: ${char}` });
    folder.addBinding(letterParams, 'rotX', { min: -Math.PI, max: Math.PI });
    folder.addBinding(letterParams, 'rotY', { min: -Math.PI, max: Math.PI });
    folder.addBinding(letterParams, 'rotZ', { min: -Math.PI, max: Math.PI });
    folder.addBinding(letterParams, 'distance', { min: 0, max: 500 });
    folder.addBinding(letterParams, 'slices', { min: 1, max: 10, step: 1 });
    folder.addBinding(letterParams, 'offset', {min: -3, max: 3, step:1});
    folder.hidden = true;
    folders.push(folder);
    
  })

  const audioFolder = pane.addFolder({ title: 'audio' });
  const playBtn = audioFolder.addButton({ title: 'Play Stream' });
  playBtn.on('click', () => {
    PARAMS.audio.audioReactive = !PARAMS.audio.audioReactive;
    if (PARAMS.audio.audioReactive) {
      audioElement.play();
      playBtn.title = 'Pause Stream';
    } else {
      audioElement.pause();
      playBtn.title = 'Play Stream';
    }
  playBtn.refresh();
});
  audioFolder.addBinding(PARAMS.audio, 'styleIntensity', { label: 'Style Intensity', min: 0, max: 2});
  audioFolder.addBinding(PARAMS.audio, 'depthIntensity', { label: 'Depth', min: 0, max: 500});
  audioFolder.addBinding(PARAMS.audio, 'minStyle', { label: 'Min Style', min: 0, max: 1});

  const exportFolder = pane.addFolder({ title: 'Export' });
  const dnldSVG = exportFolder.addButton({ title: 'Download SVG' });
  dnldSVG.on('click', () => {
    renderSVG();
  });

  const presetFolder = pane.addFolder({ title: 'Presets', expanded: false });
  presetFolder.addButton({ title: 'Download Settings' }).on('click', () => savePreset());
  presetFolder.addButton({ title: 'Upload Settings' }).on('click', () => loadPreset());

  

}

function rebuildLetters(word) { //clean up 
  pane.children.forEach(child => child.dispose());
  PARAMS.letters = [];
  folders = [];
  buildUI(word);        //populates PARAMS.letters
  buildStacks(word);
}

function updateUI(current) {
  folders.forEach((folder, i) => {
    if (i === 0) return;              
      if ((i - 1) === current) {
        folder.hidden = false; 
      } else {
        folder.hidden = true;  
      }
  });

  if (current === -1) {
    selectLabel.hidden = false;
  } else {
    selectLabel.hidden = true;

  }
}

function shuffleValues(){

  stacks.forEach((stack, i) => {
    const p = PARAMS.letters[i];
    p.rotX = (Math.random() * 2 - 1) * 0.82;
    p.rotY = (Math.random() * 2 - 1) * 0.7;
    p.rotZ = (Math.random() * 2 - 1) * 0.55;

    p.offset = Math.random() * 2 - 1; 
    p.distance = Math.random() * 200 + 100;
    p.slices = Math.floor(Math.random() * 1) + 4; 

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
      const fillColor = isFront ? PARAMS.global.coreColor : PARAMS.global.secondaryColor;
      svgPaths.push(`<path d="${d}" fill="${fillColor}"/>`);
      
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
      const color = isFront ? PARAMS.global.coreColor : PARAMS.global.secondaryColor;
      sliceGroup.children.forEach(mesh => {
        mesh.material.color.set(color);
      });
    });
  });
}


function onClick(e) {
  if (pane.element.contains(e.target)) return;
  const rect = container.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  const meshes = [];
  stacks.forEach((stack, i) => {
    stack.group.traverse((obj) => {
      if (obj.isMesh) {
       
        meshes.push(obj);
        obj.userData.stackIndex = i;
      }
    });
  });

  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0){
    updateUI(-1);
  }else{
     const i = hits[0].object.userData.stackIndex;
     updateUI(i);
  }
}

window.addEventListener('click', onClick);

const onAudioPlay = () => {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
};
audioElement.addEventListener('play', onAudioPlay, { once: true });

//PRESET STUFF

function savePreset() {
  const preset = {
    wordSet,
    global: { ...PARAMS.global },
    audio: { ...PARAMS.audio },
    letters: PARAMS.letters.map(l => ({ ...l })),
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

  pane.refresh();
  scene.background = new THREE.Color(PARAMS.global.backgroundColor);
}

function onResize() {
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
  renderer.setSize(containerWidth, containerHeight);
}

const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(container);
onResize();

return () => {
  disposed = true;
  window.removeEventListener('click', onClick);
  resizeObserver.disconnect();
  audioElement.removeEventListener('play', onAudioPlay);
  renderer.setAnimationLoop(null);
  pane.dispose();
  if (renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
  renderer.dispose();
  if (audioCtx) audioCtx.close();
};
}