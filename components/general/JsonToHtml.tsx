"use client";

import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { FontSize } from "../extensions/FontSize";

interface JsonToHtmlProps {
  json: JSONContent;
}

export function JsonToHtml({ json }: JsonToHtmlProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,TextStyle, FontSize,
      Link.configure({
        openOnClick: true, // Disable default link click behavior
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"], // Apply text alignment to headings and paragraphs
      }),
      Typography, // Automatically handles common typography like font size, etc.

    ],
    editable: false, // Set to false for read-only mode
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert", // Tailwind CSS styling
      },
    },
    content: json,
    immediatelyRender: true, // Set to true for immediate rendering
  });

  // Render a loading or error message if the editor is not yet ready
  if (!editor) {
    return <div>Loading...</div>;
  }

  return <EditorContent editor={editor} />;
}
