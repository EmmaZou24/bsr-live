import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ContentLoadingContextValue = {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

export const ContentLoadingContext = createContext<ContentLoadingContextValue | null>(null)

export function ContentLoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0)

  const startLoading = useCallback(() => {
    setLoadingCount((count) => count + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingCount((count) => Math.max(0, count - 1))
  }, [])

  const value = useMemo(
    () => ({
      isLoading: loadingCount > 0,
      startLoading,
      stopLoading,
    }),
    [loadingCount, startLoading, stopLoading],
  )

  return <ContentLoadingContext.Provider value={value}>{children}</ContentLoadingContext.Provider>
}

export function useContentLoadingState() {
  const context = useContext(ContentLoadingContext)
  if (!context) {
    throw new Error('useContentLoadingState must be used within ContentLoadingProvider')
  }
  return context
}

export function useContentLoading(isLoading: boolean) {
  const { startLoading, stopLoading } = useContentLoadingState()

  useEffect(() => {
    if (!isLoading) return

    startLoading()
    return () => {
      stopLoading()
    }
  }, [isLoading, startLoading, stopLoading])
}
