import { useState } from 'react'
import { Wand2, Image, Upload, X } from 'lucide-react'
import { IMAGE_STYLES, PLATFORMS } from '../services/constants'

export default function ContentStudio({ product, category, onGenerate, loading }) {
  const [imageStyle, setImageStyle] = useState(IMAGE_STYLES[0])
  const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORMS.map(p => p.id))
  const [autoStyle, setAutoStyle] = useState(true)
  const [uploadedImage, setUploadedImage] = useState(null)

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target.result.split(',')[1])
    reader.readAsDataURL(file)
  }

  const handleGenerate = () => {
    const platforms = PLATFORMS.filter(p => selectedPlatforms.includes(p.id))
    onGenerate({ imageStyle, platforms, imageBase64: uploadedImage, productUrl: product.purchaseLink })
  }

  if (!product) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
      <Wand2 size={40} style={{ marginBottom:12, opacity:0.2 }} />
      <p style={{ fontSize:14 }}>← 먼저 상품을 탐색하고 선택하세요</p>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* 선택된 상품 */}
      <div className="card" style={{ background:'rgba(124,92,255,0.08)', border:'1px solid rgba(124,92,255,0.3)' }}>
        <p style={{ fontSize:11, color:'var(--accent2)', fontWeight:600, marginBottom:8 }}>선택된 상품</p>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {product.imageUrl
            ? <img src={product.imageUrl} alt="" style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'1px solid rgba(124,92,255,0.3)', flexShrink:0 }} onError={e => e.target.style.display='none'} />
            : <span style={{ fontSize:28, flexShrink:0 }}>{product.emoji}</span>}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700 }}>{product.name}</p>
            <p style={{ fontSize:12, color:'var(--text2)' }}>{product.priceRange} · {category?.name}</p>
            {product.purchaseLink && (
              <a href={product.purchaseLink} target="_blank" rel="noreferrer"
                style={{ fontSize:11, color:'var(--accent2)', display:'inline-flex', alignItems:'center', gap:3, marginTop:3 }}>
                🔗 구매 링크 열기
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 상품 이미지 업로드 */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <p style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>상품 사진 업로드 (선택, 최대 3장)</p>
          {uploadedImage && (
            <button className="btn btn-ghost" style={{ padding:'2px 8px', fontSize:11 }} onClick={() => setUploadedImage(null)}>
              <X size={12} /> 제거
            </button>
          )}
        </div>
        {uploadedImage ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--green)', fontSize:12 }}>
            <Image size={14} /> 이미지 업로드됨 (Gemini가 형태·색상 분석)
          </div>
        ) : (
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'var(--text3)', fontSize:13, padding:'12px', border:'1px dashed var(--border)', borderRadius:8 }}>
            <Upload size={14} />
            클릭하여 이미지 업로드
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
          </label>
        )}
      </div>

      {/* 이미지 스타일 */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <p style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>이미지 스타일</p>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)', cursor:'pointer' }}>
            <input type="checkbox" checked={autoStyle} onChange={e => setAutoStyle(e.target.checked)} />
            자동 선택
          </label>
        </div>
        {!autoStyle && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {IMAGE_STYLES.map(s => (
              <button
                key={s.id}
                className="btn btn-ghost"
                style={{
                  padding:'6px 12px', fontSize:12,
                  borderColor: imageStyle.id === s.id ? 'var(--accent)' : 'var(--border)',
                  color: imageStyle.id === s.id ? 'var(--accent2)' : 'var(--text2)',
                  background: imageStyle.id === s.id ? 'rgba(124,92,255,0.1)' : 'var(--bg3)',
                }}
                onClick={() => setImageStyle(s)}
              >
                {s.preview} {s.name}
              </button>
            ))}
          </div>
        )}
        {autoStyle && (
          <p style={{ fontSize:12, color:'var(--text3)' }}>AI가 상품/카테고리에 맞는 스타일을 자동 선택해요</p>
        )}
      </div>

      {/* 플랫폼 선택 */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <p style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>플랫폼 선택</p>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:11 }} onClick={() => setSelectedPlatforms(PLATFORMS.map(p => p.id))}>전체</button>
            <button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:11 }} onClick={() => setSelectedPlatforms([])}>해제</button>
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {PLATFORMS.map(p => {
            const active = selectedPlatforms.includes(p.id)
            return (
              <button
                key={p.id}
                className="btn btn-ghost"
                style={{
                  padding:'6px 12px', fontSize:12,
                  borderColor: active ? p.color : 'var(--border)',
                  color: active ? p.color : 'var(--text3)',
                  background: active ? `${p.color}18` : 'var(--bg3)',
                }}
                onClick={() => togglePlatform(p.id)}
              >
                {p.emoji} {p.name}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>{selectedPlatforms.length}개 플랫폼 선택됨</p>
      </div>

      {/* 생성 버튼 */}
      <button
        className="btn btn-green"
        style={{ padding:'14px', fontSize:15, fontWeight:700, borderRadius:12 }}
        onClick={handleGenerate}
        disabled={loading || selectedPlatforms.length === 0}
      >
        {loading
          ? <><span className="spin" style={{ borderTopColor:'#000' }} /> 생성 중...</>
          : <><Wand2 size={16} /> {selectedPlatforms.length}개 플랫폼 콘텐츠 생성</>
        }
      </button>
    </div>
  )
}
