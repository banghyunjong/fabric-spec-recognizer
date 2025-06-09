import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 중첩된 객체까지 재귀적으로 정제하는 함수
function sanitizeRecursively(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeRecursively(item));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    let sanitizedValue = value;
    if (typeof value === 'string') {
      // 제어 문자 제거 및 양 끝 공백 제거
      sanitizedValue = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    } else if (typeof value === 'object') {
      sanitizedValue = sanitizeRecursively(value);
    }
    return { ...acc, [key]: sanitizedValue };
  }, {});
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `당신은 매우 지식이 풍부한 원단 전문가입니다. 제공된 원단 스펙 시트 이미지를 분석하고, 반드시 JSON 객체로만 응답해주세요. 마크다운 포맷(\`\`\`json)이나 JSON 외부의 다른 설명은 절대 포함하지 마세요.

다음 규칙과 JSON 구조를 엄격히 준수해주세요:

1.  **분석과 설명**: 이미지에서 모든 정보를 추출하세요. 전문 용어(예: 사양, 후가공)에 대해서는 초보자를 가르치는 것처럼 간략한 설명을 제공하세요. 이미지에 있는 정보는 반드시 포함해야 합니다.

2.  **JSON 구조**: 최종 결과물은 아래 구조를 정확히 따라야 합니다. 이미지에 정보가 없는 경우, 해당하는 필드에 \`null\`이나 빈 배열 \`[]\`을 사용하세요.
    {
      "basic_info": {
        "art_no": "이미지상의 Art No. 또는 TCFNO",
        "fabric_name": "원단의 주된 이름",
        "mill_name": "제조사명, 없으면 'Unknown'으로 표기",
        "fabric_type_explanation": "원단 종류에 대한 간략한 설명 (예: '삼사 후리스, 3중 구조 기모 원단')"
      },
      "yarn_specs": [
        {
          "spec": "전체 사양 문자열 (예: 'CM 30/1 ML')",
          "details": [
            "첫 번째 부분에 대한 설명 (예: 'CM (Combed Cotton): 빗질하여 불순물을 제거한 면사')",
            "두 번째 부분에 대한 설명 (예: '30/1: 30수 단사, 가늘고 부드러움')",
            "그 외 부분에 대한 설명 (예: 'ML: Mull 또는 Melange의 약자일 가능성, 혼합사 또는 혼색사 추정')"
          ]
        }
      ],
      "dimensions": {
        "width": { "value": "폭 값과 단위 (예: '190 cm')", "note": "인치 변환 등 추가 정보" },
        "weight_gsm": { "value": "g/m² 단위 중량 (예: '300 g/m²')", "note": "문맥적 설명 (예: '가을/겨울 의류에 적합')" },
        "weight_gy": { "value": "g/yd 단위 중량 (예: '521 g/yd')", "note": "추가 정보" }
      },
      "shrinkage": {
        "warp": { "value": "경사(세로) 방향 수축률", "note": "예: '세로 방향'" },
        "weft": { "value": "위사(가로) 방향 수축률", "note": "예: '가로 방향'" },
        "summary": "수축률 특성에 대한 간략한 요약"
      },
      "dyeing_info": {
        "color_count": { "value": "컬러 수", "note": "예: '염색 컬러 수 1개'" },
        "roll_count": { "value": "롤 수", "note": "예: '롤 수 1개, 시험 염색 가능성'" }
      },
      "finishing_processes": [
        {
          "name": "후가공 명칭 (예: 'Enzyme')",
          "explanation": "해당 공정이 무엇인지에 대한 간략한 설명 (예: '효소 가공으로 표면을 부드럽게 함')"
        }
      ],
      "expert_summary": "원단에 대한 종합적인 요약. 주요 특징, 질감, 촉감, 추천 용도(예: 가을/겨울용 맨투맨, 후드티, 트레이닝복)를 설명해야 함."
    }

3.  **언어**: 모든 설명과 노트는 **한국어**로 작성해주세요.`
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      // 모델 응답에서 JSON 객체만 안정적으로 추출하기 위한 정규식
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch || !jsonMatch[0]) {
        throw new Error('No JSON object found in the OpenAI response.');
      }

      const jsonString = jsonMatch[0];
      const data = JSON.parse(jsonString);
      const sanitizedData = sanitizeRecursively(data);

      return NextResponse.json(sanitizedData);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content from OpenAI:', content);
      return NextResponse.json(
        { 
          error: 'Invalid response format from OpenAI',
          rawContent: content
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 