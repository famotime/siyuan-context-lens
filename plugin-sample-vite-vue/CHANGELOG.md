# Changelog

## 0.0.1 - 2026-08-02

- docs: 对齐 SiYuan v3.7.3 与 npm `siyuan@1.2.3` 开发基线。
- feat: 将 `plugin.json` 的最低应用版本更新为 `3.7.3`。
- fix: 将多语言键迁移为 RFC 5646 格式（`zh-CN`、`en-US`）。
- refactor: 移除对 `getSecret`、`getVariable`、`addAgentAction` 的重复模块声明，改用官方类型。
- fix: 升级 `vite-plugin-static-copy` 到兼容 Vite 6 的 `2.3.2`。
- fix: 增加 Vue 单文件组件类型声明和可复现的 `typecheck` 脚本。
- docs: 补充内核插件、AI 智能体、密钥变量和公开 API 说明。
