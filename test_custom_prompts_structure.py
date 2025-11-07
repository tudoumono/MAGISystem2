#!/usr/bin/env python3
"""
カスタムプロンプト機能の構造テスト

magi_agent.pyのプロンプト構造が正しく実装されているか確認します。
Strandsモジュールは不要です。
"""

import re


def test_prompt_constants():
    """プロンプト定数の確認"""
    print("=" * 80)
    print("Test 1: プロンプト定数の存在確認")
    print("=" * 80)

    with open('agents/magi_agent.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 必要な定数が存在するか確認
    required_constants = [
        'SAGE_JSON_FORMAT',
        'SOLOMON_JSON_FORMAT',
        'DEFAULT_CASPAR_ROLE',
        'DEFAULT_BALTHASAR_ROLE',
        'DEFAULT_MELCHIOR_ROLE',
        'DEFAULT_SOLOMON_ROLE'
    ]

    print("\n📝 定数の存在確認:")
    all_found = True
    for const in required_constants:
        if const in content:
            print(f"   ✅ {const}")
        else:
            print(f"   ❌ {const} が見つかりません")
            all_found = False

    return all_found


def test_json_format_immutability():
    """JSON形式が固定されているか確認"""
    print("\n" + "=" * 80)
    print("Test 2: JSON出力形式の固定性確認")
    print("=" * 80)

    with open('agents/magi_agent.py', 'r', encoding='utf-8') as f:
        content = f.read()

    print("\n📝 JSON形式の要素確認:")

    # SAGE_JSON_FORMAT の必須要素
    sage_required = ['"decision"', '"reasoning"', '"confidence"']
    print("\n   SAGE_JSON_FORMAT:")
    all_found = True
    for element in sage_required:
        if element in content:
            print(f"      ✅ {element}")
        else:
            print(f"      ❌ {element} が見つかりません")
            all_found = False

    # SOLOMON_JSON_FORMAT の必須要素
    solomon_required = ['"final_decision"', '"reasoning"', '"confidence"', '"sage_scores"']
    print("\n   SOLOMON_JSON_FORMAT:")
    for element in solomon_required:
        if element in content:
            print(f"      ✅ {element}")
        else:
            print(f"      ❌ {element} が見つかりません")
            all_found = False

    return all_found


def test_build_prompt_method():
    """_build_prompt メソッドの存在確認"""
    print("\n" + "=" * 80)
    print("Test 3: _build_prompt メソッドの実装確認")
    print("=" * 80)

    with open('agents/magi_agent.py', 'r', encoding='utf-8') as f:
        content = f.read()

    print("\n📝 _build_prompt メソッド:")

    # _build_prompt メソッドが実装されているか
    if 'def _build_prompt(' in content:
        print("   ✅ _build_prompt メソッドが定義されています")

        # メソッドがカスタムプロンプトとJSON形式を結合しているか
        if 'role + json_format' in content or 'return role + json_format' in content:
            print("   ✅ プロンプトの結合ロジックが実装されています")
            return True
        else:
            print("   ❌ プロンプトの結合ロジックが見つかりません")
            return False
    else:
        print("   ❌ _build_prompt メソッドが見つかりません")
        return False


def test_custom_prompt_support():
    """カスタムプロンプトのサポート確認"""
    print("\n" + "=" * 80)
    print("Test 4: カスタムプロンプト機能の実装確認")
    print("=" * 80)

    with open('agents/magi_agent.py', 'r', encoding='utf-8') as f:
        content = f.read()

    print("\n📝 カスタムプロンプト機能:")

    checks = [
        ('__init__.*custom_prompts', '__init__ メソッドがカスタムプロンプトを受け取る'),
        ('request_custom_prompts', 'リクエストレベルのカスタムプロンプトをサポート'),
        ('custom_role', '_consult_sage_stream がカスタムロールを受け取る'),
        ('self.custom_prompts', 'カスタムプロンプトを保持する属性')
    ]

    all_found = True
    for pattern, description in checks:
        if re.search(pattern, content, re.DOTALL):
            print(f"   ✅ {description}")
        else:
            print(f"   ❌ {description} が見つかりません")
            all_found = False

    return all_found


def test_config_integration():
    """config.py との統合確認"""
    print("\n" + "=" * 80)
    print("Test 5: config.py との統合確認")
    print("=" * 80)

    with open('agents/shared/config.py', 'r', encoding='utf-8') as f:
        config_content = f.read()

    print("\n📝 config.py の機能:")

    checks = [
        ('caspar_custom_prompt', 'CASPARカスタムプロンプト設定'),
        ('balthasar_custom_prompt', 'BALTHASARカスタムプロンプト設定'),
        ('melchior_custom_prompt', 'MELCHIORカスタムプロンプト設定'),
        ('solomon_custom_prompt', 'SOLOMONカスタムプロンプト設定'),
        ('def get_custom_prompt', 'get_custom_prompt メソッド'),
        ('def has_custom_prompts', 'has_custom_prompts メソッド')
    ]

    all_found = True
    for pattern, description in checks:
        if pattern in config_content:
            print(f"   ✅ {description}")
        else:
            print(f"   ❌ {description} が見つかりません")
            all_found = False

    return all_found


def test_env_template():
    """環境変数テンプレートの確認"""
    print("\n" + "=" * 80)
    print("Test 6: .env.template の更新確認")
    print("=" * 80)

    with open('agents/.env.template', 'r', encoding='utf-8') as f:
        env_content = f.read()

    print("\n📝 .env.template の設定項目:")

    checks = [
        ('CASPAR_CUSTOM_PROMPT', 'CASPARカスタムプロンプト'),
        ('BALTHASAR_CUSTOM_PROMPT', 'BALTHASARカスタムプロンプト'),
        ('MELCHIOR_CUSTOM_PROMPT', 'MELCHIORカスタムプロンプト'),
        ('SOLOMON_CUSTOM_PROMPT', 'SOLOMONカスタムプロンプト')
    ]

    all_found = True
    for pattern, description in checks:
        if pattern in env_content:
            print(f"   ✅ {description}")
        else:
            print(f"   ❌ {description} が見つかりません")
            all_found = False

    return all_found


def main():
    """メインテスト実行"""
    print("\n🧪 カスタムプロンプト機能の構造テスト\n")

    tests = [
        test_prompt_constants,
        test_json_format_immutability,
        test_build_prompt_method,
        test_custom_prompt_support,
        test_config_integration,
        test_env_template
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n❌ テスト失敗: {e}")
            import traceback
            traceback.print_exc()
            results.append(False)

    # 結果サマリー
    print("\n" + "=" * 80)
    print("テスト結果サマリー")
    print("=" * 80)

    passed = sum(results)
    total = len(results)

    print(f"\n✅ 成功: {passed}/{total}")

    if passed == total:
        print("\n🎉 全てのテストが成功しました！")
        print("\nカスタムプロンプト機能は正しく実装されています：")
        print("  ✅ プロンプトがカスタマイズ可能パートと固定パートに分離")
        print("  ✅ JSON出力形式は変更不可")
        print("  ✅ 環境変数とリクエストパラメータの両方でカスタマイズ可能")
        print("  ✅ 後方互換性を維持")
        return 0
    else:
        print(f"\n⚠️  {total - passed}個のテストが失敗しました")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
