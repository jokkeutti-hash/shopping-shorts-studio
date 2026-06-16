export function buildProductDiscoveryPrompt(category, searchResults) {
  const resultsText = searchResults.length
    ? searchResults.map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 200)}`).join('\n\n')
    : '검색 결과 없음 (일반 지식 기반으로 추천)'

  return `당신은 쇼핑 어필리에이트 전문가입니다. 구매 전환율이 높은 상품을 추천해주세요.

카테고리: ${category.name} ${category.emoji}

검색 데이터:
${resultsText}

다음 JSON 형식으로 정확히 5개 상품을 추천해주세요. JSON만 출력하고 다른 텍스트는 없이:
{
  "products": [
    {
      "name": "상품명",
      "priceRange": "가격대 (예: 2만원대)",
      "conversionReason": "구매 전환율 높은 이유 (1-2문장)",
      "targetAudience": "타겟 고객",
      "keyFeature": "핵심 특징",
      "urgency": "urgency 요소 (한정수량/시즌/트렌드 등)",
      "affiliatePotential": "high|medium",
      "emoji": "상품 이모지"
    }
  ]
}`
}

export function buildContentPrompt({ product, platforms, imageStyle, category, searchContext }) {
  const platformList = platforms.map(p => `- ${p.name} (${p.tone}, 해시태그 ${p.hashtagCount}개, ${p.maxSec}초)`).join('\n')

  return `당신은 쇼핑 쇼츠 전문 콘텐츠 크리에이터입니다. 구매 전환율을 극대화하는 콘텐츠를 만드세요.

상품 정보:
- 상품명: ${product.name}
- 카테고리: ${category.name}
- 가격대: ${product.priceRange || '미정'}
- 핵심특징: ${product.keyFeature || ''}
- 타겟: ${product.targetAudience || ''}
- 어필포인트: ${product.conversionReason || ''}
- 긴급성: ${product.urgency || ''}
${product.purchaseLink ? `- 구매 링크: ${product.purchaseLink}` : ''}
${product.imageUrl ? `- 상품 이미지: ${product.imageUrl}` : ''}
${searchContext ? `\n참고 검색 데이터:\n${searchContext}` : ''}

이미지 스타일: ${imageStyle.name} (${imageStyle.desc})

대상 플랫폼:
${platformList}

다음 JSON 형식으로 정확히 출력하세요. JSON 외 텍스트 없이:
{
  "platforms": {
    ${platforms.map(p => `"${p.id}": {
      "hook": "첫 3초 훅 문장 (강렬하게)",
      "script": "전체 대본 (카메라 지시 + 나레이션 + 자막 통합, ${p.maxSec}초 분량)",
      "narration": "나레이션 텍스트만 (TTS용, 카메라지시 없이)",
      "hashtags": ["해시태그1", "해시태그2"],
      "imagePrompt": "Midjourney/DALL-E용 이미지 프롬프트 (영어, ${imageStyle.desc} 스타일 포함)",
      "videoPrompt": "Runway/Kling용 영상 프롬프트 (영어, 동작/분위기 포함)",
      "platformTip": "${p.tips}"
    }`).join(',\n    ')}
  }
}`
}
