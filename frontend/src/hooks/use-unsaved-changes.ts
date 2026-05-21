import { useBlocker } from '@tanstack/react-router'

const PROMPT = 'You have unsaved changes. Leave anyway?'

export function useUnsavedChanges(isDirty: boolean) {
  useBlocker({
    shouldBlockFn: () => {
      if (!isDirty) return false
      return !window.confirm(PROMPT)
    },
    enableBeforeUnload: () => isDirty,
  })
}
