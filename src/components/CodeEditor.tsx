'use client'

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import type { editor } from 'monaco-editor'

// 动态导入Monaco Editor以避免SSR问题
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 border border-gray-300 rounded-md">
      <div className="text-gray-500">加载编辑器中...</div>
    </div>
  )
})

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'html' | 'css' | 'javascript'
  placeholder?: string
  height?: string | number
  className?: string
}

export interface CodeEditorRef {
  insertText: (text: string) => void
  focus: () => void
  getEditor: () => editor.IStandaloneCodeEditor | null
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  value,
  onChange,
  language,
  placeholder,
  height = 400,
  className = ''
}, ref) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const editor = editorRef.current
      if (editor) {
        const selection = editor.getSelection()
        const range = selection || {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1
        }
        
        editor.executeEdits('insert-field', [{
          range,
          text,
          forceMoveMarkers: true
        }])
        
        // 设置光标位置到插入文本的末尾
        const newPosition = {
          lineNumber: range.startLineNumber,
          column: range.startColumn + text.length
        }
        editor.setPosition(newPosition)
        editor.focus()
      }
    },
    focus: () => {
      editorRef.current?.focus()
    },
    getEditor: () => editorRef.current
  }))

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    
    // 配置编辑器选项
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: true,
    })

    // 如果有占位符文本且编辑器为空，显示占位符
    if (placeholder && !value) {
      editor.setValue(placeholder)
      editor.setSelection({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: editor.getModel()?.getLineCount() || 1,
        endColumn: editor.getModel()?.getLineMaxColumn(editor.getModel()?.getLineCount() || 1) || 1
      })
    }
  }

  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '')
  }

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs"
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
        }}
      />
    </div>
  )
})

CodeEditor.displayName = 'CodeEditor'

export default CodeEditor
