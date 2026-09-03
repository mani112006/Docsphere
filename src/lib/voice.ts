type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function startVoiceSearch(lang: 'en-IN' | 'ta-IN', onText: (text: string) => void): () => void {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) throw new Error('Voice search is not supported in this browser.')
  const rec = new Ctor() as SpeechRec
  rec.lang = lang
  rec.interimResults = false
  rec.continuous = false
  rec.onresult = (event) => {
    const text = event.results[0]?.[0]?.transcript ?? ''
    if (text) onText(text)
  }
  rec.start()
  return () => rec.stop()
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
}
