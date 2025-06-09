'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { FabricSpec } from '@/types/fabric';

// Zod 스키마를 새로운 데이터 구조에 맞게 정의
const formSchema = z.object({
  key: z.string(),
  image_url: z.string().optional(),
  basic_info: z.object({
    art_no: z.string().min(1, "필수 항목입니다."),
    fabric_name: z.string().min(1, "필수 항목입니다."),
    mill_name: z.string(),
    fabric_type_explanation: z.string(),
  }),
  yarn_specs: z.array(z.object({
    spec: z.string().min(1, "필수 항목입니다."),
    details: z.string(), // textarea로 여러 줄을 받을 것이므로 string으로 처리
  })),
  dimensions: z.object({
    width: z.object({ value: z.string(), note: z.string() }),
    weight_gsm: z.object({ value: z.string(), note: z.string() }),
    weight_gy: z.object({ value: z.string(), note: z.string() }),
  }),
  shrinkage: z.object({
    warp: z.object({ value: z.string(), note: z.string() }),
    weft: z.object({ value: z.string(), note: z.string() }),
    summary: z.string(),
  }),
  dyeing_info: z.object({
    color_count: z.object({ value: z.string(), note: z.string() }),
    roll_count: z.object({ value: z.string(), note: z.string() }),
  }),
  finishing_processes: z.array(z.object({
    name: z.string().min(1, "필수 항목입니다."),
    explanation: z.string(),
  })),
  expert_summary: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function ReviewFormComponent() {
  const router = useRouter();
  const [initialData] = useState<FormValues | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const dataString = sessionStorage.getItem('fabricSpecData');
      if (dataString) {
        sessionStorage.removeItem('fabricSpecData');
        const parsedData = JSON.parse(dataString);
        // yarn_specs.details를 string[]에서 줄바꿈 문자가 포함된 string으로 변환
        if (parsedData.yarn_specs) {
            parsedData.yarn_specs.forEach((spec: any) => {
                if(Array.isArray(spec.details)) {
                    spec.details = spec.details.join('\n');
                }
            });
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse data from sessionStorage:', error);
      return null;
    }
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || undefined,
  });

  const { fields: yarnFields, append: appendYarn, remove: removeYarn } = useFieldArray({
    control, name: 'yarn_specs'
  });
  const { fields: finishingFields, append: appendFinishing, remove: removeFinishing } = useFieldArray({
    control, name: 'finishing_processes'
  });

  useEffect(() => {
    if (initialData === null) {
      toast.error('분석할 데이터가 없습니다. 다시 시도해주세요.');
      router.push('/');
    }
  }, [initialData, router]);

  const onSubmit = async (formData: FormValues) => {
    const { image_url, key, basic_info, ...restOfForm } = formData;
    
    // yarn_specs.details를 다시 string[]으로 변환
    const finalYarnSpecs = restOfForm.yarn_specs.map(spec => ({
        ...spec,
        details: spec.details.split('\n'),
    }));

    const dataToSave: Omit<FabricSpec, 'id' | 'created_at' | 'image_url'> = {
      key: key,
      art_no: basic_info.art_no,
      name: basic_info.fabric_name,
      mill_name: basic_info.mill_name,
      additional_data: {
        basic_info, // 기본 정보도 additional_data에 포함
        ...restOfForm,
        yarn_specs: finalYarnSpecs, // 변환된 yarn_specs 사용
      },
    };

    try {
      await supabase.from('fabric_specs').insert([dataToSave]).select().single();
      toast.success('저장되었습니다!');
      router.push('/');
    } catch (error: any) {
        if (error.code === '23505') { // unique constraint violation
            toast.error('이미 저장된 원단 스펙입니다 (동일한 키 존재).');
        } else {
            console.error('Error saving data:', error);
            toast.error('저장 중 오류가 발생했습니다.');
        }
    }
  };

  if (!initialData) {
    return <div className="min-h-screen p-8 flex items-center justify-center">데이터를 로드하는 중...</div>;
  }
  
  const InfoCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const EditRow = ({ label, name, note, isTextarea = false }: { label: string, name: any, note?: string, isTextarea?: boolean }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {isTextarea ? (
        <textarea {...register(name)} className="input min-h-[100px]" />
      ) : (
        <input {...register(name)} className="input" />
      )}
      {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
    </div>
  );
  
  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">전문가 분석 리포트 수정</h1>

        {initialData.image_url && (
          <InfoCard title="분석한 이미지">
            <div className="flex justify-center">
              <img src={initialData.image_url} alt="Uploaded fabric spec" className="rounded-md max-h-96 object-contain" />
            </div>
          </InfoCard>
        )}
        
        <div className="space-y-6 mt-6">
          <InfoCard title="기본 정보">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditRow label="원단 코드 (Art No.)" name="basic_info.art_no" />
              <EditRow label="원단 이름" name="basic_info.fabric_name" />
              <EditRow label="제조사명" name="basic_info.mill_name" />
              <EditRow label="원단 종류 설명" name="basic_info.fabric_type_explanation" />
            </div>
          </InfoCard>

          <InfoCard title="사양 (Yarn Spec)">
            {yarnFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 bg-slate-50 relative">
                 <EditRow label={`사양 #${index + 1}`} name={`yarn_specs.${index}.spec`} />
                 <EditRow label="상세 설명" name={`yarn_specs.${index}.details`} isTextarea />
              </div>
            ))}
             <button type="button" onClick={() => appendYarn({ spec: '', details: '' })} className="button-secondary">사양 추가</button>
          </InfoCard>
            
          <InfoCard title="규격 (Dimensions)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditRow label="폭 (Width)" name="dimensions.width.value" note="폭 값과 단위 (예: '190 cm')" />
              <EditRow label="폭 참고" name="dimensions.width.note" note="인치 변환 등 추가 정보" />
              <EditRow label="중량 (g/m²)" name="dimensions.weight_gsm.value" note="g/m² 단위 중량" />
              <EditRow label="중량 (g/m²) 참고" name="dimensions.weight_gsm.note" note="문맥적 설명" />
              <EditRow label="중량 (g/yd)" name="dimensions.weight_gy.value" note="g/yd 단위 중량" />
              <EditRow label="중량 (g/yd) 참고" name="dimensions.weight_gy.note" note="추가 정보" />
            </div>
          </InfoCard>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InfoCard title="수축률 (Shrinkage)">
                <EditRow label="세로 방향 (Warp)" name="shrinkage.warp.value" />
                <EditRow label="가로 방향 (Weft)" name="shrinkage.weft.value" />
                <EditRow label="수축률 요약" name="shrinkage.summary" isTextarea />
             </InfoCard>
             <InfoCard title="염색 정보 (Dyeing Info)">
                <EditRow label="컬러 수" name="dyeing_info.color_count.value" />
                <EditRow label="롤 수" name="dyeing_info.roll_count.value" />
             </InfoCard>
          </div>
            
          <InfoCard title="후가공 (Finishing)">
            {finishingFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-4 items-center relative">
                    <EditRow label={`후가공 #${index + 1}`} name={`finishing_processes.${index}.name`} />
                    <EditRow label="설명" name={`finishing_processes.${index}.explanation`} />
                </div>
            ))}
            <button type="button" onClick={() => appendFinishing({ name: '', explanation: '' })} className="button-secondary">후가공 추가</button>
          </InfoCard>

          <InfoCard title="전문가 종합 요약">
            <EditRow label="종합 요약" name="expert_summary" isTextarea />
          </InfoCard>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button type="button" onClick={() => router.push('/')} className="button-secondary">취소</button>
          <button type="submit" disabled={isSubmitting} className="button-primary">
            {isSubmitting ? '저장 중...' : '수정 완료 및 저장'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center">페이지를 로드하고 있습니다...</div>}>
      <ReviewFormComponent />
    </Suspense>
  );
} 