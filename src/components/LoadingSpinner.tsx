export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative bg-white p-5 rounded-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-3"></div>
        <p className="text-gray-700">이미지 분석 중...</p>
      </div>
    </div>
  );
} 