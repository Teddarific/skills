// Shared clock (put in your app's src/). Live preview ticks on requestAnimationFrame; recording calls window.__filmStep(ms) per frame so every animation is a pure function of time.
import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
const listeners = new Set(); let now = 0; let raf = null
const recording = new URLSearchParams(location.search).has('record')
const notify = () => listeners.forEach((l) => l())
const tick = (ts) => { now = ts; notify(); raf = listeners.size ? requestAnimationFrame(tick) : null }
if (recording) window.__filmStep = (ms) => { now += ms; flushSync(notify) }
const subscribe = (l) => { listeners.add(l); if (!recording && raf === null) raf = requestAnimationFrame(tick); return () => listeners.delete(l) }
export const isRecording = () => recording
export const useClock = () => useSyncExternalStore(subscribe, () => now, () => 0)
