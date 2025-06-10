'use client'

import { useState } from 'react'
import QslLogManager from '@/components/QslLogManager'
import TemplateManager from '@/components/TemplateManager'
import UserProfile from '@/components/UserProfile'

interface DashboardProps {
  user: any
  onLogout: () => void
}

type TabType = 'logs' | 'templates' | 'profile'

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('logs')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs = [
    { id: 'logs' as TabType, name: 'QSL日志', icon: '📻' },
    { id: 'templates' as TabType, name: '卡片模板', icon: '🎨' },
    { id: 'profile' as TabType, name: '个人资料', icon: '👤' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'logs':
        return <QslLogManager user={user} />
      case 'templates':
        return <TemplateManager user={user} />
      case 'profile':
        return <UserProfile user={user} />
      default:
        return <QslLogManager user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">QSL管理</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mr-3">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>

          <div className="px-4 py-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-gray-500">
                  {user.callsign || user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="mr-3">🚪</span>
              登出
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 lg:ml-0">
        {/* 移动端头部 */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* 页面内容 */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
              <p className="mt-1 text-gray-600">
                {activeTab === 'logs' && '管理您的QSL通联记录'}
                {activeTab === 'templates' && '设计和管理QSL卡片模板'}
                {activeTab === 'profile' && '管理您的个人信息'}
              </p>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 