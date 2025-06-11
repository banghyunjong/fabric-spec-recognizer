import React from 'react';

const DetailItem = ({ label, value }: { label: string, value: any }) => {
    if (value === null || String(value).trim() === '') return null;
    return (
        <div className="py-2 px-3 bg-slate-50 rounded-md break-words">
            <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
            <p className="text-sm text-slate-800 font-semibold">{String(value)}</p>
        </div>
    );
};

const labelMap: { [key: string]: string } = {
    erdat: "생성일",
    syscd: "시스템코드",
    loekz: "삭제표시",
    mtrcd: "소재코드",
    lgrop: "대분류코드",
    lgropNm: "대분류명",
    mgrop: "중분류코드",
    mgropNm: "중분류명",
    sgrop: "소분류코드",
    sgropNm: "소분류명",
    dsgnm: "디자인명",
    ingre1: "성분1 코드",
    ingre1Nm: "성분1명",
    ingre2: "성분2 코드",
    ingre2Nm: "성분2명",
    ingre3: "성분3 코드",
    ingre3Nm: "성분3명",
    yarncnt: "원사 수",
    ycunit: "원사 단위",
    ydwgt: "중량(yd)",
    wtunit: "중량 단위",
    org: "조직",
    artcno: "소재번호",
    zplifnr: "공급업체코드",
    zproprc: "공급업체 단가",
    zprowaers: "공급업체 통화",
    zprcunit: "공급업체 단위",
    zlifnr: "내부 공급업체",
    zuntprc: "내부 단가",
    zuntwaers: "내부 통화",
    zchrratio: "혼용률",
    zyarncnt: "상세 원사",
    zdensity: "밀도",
    zydwgt: "상세 중량",
    zwtunit: "상세 중량 단위",
    zorg: "상세 조직",
    ztreatment: "후가공",
    zpwidth: "폭",
    backing: "백킹",
    mainitem: "메인아이템 코드",
    mainitemNm: "메인아이템명",
    thickness: "두께",
    remark: "비고",
    purno: "발주번호",
    cfmno: "확정번호",
    reglnd: "등록 국가"
};

const MaterialDetailsDisplay = ({ results }: { results: any[] }) => {
    return (
        <div className="space-y-6">
            {results.map((item, index) => {
                const keysToDisplay = Object.keys(item);

                return (
                    <div key={index} className="p-6 border rounded-lg bg-white shadow-sm animate-fade-in">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">
                            조회 결과: {item.artcno}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {keysToDisplay.map(key => (
                                <DetailItem key={key} label={labelMap[key] || key} value={item[key]} />
                           ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default MaterialDetailsDisplay; 