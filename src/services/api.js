// ── Gemini ────────────────────────────────────────────────────────────────────
export async function callGemini(apiKey, prompt, imageBase64 = null) {
  const parts = [{ text: prompt }]
  if (imageBase64) {
    parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } })
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
export async function callOpenRouter(apiKey, model, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Tavily ────────────────────────────────────────────────────────────────────
export async function tavilySearch(apiKey, query, maxResults = 5) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: 'advanced',
    }),
  })
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`)
  const data = await res.json()
  return data.results || []
}

// ── 공통 AI 호출 (이미지 있으면 Gemini, 없으면 OpenRouter or Gemini) ────────
export async function callAI({ geminiKey, openrouterKey, openrouterModel, prompt, imageBase64 }) {
  if (imageBase64 && geminiKey) {
    return callGemini(geminiKey, prompt, imageBase64)
  }
  if (openrouterKey && openrouterModel) {
    return callOpenRouter(openrouterKey, openrouterModel, prompt)
  }
  if (geminiKey) {
    return callGemini(geminiKey, prompt)
  }
  throw new Error('API 키가 없습니다.')
}
