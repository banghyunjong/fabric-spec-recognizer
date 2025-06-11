import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artcno = searchParams.get('artcno');

  if (!artcno) {
    return NextResponse.json({ error: 'Article number (artcno) is required' }, { status: 400 });
  }

  // 외부 API로 전달하기 전에 artcno를 인코딩하여 URL에 포함될 수 있는 특수문자를 안전하게 처리합니다.
  const encodedArtcno = encodeURIComponent(artcno);

  try {
    const response = await fetch(`https://api-fbqr.eland.co.kr/materials?artcno=${encodedArtcno}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseBody = await response.text();

    if (!response.ok) {
        try {
            const errorData = JSON.parse(responseBody);
            return NextResponse.json(
                { error: errorData.errorMessage || 'Failed to fetch material data' }, 
                { status: response.status }
            );
        } catch (e) {
            return NextResponse.json(
                { error: responseBody },
                { status: response.status }
            )
        }
    }

    const data = JSON.parse(responseBody);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching from external API:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
} 