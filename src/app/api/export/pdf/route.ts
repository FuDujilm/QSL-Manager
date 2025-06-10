import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const { templateId, logIds, format = 'A4' } = await request.json()

    if (!templateId || !logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        { error: '模板ID和日志ID列表是必填项' },
        { status: 400 }
      )
    }

    // 获取模板
    const template = await prisma.cardTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: payload.userId },
          { isPublic: true }
        ]
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: '模板不存在或无访问权限' },
        { status: 404 }
      )
    }

    // 获取QSL日志记录
    const logs = await prisma.qslLog.findMany({
      where: {
        id: { in: logIds },
        userId: payload.userId
      },
      include: {
        user: true
      }
    })

    if (logs.length === 0) {
      return NextResponse.json(
        { error: '未找到有效的日志记录' },
        { status: 404 }
      )
    }

    // 生成简单的文本内容作为PDF基础
    const pdfData = {
      title: 'QSL卡片导出',
      template: template.name,
      logs: logs.map((log: any) => ({
        contactCall: log.contactCall,
        contactName: log.contactName,
        myCall: log.user.callsign || log.user.username,
        myName: log.user.name || '',
        frequency: log.frequency,
        mode: log.mode,
        date: log.date.toLocaleDateString('zh-CN'),
        time: log.time,
        rstSent: log.rstSent,
        rstReceived: log.rstReceived,
        band: log.band,
        power: log.power || '',
        antenna: log.antenna || '',
        qth: log.qth || '',
        locator: log.locator || '',
        notes: log.notes || ''
      }))
    }

    // 返回JSON数据，前端使用jsPDF生成PDF
    return NextResponse.json({
      message: 'PDF数据准备完成',
      data: pdfData
    })

  } catch (error) {
    console.error('PDF导出错误:', error)
    return NextResponse.json(
      { error: 'PDF生成失败' },
      { status: 500 }
    )
  }
} 