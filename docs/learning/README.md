# 学習リソース

## 📚 概要

MAGI Decision Systemの開発に必要な技術の学習リソースです。

## 📖 ドキュメント

### Python環境管理

- **[uv-python-management.md](./uv-python-management.md)** - uvによるPython環境管理

## 🎯 推奨学習パス

### 1. AgentCore Runtime理解

まずは参考記事を読んで、全体像を把握してください：

**[Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)**

### 2. Strands Agents学習

公式ドキュメントでStrands Agentsの基本を学んでください：

- [Strands Agents公式ドキュメント](https://strandsagents.com/latest/)
- [AWS公式ブログ](https://aws.amazon.com/blogs/opensource/introducing-strands-agents-1-0-production-ready-multi-agent-orchestration-made-simple/)

### 3. 実装確認

実際のコードを確認して理解を深めてください：

- `agents/magi_agent.py` - メインエージェント実装
- `agents/shared/prompts.py` - システムプロンプト
- `agents/tests/test_magi.py` - ストリーミングテスト

### 4. デバッグ実践

デバッグガイドを参考に、実際に動かしてみてください：

- [agents/DEBUG_GUIDE.md](../../agents/DEBUG_GUIDE.md)

## 🔗 外部リソース

### AWS関連
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Amplify Gen2 Documentation](https://docs.amplify.aws/)

### フレームワーク
- [Next.js Documentation](https://nextjs.org/docs)
- [Strands Agents](https://strandsagents.com/)

### Python
- [Python Documentation](https://docs.python.org/3/)
- [uv Documentation](https://docs.astral.sh/uv/)

---

学習を進める中で疑問があれば、GitHubのIssuesで質問してください。
