export type BsrTypographyInstance = {
  dispose: () => void
  connectAudio: () => void
}

export function initBsrTypography(options: {
  container: HTMLElement
  audioElement: HTMLAudioElement
  onReady?: () => void
}): BsrTypographyInstance
