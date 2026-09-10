import * as THREE from 'three'
import { Path, Shape, ShapeUtils } from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import opentype from 'opentype.js'
import fontUrl from '../../assets/fonts/MNKYMaurice-Bold.otf?url'
import defaultPreset from '../../assets/audioreactive-icon/bsr_preset.json'
import { getStreamAudioGraph } from '../../lib/streamAudioGraph.js'

export function initBsrTypography({ container, audioElement, onReady }) {
  let camera
  let scene
  let renderer
  let wordGroup = null
  let stacks
  const wordBlockSize = new THREE.Vector3()
  const wordBlockCenter = new THREE.Vector3()
  let hasWordBlockMetrics = false
  let otFont
  let glyphGeometries = {}
  let scale
  let wordSet = 'brown\nstudent\nradio'

  let FONTSIZE = 1000

  const ORTHO_SIZE = 2600
  const FIRST_PLAY_S_RELEASE = 0.03
  const FIRST_PLAY_MUSIC_THRESHOLD = 0.12
  const FIRST_PLAY_SETTLED_S = 0.03
  let strokeWidth = (7 / 500) * FONTSIZE * (1 + (0.01 - FONTSIZE / 50000))

  function getContainerSize() {
    return {
      width: container.clientWidth,
      height: container.clientHeight,
    }
  }

  let { width: containerWidth, height: containerHeight } = getContainerSize()
  let aspect = containerWidth / containerHeight || window.innerWidth / window.innerHeight

  let audioCtx
  let analyser
  let dataArray
  let isFirstPlaySmoothing = false
  let hasCompletedFirstPlaySmooth = false

  const PARAMS = {
    global: {
      backgroundColor: '#FFFFFF',
      word: 'brown\nstudent\nradio',
      fillColor: '#000000',
      secondaryFillColor: '#ff0a4f',
      strokeColor: '#000000',
      showStroke: true,
      fontSize: 1000,
      strength: 1,
      leading: 0.85,
    },
    letters: [],
    audio: {
      audioReactive: true,
      styleIntensity: 1.5,
      depthIntensity: 300,
      minStyle: 1,
    },
  }

  let disposed = false

  function getLines(text) {
    return text.split('\n')
  }

  function getAllChars(text) {
    return getLines(text).join('')
  }

  function updateStrokeWidth() {
    strokeWidth = (7 / 500) * FONTSIZE * (1 + (0.01 - FONTSIZE / 50000))
  }

  async function bootstrap() {
    try {
      const response = await fetch(fontUrl)
      if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`)
      otFont = opentype.parse(await response.arrayBuffer())
    } catch (err) {
      console.error('Failed to load font:', err)
      onReady?.()
      return
    }

    if (disposed) return

    scale = FONTSIZE / otFont.unitsPerEm

    void (async () => {
      try {
        const face = new FontFace('MNKYMaurice', `url(${fontUrl})`, { weight: '700' })
        await face.load()
        if (!disposed) document.fonts.add(face)
      } catch (err) {
        console.warn('CSS font registration failed; kerning may be approximate:', err)
      }
    })()

    if (disposed) return

    try {
      applyPreset(defaultPreset)
    } catch (err) {
      console.error('Failed to initialize typography:', err)
    }

    onReady?.()
  }

  bootstrap()

  camera = new THREE.OrthographicCamera(
    (ORTHO_SIZE * aspect) / -2,
    (ORTHO_SIZE * aspect) / 2,
    ORTHO_SIZE / 2,
    ORTHO_SIZE / -2,
    1,
    10000,
  )
  camera.position.set(0, 0, 4000)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(containerWidth, containerHeight, false)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.shadowMap.enabled = true

  container.appendChild(renderer.domElement)

  renderer.setAnimationLoop(() => {
    syncViewportToContainer()

    if (!wordGroup || !stacks) {
      renderer.render(scene, camera)
      return
    }

    let styleAmount = PARAMS.global.strength

    if (PARAMS.audio.audioReactive && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray)

      const level = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255
      styleAmount = level * PARAMS.audio.styleIntensity * 1.5

      stacks.forEach((stack, i) => {
        const freqIndex = Math.floor((i / stacks.length) * (dataArray.length / 4))
        const freqEnergy = dataArray[freqIndex] / 255
        const letterTriggered =
          Math.max(0, freqEnergy - (1 - PARAMS.audio.minStyle + 0.001)) /
          (1 - (1 - PARAMS.audio.minStyle + 0.001))
        PARAMS.letters[i].audioDepth = 15 + letterTriggered * PARAMS.audio.depthIntensity
        PARAMS.letters[i].styleAmount = letterTriggered * PARAMS.audio.styleIntensity * 1.5
      })
    }

    let maxTargetS = 0
    let allSmoothNearZero = true

    stacks.forEach((stack, i) => {
      const p = PARAMS.letters[i]
      if (!p) return

      const targetS =
        (analyser && PARAMS.audio.audioReactive ? p.styleAmount : styleAmount) *
        PARAMS.global.strength

      maxTargetS = Math.max(maxTargetS, targetS)

      let s
      if (isFirstPlaySmoothing) {
        p.smoothS = THREE.MathUtils.lerp(p.smoothS, targetS, FIRST_PLAY_S_RELEASE)
        s = p.smoothS
        if (p.smoothS > FIRST_PLAY_SETTLED_S) allSmoothNearZero = false
      } else {
        p.smoothS = targetS
        s = targetS
      }

      stack.group.rotation.x = p.rotX * s
      stack.group.rotation.y = p.rotY * s
      stack.group.rotation.z = p.rotZ * s

      const depth =
        analyser && PARAMS.audio.audioReactive && p.audioDepth ? p.audioDepth : p.distance

      const sliceAdd = s > 1 ? Math.floor(THREE.MathUtils.lerp(1, 3, s - 1)) : 0

      const targetSlices = p.slices + sliceAdd

      if (stack.slices.length !== targetSlices) {
        stack.slices.forEach((slice) => stack.group.remove(slice))
        const newSlices = buildSlices(stack.char, targetSlices)
        newSlices.forEach((slice) => {
          slice.traverse((obj) => {
            if (obj.isMesh) obj.userData.stackIndex = i
          })
          stack.group.add(slice)
        })
        stack.slices = newSlices
      }

      const depthMultiplier = s > 1 ? THREE.MathUtils.lerp(1, 1.2, s - 1) : 1

      stack.slices.forEach((slice, j) => {
        const centered =
          j * depth * depthMultiplier -
          Math.floor(stack.slices.length / 2) * depth * depthMultiplier +
          p.offset * depth
        slice.position.z = centered * s
      })
    })

    if (
      isFirstPlaySmoothing &&
      (maxTargetS > FIRST_PLAY_MUSIC_THRESHOLD || allSmoothNearZero)
    ) {
      isFirstPlaySmoothing = false
      hasCompletedFirstPlaySmooth = true
    }

    renderer.render(scene, camera)
  })

  function bindAnalyser() {
    const graph = getStreamAudioGraph(audioElement)
    if (!graph) return

    const isFirstBind = !analyser
    audioCtx = graph.audioCtx
    analyser = graph.analyser
    dataArray = graph.dataArray

    if (isFirstBind && !hasCompletedFirstPlaySmooth) {
      isFirstPlaySmoothing = true
    }
  }

  function connectAudio() {
    if (!PARAMS.audio.audioReactive) return
    bindAnalyser()
  }

  function resetShuffle() {
    // Let a paused home screen display its shuffled static arrangement.
    analyser = null
    dataArray = null
    shuffleValues()
  }

  function initLetters(word) {
    getAllChars(word)
      .split('')
      .forEach(() => {
        PARAMS.letters.push({
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          distance: 100,
          slices: 3,
          offset: 0,
          audioDepth: 100,
          styleAmount: 1.0,
          smoothS: 1.0,
        })
      })
  }

  function rebuildLetters(word) {
    PARAMS.letters = []
    initLetters(word)
    buildStacks(word)
  }

  function applySlicePositions() {
    stacks.forEach((stack, i) => {
      const p = PARAMS.letters[i]
      const dist = p.distance ?? 100
      stack.slices.forEach((slice, j) => {
        slice.position.z =
          j * dist - Math.floor((stack.slices.length / 2) * dist) + p.offset * dist
      })
    })
  }

  function shuffleValues() {
    if (!stacks) return

    stacks.forEach((stack, i) => {
      const p = PARAMS.letters[i]
      p.rotX = (Math.random() * 2 - 1) * 0.65
      p.rotY = (Math.random() * 2 - 1) * 0.55
      p.rotZ = (Math.random() * 2 - 1) * 0.45

      p.offset = Math.random() * 1.4 - 0.7
      p.distance = Math.random() * 140 + 90
      p.slices = Math.floor(Math.random() * 1) + 3
      p.smoothS = PARAMS.global.strength

      const dist = p.distance ?? PARAMS.global.distance
      if (stack.slices.length !== p.slices) {
        stack.slices.forEach((slice) => stack.group.remove(slice))
        const newSlices = buildSlices(stack.char, p.slices)
        newSlices.forEach((slice, j) => {
          slice.traverse((obj) => {
            if (obj.isMesh) obj.userData.stackIndex = i
          })
          slice.position.z = j * dist
          stack.group.add(slice)
        })
        stack.slices = newSlices
      }

      stack.slices.forEach((slice, j) => {
        slice.position.z = j * dist - Math.floor((stack.slices.length / 2) * dist) + p.offset * dist
      })
    })
  }

  function cacheWordBlockMetrics() {
    if (!wordGroup) {
      hasWordBlockMetrics = false
      return
    }

    wordGroup.position.set(0, 0, 0)
    wordGroup.scale.set(1, 1, 1)
    wordGroup.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(wordGroup)
    box.getSize(wordBlockSize)
    box.getCenter(wordBlockCenter)
    hasWordBlockMetrics = wordBlockSize.x > 0 && wordBlockSize.y > 0
  }

  function fitWordGroupToViewport() {
    if (!wordGroup || !hasWordBlockMetrics) return

    const visibleWidth = ORTHO_SIZE * aspect
    const visibleHeight = ORTHO_SIZE
    const padding = 0.9
    const scaleX = (visibleWidth * padding) / wordBlockSize.x
    const scaleY = (visibleHeight * padding) / wordBlockSize.y
    const fit = Math.min(scaleX, scaleY, 1)
    wordGroup.scale.set(fit, fit, fit)
    wordGroup.position.set(
      -wordBlockCenter.x * fit,
      -wordBlockCenter.y * fit,
      0,
    )
  }

  function syncViewportToContainer() {
    const size = getContainerSize()
    if (!size.width || !size.height) return
    if (size.width === containerWidth && size.height === containerHeight) return

    containerWidth = size.width
    containerHeight = size.height
    aspect = containerWidth / containerHeight
    camera.left = (ORTHO_SIZE * aspect) / -2
    camera.right = (ORTHO_SIZE * aspect) / 2
    camera.top = ORTHO_SIZE / 2
    camera.bottom = ORTHO_SIZE / -2
    camera.updateProjectionMatrix()
    renderer.setSize(containerWidth, containerHeight, false)
    fitWordGroupToViewport()
  }

  function buildStacks(text, autoFit = true) {
    if (wordGroup) {
      scene.remove(wordGroup)
    }

    wordGroup = new THREE.Group()
    scene.add(wordGroup)

    const lines = getLines(text)
    const lineHeight = FONTSIZE * PARAMS.global.leading
    stacks = []
    let globalIdx = 0

    lines.forEach((line, lineIdx) => {
      const lineMetrics = computeWordMetrics(line)
      const lineWidth = lineMetrics.reduce((sum, m) => sum + m.advanceWidth + m.kern, 0)
      let currentX = -lineWidth / 2
      const lineGroup = new THREE.Group()
      lineGroup.position.y = -lineIdx * lineHeight
      wordGroup.add(lineGroup)

      line.split('').forEach((char, charIdx) => {
        const stackGroup = new THREE.Group()
        stackGroup.position.x =
          currentX + lineMetrics[charIdx].leftBearing + lineMetrics[charIdx].visualWidth / 2
        lineGroup.add(stackGroup)
        currentX += lineMetrics[charIdx].advanceWidth + lineMetrics[charIdx].kern

        const slices = buildSlices(char, PARAMS.letters[globalIdx].slices)
        slices.forEach((slice, j) => {
          slice.traverse((obj) => {
            if (obj.isMesh) obj.userData.stackIndex = globalIdx
          })
          slice.position.z = j * PARAMS.letters[globalIdx].distance
          stackGroup.add(slice)
        })
        stacks.push({ char, group: stackGroup, slices })
        globalIdx++
      })
    })

    cacheWordBlockMetrics()

    if (autoFit) {
      fitWordGroupToViewport()
    } else {
      wordGroup.position.set(-wordBlockCenter.x, -wordBlockCenter.y, 0)
    }
  }

  function buildSlices(char, count) {
    const slices = []
    for (let i = 0; i < count; i++) {
      const isFront = i === count - 1
      const fillColor = isFront ? PARAMS.global.fillColor : PARAMS.global.secondaryFillColor
      const sliceGroup = new THREE.Group()

      if (PARAMS.global.showStroke) {
        glyphGeometries[char].stroke.forEach((strokeGeo) => {
          const mesh = new THREE.Mesh(
            strokeGeo,
            new THREE.MeshBasicMaterial({
              color: PARAMS.global.strokeColor,
              side: THREE.DoubleSide,
            }),
          )
          mesh.renderOrder = 1
          mesh.userData.type = 'stroke'
          sliceGroup.add(mesh)
        })
      }

      const fill = new THREE.Mesh(
        glyphGeometries[char].fill,
        new THREE.MeshBasicMaterial({ color: fillColor, side: THREE.DoubleSide }),
      )
      fill.renderOrder = 0
      fill.userData.type = 'fill'
      fill.position.z -= 0.005
      sliceGroup.add(fill)

      slices.push(sliceGroup)
    }
    return slices
  }

  function opentypePathToSvgPathData(path) {
    const parts = []
    for (const cmd of path.commands) {
      switch (cmd.type) {
        case 'M':
          parts.push(`M${cmd.x} ${-cmd.y}`)
          break
        case 'L':
          parts.push(`L${cmd.x} ${-cmd.y}`)
          break
        case 'C':
          parts.push(`C${cmd.x1} ${-cmd.y1} ${cmd.x2} ${-cmd.y2} ${cmd.x} ${-cmd.y}`)
          break
        case 'Q':
          parts.push(`Q${cmd.x1} ${-cmd.y1} ${cmd.x} ${-cmd.y}`)
          break
        case 'Z':
          parts.push('Z')
          break
        default:
          break
      }
    }
    return parts.join(' ')
  }

  function cloneSubPathToShape(subPath) {
    const shape = new Shape()
    for (const curve of subPath.curves) {
      shape.curves.push(curve.clone())
    }
    return shape
  }

  function cloneSubPathToPath(subPath) {
    const path = new Path()
    for (const curve of subPath.curves) {
      path.curves.push(curve.clone())
    }
    return path
  }

  function ensureContourCCW(path) {
    const points = path.getPoints(12)
    if (ShapeUtils.isClockWise(points)) {
      path.curves.reverse()
    }
  }

  function ensureContourCW(path) {
    const points = path.getPoints(12)
    if (!ShapeUtils.isClockWise(points)) {
      path.curves.reverse()
    }
  }

  function contourCenter(points) {
    const center = new THREE.Vector2()
    for (const point of points) {
      center.add(point)
    }
    return center.divideScalar(points.length)
  }

  function isPointInPolygon(point, polygon) {
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y
      const intersects =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

      if (intersects) inside = !inside
    }

    return inside
  }

  function isContourInside(inner, outer) {
    const outerBounds = {
      minX: Math.min(...outer.points.map((p) => p.x)),
      maxX: Math.max(...outer.points.map((p) => p.x)),
      minY: Math.min(...outer.points.map((p) => p.y)),
      maxY: Math.max(...outer.points.map((p) => p.y)),
    }

    if (
      inner.center.x < outerBounds.minX ||
      inner.center.x > outerBounds.maxX ||
      inner.center.y < outerBounds.minY ||
      inner.center.y > outerBounds.maxY
    ) {
      return false
    }

    return isPointInPolygon(inner.center, outer.points)
  }

  function createGlyphShapes(parsedPath) {
    const { subPaths } = parsedPath
    if (subPaths.length === 0) return []
    if (subPaths.length === 1) {
      const shape = cloneSubPathToShape(subPaths[0])
      ensureContourCCW(shape)
      return [shape]
    }

    const contours = subPaths
      .map((subPath, index) => {
        const points = subPath.getPoints(12)
        return {
          index,
          subPath,
          points,
          area: Math.abs(ShapeUtils.area(points)),
          center: contourCenter(points),
        }
      })
      .sort((a, b) => b.area - a.area)

    const used = new Set()
    const shapes = []

    for (let i = 0; i < contours.length; i++) {
      if (used.has(i)) continue

      const outer = contours[i]
      const shape = cloneSubPathToShape(outer.subPath)
      ensureContourCCW(shape)

      for (let j = i + 1; j < contours.length; j++) {
        if (used.has(j)) continue

        const inner = contours[j]
        if (!isContourInside(inner, outer)) continue

        const hole = cloneSubPathToPath(inner.subPath)
        ensureContourCW(hole)
        shape.holes.push(hole)
        used.add(j)
      }

      shapes.push(shape)
      used.add(i)
    }

    return shapes
  }

  function buildGeometries(text) {
    const loader = new SVGLoader()
    const chars = [...new Set(getAllChars(text))]
    for (const char of chars) {
      const glyph = otFont.charToGlyph(char)
      const bbox = glyph.getBoundingBox()
      const cx = ((bbox.x1 + bbox.x2) / 2) * scale
      const xHeight = otFont.tables.os2.sxHeight * scale
      const cy = -xHeight / 2

      const path = glyph.getPath(-cx, -cy, FONTSIZE)
      const parsed = loader.parse(`<svg><path d="${opentypePathToSvgPathData(path)}"/></svg>`)

      const shapes = parsed.paths.flatMap((p) => createGlyphShapes(p))
      const geometry = new THREE.ShapeGeometry(shapes)

      const strokePoints = []
      parsed.paths.forEach((path) => {
        path.subPaths.forEach((subPath) => {
          const geo = SVGLoader.pointsToStroke(subPath.getPoints(), {
            strokeWidth,
          })
          if (geo) {
            strokePoints.push(geo)
          }
        })
      })

      glyphGeometries[char] = {
        fill: geometry,
        stroke: strokePoints,
      }
    }
  }

  function computeWordMetrics(word) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `bold ${FONTSIZE}px MNKYMaurice`

    return word.split('').map((char, i) => {
      const nextChar = word[i + 1] ?? null
      const glyph = otFont.charToGlyph(char)
      const bbox = glyph.getBoundingBox()
      const kern = nextChar
        ? ctx.measureText(char + nextChar).width -
        ctx.measureText(char).width -
        ctx.measureText(nextChar).width
        : 0

      return {
        char,
        advanceWidth: glyph.advanceWidth * scale,
        leftBearing: bbox.x1 * scale,
        rightBearing: (glyph.advanceWidth - bbox.x2) * scale,
        visualWidth: (bbox.x2 - bbox.x1) * scale,
        adjustedRightBearing: (glyph.advanceWidth - bbox.x2) * scale + kern,
        kern,
      }
    })
  }

  function updateColors() {
    if (!stacks) return
    stacks.forEach(({ slices }) => {
      slices.forEach((sliceGroup, j) => {
        const isFront = j === slices.length - 1
        const fillColor = isFront ? PARAMS.global.fillColor : PARAMS.global.secondaryFillColor
        sliceGroup.children.forEach((mesh) => {
          if (mesh.userData.type === 'stroke') {
            mesh.material.color.set(PARAMS.global.strokeColor)
          } else {
            mesh.material.color.set(fillColor)
          }
        })
      })
    })
  }

  let onAudioPlay = null

  function syncAudioIntegration() {
    if (onAudioPlay) {
      audioElement.removeEventListener('play', onAudioPlay)
      onAudioPlay = null
    }

    if (!PARAMS.audio.audioReactive) return

    onAudioPlay = () => connectAudio()
    audioElement.addEventListener('play', onAudioPlay)

    if (!audioElement.paused) connectAudio()
  }

  function applyPreset(preset) {
    wordSet = preset.wordSet
    Object.assign(PARAMS.global, preset.global)
    Object.assign(PARAMS.audio, preset.audio)

    FONTSIZE = PARAMS.global.fontSize
    scale = FONTSIZE / otFont.unitsPerEm
    updateStrokeWidth()

    buildGeometries(wordSet)
    rebuildLetters(wordSet)

    shuffleValues()

    if (preset.letters?.length) {
      preset.letters.forEach((letter, i) => {
        if (PARAMS.letters[i]) Object.assign(PARAMS.letters[i], letter)
      })
      applySlicePositions()
    }
    scene.background = new THREE.Color(PARAMS.global.backgroundColor)
    updateColors()
    syncAudioIntegration()
  }

  let resizeRaf = 0

  function onResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      syncViewportToContainer()
    })
  }

  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(container)
  syncViewportToContainer()

  return {
    dispose() {
      disposed = true
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      resizeObserver.disconnect()
      if (onAudioPlay) audioElement.removeEventListener('play', onAudioPlay)
      renderer.setAnimationLoop(null)
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    },
    connectAudio,
    resetShuffle,
  }
}
