import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 更新模板
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

    const templateId = parseInt(params.id)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: '无效的模板ID' }, { status: 400 })
    }

    // 检查模板是否存在且属于当前用户
    const existingTemplate = await prisma.cardTemplate.findUnique({
      where: { id: templateId }
    })

    if (!existingTemplate || existingTemplate.userId !== payload.userId) {
      return NextResponse.json({ error: '模板不存在或无权限访问' }, { status: 404 })
    }

    const body = await request.json()
    const { name, htmlContent, cssContent, isPublic } = body

    // 验证必填字段
    if (!name || !htmlContent) {
      return NextResponse.json(
        { error: '模板名称和HTML内容为必填字段' },
        { status: 400 }
      )
    }

    // 更新模板
    const updatedTemplate = await prisma.cardTemplate.update({
      where: { id: templateId },
      data: {
        name,
        htmlContent,
        cssContent: cssContent || '',
        isPublic: Boolean(isPublic)
      }
    })

    return NextResponse.json({
      message: '模板更新成功',
      template: updatedTemplate
    })

  } catch (error) {
    console.error('更新模板失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除模板
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

    const templateId = parseInt(params.id)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: '无效的模板ID' }, { status: 400 })
    }

    // 检查模板是否存在且属于当前用户
    const existingTemplate = await prisma.cardTemplate.findUnique({
      where: { id: templateId }
    })

    if (!existingTemplate || existingTemplate.userId !== payload.userId) {
      return NextResponse.json({ error: '模板不存在或无权限访问' }, { status: 404 })
    }

    // 删除模板
    await prisma.cardTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({
      message: '模板删除成功'
    })

  } catch (error) {
    console.error('删除模板失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 