import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, getAuthCookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码是必填项' },
        { status: 400 }
      )
    }

    // 查找用户（可以使用用户名、邮箱或呼号登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          { callsign: username }
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    })

    // 创建响应并设置Cookie
    const response = NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        callsign: user.callsign,
        name: user.name
      }
    })

    response.cookies.set('auth-token', token, getAuthCookieOptions())

    return response
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后再试' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ message: '登出成功' })
    response.cookies.set('auth-token', '', {
      ...getAuthCookieOptions(),
      maxAge: 0
    })
    return response
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
} 