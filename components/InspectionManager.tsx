
import React, { useState, useEffect } from 'react';
import { Inspection, Project, InspectionChecklistItem, User, UserRole } from '../types';
import { CheckCircle, XCircle, Camera, Save, ArrowLeft, ClipboardList, AlertCircle, List, Table as TableIcon, Box, Printer, FileText, History, CheckSquare, ShieldCheck, Info } from 'lucide-react';

interface InspectionManagerProps {
  inspections: Inspection[];
  projects: Project[];
  selectedPanelContext: { project: Project; panelId: number } | null;
  onClearContext: () => void;
  onAddInspection: (inspection: Inspection) => Promise<void>;
  currentUser: User | null;
}

// --- 공정 검사 (Process Inspection) Data Structure (PDF Based) ---
const PROCESS_INSPECTION_MASTER = [
    // 1. 마킹
    { category: '마킹', subCategory: '순차', item: '외함상태(도어사양, 도장사양) 확인', criteria: '전기설계통지(구조,일반사항)' },
    { category: '마킹', subCategory: '자주', item: '마킹 표시 흔적(연필 등) 제거 확인', criteria: 'LSAE-P1-187R9' },
    { category: '마킹', subCategory: '순차', item: 'Cable hole COVER 사양 확인', criteria: '전기설계통지(구조)' },
    { category: '마킹', subCategory: '자주', item: 'DUCT 취부상태(수평,수직,마감,리벳작업) 확인', criteria: 'LSAE-P1-166R12,-188R9,-196R9' },
    
    // 2. 기기취부
    { category: '기기취부', subCategory: '순차', item: '주기기 사양 확인', criteria: '전기설계통지(주기기)' },
    { category: '기기취부', subCategory: '자주', item: '주기기 조임후 1 point 매직체크 확인', criteria: 'LSAE-P1-210R17' },
    { category: '기기취부', subCategory: '순차', item: '접지 CABLE 사양(사이즈,종류,색상) 확인', criteria: '전기설계통지(주회로)' },
    { category: '기기취부', subCategory: '자주', item: '접지 CABLE 작업후 매직체크 확인', criteria: 'LSAE-P1-230R17' },
    { category: '기기취부', subCategory: '순차', item: '주기기 접지 조임상태 확인', criteria: 'LSAE-P1-230R17' },
    { category: '기기취부', subCategory: '자주', item: '취부상태(수평,수직,SCREW조임)', criteria: 'LSAE-P1-211R11' },
    { category: '기기취부', subCategory: '순차', item: 'DOOR 상, 하 바뀜 확인', criteria: '외형도' },
    { category: '기기취부', subCategory: '자주', item: 'DOOR기기 사양 확인', criteria: '외형도, 삼선도' },
    { category: '기기취부', subCategory: '자주', item: '명판 내용은 도면과 일치 (각인,오타,누락 등)', criteria: '외형도' },

    // 3. 배선조립
    { category: '배선조립', subCategory: '순차', item: '기기판 기기배치/배선정렬 상태 확인', criteria: '배선전개도, LSAE-P1-200R8' },
    { category: '배선조립', subCategory: '자주', item: '전선보호 HOOK BAND 상태 확인', criteria: 'LSAE-P1-173R6' },
    { category: '배선조립', subCategory: '순차', item: 'PT 1차 접지선 사이즈 확인', criteria: '전기설계통지(주회로)' },
    { category: '배선조립', subCategory: '자주', item: 'CT 극성 확인', criteria: '전기설계통지(주기기)' },
    { category: '배선조립', subCategory: '순차', item: '기기판 기기조임상태 및 주요기기(AUX-RY) 오결선 확인', criteria: 'LSAE-P1-203R7, 삼선도' },
    { category: '배선조립', subCategory: '자주', item: '기기압착단자 및 배선 조임 확인', criteria: 'LSAE-P1-332R8, -201R8' },
    { category: '배선조립', subCategory: '순차', item: 'DOOR기기 간섭여부 확인', criteria: '외형도' },
    { category: '배선조립', subCategory: '자주', item: 'DOOR기기 배선정렬상태 확인', criteria: 'LSAE-P1-401R4~-410R4' },

    // 4. 도체조립
    { category: '도체조립', subCategory: '순차', item: 'BUS-BAR 상배열 상태 확인\n-TUBE사양 확인\n-수평/수직절연거리 및 열반부스바(애자포함) 위치치수 확인', criteria: '전기설계통지(주회로)\nLSAE-P1-220R2, 구조조립도면' },
    { category: '도체조립', subCategory: '순차', item: 'BOLT규격 확인\n-BOLT조임 확인', criteria: '동체도면, LSAE-P1-237R8\nLSAE-P1-233R19' },
    { category: '도체조립', subCategory: '자주', item: 'BOLT조임 확인 (Torque Check)', criteria: 'BOLT규격(강도 8.8)별 표준범위 확인' },
    { category: '도체조립', subCategory: '순차', item: '접지BUS-BAR 사양확인', criteria: '전기설계통지(주회로)' },
    { category: '도체조립', subCategory: '자주', item: '접지볼트체결 상태(매직체크) 확인', criteria: 'LSAE-P1-239R7' },
    { category: '도체조립', subCategory: '순차', item: 'BOLT규격 확인 (애자)', criteria: '동체도면, LSAE-P1-237R8' },
    { category: '도체조립', subCategory: '자주', item: 'BOLT조임 확인 (애자)', criteria: 'LSAE-P1-234R24' },

    // 5. 총조립
    { category: '총조립', subCategory: '순차', item: 'CABLE 사양 확인(전선의 종류)', criteria: '전기설계통지(주회로)' },
    { category: '총조립', subCategory: '자주', item: 'BOLT 조임, 매직 CHECK', criteria: 'LSAE-P1-454R0' },
    { category: '총조립', subCategory: '순차', item: '접속부 볼트 청색 매직체크 확인', criteria: 'LSAE-P1-233R19' },
    { category: '총조립', subCategory: '자주', item: '접속부 볼트 조임 검사 및 적색 매직체크 확인', criteria: '-' },
    { category: '총조립', subCategory: '자주', item: '재질, 색상, 치수등 (도면과 일치)', criteria: 'LSAE-P1-260R7' },
    { category: '총조립', subCategory: '자주', item: '상 스티카 및 경고/위험라벨 부착 확인', criteria: 'LSAE-P1-238R8, -345R4, -241R10, -570R0' },
    { category: '총조립', subCategory: '자주', item: 'BUS실 격벽판 취부 확인', criteria: '외함구조도면' },
    { category: '총조립', subCategory: '자주', item: '차단기 사양 확인', criteria: '전기설계통지(주기기)' },
    { category: '총조립', subCategory: '순차', item: '차단기/대차 클립 및 접지 SLIDING부 확인', criteria: '-' },
    { category: '총조립', subCategory: '자주', item: '청소 및 열반BUS 확인', criteria: '외형도, 구조도, 동체도' },
];

// --- 최종 검사 (Final Inspection) Data Structure ---
const LV_INSPECTION_MASTER = [
    { category: '일반', subCategory: '-', item: '기계/기구 사양 및 취부 상태(위치등) 확인', criteria: '승인 도면과 일치 여부 확인(삼선도에 주기기 사양 확인 및 Serial No.표기 한다.-CT사양필)' },
    { category: '일반', subCategory: '-', item: '내, 외부 기기류 외관 확인 (명판 포함)', criteria: '기기류 파손, 오염 등 외관 확인\n기기류 명판 및 스티커 부착 확인' },
    { category: '일반', subCategory: '-', item: '변성기류 및 애자 표면의 상태 확인', criteria: '표면의 손상 및 이물질 확인' },
    { category: '일반', subCategory: '-', item: '내/외부 부품의 외관 점검\n(단자대, Aux Relay, S/W등)', criteria: '외관 손상 및 명판 확인' },
    { category: '일반', subCategory: '-', item: '단자대(TB)의 체결상태 및 식별표시 확인', criteria: '체결된 배선의 흔들림 확인 및 하트마크 기기(T/B)번호의 정면 위치 확인' },
    { category: '일반', subCategory: '-', item: '차단기 CLIP 삽입 상태', criteria: 'CLIP이탈여부 확인(육안점검)' },
    { category: '일반', subCategory: '-', item: '배전반 외함 접지 및 부품 접지 확인', criteria: '접지 전선 규격 및 볼트 고정 상태 (I Marking 확인)' },
    { category: '외관\n구조', subCategory: '볼트 체결\n상태', item: '볼트 조임 토크 확인\n- 작업자: (성명)', criteria: '•조임전 절연거리를 확인 한다.\n•볼트(강도8.8) 규격별 조임 토크 기준(kgf.cm)\nM6(70~100), M8(200~245), M10(350~490), M12(600~850)\n•조임Torque값은 Bolt Torque Check Sheet 에 기록한다.' },
    { category: '외관\n구조', subCategory: '치수', item: '배전반 외함 Size 도면 일치', criteria: '외함 Size 치수 확인(치수 확인후 외형도에 확인 치수값을 표기 기록 한다. )' },
    { category: '외관\n구조', subCategory: '부스바\n조립\n상태', item: '외관 상태 확인', criteria: '스크래치, 줄무늬, 찍힘, 오염, 변색 등 확인\n튜브 절단 부위 도금 상태 확인\n부스바 수평 일치 여부 확인' },
    { category: '외관\n구조', subCategory: '배선', item: '단자대 및 Cable 결선 상태 확인', criteria: 'TB 볼트 조임 상태 확인\n케이블 결선 확인 (단선, 오결선 등)' },
    { category: '기계적 동작시험', subCategory: '-', item: '기계적 수동 동작 확인', criteria: '차단기, 개폐기의 ON/OFF 수동 동작 확인\n차단기, PT 대차 등 인입 및 인출 동작 확인' },
];

const InspectionManager: React.FC<InspectionManagerProps> = ({ inspections, projects, selectedPanelContext, onClearContext, onAddInspection, currentUser }) => {
    const [mainTab, setMainTab] = useState<'execution' | 'history'>('execution');
    const [view, setView] = useState<'list' | 'form'>('list');
    const [isSaving, setIsSaving] = useState(false);
    const [localPanelContext, setLocalPanelContext] = useState<{ project: Project; panelId: number } | null>(null);
    
    // Determine Inspection Mode dynamically
    const [activeInspectionType, setActiveInspectionType] = useState<'process' | 'final'>('process');

    const userRole = currentUser?.role;
    const isWorker = userRole === UserRole.WORKER;
    
    // Read-only Check
    const isReadOnlyResult = (activeInspectionType === 'process' && userRole !== UserRole.WORKER) || 
                             (activeInspectionType === 'final' && userRole === UserRole.WORKER);

    const [formState, setFormState] = useState({
        result: 'pending', // Default to pending
        notes: '',
    });
    const [checklistItems, setChecklistItems] = useState<InspectionChecklistItem[]>([]);

    useEffect(() => {
        if (selectedPanelContext) {
            setLocalPanelContext(selectedPanelContext);
            // Default to process for worker, final for others if not specified, but here we rely on internal state or context logic
            if (isWorker) {
                setActiveInspectionType('process');
            } else {
                 // For deep linking or auto-navigation, we might need to know which type.
                 // For now default to final if not worker.
                 setActiveInspectionType('final'); 
            }
            setMainTab('execution');
            setView('form');
        }
    }, [selectedPanelContext, isWorker]);

    useEffect(() => {
        if (view === 'form' && localPanelContext) {
            const { project, panelId } = localPanelContext;
            const existingInspection = inspections.find(i => 
                i.projectId === project.id && 
                i.taskNumber === project.taskNumber && 
                i.panelId === panelId &&
                i.type === activeInspectionType 
            );

            const isProcess = activeInspectionType === 'process';
            const masterList = isProcess ? PROCESS_INSPECTION_MASTER : LV_INSPECTION_MASTER;

            if (existingInspection) {
                setFormState({ result: existingInspection.result, notes: '' });
                const mergedChecklist = masterList.map(master => {
                    const saved = existingInspection.checkList.find(i => i.item === master.item);
                    return {
                        item: master.item,
                        category: master.category,
                        subCategory: master.subCategory,
                        criteria: master.criteria,
                        status: saved ? saved.status : 'pending',
                        value: saved ? saved.value : '',
                        inspector: saved ? saved.inspector : '',
                        inspectionDate: saved ? saved.inspectionDate : '',
                        qcInspector: saved ? saved.qcInspector : '',
                        qcDate: saved ? saved.qcDate : ''
                    } as InspectionChecklistItem;
                });
                setChecklistItems(mergedChecklist);
            } else {
                setFormState({ result: 'pending', notes: '' });
                const initialChecklist = masterList.map(master => ({
                    item: master.item,
                    category: master.category,
                    subCategory: master.subCategory,
                    criteria: master.criteria,
                    status: 'pending' as const,
                    value: '',
                    inspector: '',
                    inspectionDate: '',
                    qcInspector: '',
                    qcDate: ''
                }));
                setChecklistItems(initialChecklist);
            }
        }
    }, [localPanelContext, view, inspections, activeInspectionType]);

    // Auto-Calculate Result Logic
    useEffect(() => {
        if (checklistItems.length === 0) return;

        let calculatedResult = 'pending';

        if (activeInspectionType === 'process') {
            const itemsToVerify = checklistItems.filter(item => item.status !== 'N/A');
            const isAllVerified = itemsToVerify.length > 0 && itemsToVerify.every(item => !!item.qcInspector);
            calculatedResult = isAllVerified ? 'pass' : 'pending';
        } else {
            const itemsToCheck = checklistItems.filter(item => item.status !== 'N/A');
            const isAllOk = itemsToCheck.length > 0 && itemsToCheck.every(item => item.status === 'OK');
            calculatedResult = isAllOk ? 'pass' : 'pending';
        }

        setFormState(prev => {
            if (prev.result !== calculatedResult) {
                return { ...prev, result: calculatedResult };
            }
            return prev;
        });

    }, [checklistItems, activeInspectionType]);


    const handleBackToList = () => {
        setView('list');
        setLocalPanelContext(null);
        onClearContext();
    };

    const handleChecklistStatusChange = (index: number, status: 'OK' | 'NG' | 'N/A') => {
        if (isReadOnlyResult) return;
        setChecklistItems(prevItems => {
            const newItems = [...prevItems];
            const today = new Date().toISOString().split('T')[0];
            newItems[index] = { 
                ...newItems[index], 
                status: status,
                inspector: currentUser ? currentUser.name : 'Unknown',
                inspectionDate: today
            };
            return newItems;
        });
    };

    const handleQcSignOff = (index: number) => {
        setChecklistItems(prevItems => {
            const newItems = [...prevItems];
            const today = new Date().toISOString().split('T')[0];
            newItems[index] = {
                ...newItems[index],
                qcInspector: currentUser ? currentUser.name : 'QC',
                qcDate: today
            };
            return newItems;
        });
    };

    const handleSaveInspection = async () => {
        if (!localPanelContext?.project) return;
        setIsSaving(true);
        const { project, panelId } = localPanelContext;
        
        const newInspection: Inspection = {
            id: `${project.id}_${project.taskNumber}_${panelId}_${activeInspectionType}`,
            projectId: project.id,
            taskNumber: project.taskNumber,
            panelId: panelId,
            type: activeInspectionType as 'process' | 'final',
            result: formState.result as 'pass' | 'fail' | 'pending',
            inspector: currentUser ? currentUser.name : 'System',
            date: new Date().toISOString().split('T')[0],
            checkList: checklistItems
        };

        try {
            await onAddInspection(newInspection);
            alert(`${activeInspectionType === 'process' ? '공정' : '최종'} 검사 결과가 저장되었습니다.`);
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        alert("인쇄 미리보기 창을 엽니다. (창이 뜨지 않으면 Ctrl+P를 사용하세요)");
        try {
            setTimeout(() => { window.print(); }, 500);
        } catch (error) { console.error("Print failed:", error); }
    };

    // Helper for RowSpan
    const getRowSpans = (items: InspectionChecklistItem[]) => {
        const catSpans: Record<number, number> = {};
        const subCatSpans: Record<number, number> = {};
        let catStartIndex = 0;
        let subCatStartIndex = 0;
        for (let i = 1; i <= items.length; i++) {
            const prev = items[i - 1];
            const curr = items[i];
            if (!curr || curr.category !== items[catStartIndex].category) {
                catSpans[catStartIndex] = i - catStartIndex;
                catStartIndex = i;
            }
            if (!curr || curr.subCategory !== items[subCatStartIndex].subCategory || curr.category !== items[subCatStartIndex].category) {
                subCatSpans[subCatStartIndex] = i - subCatStartIndex;
                subCatStartIndex = i;
            }
        }
        return { catSpans, subCatSpans };
    };

    const renderPDFForm = () => {
        const { catSpans, subCatSpans } = getRowSpans(checklistItems);
        return (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-900 text-white border-b border-gray-300">
                            {activeInspectionType === 'process' ? (
                                <>
                                    <th className="border-r border-gray-600 p-3 w-20 text-center">공정분류</th>
                                    <th className="border-r border-gray-600 p-3 w-16 text-center">구분</th>
                                </>
                            ) : (
                                <>
                                    <th className="border-r border-gray-600 p-3 w-16 text-center">1Level</th>
                                    <th className="border-r border-gray-600 p-3 w-20 text-center">2Level</th>
                                </>
                            )}
                            <th className="border-r border-gray-600 p-3 text-left">검사 내용</th>
                            <th className="border-r border-gray-600 p-3 text-left w-1/3">검사 기준</th>
                            <th className="p-3 w-48 text-center no-print border-r border-gray-600">검사 결과</th>
                            <th className="border-r border-gray-600 p-3 w-24 text-center">검사일</th>
                            <th className="border-r border-gray-600 p-3 w-20 text-center">작업자</th>
                            {activeInspectionType === 'process' && (
                                <th className="p-3 w-20 text-center">확인(QC)</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {checklistItems.map((item, index) => (
                            <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${item.category !== checklistItems[index+1]?.category ? 'border-b-2 border-b-gray-400' : ''}`}>
                                {catSpans[index] > 0 && (
                                    <td rowSpan={catSpans[index]} className="border-r border-gray-300 p-2 text-center align-middle font-bold bg-gray-50 text-xs">
                                        {item.category && item.category.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                    </td>
                                )}
                                {subCatSpans[index] > 0 && (
                                    <td rowSpan={subCatSpans[index]} className="border-r border-gray-300 p-2 text-center align-middle text-xs">
                                        {item.subCategory && item.subCategory !== '-' ? item.subCategory.split('\n').map((line, i) => <div key={i}>{line}</div>) : ''}
                                    </td>
                                )}
                                <td className="border-r border-gray-300 p-2 align-middle whitespace-pre-wrap border-l border-l-gray-200">{item.item}</td>
                                <td className="border-r border-gray-300 p-2 align-middle text-xs text-gray-600 whitespace-pre-wrap">{item.criteria}</td>
                                
                                <td className="p-2 align-middle text-center no-print border-r border-gray-300">
                                    {isReadOnlyResult ? (
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded text-xs font-bold border ${
                                                item.status === 'OK' ? 'bg-green-100 text-green-700 border-green-300' :
                                                item.status === 'NG' ? 'bg-red-100 text-red-700 border-red-300' :
                                                item.status === 'N/A' ? 'bg-gray-100 text-gray-600 border-gray-300' :
                                                'bg-white text-gray-400 border-gray-200'
                                            }`}>
                                                {item.status === 'pending' ? '-' : item.status}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 justify-center">
                                            <button type="button" onClick={() => handleChecklistStatusChange(index, 'OK')} className="px-3 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                                style={{
                                                    backgroundColor: item.status === 'OK' ? '#16a34a' : '#cbd5e1',
                                                    color: item.status === 'OK' ? '#ffffff' : '#1f2937',
                                                    borderColor: item.status === 'OK' ? '#16a34a' : '#94a3b8'
                                                }}>OK</button>
                                            <button type="button" onClick={() => handleChecklistStatusChange(index, 'NG')} className="px-3 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                                style={{
                                                    backgroundColor: item.status === 'NG' ? '#dc2626' : '#cbd5e1',
                                                    color: item.status === 'NG' ? '#ffffff' : '#1f2937',
                                                    borderColor: item.status === 'NG' ? '#dc2626' : '#94a3b8'
                                                }}>NG</button>
                                            <button type="button" onClick={() => handleChecklistStatusChange(index, 'N/A')} className="px-2 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                                style={{
                                                    backgroundColor: item.status === 'N/A' ? '#6b7280' : '#cbd5e1',
                                                    color: item.status === 'N/A' ? '#ffffff' : '#1f2937',
                                                    borderColor: item.status === 'N/A' ? '#6b7280' : '#94a3b8'
                                                }}>N/A</button>
                                        </div>
                                    )}
                                </td>
                                
                                <td className="border-r border-gray-300 p-2 align-middle text-center text-xs text-gray-600">{item.inspectionDate || '-'}</td>
                                <td className="border-r border-gray-300 p-2 align-middle text-center text-xs text-gray-600 font-medium">{item.inspector || '-'}</td>
                                
                                {activeInspectionType === 'process' && (
                                    <td className="p-2 align-middle text-center">
                                        {item.qcInspector ? (
                                            <div className="flex flex-col items-center">
                                                <ShieldCheck size={14} className="text-blue-600 mb-0.5" />
                                                <span className="text-xs font-bold text-blue-600">{item.qcInspector}</span>
                                                <span className="text-[10px] text-gray-400">{item.qcDate}</span>
                                            </div>
                                        ) : (
                                            !isReadOnlyResult ? (
                                                <span className="text-xs text-gray-300">-</span>
                                            ) : (
                                                item.status === 'OK' ? (
                                                    <button 
                                                        onClick={() => handleQcSignOff(index)}
                                                        className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100"
                                                    >
                                                        확인
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-300">{item.status === 'NG' ? '조치필요' : '-'}</span>
                                                )
                                            )
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const getStatusColor = (inspection: Inspection | undefined) => {
        if (!inspection) return '#ffffff';
        if (inspection.result === 'pass') return '#16a34a'; // Green
        if (inspection.result === 'fail') return '#dc2626'; // Red
        return '#f97316'; // Orange
    };

    const getStatusTextColor = (inspection: Inspection | undefined) => {
        if (!inspection) return '#334155';
        return '#ffffff';
    };

    const renderInspectionMatrix = () => {
        return (
          <div className="space-y-6">
              {projects.map(project => (
                  <div key={`${project.id}-${project.taskNumber}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                              <h3 className="font-bold text-lg text-slate-800">{project.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                  <span className="font-bold">{project.id}</span>
                                  <span>/</span>
                                  <span className="text-blue-600 font-bold">{project.taskNumber}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                  기종: {project.modelType || '-'} | 납기: {project.deadline || '-'}
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                               <div className="text-xs text-slate-400 flex items-center gap-2">
                                  <span>{isWorker ? '공정 검사' : '검사'} 현황 (Panels)</span>
                                  {!isWorker && <span className="text-[10px] text-gray-400">(좌:공정|우:최종)</span>}
                               </div>
                          </div>
                      </div>
                      <div className="p-4">
                          {/* Use inline grid style to ensure layout */}
                          <div className="matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(55px, 1fr))', gap: '8px' }}>
                              {Array.from({ length: project.panelCount }).map((_, i) => {
                                  const panelId = i + 1;
                                  
                                  // Fetch both statuses for Split Button
                                  const processIns = inspections.find(ins => 
                                      ins.projectId === project.id && ins.taskNumber === project.taskNumber && ins.panelId === panelId && ins.type === 'process'
                                  );
                                  const finalIns = inspections.find(ins => 
                                      ins.projectId === project.id && ins.taskNumber === project.taskNumber && ins.panelId === panelId && ins.type === 'final'
                                  );

                                  if (isWorker) {
                                      // Worker: Single Button (Process Only)
                                      const bgColor = getStatusColor(processIns);
                                      const textColor = getStatusTextColor(processIns);
                                      const borderColor = processIns ? bgColor : '#e2e8f0';
                                      return (
                                          <button
                                              key={panelId}
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveInspectionType('process');
                                                  setLocalPanelContext({ project, panelId });
                                                  setView('form');
                                              }}
                                              style={{
                                                  backgroundColor: bgColor,
                                                  color: textColor,
                                                  border: `1px solid ${borderColor}`,
                                                  width: '100%',
                                                  aspectRatio: '1/1',
                                                  borderRadius: '8px',
                                                  fontWeight: 'bold',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  fontSize: '14px'
                                              }}
                                          >
                                              {panelId}
                                          </button>
                                      );
                                  } else {
                                      // Inspector/Admin: Split Button (Process | Final)
                                      const pColor = getStatusColor(processIns);
                                      const fColor = getStatusColor(finalIns);
                                      const pText = getStatusTextColor(processIns);
                                      const fText = getStatusTextColor(finalIns);
                                      
                                      return (
                                          <div 
                                            key={panelId}
                                            style={{ 
                                                display: 'flex', 
                                                width: '100%', 
                                                aspectRatio: '1/1', 
                                                borderRadius: '8px', 
                                                overflow: 'hidden', 
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                          >
                                              <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveInspectionType('process');
                                                    setLocalPanelContext({ project, panelId });
                                                    setView('form');
                                                }}
                                                style={{ 
                                                    flex: 1, 
                                                    backgroundColor: pColor, 
                                                    color: pText, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                                }}
                                                title="공정 검사"
                                              >
                                                {panelId}
                                              </div>
                                              <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveInspectionType('final');
                                                    setLocalPanelContext({ project, panelId });
                                                    setView('form');
                                                }}
                                                style={{ 
                                                    flex: 1, 
                                                    backgroundColor: fColor, 
                                                    color: fText, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                                title="최종 검사"
                                              >
                                                {panelId}
                                              </div>
                                          </div>
                                      );
                                  }
                              })}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center no-print">
                <h2 className="page-title">검사 관리</h2>
                <div className="flex bg-gray-200 rounded-lg p-1">
                    <button 
                        onClick={() => { setMainTab('execution'); setView('list'); }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${mainTab === 'execution' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={16} /> 검사 현황
                    </button>
                    <button 
                        onClick={() => setMainTab('history')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${mainTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History size={16} /> 검사 이력
                    </button>
                </div>
            </div>

            {mainTab === 'history' ? (
                renderInspectionMatrix()
            ) : (
                view === 'list' ? (
                    renderInspectionMatrix()
                ) : (
                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="inspection-form-container">
                        {/* Form Header */}
                        <div className="w-full flex justify-between items-start no-print">
                            <button onClick={handleBackToList} className="btn-icon flex items-center gap-2" style={{ paddingLeft: 0, width: 'auto' }}>
                                <ArrowLeft size={20} /> 목록으로 돌아가기
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-500 font-medium animate-pulse hidden print-visible">Ctrl+P로 인쇄하세요</span>
                                <button type="button" onClick={handlePrint} className="btn btn-outline flex items-center gap-2">
                                    <Printer size={18} /> 인쇄
                                </button>
                                <button type="button" onClick={handleSaveInspection} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
                                    <Save size={18} /> {isSaving ? '저장 중...' : '검사 완료 저장'}
                                </button>
                            </div>
                        </div>

                        <div className="text-center mt-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                배전반 {activeInspectionType === 'process' ? '공정' : '인수/중간'} 검사 성적서
                            </h2>
                        </div>

                        <div className="card">
                            {localPanelContext && (
                                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">프로젝트명:</span>
                                            <span className="font-bold text-gray-900">{localPanelContext.project.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">제번 (ID):</span>
                                            <span className="font-mono text-gray-900">{localPanelContext.project.id}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">Task No:</span>
                                            <span className="font-mono text-gray-900">{localPanelContext.project.taskNumber}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">판넬 번호:</span>
                                            <span className="font-bold text-blue-600">#{localPanelContext.panelId}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">작성자:</span>
                                            <span>{currentUser?.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-500">작성일:</span>
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="no-print" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ClipboardList size={18} /> 검사 항목
                                </h4>
                                {renderPDFForm()}

                                <div className="mt-8 pt-6 border-t border-gray-100 no-print">
                                    <h4 style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem' }}>종합 판정</h4>
                                    <div 
                                        className="w-full rounded-lg p-4 text-center font-bold text-xl text-white shadow-md transition-all"
                                        style={{ 
                                            backgroundColor: formState.result === 'pass' ? '#10b981' : '#f97316',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {formState.result === 'pass' ? (
                                            <>
                                                <CheckCircle size={28} /> 완료 (Completed)
                                            </>
                                        ) : (
                                            <>
                                                <Info size={28} /> 진행중 (In Progress)
                                            </>
                                        )}
                                    </div>
                                    <p className="text-center text-sm text-gray-500 mt-2">
                                        * 모든 항목이 {activeInspectionType === 'process' ? 'QC 확인' : 'OK 판정'}되어야 완료 상태가 됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default InspectionManager;
