import json
import re
import os
import time
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class AISolverEngine:
    """
    Engine for automated exam solving and explanation generation
    supporting Google Gemini and OpenAI ChatGPT (with intelligent retry,
    fallback model chain, and auto-batching to eliminate 503/429 errors).
    """

    PROVIDER_DEFAULT_MODELS = {
        'gemini': 'gemini-3.7-flash',
        'openai': 'gpt-4o-mini',
        'deepseek': 'deepseek-chat',
        'claude': 'claude-3-7-sonnet-20250219',
        'grok': 'grok-3'
    }

    PROVIDER_FALLBACK_MODELS = {
        'gemini': [
            'gemini-3.7-flash',       # Ưu tiên 1: Đỉnh cao suy luận & Mới nhất
            'gemini-3.6-flash',       # Ưu tiên 2: Thế hệ 3.6 cao cấp
            'gemini-3.5-flash-lite',  # Dự phòng Hạn mức Khủng: 500 RPD, 15 RPM, Siêu tốc
            'gemini-3.1-flash-lite',  # Dự phòng 500 RPD
            'gemini-2.5-flash',
            'gemini-3.5-flash',
            'gemini-3-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ],
        'openai': [
            'gpt-4o-mini',
            'gpt-4o'
        ],
        'deepseek': [
            'deepseek-chat'
        ],
        'claude': [
            'claude-3-5-haiku-20241022',
            'claude-3-5-sonnet-20241022'
        ],
        'grok': [
            'grok-3',
            'grok-2'
        ]
    }

    PROVIDER_DEFAULT_ENDPOINTS = {
        'gemini': 'https://generativelanguage.googleapis.com/v1beta/models',
        'openai': 'https://api.openai.com/v1/chat/completions',
        'deepseek': 'https://api.deepseek.com/chat/completions',
        'claude': 'https://api.anthropic.com/v1/messages',
        'grok': 'https://api.x.ai/v1/chat/completions'
    }

    @classmethod
    def test_connection(
        cls,
        provider: str,
        api_key: str,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tests whether the provided API key and provider configuration work.
        """
        provider = (provider or 'gemini').lower()
        model = model or cls.PROVIDER_DEFAULT_MODELS.get(provider, 'gemini-3.7-flash')

        test_prompt = "Hãy trả lời ngắn gọn đúng 1 từ: 'OK'."

        try:
            raw_response, used_model, fallback_used, notice = cls._call_provider_with_retry_and_fallback(
                provider=provider,
                api_key=api_key,
                model=model,
                base_url=base_url,
                prompt=test_prompt,
                max_tokens=20
            )
            msg = f'Kết nối thành công tới {provider.upper()} ({used_model})!'
            if fallback_used:
                msg += f' (Đã tự động chuyển dự phòng từ {model} do máy chủ đang quá tải)'

            return {
                'success': True,
                'provider': provider,
                'model': model,
                'model_used': used_model,
                'fallback_used': fallback_used,
                'message': msg,
                'raw_reply': raw_response.strip()
            }
        except Exception as e:
            return {
                'success': False,
                'provider': provider,
                'model': model,
                'error': str(e)
            }

    @classmethod
    def solve_exam(
        cls,
        questions: List[Dict[str, Any]],
        provider: str = 'gemini',
        api_key: str = '',
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        solve_mode: str = 'unanswered_only', # 'unanswered_only', 'all', 'selected_only'
        selected_indices: Optional[List[int]] = None,
        include_explanations: bool = True
    ) -> Dict[str, Any]:
        """
        Solves Informatics exam questions (Part I multiple-choice & Part II true/false statements)
        with automatic batching, retry with exponential backoff,
        and fallback model chain.
        """
        provider = (provider or 'gemini').lower()
        model = model or cls.PROVIDER_DEFAULT_MODELS.get(provider, 'gemini-3.7-flash')

        if not api_key:
            # Fallback to server env var if available
            env_var_map = {
                'gemini': 'GEMINI_API_KEY',
                'openai': 'OPENAI_API_KEY',
                'deepseek': 'DEEPSEEK_API_KEY',
                'claude': 'ANTHROPIC_API_KEY',
                'grok': 'GROK_API_KEY'
            }
            env_key = env_var_map.get(provider, '')
            api_key = os.environ.get(env_key, '')

        if not api_key:
            raise ValueError(f"Vui lòng cung cấp API Key cho {provider.upper()} trong phần Cài đặt AI!")

        # Filter target questions to solve
        targets = []
        selected_set = set(selected_indices) if selected_indices is not None else None

        for idx, q in enumerate(questions):
            # If in selected_only mode, only solve matching indices
            if solve_mode == 'selected_only':
                if selected_set is not None and idx not in selected_set and q.get('order_index') not in selected_set:
                    continue

            has_answer = False
            if q.get('part_type') == 'PART_I':
                has_answer = any(opt.get('is_correct') for opt in q.get('options', []))
            else:
                has_answer = any(opt.get('is_correct') for opt in q.get('options', []))

            if solve_mode in ['all', 'selected_only'] or not has_answer:
                targets.append({
                    'list_index': idx,
                    'order_index': q.get('order_index', idx + 1),
                    'part_type': q.get('part_type', 'PART_I'),
                    'branch': q.get('branch', 'COMMON'),
                    'content': q.get('content', ''),
                    'code_snippet': q.get('code_snippet', ''),
                    'code_language': q.get('code_language', ''),
                    'options': q.get('options', [])
                })

        if not targets:
            return {
                'success': True,
                'solved_count': 0,
                'message': 'Tất cả câu hỏi đều đã có đáp án đầy đủ.',
                'results': []
            }

        # Smart Batching: If <= 30 questions, solve in 1 single request to conserve daily quota (RPD).
        # If > 30 questions, chunk into batches of 20-25 questions.
        BATCH_SIZE = 25 if len(targets) > 30 else 30
        target_batches = [targets[i:i + BATCH_SIZE] for i in range(0, len(targets), BATCH_SIZE)]

        all_parsed_results = []
        final_model_used = model
        any_fallback_used = False
        all_notices = []

        for batch_idx, batch_targets in enumerate(target_batches):
            prompt = cls._build_exam_prompt(batch_targets, include_explanations)
            
            raw_text, used_model, fallback_used, notice = cls._call_provider_with_retry_and_fallback(
                provider=provider,
                api_key=api_key,
                model=model,
                base_url=base_url,
                prompt=prompt,
                max_tokens=8192
            )

            if fallback_used:
                any_fallback_used = True
                final_model_used = used_model
                if notice and notice not in all_notices:
                    all_notices.append(notice)

            parsed_batch_results = cls._parse_ai_json_response(raw_text)
            all_parsed_results.extend(parsed_batch_results)

        return {
            'success': True,
            'provider': provider,
            'model': model,
            'model_used': final_model_used,
            'fallback_used': any_fallback_used,
            'notice': " ".join(all_notices) if all_notices else "",
            'solved_count': len(all_parsed_results),
            'results': all_parsed_results
        }

    @classmethod
    def _build_exam_prompt(cls, targets: List[Dict[str, Any]], include_explanations: bool) -> str:
        simplified_questions = []
        for t in targets:
            opts_simple = []
            for opt in t['options']:
                opts_simple.append({
                    'label': opt.get('label', ''),
                    'content': opt.get('content', '')
                })

            simplified_questions.append({
                'list_index': t['list_index'],
                'order_index': t['order_index'],
                'part_type': t['part_type'],
                'branch': t['branch'],
                'prompt': t['content'],
                'code': t['code_snippet'],
                'language': t['code_language'],
                'options': opts_simple
            })

        questions_json = json.dumps(simplified_questions, ensure_ascii=False, indent=2)

        prompt = f"""Bạn là Chuyên gia giải đề thi Tin học và Khoa học máy tính THPT hàng đầu Việt Nam.
Hãy giải chính xác tuyệt đối từng câu hỏi sau đây theo đúng quy chuẩn đề thi khảo sát/tốt nghiệp THPT và HSG môn Tin học:

DANH SÁCH CÂU HỎI:
```json
{questions_json}
```

HƯỚNG DẪN GIẢI QUYẾT:
1. Đối với câu hỏi Phần I (`PART_I` - Trắc nghiệm 4 lựa chọn A, B, C, D):
   - Chọn duy nhất 1 phương án đúng (`correct_option`: "A", "B", "C" hoặc "D").
   - {"Cung cấp lời giải ngắn gọn, chuẩn xác `explanation` (phân tích code, cú pháp, thuật toán)." if include_explanations else ""}

2. Đối với câu hỏi Phần II (`PART_II` - Trắc nghiệm Đúng/Sai gồm 4 ý a, b, c, d):
   - Xác định chính xác từng ý `a`, `b`, `c`, `d` là `true` (ĐÚNG) hay `false` (SAI) trong trường `sub_answers`.
   - {"Cung cấp lời giải chi tiết `explanation` phân tích rõ từng ý a, b, c, d vì sao Đúng hoặc Sai." if include_explanations else ""}

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (Chỉ trả về JSON thuần túy, không bọc thêm văn bản giải thích bên ngoài):
{{
  "results": [
    {{
      "list_index": 0,
      "order_index": 1,
      "part_type": "PART_I",
      "correct_option": "B",
      "explanation": "Lời giải ngắn gọn tại sao phương án B đúng..."
    }},
    {{
      "list_index": 3,
      "order_index": 4,
      "part_type": "PART_II",
      "sub_answers": {{
        "a": true,
        "b": false,
        "c": true,
        "d": false
      }},
      "explanation": "Phân tích chi tiết: a) Đúng vì...; b) Sai vì...; c) Đúng vì...; d) Sai vì..."
    }}
  ]
}}
"""
        return prompt

    @classmethod
    def _call_provider_with_retry_and_fallback(
        cls,
        provider: str,
        api_key: str,
        model: str,
        base_url: Optional[str],
        prompt: str,
        max_tokens: int = 4096,
        allow_fallback: bool = True
    ) -> Tuple[str, str, bool, str]:
        """
        Executes API call with:
        1. Exponential backoff retries for transient errors (503, 429, 500, 502, 504, timeout).
        2. Automatic fallback model switching if primary model is overloaded (503) or not found (404).
        Returns: (raw_text, used_model, fallback_triggered, notice_message)
        """
        provider = (provider or 'gemini').lower()
        primary_model = (model or cls.PROVIDER_DEFAULT_MODELS.get(provider, 'gemini-2.5-flash')).strip()

        # Build ordered list of candidate models to try
        candidate_models = [primary_model]
        if allow_fallback and not base_url:
            fallback_list = cls.PROVIDER_FALLBACK_MODELS.get(provider, [])
            for fb in fallback_list:
                if fb not in candidate_models:
                    candidate_models.append(fb)

        last_error = None
        models_attempted = []

        for current_model in candidate_models:
            models_attempted.append(current_model)
            max_retries = 3

            for attempt in range(max_retries):
                try:
                    raw_response = cls._call_provider_single(
                        provider=provider,
                        api_key=api_key,
                        model=current_model,
                        base_url=base_url,
                        prompt=prompt,
                        max_tokens=max_tokens
                    )
                    
                    fallback_triggered = (current_model != primary_model)
                    notice = ""
                    if fallback_triggered:
                        notice = f"Đã tự động chuyển dự phòng sang mô hình '{current_model}' do '{primary_model}' tạm thời quá tải trên máy chủ Google (503)."

                    return raw_response, current_model, fallback_triggered, notice

                except Exception as e:
                    err_str = str(e)
                    last_error = e

                    # Check if error is authentication failure (400, 401, 403) -> No point retrying or switching models
                    if any(code in err_str for code in ['401:', '403:', 'Xác thực thất bại', 'invalid_api_key', 'incorrect api key']):
                        raise RuntimeError(f"Khóa API {provider.upper()} không hợp lệ hoặc bị từ chối truy cập. Chi tiết: {err_str}")

                    # If model not found (404), break immediately to try next fallback model
                    if '404:' in err_str or 'không tìm thấy' in err_str.lower():
                        break

                    # If transient / high demand error (503, 429, 500, 502, 504, timeout)
                    is_transient = any(code in err_str for code in ['503', '429', '500', '502', '504', 'timed out', 'timeout', 'quá tải', 'Resource has been exhausted'])

                    if is_transient and attempt < max_retries - 1:
                        # Exponential backoff sleep: 1.5s, 3.0s
                        time.sleep(1.5 * (attempt + 1))
                        continue
                    else:
                        # Move to next model in fallback list
                        break

        # If all candidates failed:
        error_summary = str(last_error) if last_error else "Không nhận được phản hồi từ AI."
        tried_models_str = ", ".join(models_attempted)
        raise RuntimeError(
            f"Máy chủ {provider.upper()} hiện đang quá tải hoặc gặp sự cố tạm thời sau khi đã tự động thử các mô hình ({tried_models_str}).\n"
            f"Chi tiết: {error_summary}\n\n"
            f"💡 Gợi ý xử lý:\n"
            f"1. Thử lại sau 1-2 phút (các đợt quá tải của Google Gemini thường diễn ra trong thời gian ngắn).\n"
            f"2. Vào Cài đặt AI chọn mô hình 'gemini-2.5-flash' hoặc 'gemini-2.0-flash' để có độ ổn định cao nhất.\n"
            f"3. Hoặc chuyển sang sử dụng mô hình OpenAI ChatGPT (gpt-4o-mini)."
        )

    @classmethod
    def _call_provider_single(
        cls,
        provider: str,
        api_key: str,
        model: str,
        base_url: Optional[str],
        prompt: str,
        max_tokens: int = 4096
    ) -> str:
        headers = {'Content-Type': 'application/json'}
        timeout = 60
        api_key_clean = (api_key or '').strip()

        if provider == 'gemini':
            model_clean = model.strip()
            if model_clean.startswith('models/'):
                model_clean = model_clean[7:]

            headers['x-goog-api-key'] = api_key_clean

            if base_url:
                base = base_url.rstrip('/')
                if 'generateContent' in base:
                    endpoint = f"{base}?key={api_key_clean}" if '?key=' not in base else base
                else:
                    endpoint = f"{base}/{model_clean}:generateContent?key={api_key_clean}"
            else:
                endpoint = f"{cls.PROVIDER_DEFAULT_ENDPOINTS['gemini']}/{model_clean}:generateContent?key={api_key_clean}"

            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": max_tokens,
                    "responseMimeType": "application/json"
                }
            }
            res = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)
            if res.status_code != 200:
                err_text = res.text
                err_msg = ""
                try:
                    err_json = res.json()
                    err_msg = err_json.get('error', {}).get('message', err_text)
                except Exception:
                    err_msg = err_text

                if res.status_code == 404:
                    raise RuntimeError(
                        f"404: Mô hình '{model_clean}' không tìm thấy trên máy chủ Google Gemini."
                    )
                elif res.status_code == 503:
                    raise RuntimeError(
                        f"503: Máy chủ Google Gemini đang quá tải cho mô hình '{model_clean}' ({err_msg})."
                    )
                elif res.status_code == 429:
                    raise RuntimeError(
                        f"429: Vượt quá giới hạn tần suất hoặc hạn mức Quota ({err_msg})."
                    )
                elif res.status_code in [400, 401, 403]:
                    raise RuntimeError(
                        f"{res.status_code}: Xác thực thất bại với Google Gemini: {err_msg}."
                    )
                else:
                    raise RuntimeError(f"Lỗi từ máy chủ Google Gemini ({res.status_code}): {err_msg}")

            data = res.json()
            candidates = data.get('candidates', [])
            if not candidates:
                raise RuntimeError("Google Gemini không trả về kết quả.")
            return candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')

        elif provider in ['openai', 'deepseek', 'grok']:
            endpoint = base_url or cls.PROVIDER_DEFAULT_ENDPOINTS.get(provider, 'https://api.openai.com/v1/chat/completions')
            headers['Authorization'] = f"Bearer {api_key_clean}"

            is_reasoning_model = any(m in model.lower() for m in ['o1', 'o3', 'deepseek-reasoner'])
            payload: Dict[str, Any] = {
                "model": model,
                "messages": [
                    {
                        "role": "developer" if is_reasoning_model and provider == 'openai' else "system",
                        "content": "You are a professional computer science exam solver. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"}
            }

            if is_reasoning_model:
                payload["max_completion_tokens"] = max_tokens
            else:
                payload["temperature"] = 0.1
                payload["max_tokens"] = max_tokens

            res = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)
            if res.status_code != 200:
                err_text = res.text
                err_msg = ""
                try:
                    err_json = res.json()
                    err_msg = err_json.get('error', {}).get('message', err_text)
                except Exception:
                    err_msg = err_text

                if res.status_code in [401, 403] or 'invalid_api_key' in err_text.lower() or 'incorrect api key' in err_text.lower():
                    raise RuntimeError(f"401: API Key {provider.upper()} không hợp lệ ({err_msg}). Vui lòng kiểm tra lại khóa API.")
                elif 'insufficient_quota' in err_text.lower() or res.status_code == 429:
                    raise RuntimeError(f"429: Tài khoản {provider.upper()} đã hết hạn mức (Quota) hoặc vượt giới hạn truy vấn. Chi tiết: {err_msg}")
                else:
                    raise RuntimeError(f"Lỗi {provider.upper()} ({res.status_code}): {err_msg}")

            data = res.json()
            return data.get('choices', [{}])[0].get('message', {}).get('content', '')

        elif provider == 'claude':
            endpoint = base_url or cls.PROVIDER_DEFAULT_ENDPOINTS['claude']
            headers['x-api-key'] = api_key
            headers['anthropic-version'] = '2023-06-01'
            payload = {
                "model": model,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            res = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)
            if res.status_code != 200:
                err_text = res.text
                try:
                    err_json = res.json()
                    err_text = err_json.get('error', {}).get('message', err_text)
                except Exception:
                    pass
                raise RuntimeError(f"Lỗi Claude ({res.status_code}): {err_text}")
            data = res.json()
            content_blocks = data.get('content', [])
            if not content_blocks:
                raise RuntimeError("Claude không trả về nội dung.")
            return content_blocks[0].get('text', '')

        else:
            raise ValueError(f"Nhà cung cấp AI '{provider}' chưa được hỗ trợ.")

    @classmethod
    def _parse_ai_json_response(cls, raw_text: str) -> List[Dict[str, Any]]:
        """
        Robust JSON extractor that handles markdown wrappers (```json ... ```) or raw strings.
        """
        if not raw_text or not raw_text.strip():
            return []

        clean_text = raw_text.strip()
        # Remove markdown code block fences if present
        if clean_text.startswith('```'):
            clean_text = re.sub(r'^```(?:json)?\s*', '', clean_text, flags=re.IGNORECASE)
            clean_text = re.sub(r'\s*```$', '', clean_text)

        try:
            parsed = json.loads(clean_text)
        except json.JSONDecodeError:
            # Try to locate the main JSON array or object
            json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', clean_text)
            if json_match:
                parsed = json.loads(json_match.group(1))
            else:
                raise RuntimeError(f"Không thể đọc định dạng JSON từ phản hồi của AI: {raw_text[:200]}")

        if isinstance(parsed, dict) and 'results' in parsed:
            return parsed['results']
        elif isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict):
            return list(parsed.values())
        return []
