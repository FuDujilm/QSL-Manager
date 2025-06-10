'use client'

import React, { useState, useEffect } from 'react'
import PDFExportDialog from './PDFExportDialog'

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
  qslSent?: boolean
  qslReceived?: boolean
  createdAt?: string
}

interface QslLogManagerProps {}

export default function QslLogManager({}: QslLogManagerProps) {
  const [logs, setLogs] = useState<QslLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState<QslLog | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showUpload, setShowUpload] = useState(false)
  const [showPDFExport, setShowPDFExport] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    contactCall: '',
    contactName: '',
    frequency: '',
    mode: 'SSB',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    rstSent: '59',
    rstReceived: '59',
    band: '',
    power: '',
    antenna: '',
    qth: '',
    locator: '',
    notes: '',
    qslSent: false,
    qslReceived: false
  })

  useEffect(() => {
    fetchLogs()
  }, [currentPage, searchTerm])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        search: searchTerm
      })
      
      const response = await fetch(`/api/qsl?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('获取日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingLog ? `/api/qsl/${editingLog.id}` : '/api/qsl'
      const method = editingLog ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchLogs()
        resetForm()
        alert(editingLog ? '日志更新成功！' : '日志添加成功！')
      } else {
        const error = await response.json()
        alert(error.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      alert('网络错误，请重试')
    }
  }

  const handleEdit = (log: QslLog) => {
    setEditingLog(log)
    setFormData({
      contactCall: log.contactCall,
      contactName: log.contactName,
      frequency: log.frequency,
      mode: log.mode,
      date: log.date,
      time: log.time,
      rstSent: log.rstSent,
      rstReceived: log.rstReceived,
      band: log.band || '',
      power: log.power || '',
      antenna: log.antenna || '',
      qth: log.qth || '',
      locator: log.locator || '',
      notes: log.notes || '',
      qslSent: log.qslSent || false,
      qslReceived: log.qslReceived || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条日志吗？')) return
    
    try {
      const response = await fetch(`/api/qsl/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchLogs()
        alert('删除成功！')
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('网络错误，请重试')
    }
  }

  const resetForm = () => {
    setEditingLog(null)
    setShowForm(false)
    setFormData({
      contactCall: '',
      contactName: '',
      frequency: '',
      mode: 'SSB',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      rstSent: '59',
      rstReceived: '59',
      band: '',
      power: '',
      antenna: '',
      qth: '',
      locator: '',
      notes: '',
      qslSent: false,
      qslReceived: false
    })
  }

  const handleSelectLog = (id: number) => {
    setSelectedLogs(prev => 
      prev.includes(id) 
        ? prev.filter(logId => logId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([])
    } else {
      setSelectedLogs(logs.map(log => log.id))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 这里可以添加CSV/ADIF文件解析逻辑
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/qsl/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchLogs()
        alert('文件上传成功！')
        setShowUpload(false)
      } else {
        const error = await response.json()
        alert(error.error || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('网络错误，请重试')
    }
  }

  const handleExportPDF = () => {
    if (selectedLogs.length === 0) {
      alert('请至少选择一条QSL日志记录进行导出')
      return
    }
    setShowPDFExport(true)
  }

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
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            添加日志
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            上传文件
          </button>
          <button
            onClick={handleExportPDF}
            disabled={selectedLogs.length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
          >
            导出PDF ({selectedLogs.length})
          </button>
        </div>
        
        <input
          type="text"
          placeholder="搜索呼号、姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 文件上传模态框 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">上传QSL日志文件</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件 (支持CSV、ADIF格式)
                </label>
                <input
                  type="file"
                  accept=".csv,.adi,.adif"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p>• CSV格式：呼号,姓名,频率,模式,日期,时间,RST发送,RST接收</p>
                <p>• ADIF格式：标准业余无线电数据交换格式</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日志表格 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  呼号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期/时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  频率/模式
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RST
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QSL状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={() => handleSelectLog(log.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.contactCall}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.contactName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.date} {log.time}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.frequency} {log.mode}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.rstSent}/{log.rstReceived}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-1">
                      <span className={`px-2 py-1 text-xs rounded ${log.qslSent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.qslSent ? '已发送' : '未发送'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${log.qslReceived ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.qslReceived ? '已接收' : '未接收'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-2">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingLog ? '编辑日志' : '添加新日志'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    对方呼号 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactCall}
                    onChange={(e) => setFormData({...formData, contactCall: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    对方姓名
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    频率 (MHz) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: 14.205"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模式 *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({...formData, mode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="SSB">SSB</option>
                    <option value="CW">CW</option>
                    <option value="FM">FM</option>
                    <option value="FT8">FT8</option>
                    <option value="FT4">FT4</option>
                    <option value="PSK31">PSK31</option>
                    <option value="RTTY">RTTY</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    时间 (UTC) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RST发送 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rstSent}
                    onChange={(e) => setFormData({...formData, rstSent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RST接收 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rstReceived}
                    onChange={(e) => setFormData({...formData, rstReceived: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    波段
                  </label>
                  <input
                    type="text"
                    value={formData.band}
                    onChange={(e) => setFormData({...formData, band: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: 20m"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    功率
                  </label>
                  <input
                    type="text"
                    value={formData.power}
                    onChange={(e) => setFormData({...formData, power: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: 100W"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    天线
                  </label>
                  <input
                    type="text"
                    value={formData.antenna}
                    onChange={(e) => setFormData({...formData, antenna: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: Yagi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QTH
                  </label>
                  <input
                    type="text"
                    value={formData.qth}
                    onChange={(e) => setFormData({...formData, qth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: 北京"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    网格定位
                  </label>
                  <input
                    type="text"
                    value={formData.locator}
                    onChange={(e) => setFormData({...formData, locator: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如: JO62"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QSL发送状态
                  </label>
                  <select
                    value={formData.qslSent ? 'sent' : 'not_sent'}
                    onChange={(e) => setFormData({...formData, qslSent: e.target.value === 'sent'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="not_sent">未发送</option>
                    <option value="sent">已发送</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QSL接收状态
                  </label>
                  <select
                    value={formData.qslReceived ? 'received' : 'not_received'}
                    onChange={(e) => setFormData({...formData, qslReceived: e.target.value === 'received'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="not_received">未接收</option>
                    <option value="received">已接收</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="通联备注信息"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {editingLog ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF导出对话框 */}
      <PDFExportDialog
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        selectedLogs={logs.filter(log => selectedLogs.includes(log.id))}
      />
    </div>
  )
} 