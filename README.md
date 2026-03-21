# 现在，开饭啦！ (Simplified Dianping Clone)

这是一个基于 React + Express + MySQL 的简化版大众点评类网站。

## 核心功能
- **用户认证**：注册、登录（JWT 认证）
- **商户系统**：商户列表浏览、详情展示、分类筛选、关键词搜索
- **评论系统**：1-5 星评分、文字评论、评论列表展示

## 技术栈
- **前端**：React 18, Ant Design 5, Tailwind CSS, Zustand, Axios
- **后端**：Node.js, Express, TypeScript, MySQL (mysql2/promise)
- **开发工具**：Vite, Nodemon, tsx

## 快速开始

### 1. 数据库准备
1. 安装 MySQL 并创建数据库 `dianping_db`。
2. 执行 `migrations/20240320_initial_schema.sql` 中的 SQL 脚本初始化表结构和基础数据。

### 2. 环境配置
1. 在项目根目录创建 `.env` 文件。
2. 填写以下配置信息：
   ```env
   # 数据库配置
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dianping_db
   DB_PORT=3306

   # JWT 配置
   JWT_SECRET=your_secret_key
   ```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动项目
```bash
# 同时启动前端和后端 (推荐)
npm run dev

# 或者分开启动
npm run server:dev  # 启动后端 (port: 3000)
npm run client:dev  # 启动前端 (port: 5173+)
```

## API 文档
请参考 [api-docs.md](./api-docs.md) 获取详细的 API 接口说明。

## 测试
```bash
npm test
```
