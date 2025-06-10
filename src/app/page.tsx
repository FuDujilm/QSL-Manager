'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('认证检查失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (userData: any) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
      setUser(null)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                QSL卡片管理系统
              </h1>
              <p className="mt-2 text-center text-sm text-gray-600">
                专为业余无线电爱好者设计的QSL卡片管理工具
              </p>
            </div>
            <AuthForm onLogin={handleLogin} />
          </div>
        </div>
      )}
    </div>
  )
}
