# Requirements Document

## Introduction

UIからの質問を受け取り、Strands Agentsフレームワークを使用して3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeを並列実行し、統合された結果をJSONで返すエージェントゲートウェイシステムを構築します。Amazon Bedrock AgentCore Runtimeで観測機能を有効化し、各実行のトレース情報をAmplify Dataに永続化します。

**学習目的**: このシステムはAmazon Bedrock AgentCore、Strands Agents、OpenTelemetryの学習を兼ねており、実装時は各技術の理解を深めるための丁寧なコメントと説明を含めます。

## Requirements

### Requirement 1: エージェント実行とオーケストレーション

**User Story:** システム開発者として、UIからの質問を受け取り、3賢者とSOLOMON Judgeを効率的に実行したい。

#### Acceptance Criteria

1. WHEN UIから/api/askリクエストを受信 THEN システム SHALL Strands Agentsフレームワークで3賢者を並列実行する
2. WHEN 3賢者の実行が完了 THEN システム SHALL SOLOMON JudgeによるA2A（Agent-to-Agent）プロトコルで結果を集約する
3. WHEN SOLOMON Judgeの評価が完了 THEN システム SHALL 統合されたJSONレスポンスを返却する
4. WHEN エージェント実行中にエラーが発生 THEN システム SHALL 適切なフォールバック処理と部分結果を提供する
5. WHEN 同時リクエストが発生 THEN システム SHALL 並列処理で効率的にリクエストを処理する

### Requirement 2: 観測とトレーシング

**User Story:** 運用者として、エージェント実行の詳細な観測情報を取得し、問題の特定と性能改善を行いたい。

#### Acceptance Criteria

1. WHEN エージェント実行が開始 THEN システム SHALL Amazon Bedrock AgentCore Runtimeで観測を有効化する
2. WHEN 各実行ステップが完了 THEN システム SHALL 一意のtrace_idを生成し、OpenTelemetryでトレース情報を記録する
3. WHEN トレース情報が生成 THEN システム SHALL CloudWatch + AWS X-Rayにメトリクスとトレースを送信する
4. WHEN 実行が完了 THEN システム SHALL トークン使用量、レイテンシ、エラー率をメトリクスとして記録する
5. WHEN 観測データが収集 THEN システム SHALL 運用ダッシュボードで可視化可能な形式で出力する

### Requirement 3: トレースステップの永続化

**User Story:** 開発者として、エージェント実行の詳細ステップをデータベースに保存し、後から分析できるようにしたい。

#### Acceptance Criteria

1. WHEN エージェント実行ステップが完了 THEN システム SHALL TraceStepをAmplify Dataに保存する
2. WHEN TraceStepを保存 THEN システム SHALL ステップ要約、使用ツール、引用URL、所要時間、エラー情報を含める
3. WHEN 保存処理でエラーが発生 THEN システム SHALL エラーログを記録し、実行は継続する
4. WHEN UIからトレース情報を要求 THEN システム SHALL 保存されたTraceStepをリアルタイムでストリーミング配信する
5. WHEN トレース保持期間が経過 THEN システム SHALL 古いトレースデータを自動削除する

### Requirement 4: エージェント設定管理

**User Story:** 研究者として、3賢者とSOLOMONの設定を動的に変更し、異なる実験条件で実行したい。

#### Acceptance Criteria

1. WHEN リクエストにエージェント設定が含まれる THEN システム SHALL 指定された設定で各エージェントを初期化する
2. WHEN 設定が指定されない THEN システム SHALL デフォルトプリセットを使用してエージェントを実行する
3. WHEN 無効な設定が指定 THEN システム SHALL 設定検証エラーを返し、デフォルト設定にフォールバックする
4. WHEN 設定変更が発生 THEN システム SHALL 設定変更をトレースログに記録する
5. WHEN 実行時間制限を超過 THEN システム SHALL タイムアウト処理を実行し、部分結果を返却する

### Requirement 5: パフォーマンスと可用性

**User Story:** ユーザーとして、高速で信頼性の高いエージェント実行サービスを利用したい。

#### Acceptance Criteria

1. WHEN 通常の負荷条件下 THEN システム SHALL 2秒以内にレスポンスを返却する
2. WHEN 高負荷状態 THEN システム SHALL 適切な負荷分散とキューイングでサービス品質を維持する
3. WHEN 一部のエージェントが失敗 THEN システム SHALL 利用可能なエージェントの結果で部分応答を提供する
4. WHEN システムリソースが不足 THEN システム SHALL 適切なエラーメッセージとリトライ指示を提供する
5. WHEN 定期メンテナンス THEN システム SHALL グレースフルシャットダウンで実行中のリクエストを完了させる

### Requirement 6: セキュリティとコンプライアンス

**User Story:** セキュリティ管理者として、エージェント実行環境のセキュリティを確保したい。

#### Acceptance Criteria

1. WHEN リクエストを受信 THEN システム SHALL Amplify Authトークンを検証し、認証済みユーザーのみアクセスを許可する
2. WHEN 入力データを処理 THEN システム SHALL 入力検証とサニタイゼーションを実行する
3. WHEN エージェント実行 THEN システム SHALL プロンプトインジェクション攻撃を検出・防止する
4. WHEN トレースデータを保存 THEN システム SHALL 機密情報を除外し、適切に匿名化する
5. WHEN ログを出力 THEN システム SHALL 個人情報を含まない安全なログ形式を使用する