import { useState, useEffect } from 'react'
import { Key, X, Eye, EyeOff, Check } from 'lucide-react'
import { OPENROUTER_MODELS } from '../services/constants'

const STORAGE_KEY = 'sss_api_keys'

export function useApiKeys() {
  const [keys, setKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch { return {} }
  })

  const save = (newKeys) => {
    setKeys(newKeys)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeys))
  }

  return [keys, save]
}

export default function ApiSettings({ onClose }) {
  const [keys, saveKeys] = useApiKeys()
  const [form, setForm] = useState({ ...keys })
  const [show, setShow] = useState({})

  const toggle = (k) => setShow(s => ({ ...s, [k]: !s[k] }))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    saveKeys(form)
    onClose()
  }

  const fields = [
    { key: 'gemini', label: 'Gemini API Key', hint: '필수 — 대본생성 + 이미지분석', color: '#4285f4', link: 'https://aistudio.google.com/apikey' },
    { key: 'openrouter', label: 'OpenRouter API Key', hint: '선택 — GPT-4o, Claude 등 다른 모델', color: '#7c5cff', link: 'https://openrouter.ai/keys' },
    { key: 'tavily', label: 'Tavily API Key', hint: '선택 — 실시간 상품 검색', color: '#00e5a0', link: 'https://app.tavily.com' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:480, maxWidth:'95vw' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Key size={18} color="var(--accent2)" />
            <span style={{ fontWeight:700, fontSize:16 }}>API 키 설정</span>
          </div>
          <button className="btn btn-ghost" style={{ padding:'4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{f.label}</label>
                <a href={f.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:f.color }}>발급받기 →</a>
              </div>
              <div style={{ position:'relative' }}>
                <input
                  type={show[f.key] ? 'text' : 'password'}
                  placeholder={`${f.label} 입력...`}
                  value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ paddingRight:36 }}
                />
                <button
                  onClick={() => toggle(f.key)}
                  style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}
                >
                  {show[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{f.hint}</p>
            </div>
          ))}

          {form.openrouter && (
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:4 }}>OpenRouter 모델</label>
              <select value={form.orModel || 'openai/gpt-4o'} onChange={e => set('orModel', e.target.value)}>
                {OPENROUTER_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={14} /> 저장
          </button>
        </div>
      </div>
    </div>
  )
}
