import { useState } from 'react'
import { Key, TrendingUp, Wand2, LayoutGrid, ChevronRight } from 'lucide-react'
import ApiSettings, { useApiKeys } from './components/ApiSettings'
import ProductDiscovery from './components/ProductDiscovery'
import ContentStudio from './components/ContentStudio'
import PlatformResult from './components/PlatformResult'
import { callAI, tavilySearch } from './services/api'
import { buildContentPrompt } from './services/prompts'
import { IMAGE_STYLES } from './services/constants'

export default function App() {
  const [keys] = useApiKeys()
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [activeTab, setActiveTab] = useState('discover') // discover | studio | results
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [results, setResults] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleSelectProduct = (product, category) => {
    setSelectedProduct(product)
    setSelectedCategory(category)
    setActiveTab('studio')
  }

  const handleGenerate = async ({ imageStyle, platforms, imageBase64, productUrl }) => {
    if (!keys.gemini && !keys.openrouter) {
      setError('API 키를 먼저 설정해주세요')
      return
    }
    setGenerating(true); setError(''); setResults(null)

    try {
      // Tavily로 상품 URL 또는 키워드 검색
      let searchContext = ''
      if (keys.tavily) {
        const query = productUrl || selectedProduct.purchaseLink || `${selectedProduct.name} 후기 구매 2025`
        const results = await tavilySearch(keys.tavily, query, 3)
        searchContext = results.map(r => `${r.title}: ${r.content?.slice(0, 150)}`).join('\n')
      }

      // 자동 스타일 선택
      const finalStyle = imageStyle.id === 'auto'
        ? IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)]
        : imageStyle

      const prompt = buildContentPrompt({
        product: selectedProduct,
        platforms,
        imageStyle: finalStyle,
        category: selectedCategory,
        searchContext,
      })

      const raw = await callAI({
        geminiKey: keys.gemini,
        openrouterKey: keys.openrouter,
        openrouterModel: keys.orModel,
        prompt,
        imageBase64,
      })

      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResults({ platforms: parsed.platforms, selectedPlatforms: platforms })
      setActiveTab('results')
    } catch (e) {
      setError(`생성 오류: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const hasKeys = !!(keys.gemini || keys.openrouter)

  const tabs = [
    { id: 'discover', label: '① 상품 탐색', icon: TrendingUp },
    { id: 'studio', label: '② 콘텐츠 설정', icon: Wand2 },
    { id: 'results', label: '③ 결과', icon: LayoutGrid },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* 헤더 */}
      <header style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🛍️</span>
          <div>
            <p style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.02em' }}>썰 쇼핑 스튜디오</p>
            <p style={{ fontSize:10, color:'var(--text3)' }}>구매전환 특화 멀티플랫폼 콘텐츠 생성</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {selectedProduct && activeTab !== 'discover' && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(124,92,255,0.1)', borderRadius:20, fontSize:11, color:'var(--accent2)' }}>
              {selectedProduct.imageUrl
                ? <img src={selectedProduct.imageUrl} alt="" style={{ width:20, height:20, borderRadius:4, objectFit:'cover' }} />
                : <span>{selectedProduct.emoji}</span>}
              {selectedProduct.name}
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ padding:'6px 12px', borderColor: hasKeys ? 'var(--green)' : 'var(--pink)', color: hasKeys ? 'var(--green)' : 'var(--pink)' }}
            onClick={() => setShowApiSettings(true)}
          >
            <Key size={13} /> {hasKeys ? 'API 연결됨' : 'API 키 설정'}
          </button>
        </div>
      </header>

      {/* 탭 */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'0 20px', display:'flex', gap:0 }}>
        {tabs.map((tab, i) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          const done = (tab.id === 'discover' && selectedProduct) || (tab.id === 'studio' && results)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'12px 16px',
                background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                color: active ? 'var(--accent2)' : 'var(--text3)',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition:'all 0.15s',
              }}
            >
              <Icon size={14} />
              {tab.label}
              {done && !active && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }} />}
              {i < tabs.length - 1 && <ChevronRight size={12} style={{ marginLeft:4, opacity:0.3 }} />}
            </button>
          )
        })}
      </div>

      {/* 메인 */}
      <main style={{ maxWidth:800, margin:'0 auto', padding:'20px 16px' }}>
        {error && (
          <div style={{ padding:'10px 14px', background:'rgba(255,77,141,0.1)', border:'1px solid rgba(255,77,141,0.3)', borderRadius:8, color:'var(--pink)', fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        {activeTab === 'discover' && (
          <ProductDiscovery keys={keys} onSelectProduct={handleSelectProduct} />
        )}

        {activeTab === 'studio' && (
          <ContentStudio
            product={selectedProduct}
            category={selectedCategory}
            keys={keys}
            onGenerate={handleGenerate}
            loading={generating}
          />
        )}

        {activeTab === 'results' && results && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>
                {results.selectedPlatforms.length}개 플랫폼 콘텐츠 생성 완료
              </p>
              <button
                className="btn btn-ghost"
                style={{ fontSize:12 }}
                onClick={() => setActiveTab('studio')}
              >
                다시 생성
              </button>
            </div>
            {results.selectedPlatforms.map(platform => (
              <PlatformResult
                key={platform.id}
                platformId={platform.id}
                data={results.platforms[platform.id]}
              />
            ))}
          </div>
        )}

        {activeTab === 'results' && !results && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
            <LayoutGrid size={40} style={{ marginBottom:12, opacity:0.2 }} />
            <p>← 상품을 선택하고 콘텐츠를 생성해주세요</p>
          </div>
        )}
      </main>

      {showApiSettings && <ApiSettings onClose={() => setShowApiSettings(false)} />}
    </div>
  )
}
