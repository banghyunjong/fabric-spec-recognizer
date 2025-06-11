'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import imageCompression from 'browser-image-compression';
import MaterialDetailsDisplay from '@/components/MaterialDetailsDisplay';
import Modal from '@/components/Modal';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 소재 조회를 위한 상태 추가
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);

    try {
      let imageFile = file;
      const options = {
        maxSizeMB: 4,          // 목표 파일 크기 (4MB)
        maxWidthOrHeight: 1920, // 이미지의 최대 너비 또는 높이
        useWebWorker: true,    // 웹 워커를 사용하여 UI 스레드 차단 방지
      };

      // Vercel의 서버리스 함수 본문 크기 제한(4.5MB)을 고려하여 4MB가 넘는 이미지는 압축
      if (file.size > options.maxSizeMB * 1024 * 1024) {
        try {
          toast.success('이미지가 4MB를 초과하여 압축을 시작합니다.');
          imageFile = await imageCompression(file, options);
          toast.success(`이미지 압축 완료! (${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`);
        } catch (compressionError) {
          console.error('Image compression error:', compressionError);
          toast.error('이미지 압축 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }
      }

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

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Server Error:", errorData);
            
            let errorMessage = errorData.error || '이미지 분석에 실패했습니다.';
            if (errorData.rawContent) {
              console.error("Problematic Raw Content from API:", errorData.rawContent);
              errorMessage = `${errorMessage}\n\n[GPT 원본 응답]:\n${errorData.rawContent.substring(0, 300)}...`;
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();

          if (!data || !data.basic_info) {
            throw new Error('분석 데이터에 기본 정보가 없습니다.');
          }

          // 고유 키 생성 (art_no + name + mill_name 조합)
          const key = [
            data.basic_info.art_no,
            data.basic_info.fabric_name,
            data.basic_info.mill_name,
          ]
            .map(val => String(val || '').replace(/[^a-zA-Z0-9]/g, '')) // 특수문자 제거
            .join('_')
            .toLowerCase();

          const dataToPass = {
            ...data,
            key, // 생성된 고유 키 추가
            image_url: base64String // 이미지 URL 추가
          };
          
          // sessionStorage에 데이터 저장
          sessionStorage.setItem('fabricSpecData', JSON.stringify(dataToPass));
          
          // 리뷰 페이지로 리다이렉트
          router.push('/review');

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

      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [router]);

  // 소재 조회 핸들러 함수
  const handleMaterialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('소재 코드를 입력해주세요.');
      return;
    }
    
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setIsModalOpen(false); // 이전 모달 닫기

    try {
      const response = await fetch(`/api/search-material?artcno=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `[${response.status}] 소재 정보를 가져오는 데 실패했습니다.`);
      }

      if (Array.isArray(data) && data.length === 0) {
        setSearchError('조회 결과가 없습니다.');
        toast('해당 소재 코드를 찾을 수 없습니다.', { icon: 'ℹ️' });
      } else {
        setSearchResult(data);
        setIsModalOpen(true); // 결과가 있으면 모달 열기
      }

    } catch (error) {
      console.error('Material search error:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      {isLoading && <LoadingSpinner />}
      
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-8">원단 스펙 인식기</h1>
        <label
          htmlFor="image-upload"
          className={`block w-full p-8 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
            isLoading || isSearching ? 'opacity-50 pointer-events-none' : ''
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
            disabled={isLoading || isSearching}
          />
        </label>
      </div>
      
      {/* 구분선 */}
      <div className="my-12 w-full max-w-md flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm">또는</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      {/* 소재 조회 섹션 */}
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">소재 정보 조회</h2>
        <form onSubmit={handleMaterialSearch} className="flex gap-2">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="소재 코드를 입력하세요 (예: BPJ5)"
                className="input flex-grow"
                disabled={isLoading || isSearching}
            />
            <button type="submit" className="button-primary" disabled={isLoading || isSearching}>
                {isSearching ? '조회 중...' : '조회'}
            </button>
        </form>
      </div>

      {/* 조회 결과 모달 */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`소재 정보 조회 결과: ${searchResult?.[0]?.artcno || ''}`}
      >
        {isSearching ? <LoadingSpinner /> : (
            <>
                {searchError && <p className="text-red-500 text-center">{searchError}</p>}
                {searchResult && <MaterialDetailsDisplay results={searchResult} />}
            </>
        )}
      </Modal>
    </main>
  );
}
