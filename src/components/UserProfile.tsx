'use client'

import React, { useState, useEffect } from 'react'

interface User {
  id: number
  email: string
  name: string
  callsign: string
  qth: string | null
  locator: string | null
  power: string | null
  antenna: string | null
  createdAt: string
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    callsign: '',
    qth: '',
    locator: '',
    power: '',
    antenna: ''
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          name: data.user.name || '',
          callsign: data.user.callsign || '',
          qth: data.user.qth || '',
          locator: data.user.locator || '',
          power: data.user.power || '',
          antenna: data.user.antenna || ''
        })
      } else {
        console.error('获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    if (user) {
      setFormData({
        name: user.name || '',
        callsign: user.callsign || '',
        qth: user.qth || '',
        locator: user.locator || '',
        power: user.power || '',
        antenna: user.antenna || ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          callSign: formData.callsign,
          qth: formData.qth,
          locator: formData.locator,
          power: formData.power,
          antenna: formData.antenna
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setEditing(false)
        alert('个人资料更新成功！')
      } else {
        const error = await response.json()
        alert(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新个人资料失败:', error)
      alert('网络错误，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">无法加载用户信息</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">个人资料</h2>
        {!editing && (
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            编辑资料
          </button>
        )}
      </div>

      {!editing ? (
        // 显示模式
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                注册时间
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {new Date(user.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {user.name || '未设置'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                呼号 *
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded font-mono">
                {user.callsign || '未设置'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QTH (地理位置)
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {user.qth || '未设置'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网格定位 (Locator)
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded font-mono">
                {user.locator || '未设置'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发射功率
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {user.power || '未设置'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                天线类型
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {user.antenna || '未设置'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // 编辑模式
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">邮箱地址不可修改</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                注册时间
              </label>
              <input
                type="text"
                value={new Date(user.createdAt).toLocaleDateString('zh-CN')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                呼号 *
              </label>
              <input
                type="text"
                required
                value={formData.callsign}
                onChange={(e) => setFormData({...formData, callsign: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="例如: BH1ABC"
              />
              <p className="text-xs text-gray-500 mt-1">只能包含大写字母和数字</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QTH (地理位置)
              </label>
              <input
                type="text"
                value={formData.qth}
                onChange={(e) => setFormData({...formData, qth: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 北京市海淀区"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网格定位 (Locator)
              </label>
              <input
                type="text"
                value={formData.locator}
                onChange={(e) => setFormData({...formData, locator: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="例如: OM92ab12"
              />
              <p className="text-xs text-gray-500 mt-1">格式: OM92 或 OM92ab12</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发射功率
              </label>
              <input
                type="text"
                value={formData.power}
                onChange={(e) => setFormData({...formData, power: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 100W"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                天线类型
              </label>
              <input
                type="text"
                value={formData.antenna}
                onChange={(e) => setFormData({...formData, antenna: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: Yagi, Dipole, Vertical"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              保存更改
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 