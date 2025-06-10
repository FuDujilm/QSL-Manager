'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface AuthFormProps {
  onLogin: (userData: any) => void
}

interface LoginFormData {
  username: string
  password: string
}

interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  callsign?: string
  name?: string
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loginForm = useForm<LoginFormData>()
  const registerForm = useForm<RegisterFormData>()

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        onLogin(result.user)
      } else {
        setError(result.error || '登录失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          callsign: data.callsign,
          name: data.name
        })
      })

      const result = await response.json()

      if (response.ok) {
        onLogin(result.user)
      } else {
        setError(result.error || '注册失败')
      }
    } catch (error) {
      setError('网络错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex mb-6">
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-center font-medium rounded-l-md ${
            isLogin
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setIsLogin(true)}
        >
          登录
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-center font-medium rounded-r-md ${
            !isLogin
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setIsLogin(false)}
        >
          注册
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLogin ? (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名/邮箱/呼号
            </label>
            <input
              type="text"
              {...loginForm.register('username', { required: '请输入用户名' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名、邮箱或呼号"
            />
            {loginForm.formState.errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {loginForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              {...loginForm.register('password', { required: '请输入密码' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
            />
            {loginForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      ) : (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱 *
            </label>
            <input
              type="email"
              {...registerForm.register('email', { 
                required: '请输入邮箱',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入邮箱"
            />
            {registerForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {registerForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名 *
            </label>
            <input
              type="text"
              {...registerForm.register('username', { 
                required: '请输入用户名',
                minLength: { value: 3, message: '用户名至少3个字符' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
            />
            {registerForm.formState.errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {registerForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              呼号 (可选)
            </label>
            <input
              type="text"
              {...registerForm.register('callsign')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入业余无线电呼号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名 (可选)
            </label>
            <input
              type="text"
              {...registerForm.register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入真实姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 *
            </label>
            <input
              type="password"
              {...registerForm.register('password', { 
                required: '请输入密码',
                minLength: { value: 6, message: '密码至少6个字符' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
            />
            {registerForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码 *
            </label>
            <input
              type="password"
              {...registerForm.register('confirmPassword', { required: '请确认密码' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请再次输入密码"
            />
            {registerForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {registerForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
      )}
    </div>
  )
} 