import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 更新QSL日志
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    const logId = parseInt(params.id)
    if (isNaN(logId)) {
      return NextResponse.json({ error: '无效的日志ID' }, { status: 400 })
    }

    // 检查日志是否存在且属于当前用户
    const existingLog = await prisma.qslLog.findUnique({
      where: { id: logId }
    })

    if (!existingLog || existingLog.userId !== payload.userId) {
      return NextResponse.json({ error: '日志不存在或无权限访问' }, { status: 404 })
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

    // 更新日志
    const updatedLog = await prisma.qslLog.update({
      where: { id: logId },
      data: {
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
      message: 'QSL日志更新成功',
      log: updatedLog
    })

  } catch (error) {
    console.error('更新QSL日志失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除QSL日志
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    const logId = parseInt(params.id)
    if (isNaN(logId)) {
      return NextResponse.json({ error: '无效的日志ID' }, { status: 400 })
    }

    // 检查日志是否存在且属于当前用户
    const existingLog = await prisma.qslLog.findUnique({
      where: { id: logId }
    })

    if (!existingLog || existingLog.userId !== payload.userId) {
      return NextResponse.json({ error: '日志不存在或无权限访问' }, { status: 404 })
    }

    // 删除日志
    await prisma.qslLog.delete({
      where: { id: logId }
    })

    return NextResponse.json({
      message: 'QSL日志删除成功'
    })

  } catch (error) {
    console.error('删除QSL日志失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 