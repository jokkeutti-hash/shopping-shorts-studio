import { useState } from 'react'
import { Search, TrendingUp, Zap, ChevronRight, RefreshCw, Link, Image, ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../services/constants'
import { tavilySearch, callAI } from '../services/api'
import { buildProductDiscoveryPrompt } from '../services/prompts'

export default function ProductDiscovery({ keys, onSelectProduct }) {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [customTopic, setCustomTopic] = useState('')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)  // 펼쳐진 카드 인덱스
  const [extras, setExtras] = useState({})            // { [index]: { purchaseLink, imageUrl } }

  const discover = async () => {
    if (!keys.gemini && !keys.openrouter) { setError('API 키를 먼저 설정해주세요'); return }
    setLoading(true); setError(''); setProducts([]); setExpandedId(null); setExtras({})
    try {
      let results = []
      if (keys.tavily) {
        const query = customTopic ? `${customTopic} 구매후기 추천 ${new Date().getFullYear()}` : category.searchQuery
        results = await tavilySearch(keys.tavily, query, 5)
      }
      const prompt = buildProductDiscoveryPrompt(
        customTopic ? { name: customTopic, emoji: '🛒' } : category,
        results
      )
      const raw = await callAI({ geminiKey: keys.gemini, openrouterKey: keys.openrouter, openrouterModel: keys.orModel, prompt })
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setProducts(parsed.products || [])
    } catch (e) {
      setError(`오류: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const setExtra = (idx, field, val) => {
    setExtras(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: val } }))
  }

  const handleSelect = (product, idx) => {
    const ex = extras[idx] || {}
    onSelectProduct(
      { ...product, purchaseLink: ex.purchaseLink || '', imageUrl: ex.imageUrl || '' },
      category
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* 카테고리 */}
      <div className="card">
        <p style={{ fontSize:12, color:'var(--text3)', marginBottom:10, fontWeight:600 }}>카테고리</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className="btn btn-ghost"
              style={{
                padding:'6px 12px', fontSize:12,
                borderColor: category.id === c.id ? 'var(--accent)' : 'var(--border)',
                color: category.id === c.id ? 'var(--accent2)' : 'var(--text2)',
                background: category.id === c.id ? 'rgba(124,92,255,0.1)' : 'var(--bg3)',
              }}
              onClick={() => setCategory(c)}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 검색창 */}
      <div className="card" style={{ display:'flex', gap:8, alignItems:'center' }}>
        <Search size={16} color="var(--text3)" style={{ flexShrink:0 }} />
        <input
          placeholder="상품명 직접 검색 (예: 다이슨 에어랩, 에어프라이어...)"
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
          style={{ flex:1 }}
          onKeyDown={e => e.key === 'Enter' && discover()}
        />
        <button className="btn btn-primary" onClick={discover} disabled={loading} style={{ flexShrink:0 }}>
          {loading ? <span className="spin" /> : <><TrendingUp size={14} /> 탐색</>}
        </button>
      </div>

      {error && (
        <p style={{ color:'var(--pink)', fontSize:13, padding:'8px 12px', background:'rgba(255,77,141,0.1)', borderRadius:8 }}>
          {error}
        </p>
      )}

      {/* 결과 */}
      {products.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }} className="fade-in">
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Zap size={14} color="var(--yellow)" />
            <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>추천 상품 — 클릭해서 선택</span>
            <button
              className="btn btn-ghost"
              style={{ marginLeft:'auto', padding:'4px 8px', fontSize:11 }}
              onClick={discover}
            >
              <RefreshCw size={12} /> 다시 탐색
            </button>
          </div>

          {products.map((p, i) => {
            const isExpanded = expandedId === i
            const ex = extras[i] || {}
            const hasLink  = !!ex.purchaseLink?.trim()
            const hasImage = !!ex.imageUrl?.trim()

            return (
              <div
                key={i}
                className="card"
                style={{
                  border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                  background: isExpanded ? 'var(--bg3)' : 'var(--bg2)',
                  transition:'all 0.15s',
                  cursor: isExpanded ? 'default' : 'pointer',
                  padding:0,
                  overflow:'hidden',
                }}
              >
                {/* 카드 상단 — 클릭 시 펼침 */}
                <div
                  style={{ padding:'14px 14px 12px', display:'flex', alignItems:'flex-start', gap:12 }}
                  onClick={() => !isExpanded && setExpandedId(i)}
                >
                  <span style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{p.name}</span>
                      <span className={`tag tag-${p.affiliatePotential === 'high' ? 'green' : 'orange'}`}>
                        {p.affiliatePotential === 'high' ? '🔥 고전환' : '📈 중전환'}
                      </span>
                      <span className="tag tag-purple">{p.priceRange}</span>
                      {(hasLink || hasImage) && (
                        <span style={{ fontSize:10, color:'var(--green)', fontWeight:600 }}>
                          {hasLink ? '🔗' : ''}{hasImage ? ' 🖼️' : ''} 추가됨
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>{p.conversionReason}</p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>👤 {p.targetAudience}</span>
                      <span style={{ fontSize:11, color:'var(--orange)' }}>⚡ {p.urgency}</span>
                    </div>
                  </div>
                  {!isExpanded && (
                    <ChevronRight size={16} color="var(--text3)" style={{ flexShrink:0, marginTop:4 }} />
                  )}
                </div>

                {/* 펼쳐진 영역 — 상품 정보 추가 + 시작 버튼 */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                    <p style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>
                      구매 링크·이미지 추가 <span style={{ fontWeight:400 }}>— 선택사항, 건너뛰어도 됩니다</span>
                    </p>

                    {/* 구매 링크 */}
                    <div style={{ position:'relative' }}>
                      <Link size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
                      <input
                        placeholder="구매 링크 (쿠팡·네이버·무신사 등)"
                        value={ex.purchaseLink || ''}
                        onChange={e => setExtra(i, 'purchaseLink', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ paddingLeft:30, width:'100%' }}
                      />
                    </div>

                    {/* 이미지 URL */}
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ position:'relative', flex:1 }}>
                        <Image size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
                        <input
                          placeholder="상품 이미지 URL (선택)"
                          value={ex.imageUrl || ''}
                          onChange={e => setExtra(i, 'imageUrl', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ paddingLeft:30, width:'100%' }}
                        />
                      </div>
                      {hasImage && (
                        <img
                          src={ex.imageUrl}
                          alt=""
                          style={{ width:38, height:38, borderRadius:6, objectFit:'cover', border:'1px solid var(--border)', flexShrink:0 }}
                          onError={e => e.target.style.display='none'}
                        />
                      )}
                    </div>

                    {/* 버튼 행 */}
                    <div style={{ display:'flex', gap:8, marginTop:2 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize:12 }}
                        onClick={() => setExpandedId(null)}
                      >
                        닫기
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex:1, justifyContent:'center', gap:6, fontSize:13 }}
                        onClick={() => handleSelect(p, i)}
                      >
                        이 상품으로 콘텐츠 만들기 <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--text3)' }}>
          <TrendingUp size={36} style={{ marginBottom:10, opacity:0.25 }} />
          <p style={{ fontSize:13 }}>카테고리를 선택하고 탐색 버튼을 눌러주세요</p>
          <p style={{ fontSize:11, marginTop:4, opacity:0.7 }}>Tavily 키가 있으면 실시간 검색 데이터 기반으로 추천해요</p>
        </div>
      )}
    </div>
  )
}
