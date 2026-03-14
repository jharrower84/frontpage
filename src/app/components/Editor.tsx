"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl max-w-full my-4" } }),
      Placeholder.configure({ placeholder: "Tell your story..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-96 text-gray-800 leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `inline-${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(fileName, file);

    if (error) { alert("Upload failed: " + error.message); return; }

    const { data: { publicUrl } } = supabase.storage
      .from("covers")
      .getPublicUrl(fileName);

    editor.chain().focus().setImage({ src: publicUrl }).run();

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetLink = () => {
    const url = window.prompt("Enter URL:");
    if (!url || !editor) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  const btn = (action: () => boolean, label: string, isActive?: boolean) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
        isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        {btn(() => editor.chain().focus().toggleBold().run(), "B", editor.isActive("bold"))}
        {btn(() => editor.chain().focus().toggleItalic().run(), "I", editor.isActive("italic"))}
        {btn(() => editor.chain().focus().toggleUnderline().run(), "U", editor.isActive("underline"))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1", editor.isActive("heading", { level: 1 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2", editor.isActive("heading", { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3", editor.isActive("heading", { level: 3 }))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {btn(() => editor.chain().focus().toggleBulletList().run(), "• List", editor.isActive("bulletList"))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), "1. List", editor.isActive("orderedList"))}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), '" Quote', editor.isActive("blockquote"))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {btn(() => editor.chain().focus().setTextAlign("left").run(), "Left", editor.isActive({ textAlign: "left" }))}
        {btn(() => editor.chain().focus().setTextAlign("center").run(), "Center", editor.isActive({ textAlign: "center" }))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleSetLink(); }}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive("link") ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black"
          }`}
        >
          Link
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
          className="px-2.5 py-1 rounded text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
        >
          📷 Image
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {btn(() => editor.chain().focus().undo().run(), "↩")}
        {btn(() => editor.chain().focus().redo().run(), "↪")}
      </div>

      {/* Editor */}
      <div className="px-6 py-6">
        <EditorContent editor={editor} />
      </div>

    </div>
  );
}