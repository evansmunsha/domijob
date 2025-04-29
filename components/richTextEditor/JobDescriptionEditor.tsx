"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Typography from "@tiptap/extension-typography"
import { useEffect } from "react"
import { MenuBar } from "./MenuBar"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { FontSize } from "../extensions/FontSize"
import { AIJobEnhancer } from "../company/AIJobEnhancer"

interface FormField {
  value: string
  onChange: (value: string) => void
}

interface JobDescriptionEditorProps {
  field: FormField
  jobTitle?: string
  industry?: string
  location?: string
}

export default function JobDescriptionEditor({ field, jobTitle, industry, location }: JobDescriptionEditorProps) {
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

  const handleApply = (enhancedDescription: string, titleSuggestion?: string) => {
    if (editor) {
      // Apply either Tiptap JSON or plain text
      let content: any;
      try {
        content = JSON.parse(enhancedDescription);
      } catch {
        content = enhancedDescription;
      }
      editor.commands.setContent(content);
      // Persist updated editor state as JSON string
      field.onChange(JSON.stringify(editor.getJSON()));
    }
  }

  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="flex items-center justify-between p-2 border-b">
          <MenuBar editor={editor} />
          
        </div>
        <div className="flex items-start justify-start border-b">
          
          <AIJobEnhancer
            jobTitle={jobTitle || ""}
            jobDescription={field.value}
            industry={industry}
            location={location}
            onApply={handleApply}
          />
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
