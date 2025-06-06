import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이미지에서 원단 스펙 정보를 추출해주세요. 반드시 JSON 형식으로만 응답해주세요. 마크다운이나 다른 형식은 사용하지 마세요. 무게(weight)는 반드시 숫자(weight_value)와 단위(weight_unit)로 분리해주세요. \n\n**매우 중요한 날짜 처리 규칙:** 이미지의 날짜가 '24/08/15'와 같이 '숫자/숫자/숫자' 형식일 경우, 반드시 **첫 번째 숫자를 연도(YY), 두 번째를 월(MM), 세 번째를 일(DD)로 해석**하세요. 예를 들어 '24/08/15'는 2024년 8월 15일을 의미합니다. 그 후, YY를 2000년대 연도(YYYY)로 변환하여 최종적으로 YYYYMMDD 형식으로 응답해주세요. \n\n가격(price)은 '$' 기호를 제외하고 숫자만, 폭(width)도 숫자만 알려주세요. \n\n다음 JSON 형식으로 응답해주세요: {\"date\": \"string\", \"art_no\": \"string\", \"mill_name\": \"string\", \"composition\": \"string\", \"spec\": \"string\", \"finishing\": \"string\", \"weight_value\": \"string\", \"weight_unit\": \"string\", \"width\": \"string\", \"price\": \"string\"}"
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
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanContent);

      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') : value
      }), {});

      return NextResponse.json(sanitizedData);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content:', content);
      return NextResponse.json(
        { error: 'Invalid response format from OpenAI' },
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