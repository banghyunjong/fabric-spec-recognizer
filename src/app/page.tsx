'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FabricSpec } from '@/types/fabric';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [redirectData, setRedirectData] = useState<string | null>(null);

  // 리다이렉트 처리를 useEffect로 이동
  useEffect(() => {
    if (redirectData) {
      router.push(`/review?data=${redirectData}`);
    }
  }, [redirectData, router]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('이미지 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64String }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze image');
          }

          if (!data || Object.keys(data).length === 0) {
            throw new Error('No data received from analysis');
          }

          // 데이터 정제 및 기본값 설정
          const sanitizedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key,
              String(value).trim() === '' ? '스캔값 없음(입력필요)' : 
              String(value).replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            ])
          ) as Omit<FabricSpec, 'key'>;

          // 고유 키 생성 (art_no + mill_name + spec + weight 조합)
          const key = [
            sanitizedData.art_no,
            sanitizedData.mill_name,
            sanitizedData.spec,
            sanitizedData.weight
          ]
            .map(val => val.replace(/[^a-zA-Z0-9]/g, '')) // 특수문자 제거
            .join('_')
            .toLowerCase();

          const dataWithKey = {
            ...sanitizedData,
            key
          };

          // Base64로 인코딩하여 안전하게 전달
          const base64Data = btoa(JSON.stringify(dataWithKey));
          setRedirectData(base64Data);
        } catch (error) {
          console.error('Error during image analysis:', error);
          toast.error(error instanceof Error ? error.message : '이미지 분석 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error('이미지 파일을 읽는 중 오류가 발생했습니다.');
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      {isLoading && <LoadingSpinner />}
      <h1 className="text-3xl font-bold mb-8">원단 스펙 인식기</h1>
      <div className="w-full max-w-md">
        <label
          htmlFor="image-upload"
          className={`block w-full p-8 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
            isLoading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium">이미지를 업로드하거나</span>
              <br />
              <span>카메라로 촬영하세요</span>
            </div>
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </label>
      </div>
    </main>
  );
}
