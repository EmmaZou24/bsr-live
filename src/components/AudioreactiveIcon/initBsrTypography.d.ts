export type BsrTypographyInstance = {
  dispose: () => void
  connectAudio: () => void
  resetShuffle: () => void
}

export function initBsrTypography(options: {
  container: HTMLElement
  audioElement: HTMLAudioElement
  onReady?: () => void
}): BsrTypographyInstance
