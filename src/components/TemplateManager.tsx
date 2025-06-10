'use client'

import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import CodeEditor, { CodeEditorRef } from './CodeEditor'

interface Template {
  id: number
  name: string
  htmlContent: string
  cssContent?: string
  isDefault: boolean
  isPublic: boolean
  createdAt: string
}

interface TemplateManagerProps {}

export default function TemplateManager({}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState<Template | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const htmlEditorRef = useRef<CodeEditorRef>(null)
  const cssEditorRef = useRef<CodeEditorRef>(null)

  const [previewData, setPreviewData] = useState({
    contactCall: 'BH1ABC',
    contactName: '张三',
    myCall: 'BH9XYZ',
    myName: '李四',
    frequency: '14.205',
    mode: 'SSB',
    date: '2024-01-15',
    time: '13:30',
    rstSent: '59',
    rstReceived: '58',
    band: '20m',
    power: '100W',
    antenna: 'Yagi',
    qth: '北京',
    locator: 'JO62',
    notes: '很愉快的通联'
  })

  const [formData, setFormData] = useState({
    name: '',
    htmlContent: defaultHtmlTemplate,
    cssContent: defaultCssTemplate,
    isPublic: false
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('获取模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates'
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchTemplates()
        resetForm()
        alert(editingTemplate ? '模板更新成功！' : '模板创建成功！')
      } else {
        const error = await response.json()
        alert(error.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      alert('网络错误，请重试')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      htmlContent: template.htmlContent,
      cssContent: template.cssContent || '',
      isPublic: template.isPublic
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个模板吗？')) return
    
    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchTemplates()
        alert('删除成功！')
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('网络错误，请重试')
    }
  }

  const handlePreview = (template: Template) => {
    setShowPreviewModal(template)
  }

  const downloadPNG = async (template: Template) => {
    try {
      // 创建临时的元素用于高质量渲染
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '825px'  // 5.5 inches * 150 DPI
      tempDiv.style.height = '525px'  // 3.5 inches * 150 DPI
      tempDiv.style.background = 'white'
      tempDiv.style.padding = '24px'
      tempDiv.style.boxSizing = 'border-box'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      // 添加CSS样式
      const styleTag = document.createElement('style')
      styleTag.textContent = template.cssContent || defaultCssTemplate
      tempDiv.appendChild(styleTag)
      
      // 添加HTML内容
      const contentDiv = document.createElement('div')
      let html = template.htmlContent
      
      // 替换所有字段
      Object.entries(previewData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        html = html.replace(regex, value)
      })
      
      contentDiv.innerHTML = html
      tempDiv.appendChild(contentDiv)
      document.body.appendChild(tempDiv)

      // 等待样式应用
      await new Promise(resolve => setTimeout(resolve, 100))

      // 使用html2canvas截图
      const canvas = await html2canvas(tempDiv, {
        width: 825,
        height: 525,
        scale: 2, // 高分辨率
        backgroundColor: 'white',
        useCORS: true,
        allowTaint: false
      })
      
      // 清理临时元素
      document.body.removeChild(tempDiv)

      // 下载图片
      const link = document.createElement('a')
      link.download = `${template.name}_QSL_Card.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('生成PNG失败:', error)
      alert('生成PNG失败，请重试')
    }
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setShowForm(false)
    setFormData({
      name: '',
      htmlContent: defaultHtmlTemplate,
      cssContent: defaultCssTemplate,
      isPublic: false
    })
  }

  const insertField = (field: string) => {
    // 使用Monaco Editor的insertText方法
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertText(`{{${field}}}`)
    }
  }

  const renderPreview = (template?: Template) => {
    const htmlContent = template?.htmlContent || formData.htmlContent
    const cssContent = template?.cssContent || formData.cssContent
    
    let html = htmlContent
    
    // 替换所有字段
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, value)
    })

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <style>{cssContent}</style>
        <div 
          ref={previewRef}
          className="p-4"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ 
            minHeight: '400px',
            width: '100%',
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }}
        />
      </div>
    )
  }

  const availableFields = [
    { key: 'contactCall', label: '对方呼号' },
    { key: 'contactName', label: '对方姓名' },
    { key: 'myCall', label: '我的呼号' },
    { key: 'myName', label: '我的姓名' },
    { key: 'frequency', label: '频率' },
    { key: 'mode', label: '模式' },
    { key: 'date', label: '日期' },
    { key: 'time', label: '时间' },
    { key: 'rstSent', label: 'RST发送' },
    { key: 'rstReceived', label: 'RST接收' },
    { key: 'band', label: '波段' },
    { key: 'power', label: '功率' },
    { key: 'antenna', label: '天线' },
    { key: 'qth', label: 'QTH' },
    { key: 'locator', label: '网格定位' },
    { key: 'notes', label: '备注' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          创建模板
        </button>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <div className="flex gap-1">
                {template.isDefault && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    默认
                  </span>
                )}
                {template.isPublic && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    公开
                  </span>
                )}
              </div>
            </div>
            
            {/* 高质量预览缩略图 */}
            <div className="bg-gray-50 border rounded h-40 mb-3 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {renderPreview(template)}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePreview(template)}
                className="text-green-600 hover:text-green-900 text-sm border border-green-200 rounded px-2 py-1 hover:bg-green-50"
              >
                预览
              </button>
              <button
                onClick={() => downloadPNG(template)}
                className="text-purple-600 hover:text-purple-900 text-sm border border-purple-200 rounded px-2 py-1 hover:bg-purple-50"
              >
                下载PNG
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="text-blue-600 hover:text-blue-900 text-sm border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="text-red-600 hover:text-red-900 text-sm border border-red-200 rounded px-2 py-1 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 预览模态框 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">模板预览: {showPreviewModal.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPNG(showPreviewModal)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                  >
                    下载PNG
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 预览数据编辑 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">预览数据 (可编辑)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {availableFields.find(f => f.key === key)?.label || key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setPreviewData({...previewData, [key]: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 全尺寸预览 */}
              <div className="flex justify-center">
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white overflow-auto" style={{ minWidth: '5.5in', minHeight: '3.5in', maxWidth: '100%' }}>
                  {renderPreview(showPreviewModal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editingTemplate ? '编辑模板' : '创建新模板'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {previewMode ? '编辑模式' : '预览模式'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {!previewMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* 左侧：基本信息和字段列表 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模板名称 *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isPublic}
                            onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                            className="mr-2"
                          />
                          <span className="text-sm">公开模板</span>
                        </label>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">可用字段</h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {availableFields.map((field) => (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => insertField(field.key)}
                              className="w-full text-left px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              {field.label} <code className="text-blue-600">{`{{${field.key}}}`}</code>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 中间：HTML编辑器 */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HTML内容 *
                      </label>
                      <CodeEditor
                        ref={htmlEditorRef}
                        value={formData.htmlContent}
                        onChange={(value) => setFormData({...formData, htmlContent: value})}
                        language="html"
                        height={480}
                        placeholder="输入HTML内容，使用 {{字段名}} 插入动态内容"
                      />
                    </div>

                    {/* 右侧：CSS编辑器 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CSS样式 (可选)
                      </label>
                      <CodeEditor
                        ref={cssEditorRef}
                        value={formData.cssContent}
                        onChange={(value) => setFormData({...formData, cssContent: value})}
                        language="css"
                        height={480}
                        placeholder="输入CSS样式..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                    >
                      {editingTemplate ? '更新模板' : '创建模板'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* 预览数据编辑 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">预览数据 (可编辑)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(previewData).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {availableFields.find(f => f.key === key)?.label || key}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setPreviewData({...previewData, [key]: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 预览区域 */}
                  <div>
                    <h4 className="font-medium mb-2">模板预览</h4>
                    {renderPreview()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 默认HTML模板
const defaultHtmlTemplate = `
<div class="qsl-card">
  <div class="card-header">
    <h1>QSL卡片</h1>
    <div class="my-info">
      <div class="call">{{myCall}}</div>
      <div class="name">{{myName}}</div>
    </div>
  </div>
  
  <div class="card-body">
    <div class="contact-info">
      <h2>通联确认</h2>
      <div class="contact-details">
        <div class="field-group">
          <label>对方呼号:</label>
          <span class="value">{{contactCall}}</span>
        </div>
        <div class="field-group">
          <label>对方姓名:</label>
          <span class="value">{{contactName}}</span>
        </div>
        <div class="field-group">
          <label>频率:</label>
          <span class="value">{{frequency}} MHz</span>
        </div>
        <div class="field-group">
          <label>模式:</label>
          <span class="value">{{mode}}</span>
        </div>
        <div class="field-group">
          <label>日期/时间:</label>
          <span class="value">{{date}} {{time}} UTC</span>
        </div>
        <div class="field-group">
          <label>RST:</label>
          <span class="value">发送 {{rstSent}} / 接收 {{rstReceived}}</span>
        </div>
      </div>
    </div>
    
    <div class="additional-info">
      <div class="field-group">
        <label>功率:</label>
        <span class="value">{{power}}</span>
      </div>
      <div class="field-group">
        <label>天线:</label>
        <span class="value">{{antenna}}</span>
      </div>
      <div class="field-group">
        <label>QTH:</label>
        <span class="value">{{qth}}</span>
      </div>
    </div>
    
    <div class="notes">
      <label>备注:</label>
      <p>{{notes}}</p>
    </div>
  </div>
  
  <div class="card-footer">
    <div class="confirm-info">
      <div class="qsl-status">
        <input type="checkbox"> PSE QSL
        <input type="checkbox"> TNX QSL
      </div>
    </div>
  </div>
</div>
`.trim()

// 默认CSS模板
const defaultCssTemplate = `
.qsl-card {
  width: 5.5in;
  height: 3.5in;
  border: 2px solid #333;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #333;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.card-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.my-info {
  text-align: right;
}

.my-info .call {
  font-size: 20px;
  font-weight: bold;
  color: #d32f2f;
}

.my-info .name {
  font-size: 14px;
  color: #666;
}

.card-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.contact-info h2 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #666;
}

.field-group {
  display: flex;
  margin-bottom: 4px;
  font-size: 12px;
}

.field-group label {
  width: 70px;
  font-weight: bold;
  color: #555;
}

.field-group .value {
  color: #333;
  font-weight: 500;
}

.additional-info {
  grid-column: 2;
}

.notes {
  grid-column: 1 / -1;
  margin-top: 8px;
}

.notes label {
  font-weight: bold;
  color: #555;
  font-size: 12px;
}

.notes p {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #333;
}

.card-footer {
  margin-top: 8px;
  border-top: 1px solid #666;
  padding-top: 8px;
}

.qsl-status {
  display: flex;
  gap: 20px;
  font-size: 12px;
  font-weight: bold;
}

.qsl-status input[type="checkbox"] {
  margin-right: 4px;
}
`.trim() 