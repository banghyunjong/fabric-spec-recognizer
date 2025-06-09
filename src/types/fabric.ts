export interface FabricSpec {
  id?: string;
  key: string;
  created_at?: string;

  // 고정 필드
  art_no: string;
  name: string; // 원단 이름
  mill_name: string;

  // 동적 데이터 필드
  additional_data: Record<string, any>;
  
  // 화면 표시에만 사용되는 임시 필드
  image_url?: string;
} 