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
              text: "이미지에서 원단 스펙 정보를 추출해주세요. 반드시 JSON 형식으로만 응답해주세요. 마크다운이나 다른 형식은 사용하지 마세요. 다음 형식으로 응답해주세요: {\"date\": \"string\", \"art_no\": \"string\", \"mill_name\": \"string\", \"composition\": \"string\", \"spec\": \"string\", \"finishing\": \"string\", \"weight\": \"string\", \"width\": \"string\", \"price\": \"string\"} 특별히 date는 YYYYMMDD 형태로 알려주세요. price는 $표시가 있을 경우 $표시는 제외하고 알려주세요"
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