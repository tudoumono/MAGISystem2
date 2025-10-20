# Requirements Document

## Introduction

エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システムのWebユーザーインターフェースを構築します。ユーザーは質問を投稿し、3賢者（CASPAR、BALTHASAR、MELCHIOR）からの異なる視点の回答とSOLOMON Judgeによる統合評価を受け取ることができます。システムはAWS Amplify、Amazon Bedrock AgentCore、Strands Agentsを基盤とし、リアルタイムな推論過程の可視化と会話履歴管理を提供します。

**学習目的**: このシステムはAWS Amplify、Amazon Bedrock AgentCore、Strands Agentsの学習を兼ねており、実装時は各技術の理解を深めるための丁寧なコメントと説明を含めます。

## Requirements

### Requirement 1: ユーザー認証とセッション管理

**User Story:** エンジニア・研究者として、安全にシステムにアクセスし、個人の会話履歴を管理したい。

#### Acceptance Criteria

1. WHEN ユーザーがサインアップページにアクセス THEN システム SHALL Amplify Auth（Cognito）による新規アカウント作成フォームを表示する
2. WHEN ユーザーが有効な認証情報でサインイン THEN システム SHALL SSRでセッション検証を行い、ダッシュボードにリダイレクトする
3. WHEN 認証済みユーザーがページをリロード THEN システム SHALL リクエストCookieからトークンを抽出し、セッションを維持する
4. WHEN ユーザーがサインアウト THEN システム SHALL セッションを無効化し、サインインページにリダイレクトする
5. WHEN 未認証ユーザーが保護されたページにアクセス THEN システム SHALL サインインページにリダイレクトする

### Requirement 2: 会話履歴管理

**User Story:** ユーザーとして、過去の質問と回答を整理し、必要な時に素早く参照したい。

#### Acceptance Criteria

1. WHEN 認証済みユーザーがダッシュボードにアクセス THEN システム SHALL アカウントごとの会話スレッド一覧をサイドバーに表示する
2. WHEN ユーザーが会話を検索 THEN システム SHALL タイトルと内容で部分一致検索を実行し、結果を表示する
3. WHEN ユーザーが過去の会話を選択 THEN システム SHALL 会話の全メッセージと3賢者の回答を復元表示する
4. WHEN ユーザーが会話を削除 THEN システム SHALL 確認ダイアログ後に会話とメッセージを完全削除する
5. WHEN 会話一覧が多数存在 THEN システム SHALL 無限スクロールで段階的に読み込む
6. WHEN 新しい会話を開始 THEN システム SHALL 新規会話スレッドを作成し、質問入力フォームを表示する

### Requirement 3: 3賢者とSOLOMON Judge による多視点分析

**User Story:** 意思決定者として、複数の異なる視点からの分析と統合された評価を受け取りたい。

#### Acceptance Criteria

1. WHEN ユーザーが質問を投稿 THEN システム SHALL SOLOMON Judgeが統括者として3賢者（CASPAR、BALTHASAR、MELCHIOR）に質問を委託する
2. WHEN 3賢者の回答が完了 THEN システム SHALL 各回答を独立したパネルで並列表示し、加えて可決/否決判断も表示する
3. WHEN 3賢者の回答が揃う THEN システム SHALL SOLOMON Judgeによる0-100点のスコアリングと根拠要約を実行する
4. WHEN SOLOMON評価が完了 THEN システム SHALL スコア比較チャート、統合要約、投票結果（可決X票、否決Y票）、最終判断（可決/否決）を表示する
5. WHEN ユーザーが回答を再実行 THEN システム SHALL 同じ質問で新しい実行を開始し、結果を比較表示する

### Requirement 4: 拡張思考の動的表現（Reasoning Trace）

**User Story:** 開発者として、エージェントの推論過程を詳細に把握し、システムの動作を理解したい。

#### Acceptance Criteria

1. WHEN エージェント実行が開始 THEN システム SHALL Reasoning Traceパネルを表示し、リアルタイム更新を開始する
2. WHEN 各実行ステップが完了 THEN システム SHALL ステップ要約（Step-1/2/3...）を時系列で表示する
3. WHEN エージェントがツールを使用 THEN システム SHALL 使用ツール名とパラメータ要約を表示する
4. WHEN 外部リソースを参照 THEN システム SHALL 主要引用リンクをクリック可能な形で表示する
5. WHEN AgentCoreからトレースIDを受信 THEN システム SHALL トレースIDを表示し、詳細ログへのリンクを提供する
6. WHEN 各ステップの実行時間を計測 THEN システム SHALL 到達時間・レイテンシ・エラー/リトライ回数を表示する
7. IF 生の思考文が含まれる THEN システム SHALL 表示せず、要約のみを安全に表示する

### Requirement 5: パフォーマンスとユーザビリティ

**User Story:** ユーザーとして、快適で応答性の高いインターフェースを使用したい。

#### Acceptance Criteria

1. WHEN 初回ページロード THEN システム SHALL 1.0秒以内にファーストコンテンツフルペイントを完了する
2. WHEN ユーザーがUI操作を実行 THEN システム SHALL 100ms以内に視覚的フィードバックを提供する
3. WHEN エージェント実行中 THEN システム SHALL Skeletonローディングで逐次到着描画を行う
4. WHEN 大量データを表示 THEN システム SHALL 仮想化スクロールで性能を維持する
5. WHEN ネットワークエラーが発生 THEN システム SHALL 適切なエラーメッセージと再試行オプションを表示する

### Requirement 6: アクセシビリティと国際化

**User Story:** 多様なユーザーとして、アクセシブルで使いやすいインターフェースを利用したい。

#### Acceptance Criteria

1. WHEN スクリーンリーダーでアクセス THEN システム SHALL WCAG 2.1 AAレベルの適切なARIAラベルを提供する
2. WHEN キーボードのみで操作 THEN システム SHALL 全機能にキーボードアクセスを提供する
3. WHEN 日本語環境で使用 THEN システム SHALL ja-JPロケールで適切な表示を行う
4. WHEN 将来的に他言語対応 THEN システム SHALL i18n対応の基盤を提供する
5. WHEN 色覚特性のあるユーザーが使用 THEN システム SHALL 色以外の視覚的手がかりを併用する

### Requirement 7: エージェント設定とプリセット管理

**User Story:** 研究者・開発者として、3賢者とSOLOMONの設定を柔軟にカスタマイズし、異なるシナリオで実験したい。

#### Acceptance Criteria

1. WHEN ユーザーが設定画面にアクセス THEN システム SHALL 3賢者とSOLOMONそれぞれの独立したロール・モデル設定画面を表示する
2. WHEN システム初期化時 THEN システム SHALL 複数の事前プリセット（デフォルト、学術研究用、ビジネス分析用等）を提供する
3. WHEN ユーザーが新規プリセット作成 THEN システム SHALL カスタムプリセットの作成・保存・管理機能を提供する
4. WHEN ユーザーがプリセットを選択 THEN システム SHALL 選択されたプリセットの設定を各エージェントに適用する
5. WHEN 会話途中でモデル・ロール変更 THEN システム SHALL 次の会話から新しい設定を反映し、設定変更を明示する
6. WHEN ユーザーが再実行を要求 THEN システム SHALL 現在の設定で同じ質問を再実行し、結果を比較表示する

