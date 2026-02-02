'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Image from '@tiptap/extension-image'
import suggestion from './suggestion'
import { Bold, Italic, Code, List, Image as ImageIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

const MenuBar = ({ editor, onImageUpload }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!editor) {
        return null
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (onImageUpload) {
            try {
                const url = await onImageUpload(file)
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run()
                }
            } catch (error) {
                console.error(error)
                // Toast handling should be done by parent or here if preferred, but parent has context
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="control-group" style={{ display: 'flex', gap: '5px', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: editor.isActive('bold') ? 'var(--primary)' : 'var(--text-muted)' }}
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: editor.isActive('italic') ? 'var(--primary)' : 'var(--text-muted)' }}
            >
                <Italic size={18} />
            </button>

            {onImageUpload && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--text-muted)' }}
                        title="Upload Image"
                    >
                        <ImageIcon size={18} />
                    </button>
                </>
            )}
        </div>
    )
}

export default function RichEditor({ content, onChange, onImageUpload }: { content: string, onChange: (html: string) => void, onImageUpload?: (file: File) => Promise<string> }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
                suggestion,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                style: 'min-height: 150px; padding: 1rem;'
            }
        },
        immediatelyRender: false,
    })

    return (
        <div className="rich-editor" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-surface)' }}>
            <MenuBar editor={editor} onImageUpload={onImageUpload} />
            <EditorContent editor={editor} />
        </div>
    )
}
