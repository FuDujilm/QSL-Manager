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

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    const text = await file.text()
    const logs: any[] = []

    if (file.name.toLowerCase().endsWith('.csv')) {
      // 解析CSV格式
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length >= 6) { // 至少需要基本字段
          const log = {
            contactCall: values[0] || '',
            contactName: values[1] || '',
            frequency: values[2] || '',
            mode: values[3] || 'SSB',
            date: values[4] || new Date().toISOString().split('T')[0],
            time: values[5] || '00:00',
            rstSent: values[6] || '59',
            rstReceived: values[7] || '59',
            band: values[8] || '',
            power: values[9] || '',
            antenna: values[10] || '',
            qth: values[11] || '',
            locator: values[12] || '',
            notes: values[13] || '',
            userId: payload.userId
          }
          if (log.contactCall) {
            logs.push(log)
          }
        }
      }
    } else if (file.name.toLowerCase().includes('.adi')) {
      // 解析ADIF格式 (简化版本)
      const records = text.split('<eor>').filter(record => record.trim())
      
      for (const record of records) {
        const log: any = { userId: payload.userId }
        
        // 匹配ADIF字段
        const matches = record.match(/<(\w+):(\d+)>([^<]*)/g)
        if (matches) {
          for (const match of matches) {
            const fieldMatch = match.match(/<(\w+):(\d+)>([^<]*)/)
            if (fieldMatch) {
              const [, field, length, value] = fieldMatch
              switch (field.toLowerCase()) {
                case 'call':
                  log.contactCall = value.trim()
                  break
                case 'name':
                  log.contactName = value.trim()
                  break
                case 'freq':
                  log.frequency = value.trim()
                  break
                case 'mode':
                  log.mode = value.trim()
                  break
                case 'qso_date':
                  // ADIF日期格式：YYYYMMDD
                  const date = value.trim()
                  if (date.length === 8) {
                    log.date = `${date.substr(0,4)}-${date.substr(4,2)}-${date.substr(6,2)}`
                  }
                  break
                case 'time_on':
                  // ADIF时间格式：HHMMSS
                  const time = value.trim()
                  if (time.length >= 4) {
                    log.time = `${time.substr(0,2)}:${time.substr(2,2)}`
                  }
                  break
                case 'rst_sent':
                  log.rstSent = value.trim()
                  break
                case 'rst_rcvd':
                  log.rstReceived = value.trim()
                  break
                case 'band':
                  log.band = value.trim()
                  break
                case 'tx_pwr':
                  log.power = value.trim()
                  break
                case 'ant_az':
                case 'ant_el':
                  log.antenna = (log.antenna || '') + ' ' + value.trim()
                  break
                case 'qth':
                  log.qth = value.trim()
                  break
                case 'gridsquare':
                  log.locator = value.trim()
                  break
                case 'comment':
                  log.notes = value.trim()
                  break
              }
            }
          }
        }
        
        // 设置默认值
        if (!log.date) log.date = new Date().toISOString().split('T')[0]
        if (!log.time) log.time = '00:00'
        if (!log.rstSent) log.rstSent = '59'
        if (!log.rstReceived) log.rstReceived = '59'
        if (!log.mode) log.mode = 'SSB'
        if (!log.contactName) log.contactName = ''
        if (!log.frequency) log.frequency = ''
        
        if (log.contactCall) {
          logs.push(log)
        }
      }
    } else {
      return NextResponse.json({ error: '不支持的文件格式' }, { status: 400 })
    }

    if (logs.length === 0) {
      return NextResponse.json({ error: '文件中没有找到有效的日志记录' }, { status: 400 })
    }

    // 批量插入数据库
    const createdLogs = await prisma.qslLog.createMany({
      data: logs,
      skipDuplicates: true
    })

    return NextResponse.json({
      message: `成功导入 ${createdLogs.count} 条日志记录`,
      imported: createdLogs.count,
      total: logs.length
    })

  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json(
      { error: '文件处理失败' },
      { status: 500 }
    )
  }
} 