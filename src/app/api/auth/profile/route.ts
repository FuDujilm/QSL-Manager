import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 获取用户个人资料
export async function GET(request: NextRequest) {
  try {
    // 获取认证token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 验证token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 })
    }

    const userId = payload.userId

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        callsign: true,
        qth: true,
        locator: true,
        power: true,
        antenna: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      user
    })

  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 获取认证token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 验证token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 })
    }

    const userId = payload.userId

    // 获取请求数据
    const body = await request.json()
    const { name, callSign, qth, locator, power, antenna } = body

    // 验证必填字段
    if (!name || !callSign) {
      return NextResponse.json({ 
        error: '姓名和呼号为必填字段' 
      }, { status: 400 })
    }

    // 验证呼号格式（基本验证）
    const callSignRegex = /^[A-Z0-9]+$/
    if (!callSignRegex.test(callSign)) {
      return NextResponse.json({ 
        error: '呼号格式不正确，只能包含大写字母和数字' 
      }, { status: 400 })
    }

    // 验证网格定位格式（如果提供）
    if (locator) {
      const locatorRegex = /^[A-R]{2}[0-9]{2}([A-X]{2}[0-9]{2})?$/
      if (!locatorRegex.test(locator)) {
        return NextResponse.json({ 
          error: '网格定位格式不正确，应为类似 OM92 或 OM92ab12 的格式' 
        }, { status: 400 })
      }
    }

    // 检查呼号是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        callsign: callSign,
        id: { not: userId }
      }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: '该呼号已被其他用户使用' 
      }, { status: 400 })
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        callsign: callSign,
        qth: qth || null,
        locator: locator || null,
        power: power || null,
        antenna: antenna || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        callsign: true,
        qth: true,
        locator: true,
        power: true,
        antenna: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: '个人资料更新成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 