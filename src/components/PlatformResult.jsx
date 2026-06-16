import { useState } from 'react'
import { Copy, Check, Image, Film, Mic, FileText, Hash } from 'lucide-react'
import { PLATFORMS } from '../services/constants'

function CopyBox({ label, content, icon: Icon, color, noBorder }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background:'var(--bg)', ...(noBorder ? {} : { border:'1px solid var(--border)', borderRadius:8 }), overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Icon && <Icon size={13} color={color || 'var(--text3)'} />}
          <span style={{ fontSize:11, fontWeight:700, color: color || 'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
        </div>
        <button
          onClick={copy}
          style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontSize:11, color: copied ? 'var(--green)' : 'var(--text3)', padding:'2px 6px' }}
        >
          {copied ? <><Check size={11} /> 복사됨</> : <><Copy size={11} /> 복사</>}
        </button>
      </div>
      <div style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto' }}>
        {content}
      </div>
    </div>
  )
}

export default function PlatformResult({ platformId, data }) {
  const platform = PLATFORMS.find(p => p.id === platformId)
  if (!platform || !data) return null

  const hashtagText = Array.isArray(data.hashtags)
    ? data.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    : data.hashtags

  return (
    <div className="card fade-in" style={{ border:`1px solid ${platform.color}30`, padding:0, overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:`${platform.color}15` }}>
        <span style={{ fontSize:20 }}>{platform.emoji}</span>
        <div>
          <span style={{ fontWeight:700, fontSize:14, color:platform.color }}>{platform.name}</span>
          <span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>{platform.ratio} · {platform.maxSec}초</span>
        </div>
      </div>

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        {/* 훅 */}
        {data.hook && (
          <div style={{ padding:'10px 14px', background:`${platform.color}10`, border:`1px solid ${platform.color}30`, borderRadius:8, fontSize:14, fontWeight:700, color:platform.color }}>
            🪝 {data.hook}
          </div>
        )}

        {data.script    && <CopyBox label="대본 (큐시트)"              content={data.script}      icon={FileText} color="var(--text2)"   />}
        {data.narration && <CopyBox label="나레이션 (TTS용)"            content={data.narration}   icon={Mic}      color="var(--accent2)" />}

        {/* 이미지 + 영상 프롬프트 */}
        {(data.imagePrompt || data.videoPrompt) && (
          <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', background:'var(--bg3)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text3)' }}>
              🎨 AI 생성 프롬프트
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {data.imagePrompt && (
                <CopyBox
                  label="정지 이미지 (Midjourney · DALL-E)"
                  content={data.imagePrompt}
                  icon={Image}
                  color="var(--pink)"
                  noBorder
                />
              )}
              {data.videoPrompt && (
                <div style={{ borderTop:'1px solid var(--border)' }}>
                  <CopyBox
                    label="모션 영상 — 위 이미지를 움직이기 (Runway · Kling)"
                    content={data.videoPrompt}
                    icon={Film}
                    color="var(--orange)"
                    noBorder
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {hashtagText && <CopyBox label={`해시태그 (${platform.hashtagCount}개 권장)`} content={hashtagText} icon={Hash} color="var(--green)" />}

        {data.platformTip && (
          <div style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:8, fontSize:11, color:'var(--text3)', borderLeft:'3px solid var(--accent)' }}>
            💡 {data.platformTip}
          </div>
        )}
      </div>
    </div>
  )
}
