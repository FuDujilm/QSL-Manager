import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 获取用户的QSL日志列表
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where = {
      userId: payload.userId,
      ...(search && {
        OR: [
          { contactCall: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { qth: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [logs, total] = await Promise.all([
      prisma.qslLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              username: true,
              callsign: true
            }
          }
        }
      }),
      prisma.qslLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取QSL日志错误:', error)
    return NextResponse.json(
      { error: '获取日志失败' },
      { status: 500 }
    )
  }
}

// 创建新的QSL日志记录
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

    const {
      contactCall,
      contactName,
      frequency,
      mode,
      date,
      time,
      rstSent,
      rstReceived,
      band,
      power,
      antenna,
      qth,
      locator,
      notes
    } = await request.json()

    // 验证必填字段
    if (!contactCall || !frequency || !mode || !date || !time || !rstSent || !rstReceived || !band) {
      return NextResponse.json(
        { error: '对方呼号、频率、模式、日期、时间、RST报告和波段是必填项' },
        { status: 400 }
      )
    }

    const qslLog = await prisma.qslLog.create({
      data: {
        userId: payload.userId,
        contactCall: contactCall.toUpperCase(),
        contactName,
        frequency,
        mode: mode.toUpperCase(),
        date: new Date(date),
        time,
        rstSent,
        rstReceived,
        band: band.toUpperCase(),
        power,
        antenna,
        qth,
        locator,
        notes
      },
      include: {
        user: {
          select: {
            username: true,
            callsign: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'QSL日志创建成功',
      log: qslLog
    })
  } catch (error) {
    console.error('创建QSL日志错误:', error)
    return NextResponse.json(
      { error: '创建日志失败' },
      { status: 500 }
    )
  }
} 