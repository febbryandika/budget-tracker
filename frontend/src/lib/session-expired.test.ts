import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}))

const queryClientClear = vi.fn()
vi.mock('./query-client', () => ({
  queryClient: { clear: () => queryClientClear() },
}))

const anyDirtyMock = vi.fn(() => false)
vi.mock('./dirty-forms', () => ({
  anyDirty: () => anyDirtyMock(),
}))

const originalLocation = window.location

function stubLocation(pathname: string) {
  const assign = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, pathname, assign },
  })
  return assign
}

describe('handleSessionExpired', () => {
  beforeEach(async () => {
    vi.resetModules()
    toastError.mockReset()
    queryClientClear.mockReset()
    anyDirtyMock.mockReset()
    anyDirtyMock.mockReturnValue(false)
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('shows a toast, clears the query cache, and redirects to /login', async () => {
    const assign = stubLocation('/dashboard')
    const mod = await import('./session-expired')

    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    expect(toastError).toHaveBeenCalledWith('Your session expired. Please sign in again.')
    expect(queryClientClear).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('is idempotent — concurrent 401s only fire the flow once', async () => {
    const assign = stubLocation('/dashboard')
    const mod = await import('./session-expired')

    mod.handleSessionExpired()
    mod.handleSessionExpired()
    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    expect(toastError).toHaveBeenCalledTimes(1)
    expect(queryClientClear).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('no-ops when already on /login', async () => {
    const assign = stubLocation('/login')
    const mod = await import('./session-expired')

    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    expect(toastError).not.toHaveBeenCalled()
    expect(queryClientClear).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('prompts to confirm when a form is dirty and bails on cancel', async () => {
    const assign = stubLocation('/entries/new')
    anyDirtyMock.mockReturnValue(true)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const mod = await import('./session-expired')

    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Continue to login?')
    expect(toastError).not.toHaveBeenCalled()
    expect(queryClientClear).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()

    // A later 401 with no dirty form should still trigger the flow.
    anyDirtyMock.mockReturnValue(false)
    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    expect(assign).toHaveBeenCalledWith('/login')

    confirmSpy.mockRestore()
  })

  it('proceeds with redirect when user confirms the unsaved-changes prompt', async () => {
    const assign = stubLocation('/entries/new')
    anyDirtyMock.mockReturnValue(true)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const mod = await import('./session-expired')

    mod.handleSessionExpired()
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    expect(confirmSpy).toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(queryClientClear).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/login')

    confirmSpy.mockRestore()
  })
})
