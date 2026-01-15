'use client'

import { useState, useEffect } from 'react'

interface VoiceInputProps {
    onTranscript: (text: string) => void
    isListening?: boolean
    onListeningChange?: (isListening: boolean) => void
}

export default function VoiceInput({ onTranscript, onListeningChange }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [recognition, setRecognition] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                setIsSupported(true)
                const recognitionInstance = new SpeechRecognition()
                recognitionInstance.continuous = false
                recognitionInstance.interimResults = false
                recognitionInstance.lang = 'es-ES'

                recognitionInstance.onstart = () => {
                    setIsListening(true)
                    onListeningChange?.(true)
                }

                recognitionInstance.onend = () => {
                    setIsListening(false)
                    onListeningChange?.(false)
                }

                recognitionInstance.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript
                    onTranscript(transcript)
                }

                recognitionInstance.onerror = (event: any) => {
                    console.error('Error de reconocimiento de voz:', event.error)
                    setIsListening(false)
                    onListeningChange?.(false)
                }

                setRecognition(recognitionInstance)
            }
        }
    }, [onTranscript, onListeningChange])

    const toggleListening = () => {
        if (!recognition) return

        if (isListening) {
            recognition.stop()
        } else {
            recognition.start()
        }
    }

    if (!isSupported) return null

    return (
        <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Detener grabación" : "Dictar descripción"}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backgroundColor: isListening ? '#fee2e2' : 'transparent',
                color: isListening ? '#dc2626' : '#64748b'
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isListening ? "animate-pulse" : ""}
            >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
        </button>
    )
}
