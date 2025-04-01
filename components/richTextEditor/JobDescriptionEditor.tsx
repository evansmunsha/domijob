"use client"
//@typescript-eslint/no-explicit-any
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Typography from "@tiptap/extension-typography"
import { useEffect, useState } from "react"
import { MenuBar } from "./MenuBar"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { FontSize } from "../extensions/FontSize"



// Let's fix the any type on line 16
// If you have something like:
// const [content, setContent] = useState<any>(initialContent)

// Change it to a more specific type, for example:
// const [content, setContent] = useState<string | Record<string, unknown>>(initialContent)

// Or if it's a specific editor content type:
interface EditorContent {
  blocks?: Array<{
    id: string
    type: string
    data?: Record<string, unknown>
    text?: string
  }>
  time?: number
  version?: string
}

const initialContent: EditorContent = {
  blocks: [],
  time: 0,
  version: "2.0",
}

const [content, setContent] = useState<EditorContent>(initialContent) // Removed conditional hook

interface FormField {
  value: string
  onChange: (value: string) => void
}

interface JobDescriptionEditorProps {
  field: FormField
}


export default function JobDescriptionEditor({ field }: JobDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] p-4 max-w-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor }) => {
      field.onChange(JSON.stringify(editor.getJSON()))
    },
    content: field.value ? JSON.parse(field.value) : "",
  })

  useEffect(() => {
    if (editor && field.value && editor.getHTML() !== field.value) {
      editor.commands.setContent(JSON.parse(field.value))
    }
  }, [editor, field.value])

  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden bg-card">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

