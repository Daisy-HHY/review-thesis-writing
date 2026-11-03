# review-thesis-writing

面向需求文档智能审查及相关软件工程课题的中文工程论文写作 skill。用于开题报告、毕业论文章节、文献综述、润色与引用审阅，强调问题、方法、证据和结论边界。

包含可独立使用的写作指南与原文核验方法，不附带论文 PDF、文献库、项目实现或实验数据。写作时需要提供自己的材料；skill 不保证事实自动正确，也不替代学校格式要求。

## 用 npx 安装

需要 Node.js 22 或更新版本、npm；从 GitHub 安装还需 Git。在准备使用 skill 的项目目录执行：

```shell
npx --yes --package=github:Daisy-HHY/review-thesis-writing review-thesis-writing
```

也可指定已经存在的项目目录：

```shell
npx --yes --package=github:Daisy-HHY/review-thesis-writing review-thesis-writing --target "D:/my-project"
```

安装器写入目标项目的 `.agents/skills/review-thesis-writing`。已有同名 skill 会报错并保留；不修改项目规则或其他文件。该路径是安装目标示例，不是本仓库中的导航链接。npm 下载缓存位置由本机 npm 配置决定。

## 用 npm 下载后安装

在目标项目执行：

```shell
npm install --save-dev github:Daisy-HHY/review-thesis-writing
npm exec -- review-thesis-writing
```

第一条命令将包下载为项目开发依赖，并更新 npm 的项目清单/锁文件；第二条才复制 skill。包没有自动安装脚本，没有第三方运行依赖，也不会在运行时上传论文或调用模型。

以上命令从 GitHub 获取包，不要求包已发布到 npm registry。需要固定版本时，可在 GitHub 包地址后追加 `#` 和经过核实的提交 SHA。

## 使用

在支持项目级 Agent Skills 的工具中打开目标项目，调用：

```text
使用 $review-thesis-writing，基于我提供的原始文献和项目方案修改开题报告。
未实施的内容保持计划语气，每个关键论点保留来源定位。
```

安装器只负责放置文件；识别和执行方式取决于宿主工具。其他支持 `SKILL.md` 的工具可按其目录规范复制完整 skill 文件夹。

| 内容 | 文件 |
| --- | --- |
| 任务入口与交付要求 | [SKILL.md](skills/review-thesis-writing/SKILL.md) |
| 章节、语气、方法与实验表达 | [writing-style.md](skills/review-thesis-writing/references/writing-style.md) |
| 六项文献整理、原文定位与引用边界 | [source-verification.md](skills/review-thesis-writing/references/source-verification.md) |
| 安装器 | [cli.mjs](bin/cli.mjs) |
| 安装行为测试 | [install.test.mjs](test/install.test.mjs) |

## 本地验证

```shell
npm test
npm pack --dry-run
```

打包白名单仅包含安装器、skill 文件及 npm 自动包含的包元数据、说明文档和许可证（如有）。测试覆盖完整安装、中文路径、已有内容保护、无效参数和链接目录防护。没有覆盖不同宿主模型的实际论文生成质量。

安装与执行参数依据 [npm install 文档](https://docs.npmjs.com/cli/v11/commands/npm-install)、[npm exec 文档](https://docs.npmjs.com/cli/v11/commands/npm-exec)及 [package.json 文档](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)。
