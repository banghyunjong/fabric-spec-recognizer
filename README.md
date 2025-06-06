# Fabric Spec Recognizer

원단 스펙 이미지를 분석하여 텍스트 데이터로 변환하고 관리하는 웹 애플리케이션입니다.

## 주요 기능

- 원단 스펙 이미지 업로드 및 카메라 촬영
- GPT Vision API를 활용한 이미지 텍스트 추출
- 추출된 데이터 검토 및 수정
- Supabase를 통한 데이터 저장 및 관리
- 중복 데이터 방지를 위한 고유 키 생성

## 기술 스택

- Frontend: Next.js, React, TypeScript
- UI: Tailwind CSS
- API: OpenAI GPT-4 Vision
- Database: Supabase
- Form Management: React Hook Form, Zod

## 시작하기

1. 저장소 클론
```bash
git clone [repository-url]
cd fabric-spec-recognizer
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 개발 서버 실행
```bash
npm run dev
```

## Supabase 설정

1. `fabrics` 테이블 생성
```sql
CREATE TABLE fabrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  art_no TEXT NOT NULL,
  mill_name TEXT NOT NULL,
  composition TEXT NOT NULL,
  spec TEXT NOT NULL,
  finishing TEXT NOT NULL,
  weight TEXT NOT NULL,
  width TEXT NOT NULL,
  price TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## 환경 변수

프로젝트 실행을 위해 다음 환경 변수가 필요합니다:

- `OPENAI_API_KEY`: OpenAI API 키
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키

## 라이선스

MIT License
