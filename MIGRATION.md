# 项目重构说明

本项目已从 pnpm 重构为使用 Yarn 4.x + PnP (Plug'n'Play) 模式管理依赖，并使用 volta 进行 Node.js 版本管理。

## 环境要求

### 安装 Volta 和 Corepack

```bash
# 安装 volta
curl https://get.volta.sh | bash

# 重启终端或执行
source ~/.bashrc  # 或 ~/.zshrc

# 启用 Corepack (Node.js 16+ 内置)
corepack enable
```

### 初始化环境

```bash
# 安装指定版本的 Node.js 和 Yarn
yarn run initenv

# 或者手动安装
volta install node@18.17.0
volta install yarn@4.2.2
corepack enable
```

## 项目结构变化

### 删除的文件

- `pnpm-workspace.yaml` - 替换为 package.json 中的 workspaces 配置
- `pnpm-lock.yaml` - 替换为 yarn.lock (Yarn 4.x 格式)
- `.nvmrc` - 替换为 package.json 中的 volta 配置
- `node_modules/` - 由 PnP 的 `.pnp.cjs` 文件替代

### 修改的文件

- `package.json` - 添加了 volta 配置、workspaces 配置和 PnP 配置
- `.yarnrc.yml` - 添加了 Yarn 4.x 和 PnP 相关配置
- `.gitignore` - 更新了 PnP 相关的忽略规则
- 所有脚本命令从 `pnpm` 改为 `yarn workspace`

## 常用命令

```bash
# 安装依赖
yarn install

# 开发模式
yarn client:dev    # 启动客户端
yarn server:dev    # 启动服务端
yarn ext:dev       # 启动浏览器扩展

# 构建
yarn client:build  # 构建客户端
yarn server:build  # 构建服务端
yarn ext:build     # 构建浏览器扩展

# 清理 node_modules
yarn clean

# 代码格式化
yarn format
```

## Yarn PnP 优势

1. **极速安装**: 无需复制文件到 node_modules，只生成单个 `.pnp.cjs` 文件
2. **完美去重**: 所有项目共享同一份依赖缓存，节省磁盘空间
3. **严格依赖**: 防止幽灵依赖，确保只能访问声明的依赖
4. **语义化错误**: 提供更清晰的依赖解析错误信息
5. **零安装**: 可以将 `.pnp.cjs` 提交到仓库，实现零安装部署

## Volta 优势

1. **自动版本切换**: 进入项目目录时自动切换到指定的 Node.js 和 Yarn 版本
2. **团队一致性**: 确保所有团队成员使用相同的工具版本
3. **简化配置**: 无需手动管理多个 Node.js 版本
4. **跨平台支持**: 支持 macOS、Linux 和 Windows

## PnP 注意事项

### IDE 支持

大多数现代 IDE 都支持 Yarn PnP，但可能需要额外配置：

- **VS Code**: 安装 "ZipFS" 扩展以支持 zip 文件中的包
- **WebStorm**: 内置支持 PnP
- **其他编辑器**: 可能需要安装相应的 PnP 插件

### 兼容性

- 大部分现代 npm 包都兼容 PnP
- 如遇到兼容性问题，可在 `.yarnrc.yml` 中配置 `packageExtensions`
- React Native 项目暂不支持 PnP，需要使用传统的 node_modules 模式

## 迁移完成

项目已成功从 pnpm 迁移到 Yarn 4.x PnP + volta 管理方式。所有依赖已重新安装，workspace 配置已更新，PnP 模式已启用。
