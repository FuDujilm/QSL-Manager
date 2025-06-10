import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, getAuthCookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, callsign, name } = await request.json()

    // 验证必填字段
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: '邮箱、用户名和密码是必填项' },
        { status: 400 }
      )
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          ...(callsign ? [{ callsign }] : [])
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 })
      }
      if (existingUser.username === username) {
        return NextResponse.json({ error: '该用户名已被使用' }, { status: 400 })
      }
      if (existingUser.callsign === callsign) {
        return NextResponse.json({ error: '该呼号已被注册' }, { status: 400 })
      }
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        callsign: callsign || null,
        name: name || null
      }
    })

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    })

    // 创建响应并设置Cookie
    const response = NextResponse.json({
      message: '注册成功',
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
    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后再试' },
      { status: 500 }
    )
  }
} 