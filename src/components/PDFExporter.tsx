'use client'

import React from 'react'

interface PDFExporterProps {
  logs: any[]
  templateName: string
  onExport?: () => void
}

export default function PDFExporter({ logs, templateName, onExport }: PDFExporterProps) {
  const handleExportPDF = async () => {
    try {
      // 动态导入jsPDF和autoTable
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // 设置字体以支持中文字符
      // 尝试使用基础字体，但添加中文支持
      try {
        // 使用UTF-8编码以支持中文
        doc.setFont('helvetica')
        doc.setCharSpace(0.5) // 调整字符间距
      } catch (fontError) {
        console.warn('字体设置警告:', fontError)
        doc.setFont('helvetica') // 使用默认字体
      }
      
      // 添加标题 - 使用Unicode编码确保中文显示
      doc.setFontSize(20)
      const title = 'QSL卡片导出'
      doc.text(title, 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      const templateText = `模板: ${templateName}`
      const dateText = `导出时间: ${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN')}`
      const countText = `总计: ${logs.length} 条记录`
      
      doc.text(templateText, 20, 35)
      doc.text(dateText, 20, 45)  
      doc.text(countText, 20, 55)
      
      // 创建表格数据
      const tableData = logs.map((log, index) => [
        (index + 1).toString(),
        log.contactCall || '',
        log.contactName || '',
        log.frequency || '',
        log.mode || '',
        log.date || '',
        log.time || '',
        `${log.rstSent || ''}/${log.rstReceived || ''}`,
        log.power || '',
        log.antenna || '',
        log.qth || '',
        log.notes || ''
      ])
      
      // 表头使用拼音或英文，以避免字体问题
      const headers = ['#', 'Call', 'Name', 'Freq', 'Mode', 'Date', 'Time', 'RST', 'Power', 'Ant', 'QTH', 'Notes']
      
      // 使用autoTable创建表格
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 65,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica',
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: 'left',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // #
          1: { cellWidth: 20 }, // 呼号
          2: { cellWidth: 15 }, // 姓名
          3: { cellWidth: 15 }, // 频率
          4: { cellWidth: 12 }, // 模式
          5: { cellWidth: 18 }, // 日期
          6: { cellWidth: 12 }, // 时间
          7: { cellWidth: 15 }, // RST
          8: { cellWidth: 12 }, // 功率
          9: { cellWidth: 15 }, // 天线
          10: { cellWidth: 20 }, // QTH
          11: { cellWidth: 25 }  // 备注
        },
        margin: { top: 65, left: 10, right: 10 },
        didDrawPage: (data) => {
          // 添加页码
          const pageCount = (doc as any).internal.getNumberOfPages()
          doc.setFontSize(8)
          const pageText = `Page ${data.pageNumber} of ${pageCount}`
          doc.text(
            pageText,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
          )
        }
      })
      
      // 添加页脚信息
      const finalY = (doc as any).lastAutoTable.finalY || 100
      if (finalY < doc.internal.pageSize.height - 50) {
        doc.setFontSize(10)
        doc.text('QSL Card Management System', 20, finalY + 20)
        doc.text(`Generated: ${new Date().toISOString()}`, 20, finalY + 30)
      }
      
      // 保存PDF
      const fileName = `QSL-Export-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      if (onExport) {
        onExport()
      }
      
    } catch (error) {
      console.error('PDF导出失败:', error)
      alert('PDF导出失败，请重试')
    }
  }

  return (
    <button
      onClick={handleExportPDF}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      disabled={logs.length === 0}
    >
      📄 导出PDF ({logs.length}条记录)
    </button>
  )
} 