# 重构计划

更新时间：2026-04-12

## 前置说明

- 当前工作树为干净状态，开始规划时未发现未提交改动。
- 技能约定提到的 `references/refactor-plan-template.md` 在当前仓库中不存在，本计划按同等字段要求手工编排。
- 本文件产出后先等待用户批准；在获得明确批准前，不开始任何重构代码修改。
- 当前尚未执行基线测试；每个获批条目都会先跑定向测试，再实施重构，随后跑定向测试和完整测试套件。

## 模块分析摘要

### 入口与生命周期

- `src/index.ts`
  - 负责插件入口、 Dock 注册、配置读写与界面打开，职责相对稳定，当前不是优先重构目标。
- `src/main.ts`
  - 负责 Vue 挂载和销毁，文件较小，边界清晰，当前不是优先重构目标。

### 业务与核心逻辑

- `src/analytics/analysis.ts`
  - 当前约 1079 行，同时承载时间窗口过滤、图构建、社区/桥接/孤立/沉没/传播分析、趋势分析、路径搜索。
  - 优点是纯函数化和测试覆盖较强；问题是单文件职责过宽，后续继续加规则时回归面会迅速扩大。
- `src/analytics/summary-details.ts`
  - 当前约 584 行，负责顶部卡片和详情 section 的组装，已经有较完整测试，但分支数量明显增长。

### UI 与控制编排

- `src/composables/use-analytics.ts`
  - 当前约 1297 行，是最宽的状态编排文件。
  - 同时负责快照加载、筛选状态、图分析派生、卡片状态、孤立修复交互、AI Inbox、AI 补链、LLM Wiki 预览与写回、副作用 watcher。
  - 依赖面最广，回归风险最高，也是后续功能继续叠加时最容易失控的位置。
- `src/App.vue`
  - 当前约 1357 行，模板体量大，脚本层已经主要做页面组装，但仍保留 wiki 面板状态和页面级联动控制。
  - 已经做过一次拆分，继续重构时要维持现有组件边界和交互行为不变。
- `src/components/SettingPanel.vue`
  - 当前约 964 行，同时承载主题文档、已读规则、统计卡片配置、AI 服务接入、SiliconFlow 模型目录懒加载、导入导出等逻辑。
  - 表单渲染、异步副作用和配置迁移逻辑混在同一 SFC，继续扩展配置项时维护成本偏高。

### 类型与边界

- `src/types/config.ts`
  - 是多个模块共享的稳定配置边界；重构时应尽量保持对外字段不变，避免把结构性重构变成配置迁移任务。

### 现有测试与覆盖缺口

- 已有强覆盖模块：
  - `src/composables/use-analytics.test.ts`
  - `src/analytics/analysis.test.ts`
  - `src/analytics/summary-details.test.ts`
  - `src/components/SettingPanel.test.ts`
  - `src/App.test.ts`
- 当前主要缺口：
  - `useAnalyticsState` 内部 watcher 和异步分支虽然已有集成测试，但缺少更细粒度的职责分块护栏。
  - `SettingPanel.vue` 的 AI 配置副作用逻辑目前更多依赖组件级 SSR 断言，拆分前需要增加更聚焦的行为测试。
  - `App.vue` 的 wiki 面板局部状态与详情区联动目前主要通过页面级断言覆盖，拆分前需要补充更明确的编排场景。

## 优先级总览

| ID | 优先级 | 状态 | 范围摘要 | 建议顺序 |
| --- | --- | --- | --- | --- |
| `RF-P0-01` | P0 | done | 拆分 `useAnalyticsState` 的域职责与副作用 | 1 |
| `RF-P1-01` | P1 | done | 拆分 `SettingPanel.vue` 的 AI 配置与传输逻辑 | 2 |
| `RF-P1-02` | P1 | done | 收敛 `App.vue` 的 wiki 面板编排状态 | 3 |
| `RF-P1-03` | P1 | done | 分解 `analysis.ts` 的图分析阶段函数 | 4 |
| `RF-P2-01` | P2 | done | 清理 `summary-details.ts` 的卡片/详情构建分支 | 5 |

## 重构条目

### `RF-P0-01` 拆分 `useAnalyticsState` 的域职责与副作用

- 状态：`done`
- 范围文件：
  - `src/composables/use-analytics.ts`
  - 允许新增配套文件到 `src/composables/`，例如按分析状态、AI 状态、Wiki 状态、副作用同步拆分。
  - 如有必要，少量调整 `src/App.vue` 的导入或解构方式，但不改变其可观察行为。
- 当前职责与依赖边界：
  - 输入依赖包括思源插件 API、块写入 API、AI 服务、Wiki 存储、配置对象。
  - 输出同时面向页面 UI、详情面板、孤立修复动作、AI 生成动作和 Wiki 写回动作。
  - 内部把“纯派生、异步 IO、watcher 同步、副作用动作”放在同一层，阅读和测试成本高。
- 重构价值：
  - 降低中心文件复杂度，给后续 AI 与 Wiki 能力继续扩展留出边界。
  - 让纯状态派生、异步服务调用和写操作控制器分层，更容易补单元测试。
- 行为不变式：
  - `useAnalyticsState` 的公开返回字段和现有调用方式保持兼容，至少对 `src/App.vue` 无需行为级改动。
  - 现有语义不变：孤立/沉没判定、主题建议写入/撤销、已读卡片切换、路径分析、AI Inbox 自动触发、Wiki 预览与写回错误提示。
  - `onMounted -> refresh()` 和活动文档联动保持现状。
- 风险：
  - watcher 拆散后容易出现初始化顺序变化。
  - 异步状态重置可能被遗漏，导致旧 AI/Wiki 状态泄漏。
  - 配置对象的原地写入时机变化，可能影响卡片顺序和 provider 配置持久化。
- 重构前测试清单：
  - `npx vitest run src/composables/use-analytics.test.ts`
  - `npx vitest run src/App.test.ts`
  - 如补测试，优先新增：
    - `refresh()` 重置 AI/Wiki 临时状态
    - `selectedSummaryCardKey` 与 `visibleSummaryCards` 的回退同步
    - Wiki 预览准备失败时的错误落点
- 完成定义：
  - `useAnalyticsState` 保留对外统一入口，但内部域职责明显收敛。
  - 新增或调整测试后，定向测试与完整测试均通过。
- 文档影响：
  - 完成后需要更新 `docs/project-structure.md` 中 composables 分层说明。
  - README 需要更新主状态层结构描述。
- 已完成结果：
  - 新增 `src/composables/use-analytics-ai.ts`，承接 AI 收件箱、连接测试与孤立文档 AI 补链控制器。
  - 新增 `src/composables/use-analytics-wiki.ts`，承接 wiki 预览类型和 wiki 相关 helper。
  - 在 `src/composables/use-analytics.ts` 中收敛异步临时状态清理逻辑，并保留原有对外 API。
- 测试证据：
  - 重构前定向测试：`npx vitest run src/composables/use-analytics.test.ts src/App.test.ts`
  - 补充护栏测试：`clears transient AI and wiki state on refresh`
  - 重构后定向测试：`npx vitest run src/composables/use-analytics.test.ts src/App.test.ts`
  - 重构后完整测试：`npm test`

### `RF-P1-01` 拆分 `SettingPanel.vue` 的 AI 配置与传输逻辑

- 状态：`done`
- 范围文件：
  - `src/components/SettingPanel.vue`
  - 允许新增 `src/components/` 下的 AI 设置子组件或 composable/helper。
  - 可调整现有 `setting-panel-ai*.ts`、`setting-panel-secret-field.ts` 的组合方式。
- 当前职责与依赖边界：
  - 一个组件同时负责基础设置渲染、AI provider 预设切换、API Key 显隐、导入导出、模型目录拉取、连接测试。
  - 已存在多个 helper，但主组件仍保留大量异步控制与表单状态。
- 重构价值：
  - 降低单个 SFC 的模板和脚本复杂度。
  - 提高 AI 设置逻辑的复用性和可测性。
- 行为不变式：
  - 设置项顺序不变。
  - Alpha 开关对 AI/LLM Wiki 相关设置的可见性不变。
  - SiliconFlow 模型列表仍保持懒加载与错误提示逻辑。
  - 导入/导出、连接测试、API Key 显隐交互不变。
- 风险：
  - `props.config` 的双向修改链路被拆分后，容易引入响应式不同步。
  - SSR 测试依赖的结构和文案较多，模板拆分时容易造成快照式断言回归。
- 重构前测试清单：
  - `npx vitest run src/components/SettingPanel.test.ts`
  - `npx vitest run src/components/setting-panel-ai.test.ts`
  - `npx vitest run src/components/setting-panel-ai-transfer.test.ts`
  - `npx vitest run src/components/setting-panel-secret-field.test.ts`
  - 如补测试，优先新增：
    - provider 切换时的配置镜像保存
    - SiliconFlow API Key 变化后的模型目录重置
- 完成定义：
  - `SettingPanel.vue` 只保留页面组装和必要桥接。
  - AI 设置异步逻辑移动到可单测的子层。
- 文档影响：
  - 更新 `docs/project-structure.md` 中设置页结构描述。
  - README 如提及 AI 接入配置，需要同步最新模块分层。
- 已完成结果：
  - 新增 `src/components/use-setting-panel-ai.ts`，承接 AI 设置区的连接测试、导入导出、provider 切换与 SiliconFlow 模型目录加载。
  - 新增 `src/components/setting-panel-ai-state.ts`，承接 provider 配置镜像、catalog 重置判定与标题文案拼装等纯函数。
  - `src/components/SettingPanel.vue` 收敛为设置页组装层，仅保留与 AI 区域相关的桥接解构。
- 测试证据：
  - 重构前定向测试：`npx vitest run src/components/SettingPanel.test.ts src/components/setting-panel-ai.test.ts src/components/setting-panel-ai-transfer.test.ts src/components/setting-panel-secret-field.test.ts`
  - 补充护栏测试：provider 配置镜像、SiliconFlow catalog 重置判定、select title 错误提示拼装
  - 重构后定向测试：`npx vitest run src/components/SettingPanel.test.ts src/components/setting-panel-ai.test.ts src/components/setting-panel-ai-transfer.test.ts src/components/setting-panel-secret-field.test.ts`
  - 重构后完整测试：`npm test`

### `RF-P1-02` 收敛 `App.vue` 的 wiki 面板编排状态

- 状态：`done`
- 范围文件：
  - `src/App.vue`
  - 允许新增页面级 composable 或局部 controller 文件。
  - 允许少量调整 `src/components/SummaryDetailSection.vue` 或 `src/components/WikiMaintainPanel.vue` 的参数组织方式，但不改变界面行为。
- 当前职责与依赖边界：
  - `App.vue` 已经把统计卡片和详情区委托给子组件，但 wiki 面板放置策略、局部 preview 请求构造、页面级按钮文案仍在页面组件中。
- 重构价值：
  - 让页面组件回到“布局装配器”的角色。
  - 为后续更多 detail-panel 级能力保留清晰入口。
- 行为不变式：
  - 统计卡片、详情区、wiki 面板的显示位置和触发时机不变。
  - “文档样本范围”和“核心文档局部范围”两种 wiki 预览请求语义不变。
  - 当前 `visibleSummaryCards` 过滤逻辑不变。
- 风险：
  - 页面状态拆分后，容易影响 `selectedSummaryCardKey` 与 wiki 面板显示条件的组合逻辑。
  - 子组件 props 变更过多会把简单重构扩大为接口重写。
- 重构前测试清单：
  - `npx vitest run src/App.test.ts`
  - `npx vitest run src/components/SummaryDetailSection.test.ts`
  - `npx vitest run src/components/SummaryCardsGrid.test.ts`
  - 如补测试，优先新增：
    - wiki 面板 placement 切换
    - ranking detail 中核心文档 wiki 面板显隐
- 完成定义：
  - `App.vue` 中页面级状态和动作数量进一步下降。
  - wiki 面板编排逻辑被命名清晰的子层接管。
- 文档影响：
  - 更新 `docs/project-structure.md` 的 App 页面职责说明。
  - README 如描述 UI 架构，需要同步页面层职责变化。
- 已完成结果：
  - 新增 `src/composables/use-app-wiki-panel.ts`，集中管理文档样本 wiki 面板和核心文档 wiki 面板的 placement、request 构造与显隐切换。
  - `src/App.vue` 改为消费页面级 wiki 面板控制器，页面脚本仅保留筛选与布局装配相关桥接。
- 测试证据：
  - 重构前定向测试：`npx vitest run src/composables/use-app-wiki-panel.test.ts src/App.test.ts`（新增测试后先失败，缺少实现）
  - 补充护栏测试：文档样本范围 request 构造、核心文档关联范围 request 去重与显隐判断
  - 重构后定向测试：`npx vitest run src/composables/use-app-wiki-panel.test.ts src/App.test.ts`
  - 重构后完整测试：`npm test`

### `RF-P1-03` 分解 `analysis.ts` 的图分析阶段函数

- 状态：`done`
- 范围文件：
  - `src/analytics/analysis.ts`
  - 允许新增 `src/analytics/` 下的纯函数 helper 文件，例如按过滤、图构建、指标计算、路径搜索拆分。
- 当前职责与依赖边界：
  - 一个文件集中处理时间过滤、样本构建、图分析、趋势分析和路径搜索。
  - 虽然纯函数化程度高，但后续增加一个规则经常需要同时理解多个阶段。
- 重构价值：
  - 让“样本过滤”和“图指标计算”分层，减少修改时的认知负担。
  - 为后续更多传播解释或链接格式兼容提供稳定落点。
- 行为不变式：
  - 孤立文档与沉没文档定义不变。
  - `refs + markdown fallback` 产生的文档级边语义不变。
  - 自引用不计入文档级连接。
  - 时间窗口、本地时间语义、wiki 页面排除规则不变。
- 风险：
  - 这是产品语义最核心的文件，任何分层错误都会扩散到卡片、详情、筛选和路径分析。
  - 多个 helper 间参数传递不清晰时，容易出现当前窗口与历史窗口混用。
- 重构前测试清单：
  - `npx vitest run src/analytics/analysis.test.ts`
  - `npx vitest run src/analytics/summary-details.test.ts`
  - `npx vitest run src/composables/use-analytics.test.ts`
  - 如补测试，优先新增：
    - 当前窗口孤立与历史活跃沉没的边界样例
    - 主题筛选和 wiki page suffix 同时存在时的样本过滤
- 完成定义：
  - `analysis.ts` 保留高层入口，但阶段性 helper 明确分层。
  - 现有测试全部通过，新增测试能覆盖拆分出的关键 helper。
- 文档影响：
  - 更新 `docs/project-structure.md` 的分析层职责映射。
  - README 如描述分析能力实现方式，可同步说明模块划分。
- 已完成结果：
  - 新增 `src/analytics/analysis-context.ts`，承接文档样本过滤、图分析上下文、趋势上下文以及底层邻接/计数 helper。
  - 新增 `src/analytics/analysis-context.test.ts`，直接覆盖图分析上下文与趋势上下文的阶段结果。
  - `src/analytics/analysis.ts` 收敛为高层分析入口和核心指标组装，减少前置样本准备代码重复。
- 测试证据：
  - 重构前定向测试：`npx vitest run src/analytics/analysis-context.test.ts src/analytics/analysis.test.ts src/analytics/summary-details.test.ts src/composables/use-analytics.test.ts`（新增测试后先失败，缺少实现）
  - 补充护栏测试：graph context 当前窗口过滤、trend context 当前/上一窗口分桶
  - 重构后定向测试：`npx vitest run src/analytics/analysis-context.test.ts src/analytics/analysis.test.ts src/analytics/summary-details.test.ts src/composables/use-analytics.test.ts`
  - 重构后完整测试：`npm test`

### `RF-P2-01` 清理 `summary-details.ts` 的卡片/详情构建分支

- 状态：`done`
- 范围文件：
  - `src/analytics/summary-details.ts`
  - `src/analytics/summary-cards.ts`
  - `src/analytics/summary-detail-sections.ts`
  - `src/analytics/summary-detail-types.ts`
- 当前职责与依赖边界：
  - 顶部卡片和值班详情 section 都在同一文件里，已逐渐形成较长的条件分支链。
- 重构价值：
  - 属于一致性和可读性优化，风险低于前几项，但收益也相对次要。
- 行为不变式：
  - 卡片 key、标题、tooltip、详情结构和排序不变。
  - 已读/未读、大文档模式切换语义不变。
- 风险：
  - 如果抽象过度，容易把原本直接可读的规则分散到过多文件中。
- 重构前测试清单：
  - `npx vitest run src/analytics/summary-details.test.ts`
  - `npx vitest run src/composables/use-analytics.test.ts`
  - `npx vitest run src/components/SummaryDetailSection.test.ts`
- 完成定义：
  - 按卡片构建与详情构建分层，但不引入额外语义抽象。
- 文档影响：
  - `docs/project-structure.md` 视实际拆分情况更新。
  - README 仅在用户可见能力描述受影响时更新。
- 已完成结果：
  - 新增 `src/analytics/summary-cards.ts`，承接顶部统计卡片顺序、标题、数值与 hint 构建。
  - 新增 `src/analytics/summary-detail-sections.ts`，承接详情 section 和内部建议/计数 helper。
  - 新增 `src/analytics/summary-detail-types.ts`，集中卡片与详情共享类型。
  - `src/analytics/summary-details.ts` 收敛为稳定导出入口，保持现有调用方不变。
- 测试证据：
  - 重构前定向测试：`npx vitest run src/analytics/summary-details.test.ts src/composables/use-analytics.test.ts src/components/SummaryDetailSection.test.ts`
  - 补充护栏测试：summary card 顺序在 read/storage 模式切换下保持不变
  - 重构后定向测试：`npx vitest run src/analytics/summary-details.test.ts src/composables/use-analytics.test.ts src/components/SummaryDetailSection.test.ts`
  - 重构后完整测试：`npm test`
  - 备注：`SummaryDetailSection.test.ts` 仍存在既有 `showWikiPanelActions` required prop warning，但不影响测试通过，且本次未修改该语义。

## 文档刷新范围

- `docs/project-structure.md`
  - 需要反映最终获批条目完成后的模块拆分、职责映射和新增文件。
- `README.md`
  - 需要反映最终获批条目涉及的用户可见能力、开发命令说明和项目结构描述。
- 这两项文档刷新只在最后一个获批条目完成后执行，并将结果回写到本计划文件。

## 文档刷新结果

- `docs/project-structure.md`
  - 已更新到 2026-04-12，补充 `analysis-context.ts`、`summary-cards.ts`、`summary-detail-sections.ts`、`summary-detail-types.ts`、`use-analytics-ai.ts`、`use-analytics-wiki.ts`、`use-app-wiki-panel.ts`、`use-setting-panel-ai.ts` 与 `setting-panel-ai-state.ts` 的职责说明。
- `README.md`
  - 已补充“当前实现概览”和“开发”章节，更新当前主能力、技术栈、常用命令与 `package.zip` 构建说明。

## 最终验证结果

- `npm test`
  - 通过，`57` 个测试文件、`231` 个测试全部通过。
  - 保留既有警告：`SummaryDetailSection.test.ts` 中仍有 `showWikiPanelActions` required prop warning，但不影响结果，本次未扩散或变更该行为。
- `npm run build`
  - 通过，Vite 生产构建完成并正常更新根目录 `package.zip`。

## 执行与验证约束

- 一次只执行一个获批条目。
- 每个条目都遵循：
  - 先补测试或调整测试。
  - 先跑该条目的定向测试。
  - 再实施重构。
  - 再跑定向测试。
  - 再跑完整测试 `npm test`。
- 全部获批条目完成后，再执行：
  - `npm run build`
- 如果实施前发现基线测试失败，会先在本文件中记录为 `blocked` 或补充基线说明。

## 建议批准方式

- 推荐先从 `RF-P0-01` 开始，先把中心编排层拆出清晰边界，再处理页面层和设置层。
- 如果你希望控制范围更小，也可以只批准一个 `P1` 条目先做试点。
