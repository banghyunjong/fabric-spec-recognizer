'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { FabricSpec } from '@/types/fabric';

// 새로운 데이터 구조를 위한 타입 정의
interface ExpertData {
  key: string;
  image_url?: string;
  basic_info: {
    art_no: string;
    fabric_name: string;
    mill_name: string;
    fabric_type_explanation: string;
  };
  yarn_specs: { spec: string; details: string[] }[];
  dimensions: {
    width: { value: string; note: string };
    weight_gsm: { value: string; note: string };
    weight_gy: { value: string; note: string };
  };
  shrinkage: {
    warp: { value: string; note: string };
    weft: { value: string; note: string };
    summary: string;
  };
  dyeing_info: {
    color_count: { value: string; note: string };
    roll_count: { value: string; note: string };
  };
  finishing_processes: { name: string; explanation: string }[];
  expert_summary: string;
}


function ReviewDisplayComponent() {
  const router = useRouter();
  const [data, setData] = useState<ExpertData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const dataString = sessionStorage.getItem('fabricSpecData');
      if (dataString) {
        sessionStorage.removeItem('fabricSpecData');
        return JSON.parse(dataString);
      }
      return null;
    } catch (error) {
      console.error('Failed to parse data from sessionStorage:', error);
      return null;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data === null) {
      toast.error('분석할 데이터가 없습니다. 다시 시도해주세요.');
      router.push('/');
    }
  }, [data, router]);

  const handleSave = async () => {
    if (!data) return;
    setIsSubmitting(true);

    const { image_url, ...restData } = data;
    
    // 최종 저장 데이터 구조 flattening
    const dataToSave: Omit<FabricSpec, 'id' | 'created_at' | 'image_url'> = {
        key: data.key,
        art_no: data.basic_info.art_no,
        name: data.basic_info.fabric_name,
        mill_name: data.basic_info.mill_name,
        additional_data: {
            ...restData
        }
    };
    
    try {
        const { data: existingData } = await supabase
          .from('fabric_specs')
          .select('id')
          .eq('key', dataToSave.key)
          .single();
  
        if (existingData) {
          toast.error('이미 저장된 원단 스펙입니다.');
          setIsSubmitting(false);
          return;
        }
  
        await supabase.from('fabric_specs').insert([dataToSave]);
        toast.success('저장되었습니다!');
        router.push('/');
      } catch (error) {
        console.error('Error saving data:', error);
        toast.error('저장 중 오류가 발생했습니다.');
        setIsSubmitting(false);
      }
  };

  if (!data) {
    return <div className="min-h-screen p-8 flex items-center justify-center">데이터를 로드하는 중...</div>;
  }
  
  const InfoCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const InfoRow = ({ label, value, note }: { label: string, value: string | React.ReactNode, note?: string }) => (
    <div>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="text-lg text-slate-900">{value}</p>
      {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
    </div>
  );

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">전문가 분석 리포트</h1>

        {data.image_url && (
          <InfoCard title="분석한 이미지">
            <div className="flex justify-center">
              <img src={data.image_url} alt="Uploaded fabric spec" className="rounded-md max-h-96 object-contain" />
            </div>
          </InfoCard>
        )}
        
        <div className="space-y-6 mt-6">
            <InfoCard title="기본 정보">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow label="원단 코드 (Art No.)" value={data.basic_info.art_no} />
                    <InfoRow label="원단 이름" value={data.basic_info.fabric_name} />
                    <InfoRow label="제조사명" value={data.basic_info.mill_name} />
                    <InfoRow label="원단 종류 설명" value={data.basic_info.fabric_type_explanation} />
                </div>
            </InfoCard>

            <InfoCard title="사양 (Yarn Spec)">
                {data.yarn_specs.map((spec, i) => (
                    <div key={i} className="pt-2">
                        <p className="text-md font-bold text-slate-700">{spec.spec}</p>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-slate-600">
                            {spec.details.map((detail, j) => <li key={j}>{detail}</li>)}
                        </ul>
                    </div>
                ))}
            </InfoCard>

            <InfoCard title="규격 (Dimensions)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoRow label="폭 (Width)" value={data.dimensions.width.value} note={data.dimensions.width.note} />
                    <InfoRow label="중량 (Weight g/m²)" value={data.dimensions.weight_gsm.value} note={data.dimensions.weight_gsm.note} />
                    <InfoRow label="중량 (Weight g/yd)" value={data.dimensions.weight_gy.value} note={data.dimensions.weight_gy.note} />
                </div>
            </InfoCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="수축률 (Shrinkage)">
                    <InfoRow label="세로 방향 (Warp)" value={data.shrinkage.warp.value} note={data.shrinkage.warp.note} />
                    <InfoRow label="가로 방향 (Weft)" value={data.shrinkage.weft.value} note={data.shrinkage.weft.note} />
                    <InfoRow label="요약" value={data.shrinkage.summary} />
                </InfoCard>
                <InfoCard title="염색 정보 (Dyeing Info)">
                    <InfoRow label="컬러 수" value={data.dyeing_info.color_count.value} note={data.dyeing_info.color_count.note} />
                    <InfoRow label="롤 수" value={data.dyeing_info.roll_count.value} note={data.dyeing_info.roll_count.note} />
                </InfoCard>
            </div>
            
            <InfoCard title="후가공 (Finishing)">
                 {data.finishing_processes.map((p, i) => <InfoRow key={i} label={p.name} value={p.explanation} /> )}
            </InfoCard>

            <InfoCard title="전문가 종합 요약">
                <p className="text-base text-slate-700 whitespace-pre-wrap">{data.expert_summary}</p>
            </InfoCard>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button type="button" onClick={() => router.push('/')} className="button-secondary">취소</button>
          <button onClick={handleSave} disabled={isSubmitting} className="button-primary">
            {isSubmitting ? '저장 중...' : '이대로 저장'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center">페이지를 로드하고 있습니다...</div>}>
      <ReviewDisplayComponent />
    </Suspense>
  );
} 