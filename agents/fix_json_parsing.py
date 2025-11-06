#!/usr/bin/env python3
"""
magi_agent.pyのJSON解析部分を修正するスクリプト
"""

import re

# ファイルを読み込む
with open('magi_agent.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 古いJSON解析パターン（3賢者用）
old_sage_pattern = r'''            # JSON部分を抽出（より堅牢な方法）
            try:
                # Strands Agentsのデバッグ出力を除去
                import re
                clean_response = full_response
                
                # デバッグ出力パターンを除去（より強力な正規表現）
                # \{'\.\.\.': \.\.\.} 形式のデバッグ出力を全て除去
                clean_response = re\.sub\(r"\\{\\['\"]\\(\\?:event\\|message\\|result\\|init_event_loop\\|start\\|start_event_loop\\)\\['\"]:[^}]*\\}", "", clean_response\)
                
                # 残った {} のみの行を除去
                clean_response = re\.sub\(r"^\\{\\}$", "", clean_response, flags=re\.MULTILINE\)
                
                # JSON抽出の試行
                json_text = None
                
                # 1\. ```json ブロックを探す
                if '```json' in clean_response:
                    json_start = clean_response\.find\('```json'\) \+ 7
                    json_end = clean_response\.find\('```', json_start\)
                    if json_end > json_start:
                        json_text = clean_response\[json_start:json_end\]\.strip\(\)
                
                # 2\. { } で囲まれた部分を探す（最も外側の括弧）
                if not json_text and '{' in clean_response:
                    # 最初の { を見つける
                    json_start = clean_response\.find\('{'\)
                    # 対応する } を見つける（ネストを考慮）
                    bracket_count = 0
                    json_end = -1
                    for i in range\(json_start, len\(clean_response\)\):
                        if clean_response\[i\] == '{':
                            bracket_count \+= 1
                        elif clean_response\[i\] == '}':
                            bracket_count -= 1
                            if bracket_count == 0:
                                json_end = i \+ 1
                                break
                    
                    if json_end > json_start:
                        json_text = clean_response\[json_start:json_end\]
                
                # 3\. JSON解析
                if json_text:
                    result = json\.loads\(json_text\)
                    result\['agent_id'\] = agent_id'''

# 新しいJSON解析パターン（3賢者用）
new_sage_pattern = '''            # JSON部分を抽出（シンプルで堅牢な方法）
            try:
                import re
                
                # "decision"キーを含む最初の完全なJSONオブジェクトを探す
                json_text = None
                
                if '"decision"' in full_response:
                    # "decision"の前の最も近い { を見つける
                    decision_pos = full_response.find('"decision"')
                    json_start = full_response.rfind('{', 0, decision_pos)
                    
                    if json_start != -1:
                        # 対応する } を見つける（ネストを考慮）
                        bracket_count = 0
                        json_end = -1
                        for i in range(json_start, len(full_response)):
                            if full_response[i] == '{':
                                bracket_count += 1
                            elif full_response[i] == '}':
                                bracket_count -= 1
                                if bracket_count == 0:
                                    json_end = i + 1
                                    break
                        
                        if json_end > json_start:
                            json_text = full_response[json_start:json_end]
                
                # JSON解析
                if json_text:
                    result = json.loads(json_text)
                    result['agent_id'] = agent_id'''

# 置換実行（最初の出現のみ）
content_new = content.replace(old_sage_pattern, new_sage_pattern, 1)

# SOLOMON Judge用も同様に置換（2回目の出現）
# "final_decision"を探すパターンに変更
old_solomon_pattern = old_sage_pattern.replace("result['agent_id'] = agent_id", "")

new_solomon_pattern = '''            # JSON部分を抽出（シンプルで堅牢な方法）
            try:
                import re
                
                # "final_decision"キーを含む最初の完全なJSONオブジェクトを探す
                json_text = None
                
                if '"final_decision"' in full_response:
                    # "final_decision"の前の最も近い { を見つける
                    decision_pos = full_response.find('"final_decision"')
                    json_start = full_response.rfind('{', 0, decision_pos)
                    
                    if json_start != -1:
                        # 対応する } を見つける（ネストを考慮）
                        bracket_count = 0
                        json_end = -1
                        for i in range(json_start, len(full_response)):
                            if full_response[i] == '{':
                                bracket_count += 1
                            elif full_response[i] == '}':
                                bracket_count -= 1
                                if bracket_count == 0:
                                    json_end = i + 1
                                    break
                        
                        if json_end > json_start:
                            json_text = full_response[json_start:json_end]
                
                # JSON解析
                if json_text:
                    result = json.loads(json_text)'''

content_new = content_new.replace(old_solomon_pattern.strip(), new_solomon_pattern, 1)

# ファイルに書き込む
with open('magi_agent.py', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("✅ JSON解析部分を修正しました")
print(f"変更前: {len(content)} 文字")
print(f"変更後: {len(content_new)} 文字")
