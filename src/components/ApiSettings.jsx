import { useState } from 'react'
import { Key, X, Eye, EyeOff, Check, RefreshCw } from 'lucide-react'
import { OPENROUTER_MODELS } from '../services/constants'

const STORAGE_KEY = 'sss_api_keys'

const readStored = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function useApiKeys() {
  const [keys, setKeys] = useState(readStored)
  const save = (newKeys) => { setKeys(newKeys); localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeys)) }
  const refresh = () => setKeys(readStored())
  return [keys, save, refresh]
}

async function verifyGemini(key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  )
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error?.message || `오류 ${res.status}`)
  }
}

async function verifyOpenRouter(key) {
  const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`유효하지 않은 키 (${res.status})`)
}

async function verifyTavily(key) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, query: '테스트', max_results: 1, search_depth: 'basic' }),
  })
  if (!res.ok) throw new Error(`유효하지 않은 키 (${res.status})`)
}

function KeyField({ label, hint, color, link, value, status, msg, showPw, onValueChange, onToggleShow, onVerify, onDelete }) {
  const btnColor  = status === 'ok' ? 'var(--green)' : status === 'error' ? 'var(--pink)' : 'var(--text2)'
  const btnBorder = status === 'ok' ? 'var(--green)' : status === 'error' ? 'var(--pink)' : 'var(--border)'

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{label}</label>
        {link && <a href={link} target="_blank" rel="noreferrer" style={{ fontSize:11, color }}>발급받기 →</a>}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <div style={{ position:'relative', flex:1 }}>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder={`${label} 입력...`}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            style={{ paddingRight:36, width:'100%' }}
          />
          <button
            onClick={onToggleShow}
            style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onVerify}
          disabled={!value.trim() || status === 'checking'}
          style={{ padding:'0 10px', fontSize:12, flexShrink:0, minWidth:82, justifyContent:'center', borderColor: btnBorder, color: btnColor }}
        >
          {status === 'checking'
            ? <><RefreshCw size={12} style={{ animation:'spin 0.7s linear infinite' }} /> 확인중</>
            : status === 'ok'
            ? <><Check size={12} /> 확인됨</>
            : '확인 & 저장'
          }
        </button>
        {value && (
          <button
            className="btn btn-ghost"
            onClick={onDelete}
            title="키 삭제"
            style={{ padding:'0 8px', flexShrink:0, borderColor:'var(--border)', color:'var(--text3)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {msg && (
        <p style={{ fontSize:11, marginTop:3, color: status === 'ok' ? 'var(--green)' : 'var(--pink)' }}>
          {msg}
        </p>
      )}
      <p style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{hint}</p>
    </div>
  )
}

export default function ApiSettings({ onClose }) {
  const stored = readStored()
  const init = (val) => ({ value: val || '', status: val ? 'saved' : 'idle', msg: '' })

  const [gemini, setGemini]               = useState(init(stored.gemini))
  const [openrouter, setOpenrouter]       = useState(init(stored.openrouter))
  const [orModel, setOrModel]             = useState(stored.orModel || 'openai/gpt-4o')
  const [tavily, setTavily]               = useState(init(stored.tavily))
  const [coupangAccess, setCoupangAccess] = useState(init(stored.coupangAccess))
  const [coupangSecret, setCoupangSecret] = useState(init(stored.coupangSecret))
  const [show, setShow]                   = useState({})

  const toggleShow = (k) => setShow(s => ({ ...s, [k]: !s[k] }))

  const patch = (update) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...update }))
  }

  const makeVerify = (state, setter, verifyFn, storageKey) => async () => {
    if (!state.value.trim()) return
    setter(s => ({ ...s, status: 'checking', msg: '' }))
    try {
      await verifyFn(state.value.trim())
      patch({ [storageKey]: state.value.trim() })
      setter(s => ({ ...s, status: 'ok', msg: '✅ 연결 확인 & 저장됨' }))
    } catch (e) {
      setter(s => ({ ...s, status: 'error', msg: `❌ ${e.message}` }))
    }
  }

  const makeDelete = (setter, storageKey) => () => {
    setter({ value: '', status: 'idle', msg: '' })
    const current = readStored()
    delete current[storageKey]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  }

  const handleOrModel = (val) => { setOrModel(val); patch({ orModel: val }) }

  const handleSaveCoupang = () => {
    const a = coupangAccess.value.trim()
    const s = coupangSecret.value.trim()
    if (!a || !s) return
    patch({ coupangAccess: a, coupangSecret: s })
    setCoupangAccess(prev => ({ ...prev, status: 'saved', msg: '✅ 저장됨' }))
    setCoupangSecret(prev => ({ ...prev, status: 'saved', msg: '' }))
  }

  const coupangSaved = coupangAccess.status === 'saved'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:1000, overflowY:'auto', padding:'24px 0' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:500, maxWidth:'95vw' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Key size={18} color="var(--accent2)" />
            <span style={{ fontWeight:700, fontSize:16 }}>API 키 설정</span>
          </div>
          <button className="btn btn-ghost" style={{ padding:'4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <KeyField
            label="Gemini API Key" hint="필수 — 대본생성 + 이미지분석"
            color="#4285f4" link="https://aistudio.google.com/apikey"
            value={gemini.value} status={gemini.status} msg={gemini.msg} showPw={show.gemini}
            onValueChange={v => setGemini(s => ({ ...s, value: v, status: 'idle', msg: '' }))}
            onToggleShow={() => toggleShow('gemini')}
            onVerify={makeVerify(gemini, setGemini, verifyGemini, 'gemini')}
            onDelete={makeDelete(setGemini, 'gemini')}
          />

          <KeyField
            label="OpenRouter API Key" hint="선택 — GPT-4o, Claude 등 다른 모델"
            color="#7c5cff" link="https://openrouter.ai/keys"
            value={openrouter.value} status={openrouter.status} msg={openrouter.msg} showPw={show.openrouter}
            onValueChange={v => setOpenrouter(s => ({ ...s, value: v, status: 'idle', msg: '' }))}
            onToggleShow={() => toggleShow('openrouter')}
            onVerify={makeVerify(openrouter, setOpenrouter, verifyOpenRouter, 'openrouter')}
            onDelete={makeDelete(setOpenrouter, 'openrouter')}
          />

          {openrouter.value && (
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:4 }}>OpenRouter 모델</label>
              <select value={orModel} onChange={e => handleOrModel(e.target.value)}>
                {OPENROUTER_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <KeyField
            label="Tavily API Key" hint="선택 — 실시간 상품 검색"
            color="#00e5a0" link="https://app.tavily.com"
            value={tavily.value} status={tavily.status} msg={tavily.msg} showPw={show.tavily}
            onValueChange={v => setTavily(s => ({ ...s, value: v, status: 'idle', msg: '' }))}
            onToggleShow={() => toggleShow('tavily')}
            onVerify={makeVerify(tavily, setTavily, verifyTavily, 'tavily')}
            onDelete={makeDelete(setTavily, 'tavily')}
          />

          {/* 쿠팡 파트너스 */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>🛒 쿠팡 파트너스 API</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {(coupangAccess.value || coupangSecret.value) && (
                  <button
                    className="btn btn-ghost"
                    title="쿠팡 키 삭제"
                    onClick={() => {
                      setCoupangAccess({ value: '', status: 'idle', msg: '' })
                      setCoupangSecret({ value: '', status: 'idle', msg: '' })
                      const current = readStored()
                      delete current.coupangAccess
                      delete current.coupangSecret
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
                    }}
                    style={{ padding:'2px 8px', fontSize:11, color:'var(--text3)', borderColor:'var(--border)' }}
                  >
                    <X size={12} /> 삭제
                  </button>
                )}
                <a href="https://partners.coupang.com" target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#e84141' }}>발급받기 →</a>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Access Key</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={show.coupangAccess ? 'text' : 'password'}
                    placeholder="Access Key 입력..."
                    value={coupangAccess.value}
                    onChange={e => setCoupangAccess(s => ({ ...s, value: e.target.value, status: 'idle', msg: '' }))}
                    style={{ paddingRight:36, width:'100%' }}
                  />
                  <button onClick={() => toggleShow('coupangAccess')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
                    {show.coupangAccess ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Secret Key</label>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ position:'relative', flex:1 }}>
                    <input
                      type={show.coupangSecret ? 'text' : 'password'}
                      placeholder="Secret Key 입력..."
                      value={coupangSecret.value}
                      onChange={e => setCoupangSecret(s => ({ ...s, value: e.target.value, status: 'idle', msg: '' }))}
                      style={{ paddingRight:36, width:'100%' }}
                    />
                    <button onClick={() => toggleShow('coupangSecret')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
                      {show.coupangSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={handleSaveCoupang}
                    disabled={!coupangAccess.value.trim() || !coupangSecret.value.trim()}
                    style={{
                      padding:'0 10px', fontSize:12, flexShrink:0, minWidth:64, justifyContent:'center',
                      borderColor: coupangSaved ? 'var(--green)' : 'var(--border)',
                      color: coupangSaved ? 'var(--green)' : 'var(--text2)',
                    }}
                  >
                    {coupangSaved ? <><Check size={12} /> 저장됨</> : '저장'}
                  </button>
                </div>
              </div>

              {coupangAccess.msg && (
                <p style={{ fontSize:11, color:'var(--green)' }}>{coupangAccess.msg}</p>
              )}
              <p style={{ fontSize:11, color:'var(--text3)' }}>
                선택 — 쿠팡 파트너스 수익 링크 생성용 · 브라우저 정책상 연결 확인 불가, 저장만 지원
              </p>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:22 }}>
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
