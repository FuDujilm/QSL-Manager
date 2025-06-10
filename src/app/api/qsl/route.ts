import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 获取QSL日志列表
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const search = url.searchParams.get('search') || ''

    const where = {
      userId: payload.userId,
      ...(search && {
        OR: [
          { contactCall: { contains: search } },
          { contactName: { contains: search } },
          { band: { contains: search } },
          { mode: { contains: search } }
        ]
      })
    }

    // 获取总数
    const total = await prisma.qslLog.count({ where })

    // 获取分页数据
    const logs = await prisma.qslLog.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })

  } catch (error) {
    console.error('获取QSL日志失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新的QSL日志
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    const body = await request.json()
    const {
      contactCall,
      contactName,
      date,
      time,
      band,
      mode,
      frequency,
      rstSent,
      rstReceived,
      qth,
      locator,
      notes,
      qslSent,
      qslReceived,
      power,
      antenna
    } = body

    // 验证必填字段
    if (!contactCall || !date) {
      return NextResponse.json(
        { error: '呼号和联络日期为必填字段' },
        { status: 400 }
      )
    }

    // 创建新的QSL日志
    const newLog = await prisma.qslLog.create({
      data: {
        userId: payload.userId,
        contactCall,
        contactName: contactName || '',
        date,
        time: time || '',
        band: band || '',
        mode: mode || '',
        frequency: frequency || '',
        rstSent: rstSent || '',
        rstReceived: rstReceived || '',
        qth: qth || '',
        locator: locator || '',
        notes: notes || '',
        power: power || '',
        antenna: antenna || '',
        qslSent: Boolean(qslSent),
        qslReceived: Boolean(qslReceived)
      }
    })

    return NextResponse.json({
      message: 'QSL日志创建成功',
      log: newLog
    })

  } catch (error) {
    console.error('创建QSL日志失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 