'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { FabricSpec } from '@/types/fabric';
import { useEffect, useState } from 'react';

const fabricSchema = z.object({
  key: z.string(),
  date: z.string(),
  art_no: z.string(),
  mill_name: z.string(),
  composition: z.string(),
  spec: z.string(),
  finishing: z.string(),
  weight: z.string(),
  width: z.string(),
  price: z.string(),
});

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [initialData, setInitialData] = useState<FabricSpec | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FabricSpec>({
    resolver: zodResolver(fabricSchema),
    defaultValues: initialData || undefined,
  });

  // URL 파라미터 처리 로직
  useEffect(() => {
    try {
      const dataParam = searchParams.get('data');
      if (!dataParam) {
        setShouldRedirect(true);
        return;
      }

      // Base64 디코딩 후 JSON 파싱
      const jsonString = atob(dataParam);
      const parsedData = JSON.parse(jsonString);
      setInitialData(parsedData);
      // 폼 초기값 설정
      reset(parsedData);
    } catch (error) {
      console.error('Error parsing URL data:', error);
      toast.error('데이터 처리 중 오류가 발생했습니다.');
      setShouldRedirect(true);
    }
  }, [searchParams, reset]);

  // 리다이렉트 처리
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/');
    }
  }, [shouldRedirect, router]);

  const onSubmit = async (formData: FabricSpec) => {
    try {
      // 중복 체크
      const { data: existingData, error: checkError } = await supabase
        .from('fabrics')
        .select('id')
        .eq('key', formData.key)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for duplicates:', checkError);
        throw checkError;
      }

      if (existingData) {
        toast.error('이미 저장된 원단 스펙입니다.');
        return;
      }

      // 새로운 데이터 저장
      const { error: insertError } = await supabase
        .from('fabrics')
        .insert([formData]);
      
      if (insertError) throw insertError;
      
      toast.success('저장되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  // 초기 데이터가 로드되지 않았으면 로딩 표시
  if (!initialData && !shouldRedirect) {
    return <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="text-gray-600">데이터 로드 중...</div>
    </div>;
  }

  // 리다이렉트 중이면 아무것도 렌더링하지 않음
  if (shouldRedirect) {
    return null;
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">스펙 정보 확인</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              날짜
            </label>
            <input
              {...register('date')}
              className="w-full p-2 border rounded-md"
              placeholder="예: 24/8/15"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Art No.
            </label>
            <input
              {...register('art_no')}
              className="w-full p-2 border rounded-md"
              placeholder="예: DHYX-WT-11"
            />
            {errors.art_no && (
              <p className="text-red-500 text-sm mt-1">{errors.art_no.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제조사/밀
            </label>
            <input
              {...register('mill_name')}
              className="w-full p-2 border rounded-md"
              placeholder="예: WISH"
            />
            {errors.mill_name && (
              <p className="text-red-500 text-sm mt-1">{errors.mill_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              혼용률
            </label>
            <input
              {...register('composition')}
              className="w-full p-2 border rounded-md"
              placeholder="예: 98% C 2% SP"
            />
            {errors.composition && (
              <p className="text-red-500 text-sm mt-1">{errors.composition.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              스펙
            </label>
            <input
              {...register('spec')}
              className="w-full p-2 border rounded-md"
              placeholder="예: 12*16+70D+16/51*134"
            />
            {errors.spec && (
              <p className="text-red-500 text-sm mt-1">{errors.spec.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              후가공
            </label>
            <input
              {...register('finishing')}
              className="w-full p-2 border rounded-md"
              placeholder="예: Air Washing"
            />
            {errors.finishing && (
              <p className="text-red-500 text-sm mt-1">{errors.finishing.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              무게
            </label>
            <input
              {...register('weight')}
              className="w-full p-2 border rounded-md"
              placeholder="예: 340GSM"
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              폭
            </label>
            <input
              {...register('width')}
              className="w-full p-2 border rounded-md"
              placeholder="예: 54/55&quot;"
            />
            {errors.width && (
              <p className="text-red-500 text-sm mt-1">{errors.width.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              가격
            </label>
            <input
              {...register('price')}
              className="w-full p-2 border rounded-md"
              placeholder="예: $3.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </main>
  );
} 