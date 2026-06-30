const audioGraphByElement = new WeakMap()

/**
 * Routes the shared stream <audio> element through Web Audio for playback + analysis.
 * Must outlive the homepage icon — createMediaElementSource can only be called once per element.
 */
export function attachStreamAudioGraph(audioElement) {
  let graph = audioGraphByElement.get(audioElement)
  if (graph) return graph

  const audioCtx = new AudioContext()
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.8

  const source = audioCtx.createMediaElementSource(audioElement)
  source.connect(analyser)
  analyser.connect(audioCtx.destination)

  graph = {
    audioCtx,
    analyser,
    dataArray: new Uint8Array(analyser.frequencyBinCount),
  }
  audioGraphByElement.set(audioElement, graph)
  return graph
}

export function getStreamAudioGraph(audioElement) {
  return audioGraphByElement.get(audioElement) ?? null
}

export function resumeStreamAudio(audioElement) {
  const graph = attachStreamAudioGraph(audioElement)
  if (graph.audioCtx.state === 'suspended') {
    void graph.audioCtx.resume()
  }
  return graph
}

export function suspendStreamAudio(audioElement) {
  const graph = audioGraphByElement.get(audioElement)
  if (graph?.audioCtx.state === 'running') {
    void graph.audioCtx.suspend()
  }
}
