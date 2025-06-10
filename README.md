# QSL卡片管理系统

一个基于Next.js的现代化QSL卡片管理系统，为业余无线电爱好者提供完整的QSL卡片创建、管理和导出功能。

## 🌟 主要功能

### 📋 QSL日志管理
- **完整的CRUD操作**：创建、读取、更新、删除QSL通联记录
- **可编辑表格**：双击单元格即可编辑，支持实时保存
- **批量操作**：支持选择多条记录进行批量删除或导出
- **搜索与过滤**：按呼号、姓名等字段快速搜索
- **文件上传**：支持CSV和ADIF格式的日志文件导入
- **分页显示**：高效处理大量日志数据

### 🎨 卡片模板设计
- **HTML/CSS编辑器**：内置代码编辑器，支持完全自定义设计
- **实时预览**：编辑时即时查看卡片效果
- **字段插入**：一键插入动态字段，支持所有QSL标准字段
- **模板管理**：创建、编辑、删除、分享模板
- **预设模板**：提供专业的默认模板作为起点

### 📄 PDF导出功能
- **批量导出**：选择多个日志记录，一次生成多张QSL卡片
- **多种布局**：支持1张/页、2张/页、4张/页等布局选项
- **标准纸张**：支持A4和Letter纸张格式
- **高质量输出**：矢量图形，适合专业打印

### 👤 用户管理
- **完整个人资料**：姓名、呼号、QTH、网格定位等
- **资料验证**：呼号格式验证、网格定位格式检查
- **自动填充**：个人信息自动填充到QSL卡片中

## 🚀 技术栈

### 前端
- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 现代化的CSS框架
- **jsPDF** - 客户端PDF生成

### 后端
- **Next.js API Routes** - 服务器端API
- **Prisma** - 现代化的数据库ORM
- **SQLite** - 轻量级数据库
- **JWT** - 身份认证

### 开发工具
- **ESLint** - 代码质量检查
- **TypeScript编译器** - 类型检查

## 📦 安装与部署

### 环境要求
- Node.js 20.0.0+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd qsl-card-manager
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-super-secret-jwt-key"
```

4. **初始化数据库**
```bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库结构
npx prisma db push
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
   - 打开浏览器访问 `http://localhost:3000`
   - 注册账户并开始使用

## 📖 使用指南

### 1. 账户注册与登录
- 首次使用需要注册账户
- 使用邮箱和密码进行登录
- 完善个人资料（呼号、姓名等）

### 2. QSL日志管理
- **添加记录**：点击"添加日志"按钮，填写通联信息
- **编辑记录**：双击表格单元格进行编辑，或点击操作按钮
- **批量操作**：使用复选框选择多条记录
- **文件导入**：支持CSV和ADIF格式文件上传

### 3. 模板设计
- **创建模板**：点击"创建模板"，使用HTML/CSS编辑器设计
- **插入字段**：点击左侧字段列表，自动插入动态内容
- **实时预览**：切换到预览模式查看效果
- **保存模板**：完成设计后保存，可设置为公开模板

### 4. PDF导出
- **选择记录**：在日志管理中选择要导出的记录
- **点击导出**：点击"导出PDF"按钮
- **配置选项**：选择模板、纸张大小、每页卡片数
- **生成PDF**：系统自动生成PDF文件供下载

## 🔧 高级功能

### 字段说明
支持的QSL字段包括：
- `contactCall` - 对方呼号
- `contactName` - 对方姓名  
- `myCall` - 我的呼号
- `myName` - 我的姓名
- `frequency` - 频率
- `mode` - 模式
- `date` - 日期
- `time` - 时间
- `rstSent` - RST发送
- `rstReceived` - RST接收
- `band` - 波段
- `power` - 功率
- `antenna` - 天线
- `qth` - QTH地址
- `locator` - 网格定位
- `notes` - 备注

### 文件格式支持

**CSV格式示例：**
```csv
contactCall,contactName,frequency,mode,date,time,rstSent,rstReceived
BH1ABC,张三,14.205,SSB,2024-01-15,13:30,59,58
```

**ADIF格式支持：**
- 标准ADIF 3.1.0 格式
- 自动解析常用字段
- 支持中文内容

## 🛠️ 开发说明

### 项目结构
```
qsl-card-manager/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API路由
│   │   └── page.tsx      # 主页面
│   ├── components/       # React组件
│   │   ├── Dashboard.tsx
│   │   ├── QslLogManager.tsx
│   │   ├── TemplateManager.tsx
│   │   ├── UserProfile.tsx
│   │   └── PDFExportDialog.tsx
│   └── lib/              # 工具库
├── prisma/               # 数据库配置
└── public/               # 静态资源
```

### API端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/profile` - 更新用户资料
- `GET /api/qsl` - 获取QSL日志
- `POST /api/qsl` - 创建QSL日志
- `PUT /api/qsl/[id]` - 更新QSL日志
- `DELETE /api/qsl/[id]` - 删除QSL日志
- `POST /api/qsl/upload` - 上传QSL文件
- `GET /api/templates` - 获取模板列表
- `POST /api/templates` - 创建模板
- `PUT /api/templates/[id]` - 更新模板
- `DELETE /api/templates/[id]` - 删除模板

## 🐛 故障排除

### 常见问题

1. **安装依赖失败**
   - 检查Node.js版本是否 >= 20.0.0
   - 清理缓存：`npm cache clean --force`

2. **数据库连接错误**
   - 确认DATABASE_URL配置正确
   - 运行：`npx prisma db push`

3. **JWT认证失败**
   - 检查JWT_SECRET是否配置
   - 清除浏览器Cookie重新登录

4. **PDF导出失败**
   - 检查是否选择了模板和日志记录
   - 确认浏览器支持下载功能

### 日志查看
```bash
# 查看开发服务器日志
npm run dev

# 查看数据库
npx prisma studio
```

## 🤝 贡献指南

欢迎提交问题和功能请求！

1. Fork 这个项目
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有为业余无线电社区做出贡献的开发者
- 感谢Next.js、Prisma等开源项目
- 感谢所有测试用户的反馈和建议

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至：[您的邮箱]

---

**73! 祝您使用愉快！** 🎯
