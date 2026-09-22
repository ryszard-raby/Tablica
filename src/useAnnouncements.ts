import { useEffect, useRef, useState } from 'preact/hooks'

export function useAnnouncements() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const [sound, setSound] = useState(false)
  const [speechMessage, setSpeechMessage] = useState('Włącz zapowiedzi, aby usłyszeć próbny komunikat. Włączaj je po każdym otwarciu aplikacji.')
  const [speechError, setSpeechError] = useState(false)
  const voices = useRef<SpeechSynthesisVoice[]>([])
  const active = useRef<SpeechSynthesisUtterance | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function stopSpeech() {
    clearTimeout(timeout.current)
    active.current = null
    if (supported) window.speechSynthesis.cancel()
  }

  useEffect(() => {
    if (!supported) {
      setSpeechError(true)
      setSpeechMessage('Ta przeglądarka nie udostępnia syntezy mowy.')
      return
    }
    const synth = window.speechSynthesis
    const refresh = () => { voices.current = synth.getVoices() }
    refresh()
    synth.addEventListener('voiceschanged', refresh)
    return () => { synth.removeEventListener('voiceschanged', refresh); stopSpeech() }
  }, [])

  function speak(text: string) {
    if (!supported) return false
    stopSpeech()
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    // Voices may arrive asynchronously on mobile. With an empty list, let the
    // system resolve pl-PL rather than delaying speak() past the user's gesture.
    const available = synth.getVoices()
    if (available.length) voices.current = available
    const polish = voices.current.filter(v => /^pl(?:[-_]|$)/i.test(v.lang))
    const voice = polish.find(v => v.localService) || polish[0]
    if (voice) utterance.voice = voice
    utterance.lang = 'pl-PL'
    utterance.volume = 1
    utterance.rate = 1
    active.current = utterance
    setSpeechError(false)
    setSpeechMessage('Uruchamiam zapowiedź…')
    const fail = (message: string) => {
      if (active.current !== utterance) return
      stopSpeech()
      setSound(false)
      setSpeechError(true)
      setSpeechMessage(message)
    }
    utterance.onstart = () => {
      if (active.current !== utterance) return
      clearTimeout(timeout.current)
      setSpeechMessage('Zapowiedzi są aktywne. Jeśli nic nie słychać, sprawdź głośność multimediów i wyjście dźwięku tabletu.')
    }
    utterance.onend = () => {
      if (active.current === utterance) { clearTimeout(timeout.current); active.current = null }
    }
    utterance.onerror = event => {
      if (event.error === 'interrupted' || event.error === 'canceled') return
      const messages: Record<string, string> = {
        'not-allowed': 'Przeglądarka zablokowała głos. Dotknij „Przetestuj głos”, aby ponownie włączyć zapowiedzi.',
        'language-unavailable': 'Brak polskiego głosu. Sprawdź język polski w ustawieniach zamiany tekstu na mowę na tablecie.',
        'voice-unavailable': 'Wybrany głos jest niedostępny. Sprawdź ustawienia zamiany tekstu na mowę na tablecie.',
        'synthesis-unavailable': 'Synteza mowy jest niedostępna. Sprawdź systemowy silnik zamiany tekstu na mowę na tablecie.',
        'network': 'Głos wymaga połączenia z internetem. Połącz tablet z siecią lub zainstaluj polski głos offline.',
      }
      fail(messages[event.error] || `Nie udało się odtworzyć zapowiedzi (${event.error}). Sprawdź głośność i ustawienia zamiany tekstu na mowę na tablecie.`)
    }
    timeout.current = setTimeout(() => fail('Nie udało się uruchomić głosu. Sprawdź systemową zamianę tekstu na mowę i dotknij „Przetestuj głos”.'), 10000)
    try {
      if (synth.paused) synth.resume()
      synth.speak(utterance)
      return true
    } catch {
      fail('Nie udało się uruchomić głosu. Sprawdź ustawienia zamiany tekstu na mowę i spróbuj ponownie.')
      return false
    }
  }

  function testSpeech() {
    // Keep this synchronous in the click/change handler for mobile activation.
    setSound(true)
    if (!speak('Zapowiedzi głosowe włączone. Witamy na stacji Mała Kolej. Życzymy miłej podróży.')) setSound(false)
  }
  function toggleSound(enabled: boolean) {
    if (enabled) testSpeech()
    else { stopSpeech(); setSound(false); setSpeechError(false); setSpeechMessage('Zapowiedzi wyłączone.') }
  }
  return { sound, supported, speechMessage, speechError, speak, testSpeech, toggleSound }
}
