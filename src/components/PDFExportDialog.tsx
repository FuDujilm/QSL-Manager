'use client'

import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'

interface QslLog {
  id: number
  contactCall: string
  contactName: string
  frequency: string
  mode: string
  date: string
  time: string
  rstSent: string
  rstReceived: string
  band: string
  power: string
  antenna: string
  qth: string
  locator: string
  notes: string
}

interface Template {
  id: number
  name: string
  htmlContent: string
  cssContent?: string
}

interface User {
  callSign: string
  name: string
  qth: string
  locator: string
  power: string
  antenna: string
}

interface PDFExportDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedLogs?: QslLog[]
}

export default function PDFExportDialog({ isOpen, onClose, selectedLogs = [] }: PDFExportDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [cardsPerPage, setCardsPerPage] = useState(1)
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4')

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      fetchUserProfile()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        // 选择默认模板
        const defaultTemplate = data.templates?.find((t: Template) => t.name.includes('默认'))
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id)
        }
      }
    } catch (error) {
      console.error('获取模板失败:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const generatePDF = async () => {
    if (!selectedTemplate || selectedLogs.length === 0) {
      alert('请选择模板和至少一条QSL日志记录')
      return
    }

    setLoading(true)
    try {
      const template = templates.find(t => t.id === selectedTemplate)
      if (!template || !user) return

      // 创建PDF文档
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: paperSize === 'A4' ? [11.7, 8.3] : [11, 8.5]
      })

      // 设置字体（支持中文）
      pdf.setFont('helvetica')

      let cardCount = 0
      const maxCardsPerPage = cardsPerPage

      for (const log of selectedLogs) {
        // 新页面
        if (cardCount > 0 && cardCount % maxCardsPerPage === 0) {
          pdf.addPage()
        }

        // 计算卡片位置
        const cardIndex = cardCount % maxCardsPerPage
        const cardsPerRow = Math.ceil(Math.sqrt(maxCardsPerPage))
        const cardWidth = 5.5
        const cardHeight = 3.5
        const marginX = (pdf.internal.pageSize.getWidth() - cardsPerRow * cardWidth) / (cardsPerRow + 1)
        const marginY = (pdf.internal.pageSize.getHeight() - Math.ceil(maxCardsPerPage / cardsPerRow) * cardHeight) / (Math.ceil(maxCardsPerPage / cardsPerRow) + 1)
        
        const row = Math.floor(cardIndex / cardsPerRow)
        const col = cardIndex % cardsPerRow
        const x = marginX + col * (cardWidth + marginX)
        const y = marginY + row * (cardHeight + marginY)

        // 绘制卡片边框
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.02)
        pdf.rect(x, y, cardWidth, cardHeight)

        // 填充数据
        const cardData = {
          contactCall: log.contactCall,
          contactName: log.contactName,
          myCall: user.callSign || '',
          myName: user.name || '',
          frequency: log.frequency,
          mode: log.mode,
          date: log.date,
          time: log.time,
          rstSent: log.rstSent,
          rstReceived: log.rstReceived,
          band: log.band,
          power: log.power || user.power || '',
          antenna: log.antenna || user.antenna || '',
          qth: log.qth || user.qth || '',
          locator: log.locator || user.locator || '',
          notes: log.notes
        }

        // 绘制卡片内容
        drawQSLCard(pdf, cardData, x, y, cardWidth, cardHeight)
        cardCount++
      }

      // 保存PDF
      const fileName = `QSL卡片_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      alert(`PDF导出成功！共生成 ${selectedLogs.length} 张QSL卡片`)
      onClose()

    } catch (error) {
      console.error('PDF生成失败:', error)
      alert('PDF生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const drawQSLCard = (pdf: jsPDF, data: any, x: number, y: number, width: number, height: number) => {
    // 设置字体大小
    pdf.setFontSize(10)
    
    // 标题
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('QSL CARD', x + width/2, y + 0.3, { align: 'center' })
    
    // 我的信息（右上角）
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.myCall, x + width - 0.1, y + 0.3, { align: 'right' })
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.myName, x + width - 0.1, y + 0.5, { align: 'right' })
    
    // 通联确认标题
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('CONFIRMING QSO WITH', x + 0.1, y + 0.8)
    
    // 对方信息
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.contactCall, x + 0.1, y + 1.1)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    if (data.contactName) {
      pdf.text(data.contactName, x + 0.1, y + 1.3)
    }
    
    // 通联详情
    const details = [
      `Date: ${data.date}`,
      `Time: ${data.time} UTC`,
      `Freq: ${data.frequency} MHz`,
      `Mode: ${data.mode}`,
      `RST: ${data.rstSent}/${data.rstReceived}`
    ]
    
    pdf.setFontSize(8)
    let detailY = y + 1.6
    details.forEach(detail => {
      pdf.text(detail, x + 0.1, detailY)
      detailY += 0.15
    })
    
    // 技术信息
    const techInfo = [
      data.power ? `Power: ${data.power}` : '',
      data.antenna ? `Ant: ${data.antenna}` : '',
      data.qth ? `QTH: ${data.qth}` : ''
    ].filter(Boolean)
    
    let techY = y + 1.6
    techInfo.forEach(info => {
      pdf.text(info, x + width/2 + 0.2, techY)
      techY += 0.15
    })
    
    // 确认信息
    pdf.setFontSize(8)
    pdf.text('☐ PSE QSL', x + 0.1, y + height - 0.4)
    pdf.text('☐ TNX QSL', x + 1.5, y + height - 0.4)
    
    // 日期线
    pdf.line(x + width - 2, y + height - 0.4, x + width - 0.1, y + height - 0.4)
    pdf.text('Date', x + width - 1, y + height - 0.2)
    
    // 备注
    if (data.notes) {
      pdf.setFontSize(7)
      const notesLines = pdf.splitTextToSize(data.notes, width - 0.4)
      pdf.text(notesLines, x + 0.1, y + height - 0.8)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">导出QSL卡片为PDF</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* 选中的日志数量 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700">
                已选择 <strong>{selectedLogs.length}</strong> 条QSL日志记录进行导出
              </p>
            </div>

            {/* 模板选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择卡片模板 *
              </label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择模板</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  纸张大小
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as 'A4' | 'Letter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每页卡片数
                </label>
                <select
                  value={cardsPerPage}
                  onChange={(e) => setCardsPerPage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1张/页</option>
                  <option value={2}>2张/页</option>
                  <option value={4}>4张/页</option>
                </select>
              </div>
            </div>

            {/* 预览信息 */}
            {selectedLogs.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium mb-2">导出预览</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• 总卡片数: {selectedLogs.length} 张</p>
                  <p>• 预计页数: {Math.ceil(selectedLogs.length / cardsPerPage)} 页</p>
                  <p>• 纸张格式: {paperSize} ({cardsPerPage}张/页)</p>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={generatePDF}
                disabled={loading || !selectedTemplate || selectedLogs.length === 0}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded"
              >
                {loading ? '正在生成PDF...' : '生成PDF'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 