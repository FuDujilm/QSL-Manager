import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 获取用户的卡片模板列表
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
    const includePublic = searchParams.get('includePublic') === 'true'

    const where = includePublic
      ? {
          OR: [
            { userId: payload.userId },
            { isPublic: true }
          ]
        }
      : { userId: payload.userId }

    const templates = await prisma.cardTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            username: true,
            callsign: true
          }
        }
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('获取模板错误:', error)
    return NextResponse.json(
      { error: '获取模板失败' },
      { status: 500 }
    )
  }
}

// 创建新的卡片模板
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
      name,
      description,
      htmlContent,
      cssContent,
      isDefault,
      isPublic
    } = await request.json()

    // 验证必填字段
    if (!name || !htmlContent) {
      return NextResponse.json(
        { error: '模板名称和HTML内容是必填项' },
        { status: 400 }
      )
    }

    // 如果设置为默认模板，先取消其他默认模板
    if (isDefault) {
      await prisma.cardTemplate.updateMany({
        where: {
          userId: payload.userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    const template = await prisma.cardTemplate.create({
      data: {
        userId: payload.userId,
        name,
        description,
        htmlContent,
        cssContent: cssContent || '',
        isDefault: isDefault || false,
        isPublic: isPublic || false
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
      message: '模板创建成功',
      template
    })
  } catch (error) {
    console.error('创建模板错误:', error)
    return NextResponse.json(
      { error: '创建模板失败' },
      { status: 500 }
    )
  }
} 