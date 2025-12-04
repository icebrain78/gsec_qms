
import React, { useState, useEffect } from 'react';
import { Inspection, Project, User, InspectionChecklistItem, InspectionDefect, UserRole } from '../types';
import { Save, ArrowLeft, Plus, Trash2, AlertCircle, Search, Settings, ClipboardList, Printer, CheckSquare, ShieldCheck, Edit2, Info } from 'lucide-react';

// Import service functions (Assumed to be exported from firestoreService based on context)
import { saveChecklistTemplate, fetchChecklistTemplate } from '../services/firestoreService';

interface InspectionManagerProps {
  inspections: Inspection[];
  projects: Project[];
  selectedPanelContext: { project: Project; panelId: number } | null;
  onClearContext: () => void;
  onAddInspection: (inspection: Inspection) => Promise<void>;
  currentUser: User;
  isSettingsMode: boolean;
}

const INITIAL_PROCESS_INSPECTION_MASTER = [
    { category: '마킹', subCategory: '순차', item: '외함상태(도어사양, 도장사양) 확인', criteria: '전기설계통지(구조,일반사항)' },
    { category: '마킹', subCategory: '자주', item: '마킹 표시 흔적(연필 등) 제거 확인', criteria: 'LSAE-P1-187R9' },
    { category: '마킹', subCategory: '순차', item: 'Cable hole COVER 사양 확인', criteria: '전기설계통지(구조)' },
    { category: '마킹', subCategory: '자주', item: 'DUCT 취부상태(수평,수직,마감,리벳작업) 확인', criteria: 'LSAE-P1-166R12,-188R9,-196R9' },
    { category: '기기취부', subCategory: '순차', item: '주기기 사양 확인', criteria: '전기설계통지(주기기)' },
    { category: '기기취부', subCategory: '자주', item: '주기기 조임후 1 point 매직체크 확인', criteria: 'LSAE-P1-210R17' },
    { category: '기기취부', subCategory: '순차', item: '접지 CABLE 사양(사이즈,종류,색상) 확인', criteria: '전기설계통지(주회로)' },
    { category: '기기취부', subCategory: '자주', item: '접지 CABLE 작업후 매직체크 확인', criteria: 'LSAE-P1-230R17' },
    { category: '기기취부', subCategory: '순차', item: '주기기 접지 조임상태 확인', criteria: 'LSAE-P1-230R17' },
    { category: '기기취부', subCategory: '자주', item: '취부상태(수평,수직,SCREW조임)', criteria: 'LSAE-P1-211R11' },
    { category: '기기취부', subCategory: '순차', item: 'DOOR 상, 하 바뀜 확인', criteria: '외형도' },
    { category: '기기취부', subCategory: '자주', item: 'DOOR기기 사양 확인', criteria: '외형도, 삼선도' },
    { category: '기기취부', subCategory: '자주', item: '명판 내용은 도면과 일치 (각인,오타,누락 등)', criteria: '외형도' },
    { category: '배선조립', subCategory: '순차', item: '기기판 기기배치/배선정렬 상태 확인', criteria: '배선전개도, LSAE-P1-200R8' },
    { category: '배선조립', subCategory: '자주', item: '전선보호 HOOK BAND 상태 확인', criteria: 'LSAE-P1-173R6' },
    { category: '배선조립', subCategory: '순차', item: 'PT 1차 접지선 사이즈 확인', criteria: '전기설계통지(주회로)' },
    { category: '배선조립', subCategory: '자주', item: 'CT 극성 확인', criteria: '전기설계통지(주기기)' },
    { category: '배선조립', subCategory: '순차', item: '기기판 기기조임상태 및 주요기기(AUX-RY) 오결선 확인', criteria: 'LSAE-P1-203R7, 삼선도' },
    { category: '배선조립', subCategory: '자주', item: '기기압착단자 및 배선 조임 확인', criteria: 'LSAE-P1-332R8, -201R8' },
    { category: '배선조립', subCategory: '순차', item: 'DOOR기기 간섭여부 확인', criteria: '외형도' },
    { category: '배선조립', subCategory: '자주', item: 'DOOR기기 배선정렬상태 확인', criteria: 'LSAE-P1-401R4~-410R4' },
    { category: '도체조립', subCategory: '순차', item: 'BUS-BAR 상배열 상태 확인\n-TUBE사양 확인\n-수평/수직절연거리 및 열반부스바(애자포함) 위치치수 확인', criteria: '전기설계통지(주회로)\nLSAE-P1-220R2, 구조조립도면' },
    { category: '도체조립', subCategory: '순차', item: 'BOLT규격 확인\n-BOLT조임 확인', criteria: '동체도면, LSAE-P1-237R8\nLSAE-P1-233R19' },
    { category: '도체조립', subCategory: '자주', item: 'BOLT조임 확인 (Torque Check)', criteria: 'BOLT규격(강도 8.8)별 표준범위 확인' },
    { category: '도체조립', subCategory: '순차', item: '접지BUS-BAR 사양확인', criteria: '전기설계통지(주회로)' },
    { category: '도체조립', subCategory: '자주', item: '접지볼트체결 상태(매직체크) 확인', criteria: 'LSAE-P1-239R7' },
    { category: '도체조립', subCategory: '순차', item: 'BOLT규격 확인 (애자)', criteria: '동체도면, LSAE-P1-237R8' },
    { category: '도체조립', subCategory: '자주', item: 'BOLT조임 확인 (애자)', criteria: 'LSAE-P1-234R24' },
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

const INITIAL_FINAL_INSPECTION_MASTER = [
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

const InspectionManager: React.FC<InspectionManagerProps> = ({
  inspections,
  projects,
  selectedPanelContext,
  onClearContext,
  onAddInspection,
  currentUser,
  isSettingsMode
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [localPanelContext, setLocalPanelContext] = useState<{ project: Project; panelId: number } | null>(null);
  const [activeInspectionType, setActiveInspectionType] = useState<'process' | 'final'>('process');
  const [showPrintToast, setShowPrintToast] = useState(false);
  
  // Checklist Settings State
  const [processMaster, setProcessMaster] = useState(INITIAL_PROCESS_INSPECTION_MASTER);
  const [finalMaster, setFinalMaster] = useState(INITIAL_FINAL_INSPECTION_MASTER);
  
  // Settings Mode State
  const [settingsTab, setSettingsTab] = useState<'process' | 'final'>('process');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ index: number, data: any } | null>(null);
  const [newItemData, setNewItemData] = useState({ category: '', subCategory: '', item: '', criteria: '' });

  const userRole = currentUser?.role;
  const isWorker = userRole === UserRole.WORKER;
  
  const canVerifyDefect = userRole === UserRole.PRODUCTION_LEADER || 
                          userRole === UserRole.ADMIN || 
                          userRole === UserRole.MANAGER || 
                          userRole === UserRole.INSPECTOR;

  const isReadOnlyResult = (activeInspectionType === 'process' && userRole !== UserRole.WORKER);
  
  const [formState, setFormState] = useState({
      result: 'pending', 
      notes: '',
  });
  const [checklistItems, setChecklistItems] = useState<InspectionChecklistItem[]>([]);
  const [defectList, setDefectList] = useState<InspectionDefect[]>([]);

  // DB Persistence and Initialization
  useEffect(() => {
    const loadData = async () => {
        try {
             const dbProcessMaster = await fetchChecklistTemplate('process');
             const dbFinalMaster = await fetchChecklistTemplate('final');
             
             if (dbProcessMaster && dbProcessMaster.length > 0) {
                 setProcessMaster(dbProcessMaster);
             } else {
                 await saveChecklistTemplate('process', INITIAL_PROCESS_INSPECTION_MASTER);
             }

             if (dbFinalMaster && dbFinalMaster.length > 0) {
                 setFinalMaster(dbFinalMaster);
             } else {
                 await saveChecklistTemplate('final', INITIAL_FINAL_INSPECTION_MASTER);
             }
        } catch (e) {
            console.error("Failed to load templates", e);
        }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPanelContext) {
      setLocalPanelContext(selectedPanelContext);
      if (isWorker) {
          setActiveInspectionType('process');
      }
      setView('form');
    }
  }, [selectedPanelContext, isWorker]);

  useEffect(() => {
    if (view === 'form' && localPanelContext && !isSettingsMode) {
        const { project, panelId } = localPanelContext;
        const existingInspection = inspections.find(i => 
            i.projectId === project.id && 
            i.taskNumber === project.taskNumber && 
            i.panelId === panelId &&
            i.type === activeInspectionType 
        );

        const isProcess = activeInspectionType === 'process';
        const masterList = isProcess ? processMaster : finalMaster;

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
            if (existingInspection.defectList && existingInspection.defectList.length > 0) {
                setDefectList(existingInspection.defectList);
            } else {
                setDefectList(Array.from({length: 5}, (_, i) => ({
                    id: `def-${Date.now()}-${i}`,
                    category: 'enclosure',
                    content: '',
                    date: '',
                    writer: '',
                    completed: false,
                    verified: false
                })));
            }

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
            setDefectList(Array.from({length: 5}, (_, i) => ({
                id: `def-${Date.now()}-${i}`,
                category: 'enclosure',
                content: '',
                date: '',
                writer: '',
                completed: false,
                verified: false
            })));
        }
    }
  }, [localPanelContext, view, inspections, activeInspectionType, isSettingsMode, processMaster, finalMaster]);

  useEffect(() => {
      if (checklistItems.length === 0) return;

      let calculatedResult = 'pending';

      if (activeInspectionType === 'process') {
          const itemsToVerify = checklistItems.filter(item => item.status !== 'N/A');
          const isAllQcChecked = itemsToVerify.length > 0 && itemsToVerify.every(item => item.qcInspector && item.qcInspector.length > 0);
          calculatedResult = isAllQcChecked ? 'pass' : 'pending';
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
        const currentItem = newItems[index];
        
        const nextStatus = currentItem.status === status ? 'pending' : status;
        
        const today = new Date().toISOString().split('T')[0];
        newItems[index] = { 
            ...currentItem, 
            status: nextStatus,
            inspector: nextStatus === 'pending' ? '' : (currentUser ? currentUser.name : 'Unknown'),
            inspectionDate: nextStatus === 'pending' ? '' : today,
            qcInspector: '',
            qcDate: ''
        };
        return newItems;
    });
  };

  const handleQcSignOff = (index: number) => {
      if (isWorker) return; 
      setChecklistItems(prevItems => {
          const newItems = [...prevItems];
          const today = new Date().toISOString().split('T')[0];
          if (newItems[index].qcInspector) {
               newItems[index] = { ...newItems[index], qcInspector: '', qcDate: '' };
          } else {
               newItems[index] = { ...newItems[index], qcInspector: currentUser ? currentUser.name : 'QC', qcDate: today };
          }
          return newItems;
      });
  }

  const handleDefectChange = (index: number, field: 'content' | 'category', value: string) => {
    if (field === 'content' && isReadOnlyResult) return;

    setDefectList(prev => {
        const newList = [...prev];
        const today = new Date().toISOString().split('T')[0];
        
        if (field === 'category') {
             newList[index] = { ...newList[index], category: value as 'enclosure' | 'system' };
        } else {
             newList[index] = {
                ...newList[index],
                content: value,
                date: value ? (newList[index].date || today) : '',
                writer: value ? (newList[index].writer || currentUser?.name || '') : ''
            };
        }
        return newList;
    });
  };

  const handleDefectCompleteToggle = (index: number) => {
    if (!isWorker && !canVerifyDefect && !isReadOnlyResult) return; 

    setDefectList(prev => {
        const newList = [...prev];
        const item = newList[index];
        if (!item.content) return prev;

        const newCompleted = !item.completed;
        const today = new Date().toISOString().split('T')[0];
        
        newList[index] = {
            ...item,
            completed: newCompleted,
            actionDate: newCompleted ? today : undefined,
            actionBy: newCompleted ? (currentUser?.name || '') : undefined
        };
        return newList;
    });
  };

  const handleDefectVerifyToggle = (index: number) => {
    if (!canVerifyDefect) return;

    setDefectList(prev => {
        const newList = [...prev];
        const item = newList[index];
        if (!item.completed) return prev;

        const newVerified = !item.verified;
        const today = new Date().toISOString().split('T')[0];

        newList[index] = {
            ...item,
            verified: newVerified,
            verifiedDate: newVerified ? today : undefined,
            verifiedBy: newVerified ? (currentUser?.name || '') : undefined
        };
        return newList;
    });
  };

  const handleAddDefectRow = () => {
      setDefectList(prev => [
          ...prev,
          { id: `def-${Date.now()}`, category: 'enclosure', content: '', date: '', writer: '', completed: false, verified: false }
      ]);
  };

  const handleSaveInspection = async () => {
      if (!localPanelContext?.project) return;
      setIsSaving(true);
      const { project, panelId } = localPanelContext;
      
      const validDefects = defectList.filter(d => d.content.trim() !== '');

      const newInspection: Inspection = {
          id: `${project.id}_${project.taskNumber}_${panelId}_${activeInspectionType}`,
          projectId: project.id,
          taskNumber: project.taskNumber,
          panelId: panelId,
          type: activeInspectionType as 'process' | 'final',
          result: formState.result as 'pass' | 'fail' | 'pending',
          inspector: currentUser ? currentUser.name : 'System',
          date: new Date().toISOString().split('T')[0],
          checkList: checklistItems,
          defectList: validDefects
      };

      try {
          await onAddInspection(newInspection);
          alert(`${activeInspectionType === 'process' ? '공정' : '최종'} 검사 결과가 저장되었습니다.`);
          handleBackToList();
      } catch (error) {
          alert('저장 중 오류가 발생했습니다.');
      } finally {
          setIsSaving(false);
      }
  };

  const handlePrint = () => {
    setShowPrintToast(true);
    setTimeout(() => setShowPrintToast(false), 5000);
    try { setTimeout(() => { window.print(); }, 500); } catch (e) { console.error(e); }
  };

  const getRowSpans = (items: any[]) => {
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

  const getStatusColor = (project: Project, panelId: number, type: 'process' | 'final') => {
      const inspection = inspections.find(i => 
          i.projectId === project.id && 
          i.taskNumber === project.taskNumber && 
          i.panelId === panelId && 
          i.type === type
      );

      if (!inspection) return '#ffffff';
      if (inspection.result === 'fail') return '#dc2626';

      if (type === 'process') {
           const applicable = inspection.checkList.filter(item => item.status !== 'N/A');
           if (applicable.length === 0) return '#f97316'; 

           const allQc = applicable.every(item => item.qcInspector && item.qcInspector.length > 0);
           if (allQc) return '#16a34a';
           return '#f97316';
      } else {
          const applicable = inspection.checkList.filter(item => item.status !== 'N/A');
           if (applicable.length === 0) return '#f97316';

          const allOk = applicable.every(item => item.status === 'OK');
          if (allOk) return '#16a34a';
          return '#f97316';
      }
  };

  const getStatusTextColor = (bgColor: string) => bgColor === '#ffffff' ? '#374151' : '#ffffff';

  const handlePanelClick = (e: React.MouseEvent, project: Project, panelId: number, type: 'process' | 'final') => {
      e.stopPropagation();
      setLocalPanelContext({ project, panelId });
      setActiveInspectionType(type);
      setView('form');
  };

  const renderInspectionMatrix = (project: Project) => {
      return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '0.5rem' }}>
              {Array.from({ length: project.panelCount }).map((_, i) => {
                  const panelId = i + 1;
                  
                  if (isWorker) {
                      const bgColor = getStatusColor(project, panelId, 'process');
                      return (
                          <button
                              key={panelId}
                              onClick={(e) => handlePanelClick(e, project, panelId, 'process')}
                              style={{
                                  backgroundColor: bgColor,
                                  color: getStatusTextColor(bgColor),
                                  border: bgColor === '#ffffff' ? '1px solid #cbd5e1' : 'none',
                                  borderRadius: '8px',
                                  width: '100%',
                                  aspectRatio: '1/1',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                          >
                              {panelId}
                          </button>
                      );
                  }

                  const procColor = getStatusColor(project, panelId, 'process');
                  const finalColor = getStatusColor(project, panelId, 'final');
                  
                  return (
                      <div key={panelId} className="rounded-lg overflow-hidden shadow-sm flex border border-gray-300" style={{ height: '50px', cursor: 'default' }}>
                          <div
                              onClick={(e) => handlePanelClick(e, project, panelId, 'process')}
                              style={{ 
                                  flex: 1, 
                                  backgroundColor: procColor, 
                                  color: getStatusTextColor(procColor),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                                  borderRight: '1px solid rgba(0,0,0,0.1)'
                              }}
                              title="공정 검사"
                          >
                              {panelId}
                          </div>
                          <div
                              onClick={(e) => handlePanelClick(e, project, panelId, 'final')}
                              style={{ 
                                  flex: 1, 
                                  backgroundColor: finalColor, 
                                  color: getStatusTextColor(finalColor),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                              }}
                              title="최종 검사"
                          >
                              {panelId}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  const handleAddItem = async () => {
      const targetMaster = settingsTab === 'process' ? processMaster : finalMaster;
      const setTargetMaster = settingsTab === 'process' ? setProcessMaster : setFinalMaster;
      const updated = [...targetMaster, { ...newItemData }];
      setTargetMaster(updated);
      
      await saveChecklistTemplate(settingsTab, updated);
      
      setIsEditModalOpen(false);
      setNewItemData({ category: '', subCategory: '', item: '', criteria: '' });
  };

  const handleUpdateItem = async () => {
      if (!editingItem) return;
      const targetMaster = settingsTab === 'process' ? processMaster : finalMaster;
      const setTargetMaster = settingsTab === 'process' ? setProcessMaster : setFinalMaster;
      const newMaster = [...targetMaster];
      newMaster[editingItem.index] = newItemData;
      setTargetMaster(newMaster);
      
      await saveChecklistTemplate(settingsTab, newMaster);

      setIsEditModalOpen(false);
      setEditingItem(null);
      setNewItemData({ category: '', subCategory: '', item: '', criteria: '' });
  };

  const handleDeleteItem = async (index: number) => {
      if(!confirm('정말 삭제하시겠습니까?')) return;
      const targetMaster = settingsTab === 'process' ? processMaster : finalMaster;
      const setTargetMaster = settingsTab === 'process' ? setProcessMaster : setFinalMaster;
      const newMaster = [...targetMaster];
      newMaster.splice(index, 1);
      setTargetMaster(newMaster);
      
      await saveChecklistTemplate(settingsTab, newMaster);
  };

  const openAddModal = () => {
      setEditingItem(null);
      setNewItemData({ category: '', subCategory: '', item: '', criteria: '' });
      setIsEditModalOpen(true);
  };
  const openEditModal = (item: any, index: number) => {
      setEditingItem({ index, data: item });
      setNewItemData({ ...item });
      setIsEditModalOpen(true);
  };

  const renderChecklistSettings = () => {
      const targetMaster = settingsTab === 'process' ? processMaster : finalMaster;
      return (
          <div className="space-y-4">
              <div className="flex gap-4 border-b border-gray-200 pb-4">
                  <button onClick={() => setSettingsTab('process')} className={`px-4 py-2 rounded-lg font-bold ${settingsTab === 'process' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>공정 검사 항목</button>
                  <button onClick={() => setSettingsTab('final')} className={`px-4 py-2 rounded-lg font-bold ${settingsTab === 'final' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>최종 검사 항목</button>
                  <div className="ml-auto"><button onClick={openAddModal} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> 항목 추가</button></div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="p-3 text-center w-32">1Level</th><th className="p-3 text-center w-32">2Level</th><th className="p-3 text-left">검사 내용</th><th className="p-3 text-left w-1/3">검사 기준</th><th className="p-3 text-center w-24">관리</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                          {targetMaster.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                  <td className="p-3 text-center font-medium">{item.category}</td><td className="p-3 text-center text-gray-500">{item.subCategory}</td><td className="p-3 whitespace-pre-wrap">{item.item}</td><td className="p-3 text-gray-500 whitespace-pre-wrap text-xs">{item.criteria}</td>
                                  <td className="p-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEditModal(item, index)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button><button onClick={() => handleDeleteItem(index)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></div></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {isEditModalOpen && (
                  <div className="modal-backdrop"><div className="modal-panel"><h3 className="text-lg font-bold mb-4">{editingItem ? '항목 수정' : '새 항목 추가'}</h3><div className="space-y-3"><div><label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label><input type="text" value={newItemData.category} onChange={e => setNewItemData({...newItemData, category: e.target.value})} className="form-control"/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">서브 카테고리</label><input type="text" value={newItemData.subCategory} onChange={e => setNewItemData({...newItemData, subCategory: e.target.value})} className="form-control"/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">검사 내용</label><textarea value={newItemData.item} onChange={e => setNewItemData({...newItemData, item: e.target.value})} className="form-control h-20"/></div><div><label className="block text-xs font-bold text-gray-500 mb-1">검사 기준</label><textarea value={newItemData.criteria} onChange={e => setNewItemData({...newItemData, criteria: e.target.value})} className="form-control h-20"/></div></div><div className="flex gap-2 mt-6"><button onClick={() => setIsEditModalOpen(false)} className="btn btn-outline flex-1">취소</button><button onClick={editingItem ? handleUpdateItem : handleAddItem} className="btn btn-primary flex-1">저장</button></div></div></div>
              )}
          </div>
      );
  };

  const renderPDFForm = () => {
      const { catSpans, subCatSpans } = getRowSpans(checklistItems);

      return (
          <div className="table-responsive">
              <table className="checklist-table w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                      <tr className="bg-gray-800 text-white">
                          <th className="border border-gray-600 p-2 w-12 text-center">{activeInspectionType === 'process' ? '공정분류' : '1LEVEL'}</th>
                          <th className="border border-gray-600 p-2 w-12 text-center">{activeInspectionType === 'process' ? '구분' : '2LEVEL'}</th>
                          <th className="border border-gray-600 p-2 text-center">검사 내용</th>
                          <th className="border border-gray-600 p-2 w-1/3 hidden md:table-cell text-center">검사 기준</th>
                          <th className="border border-gray-600 p-2 w-40 text-center">검사 결과</th>
                          <th className="border border-gray-600 p-2 w-20 text-center">검사일</th>
                          <th className="border border-gray-600 p-2 w-20 text-center">작성자</th>
                          {activeInspectionType === 'process' && (
                              <th className="border border-gray-600 p-2 w-20 text-center">확인(QC)</th>
                          )}
                      </tr>
                  </thead>
                  <tbody>
                      {checklistItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                              {catSpans[index] > 0 && (
                                  <td rowSpan={catSpans[index]} className="border border-gray-300 p-2 text-center bg-gray-50 font-bold align-middle border-b-2 border-b-gray-400">
                                      {item.category}
                                  </td>
                              )}
                              {subCatSpans[index] > 0 && (
                                  <td rowSpan={subCatSpans[index]} className="border border-gray-300 p-2 text-center align-middle border-b-2 border-b-gray-400">
                                      {item.subCategory}
                                  </td>
                              )}
                              <td className="border border-gray-300 p-2 align-middle">
                                  <span className="whitespace-pre-wrap">{item.item}</span>
                              </td>
                              <td className="border border-gray-300 p-2 text-xs text-gray-600 hidden md:table-cell whitespace-pre-wrap align-middle">
                                  {item.criteria}
                              </td>
                              <td className="border border-gray-300 p-2 text-center align-middle">
                                  {isReadOnlyResult ? (
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'OK' ? 'bg-green-100 text-green-700' : item.status === 'NG' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {item.status === 'pending' ? '대기중' : item.status}
                                      </span>
                                  ) : (
                                      <div className="flex gap-1 justify-center">
                                          <button 
                                              type="button"
                                              onClick={() => handleChecklistStatusChange(index, 'OK')}
                                              className="px-3 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                              style={{
                                                  backgroundColor: item.status === 'OK' ? '#16a34a' : '#cbd5e1', 
                                                  color: item.status === 'OK' ? '#ffffff' : '#1f2937',
                                                  borderColor: item.status === 'OK' ? '#16a34a' : '#94a3b8'
                                              }}
                                          >
                                              OK
                                          </button>
                                          <button 
                                              type="button"
                                              onClick={() => handleChecklistStatusChange(index, 'NG')}
                                              className="px-3 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                              style={{
                                                  backgroundColor: item.status === 'NG' ? '#dc2626' : '#cbd5e1',
                                                  color: item.status === 'NG' ? '#ffffff' : '#1f2937',
                                                  borderColor: item.status === 'NG' ? '#dc2626' : '#94a3b8'
                                              }}
                                          >
                                              NG
                                          </button>
                                          <button 
                                              type="button"
                                              onClick={() => handleChecklistStatusChange(index, 'N/A')}
                                              className="px-2 py-1 rounded text-xs font-bold border transition-colors shadow-sm"
                                              style={{
                                                  backgroundColor: item.status === 'N/A' ? '#6b7280' : '#cbd5e1',
                                                  color: item.status === 'N/A' ? '#ffffff' : '#1f2937',
                                                  borderColor: item.status === 'N/A' ? '#6b7280' : '#94a3b8'
                                              }}
                                          >
                                              N/A
                                          </button>
                                      </div>
                                  )}
                              </td>
                              <td className="border border-gray-300 p-2 text-center align-middle text-xs text-gray-600">
                                  {item.inspectionDate || '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-center align-middle text-xs text-gray-600">
                                  {item.inspector || '-'}
                              </td>
                              {activeInspectionType === 'process' && (
                                  <td className="border border-gray-300 p-2 text-center align-middle">
                                      {item.status === 'OK' && (
                                          <div className="flex flex-col items-center">
                                              {item.qcInspector ? (
                                                  <button onClick={() => canVerifyDefect && handleQcSignOff(index)} className="text-blue-600 flex flex-col items-center" disabled={!canVerifyDefect}>
                                                      <ShieldCheck size={16} />
                                                      <span className="text-[10px] font-bold">{item.qcInspector}</span>
                                                      <span className="text-[9px] text-gray-400">{item.qcDate}</span>
                                                  </button>
                                              ) : (
                                                  <button 
                                                      onClick={() => handleQcSignOff(index)} 
                                                      disabled={!canVerifyDefect}
                                                      className={`text-xs border px-2 py-1 rounded ${canVerifyDefect ? 'text-gray-600 hover:text-blue-600 hover:border-blue-400' : 'text-gray-300 cursor-not-allowed'}`}
                                                  >
                                                      확인
                                                  </button>
                                              )}
                                          </div>
                                      )}
                                      {item.status === 'NG' && <span className="text-xs text-red-400">조치대기</span>}
                                  </td>
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderDefectList = () => {
      return (
          <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                   <h4 className="font-bold text-gray-600 flex items-center gap-2">
                      <AlertCircle size={18} /> 불량 및 조치 사항
                   </h4>
                   {!isReadOnlyResult && (
                      <button type="button" onClick={handleAddDefectRow} className="text-sm text-blue-600 font-bold flex items-center gap-1 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">
                          <Plus size={14} /> 행 추가
                      </button>
                   )}
              </div>
              
              <div className="table-responsive">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                           <tr className="bg-gray-50 text-gray-700">
                              <th className="border border-gray-300 p-2 w-12 text-center">No</th>
                              <th className="border border-gray-300 p-2 w-32 text-center">구분</th>
                              <th className="border border-gray-300 p-2 text-center">불량 내용</th>
                              <th className="border border-gray-300 p-2 w-32 text-center">작성 (작성자/일자)</th>
                              <th className="border border-gray-300 p-2 w-32 text-center">조치 (조치자/일자)</th>
                              <th className="border border-gray-300 p-2 w-24 text-center">조치완료(작업자)</th>
                              <th className="border border-gray-300 p-2 w-24 text-center">확인(책임자/QC)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {defectList.map((defect, index) => (
                              <tr key={defect.id}>
                                  <td className="border border-gray-300 p-2 text-center text-gray-500">{index + 1}</td>
                                  <td className="border border-gray-300 p-2">
                                      <div className="flex gap-1 justify-center">
                                          <button 
                                              type="button"
                                              onClick={() => handleDefectChange(index, 'category', 'enclosure')}
                                              disabled={isReadOnlyResult}
                                              className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                                  defect.category === 'enclosure' 
                                                      ? 'bg-blue-600 text-white border-blue-600' 
                                                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                              } ${isReadOnlyResult ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                              외함
                                          </button>
                                          <button 
                                              type="button"
                                              onClick={() => handleDefectChange(index, 'category', 'system')}
                                              disabled={isReadOnlyResult}
                                              className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                                  defect.category === 'system' 
                                                      ? 'bg-blue-600 text-white border-blue-600' 
                                                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                              } ${isReadOnlyResult ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                              시스템
                                          </button>
                                      </div>
                                  </td>
                                  <td className="border border-gray-300 p-2">
                                      <input 
                                          type="text" 
                                          value={defect.content}
                                          onChange={(e) => handleDefectChange(index, 'content', e.target.value)}
                                          placeholder={!isReadOnlyResult ? "불량 내용 입력" : "-"}
                                          readOnly={isReadOnlyResult}
                                          className="w-full p-1 bg-transparent outline-none focus:bg-gray-50 rounded"
                                      />
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center align-middle">
                                      <div className="flex flex-col items-center">
                                          <span className="font-bold text-xs">{defect.writer}</span>
                                          <span className="text-[10px] text-gray-400">{defect.date}</span>
                                      </div>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center align-middle">
                                      <div className="flex flex-col items-center">
                                          <span className="font-bold text-xs">{defect.actionBy || '-'}</span>
                                          <span className="text-[10px] text-gray-400">{defect.actionDate}</span>
                                      </div>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center align-middle">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                          {defect.completed ? (
                                               <div className="flex flex-col items-center">
                                                  <CheckSquare size={16} className="text-red-600" />
                                                  <span className="text-[10px] text-green-600 font-bold">완료</span>
                                              </div>
                                          ) : (
                                               <input 
                                                  type="checkbox" 
                                                  checked={defect.completed} 
                                                  onChange={() => handleDefectCompleteToggle(index)}
                                                  disabled={!isWorker && !canVerifyDefect && !isReadOnlyResult} 
                                                  className="w-4 h-4 cursor-pointer"
                                              />
                                          )}
                                      </div>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center align-middle">
                                       <div className="flex flex-col items-center justify-center gap-1">
                                          {defect.verified ? (
                                              <div className="flex flex-col items-center">
                                                  <CheckSquare size={16} className="text-blue-600" />
                                                  <span className="text-[10px] text-blue-700 font-bold">{defect.verifiedBy}</span>
                                                  <span className="text-[9px] text-gray-400">{defect.verifiedDate}</span>
                                              </div>
                                          ) : (
                                              <input 
                                                  type="checkbox" 
                                                  checked={defect.verified || false}
                                                  onChange={() => handleDefectVerifyToggle(index)}
                                                  disabled={!canVerifyDefect}
                                                  className="w-4 h-4 cursor-pointer accent-blue-600"
                                              />
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  if (isSettingsMode) return <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}><div className="page-header"><h2 className="page-title flex items-center gap-2"><Settings/> 검사 항목 관리</h2></div>{renderChecklistSettings()}</div>;

  return view === 'list' ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="page-header no-print"><h2 className="page-title">검사 관리</h2></div>
        <div className="grid gap-6">
            {projects.map((project) => (
                <div key={`${project.id}-${project.taskNumber}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-80 bg-slate-50 p-6 border-r border-gray-200 flex flex-col justify-center">
                            <h3 className="text-xl font-extrabold text-slate-800 mb-1">{project.name}</h3>
                            <div className="text-sm font-bold text-slate-500 mb-4">{project.id} / <span className="text-blue-600">{project.taskNumber}</span></div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2"><span className="w-20 font-bold text-gray-400">기종</span><span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">{project.modelType || '-'}</span></div>
                                <div className="flex items-center gap-2"><span className="w-20 font-bold text-gray-400">납기</span><span className="font-medium">{project.deadline || '-'}</span></div>
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <div className="mb-3 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{isWorker ? '공정 검사 현황' : '검사 현황 (좌:공정|우:최종)'}</span>
                                <div className="flex gap-2 text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-white border border-gray-300 rounded-full"></span> 미검사</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> 진행중</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-600 rounded-full"></span> 완료</span></div>
                            </div>
                            {renderInspectionMatrix(project)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  ) : (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="inspection-form-container">
        {showPrintToast && <div className="fixed top-5 right-5 bg-slate-800 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce flex items-center gap-3 no-print"><Printer size={24} className="text-blue-400" /><div><p className="font-bold">인쇄 미리보기</p><p className="text-sm text-slate-300">창이 열리지 않으면 <span className="text-yellow-400 font-bold">Ctrl + P</span></p></div></div>}
        <div className="w-full flex justify-between items-start no-print"><button onClick={handleBackToList} className="btn-icon flex items-center gap-2" style={{ paddingLeft: 0, width: 'auto' }}><ArrowLeft size={20} /> 목록으로 돌아가기</button><button type="button" onClick={handlePrint} className="btn btn-outline flex items-center gap-2"><Printer size={18} /> 인쇄</button></div>
        <div className="text-center mt-4 mb-6"><h2 className="text-2xl font-bold text-gray-900">배전반 {activeInspectionType === 'process' ? '공정' : '인수/중간'} 검사 성적서</h2></div>
        <div className="card">
            {localPanelContext && (
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2"><span className="badge badge-indigo">{localPanelContext.project.id}</span><span className="badge badge-gray">{localPanelContext.project.taskNumber}</span></div>
                        <h3 className="font-bold text-2xl text-gray-900">{localPanelContext.project.name}</h3>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="text-gray-500 text-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>기종: {localPanelContext.project.modelType || '-'}</div>
                            <div><span className="font-extrabold text-2xl text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 inline-block shadow-sm">Panel #{localPanelContext.panelId}</span></div>
                        </div>
                    </div>
                </div>
            )}
            <div>
                <h4 className="no-print" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={18} /> 검사 항목</h4>
                {renderPDFForm()}
                {activeInspectionType === 'process' && renderDefectList()}
                <div className="mt-8 pt-6 border-t border-gray-100 no-print">
                    <h4 style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.75rem' }}>종합 판정</h4>
                    <div className="w-full p-4 rounded-lg text-center font-bold text-white shadow-md transition-colors duration-300 flex items-center justify-center gap-2" style={{ backgroundColor: formState.result === 'pass' ? '#16a34a' : '#f97316', height: '60px', fontSize: '1.2rem' }}>
                        {formState.result === 'pass' ? (<><CheckSquare size={24} /> 완료 (Completed)</>) : (<><Info size={24} /> 진행중 (In Progress)</>)}
                    </div>
                    <button type="button" onClick={handleSaveInspection} disabled={isSaving} className="btn btn-primary w-full justify-center no-print" style={{ padding: '0 1rem', marginTop: '1rem', height: '56px', fontSize: '1.1rem' }}><Save size={20} />{isSaving ? '저장 중...' : '검사 완료 저장'}</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InspectionManager;
