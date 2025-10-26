# MAGI Decision System - AgentCore Runtime実装要件

## 概要

AWS公式の`bedrock-agentcore-starter-toolkit`を使用して、MAGI Decision Systemを Amazon Bedrock AgentCore Runtime上に実装します。

## 用語集

- **AgentCore Runtime**: Amazon Bedrockの専用AI実行環境、8時間実行可能、専用マイクロVM
- **Strands Agents**: AI Agent Framework、AgentCore Runtime対応
- **MAGI System**: 3賢者（CASPAR、BALTHASAR、MELCHIOR）+ SOLOMON Judge統合評価システム
- **Starter Toolkit**: AWS公式のCLIツール、AgentCore Runtimeへのデプロイを自動化

## 要件

### 要件1: AgentCore Runtime基盤構築

**ユーザーストーリー:** 開発者として、AWS公式ツールを使用してMAGI Decision Systemを確実にデプロイしたい

#### 受け入れ基準

1. WHEN bedrock-agentcore-starter-toolkitを使用する時、THE システム SHALL AgentCore Runtime環境を自動構築する
2. WHEN 設定を行う時、THE システム SHALL ap-northeast-1リージョンにデプロイする
3. WHEN デプロイを実行する時、THE システム SHALL 必要なAWSリソース（ECR、IAM、CloudWatch）を自動作成する
4. WHEN エージェントを起動する時、THE システム SHALL 8時間の長時間実行を可能にする
5. WHEN 複数セッションがある時、THE システム SHALL 専用マイクロVMでセッション分離を実現する

### 要件2: MAGI Strands Agents統合

**ユーザーストーリー:** ユーザーとして、3賢者による多視点分析とSOLOMON統合評価を受けたい

#### 受け入れ基準

1. WHEN 質問を入力する時、THE システム SHALL 3賢者（CASPAR、BALTHASAR、MELCHIOR）による並列分析を実行する
2. WHEN 各賢者が判断する時、THE システム SHALL それぞれ異なる視点（保守的、革新的、バランス型）で分析する
3. WHEN 3賢者の分析が完了する時、THE システム SHALL SOLOMON Judgeによる統合評価を実行する
4. WHEN 最終判断を行う時、THE システム SHALL 投票結果（可決/否決/棄権）と信頼度を提供する
5. WHEN エラーが発生する時、THE システム SHALL 利用可能なエージェントで処理を継続する

### 要件3: フロントエンド統合

**ユーザーストーリー:** ユーザーとして、直感的なWebインターフェースでMAGI判断を利用したい

#### 受け入れ基準

1. WHEN ユーザーが質問を入力する時、THE システム SHALL AgentCore Runtime APIを呼び出す
2. WHEN 処理が開始される時、THE システム SHALL リアルタイムでステータスを表示する
3. WHEN 結果が返される時、THE システム SHALL 3賢者の判断と統合評価を視覚的に表示する
4. WHEN エラーが発生する時、THE システム SHALL 適切なエラーメッセージを表示する
5. WHEN 会話履歴がある時、THE システム SHALL セッション管理により継続的な対話を可能にする

### 要件4: 監視・運用

**ユーザーストーリー:** 運用者として、システムの動作状況を監視し、問題を迅速に特定したい

#### 受け入れ基準

1. WHEN エージェントが実行される時、THE システム SHALL CloudWatch Logsに詳細ログを出力する
2. WHEN 処理時間を測定する時、THE システム SHALL 各エージェントの実行時間を記録する
3. WHEN エラーが発生する時、THE システム SHALL スタックトレースと詳細情報を記録する
4. WHEN パフォーマンスを監視する時、THE システム SHALL AgentCore Observabilityでトレーシングを提供する
5. WHEN リソース使用量を確認する時、THE システム SHALL 消費ベース課金の詳細を提供する

### 要件5: セキュリティ・認証

**ユーザーストーリー:** セキュリティ管理者として、適切な認証・認可でシステムを保護したい

#### 受け入れ基準

1. WHEN APIアクセスを行う時、THE システム SHALL AWS IAM認証を要求する
2. WHEN セッションを管理する時、THE システム SHALL 専用マイクロVMでセッション分離を実現する
3. WHEN データを処理する時、THE システム SHALL 暗号化された通信を使用する
4. WHEN ログを出力する時、THE システム SHALL 機密情報をマスクする
5. WHEN 権限を管理する時、THE システム SHALL 最小権限の原則を適用する