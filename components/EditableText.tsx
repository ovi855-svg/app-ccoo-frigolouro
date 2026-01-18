'use client'

import { useState, useEffect, useRef } from 'react'

interface EditableTextProps {
    initialValue: string
    onSave: (newValue: string) => Promise<void>
    isTextArea?: boolean
    className?: string
    style?: React.CSSProperties
    placeholder?: string
    label?: string
    options?: readonly string[]
}

export default function EditableText({
    initialValue,
    onSave,
    isTextArea = false,
    className = '',
    style = {},
    placeholder = 'Haga clic para editar',
    label,
    options
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialValue)
    const [saving, setSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleSave = async () => {
        if (value.trim() === initialValue) {
            setIsEditing(false)
            return
        }

        try {
            setSaving(true)
            await onSave(value)
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving:', error)
            alert('Error al guardar. Por favor intente de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setValue(initialValue)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel()
        }
        // Save on Enter only for single inputs, not textareas
        if (e.key === 'Enter' && !isTextArea && !e.shiftKey) {
            e.preventDefault()
            handleSave()
        }
    }

    if (isEditing) {
        return (
            <div className="editable-text-container" style={{ width: '100%' }}>
                {options ? (
                    <select
                        ref={inputRef as any}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value)
                            // Auto save for select
                            // But we need to update state first, so maybe better keep manual save
                            // or utilize the fact that change is instant.
                            // Let's keep manual save consistent with other inputs for now 
                            // OR user explicitly requested "editable select", usually implies picking and it's done. 
                            // However, base component has Save/Cancel buttons. 
                            // Let's keep consistency: User selects, then clicks Save.
                        }}
                        onKeyDown={handleKeyDown}
                        className={className}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #3b82f6',
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            ...style
                        }}
                    >
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : isTextArea ? (
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={className}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #3b82f6',
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            resize: 'vertical',
                            ...style
                        }}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={className}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #3b82f6',
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            ...style
                        }}
                        placeholder={placeholder}
                    />
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '4px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        style={{
                            padding: '4px 12px',
                            backgroundColor: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`editable-text-preview ${className}`}
            style={{
                cursor: 'pointer',
                border: '1px solid transparent',
                borderRadius: '4px',
                transition: 'all 0.2s',
                position: 'relative',
                ...style
            }}
            title="Haga clic para editar"
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'
                e.currentTarget.style.borderColor = '#e2e8f0'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
            }}
        >
            {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{placeholder}</span>}
        </div>
    )
}
