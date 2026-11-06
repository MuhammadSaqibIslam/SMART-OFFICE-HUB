import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Loader2, Mic, MicOff, Square } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// ── Speech Recognition types ──
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

type MicState = 'idle' | 'listening' | 'error'

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// ── Component ──

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  sending?: boolean
}

export function ChatInput({ onSend, disabled, sending }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Voice
  const [micState, setMicState] = useState<MicState>('idle')
  const [micError, setMicError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const supported = !!getSpeechRecognition()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  // ── Text input handlers ──
  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || sending) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  // ── Voice handlers ──
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setMicState('idle')
  }, [])

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setMicError('Voice input is not supported in this browser.')
      setMicState('error')
      setTimeout(() => { setMicState('idle'); setMicError(null) }, 3000)
      return
    }

    setMicError(null)
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    let finalTranscript = ''

    recognition.onstart = () => {
      setMicState('listening')
    }

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim = transcript
        }
      }
      // Show final + interim in input
      setValue((prev) => {
        const base = prev.endsWith(' ') || prev === '' ? prev : prev + ' '
        if (finalTranscript) {
          return (base + finalTranscript).trimStart()
        }
        return (base + interim).trimStart()
      })
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      let msg = 'Voice input failed. Please try again.'
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        msg = 'Microphone permission is required to use voice input.'
      } else if (e.error === 'no-speech') {
        msg = 'No speech detected. Please try again.'
      } else if (e.error === 'network') {
        msg = 'Network error. Please check your connection.'
      } else if (e.error === 'audio-capture') {
        msg = 'Unable to access your microphone. Please check your device settings.'
      }
      setMicError(msg)
      setMicState('error')
      setTimeout(() => { setMicState('idle'); setMicError(null) }, 4000)
    }

    recognition.onend = () => {
      setMicState('idle')
      recognitionRef.current = null
      // Apply final transcript
      if (finalTranscript) {
        setValue((prev) => {
          const base = prev.replace(/\s+$/, '')
          const combined = base ? base + ' ' + finalTranscript : finalTranscript
          return combined.trimStart()
        })
      }
      // Focus textarea for editing
      textareaRef.current?.focus()
    }

    try {
      recognition.start()
    } catch {
      setMicError('Failed to start voice input.')
      setMicState('error')
      setTimeout(() => { setMicState('idle'); setMicError(null) }, 3000)
    }
  }, [])

  const toggleMic = () => {
    if (micState === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }

  const hasValue = value.trim().length > 0
  const isListening = micState === 'listening'

  return (
    <div className="border-t border-border-default bg-surface px-3 sm:px-4 py-2 sm:py-3 shrink-0">
      <div className="mx-auto max-w-3xl">
        {/* Error message */}
        {micError && (
          <div className="mb-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger animate-fade-in">
            {micError}
          </div>
        )}

        <div className={`flex items-end gap-1.5 sm:gap-2 rounded-2xl border bg-background px-3 sm:px-4 py-2 shadow-sm transition-all ${
          isListening
            ? 'border-danger/50 shadow-md shadow-danger/5'
            : 'border-border-default focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5'
        }`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask anything...'}
            disabled={disabled || sending}
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50"
          />

          {/* Mic button + wave */}
          {supported && (
            <>
              {isListening && (
                <div className="audio-wave text-danger">
                  <span /><span /><span /><span /><span />
                </div>
              )}
              <Tooltip>
                <TooltipTrigger
                  onClick={toggleMic}
                  disabled={disabled || sending}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                    isListening
                      ? 'bg-danger text-white shadow-sm'
                      : micState === 'error'
                      ? 'bg-danger/10 text-danger'
                      : 'text-text-muted hover:bg-surface-secondary hover:text-text-primary'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isListening ? (
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  ) : micState === 'error' ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isListening ? 'Stop recording' : 'Start voice input'}
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!hasValue || disabled || sending}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
              hasValue && !sending
                ? 'bg-primary text-white shadow-sm hover:bg-primary-hover'
                : 'bg-surface-secondary text-text-disabled cursor-not-allowed'
            }`}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <p className="mt-1.5 text-center text-[11px] text-text-muted hidden sm:block">
          Powered by real company data. Always verify important information.
        </p>
      </div>
    </div>
  )
}
