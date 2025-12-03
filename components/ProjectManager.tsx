
import React, { useState, useMemo } from 'react';
import { Project, Inspection, UserRole } from '../types';
import { QrCode, Plus, Search, X, Grid, Edit2, ChevronDown, Calendar, Box, Wrench, AlertCircle, MoreVertical } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  inspections: Inspection[]; // 검사 이력 데이터
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onUpdateProjectInfo: (oldId: string, newId: string, newName: string) => void;
  onSelectPanel: (project: Project, panelIndex: number) => void;
  userRole: UserRole; // Added to control read-only access
}

const MODEL_OPTIONS = ['LV SWGR', 'MV SWGR (15kV)', 'MV SWGR (38kV)', 'Junction', 'Control Panel', 'HV SWGR'];

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, inspections, onAddProject, onUpdateProject, onUpdateProjectInfo, onSelectPanel, userRole }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddTaskMode, setIsAddTaskMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProjectInfoEditMode, setIsProjectInfoEditMode] = useState(false);
  
  const [originalId, setOriginalId] = useState('');

  const [editingStatusProject, setEditingStatusProject] = useState<Project | null>(null);
  
  // Model Selector State
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelSelectionTarget, setModelSelectionTarget] = useState<{ type: 'form' } | { type: 'direct', project: Project }>({ type: 'form' });

  // Worker role is read-only for project management
  const isReadOnly = userRole === UserRole.WORKER;

  const initialFormState: Partial<Project> = {
    name: '',
    id: '',
    client: '', // Added
    taskNumber: '',
    panelCount: 1,
    color: '',
    spec: '',
    modelType: '',
    deadline: '',
    remarks: '',
    status: 'planning',
    startDate: new Date().toISOString().split('T')[0]
  };
  
  const [newProject, setNewProject] = useState<Partial<Project>>(initialFormState);

  const groupedProjects = useMemo<Record<string, Project[]>>(() => {
    const filtered = projects.filter(p => 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.name.includes(searchTerm)
    );
    const groups: Record<string, Project[]> = {};
    filtered.forEach(project => {
      if (!groups[project.id]) {
        groups[project.id] = [];
      }
      groups[project.id].push(project);
    });
    return groups;
  }, [projects, searchTerm]);

  const handlePrintQR = (project: Project) => {
    const qrUrl = `${window.location.origin}${window.location.pathname}?project=${project.id}&task=${project.taskNumber}&panel=1`;
    alert(`QR 코드 링크 생성됨:\n${qrUrl}\n(실제 구현 시 이 링크를 담은 QR 이미지 출력)`);
  };

  const handleOpenNewProjectModal = () => {
    if (isReadOnly) return;
    setNewProject(initialFormState);
    setIsAddTaskMode(false);
    setIsEditMode(false);
    setIsProjectInfoEditMode(false);
    setShowAddModal(true);
  };

  const handleAddTaskToExisting = (project: Project) => {
    if (isReadOnly) return;
    setNewProject({
        ...project,
        taskNumber: '',
        panelCount: 1,
        deadline: project.deadline || '',
        modelType: project.modelType || '',
        remarks: project.remarks || '',
    });
    setIsAddTaskMode(true);
    setIsEditMode(false);
    setIsProjectInfoEditMode(false);
    setShowAddModal(true);
  };

  const handleEditTask = (project: Project) => {
    if (isReadOnly) return;
    setNewProject({ ...project });
    setIsEditMode(true);
    setIsAddTaskMode(false);
    setIsProjectInfoEditMode(false);
    setShowAddModal(true);
  };

  const handleEditProjectInfo = (project: Project) => {
    if (isReadOnly) return;
    setNewProject({ ...project });
    setOriginalId(project.id);
    setIsProjectInfoEditMode(true);
    setIsEditMode(false);
    setIsAddTaskMode(false);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (newProject.id && newProject.name) {
        if (isProjectInfoEditMode) {
            if (originalId && newProject.id && newProject.name) {
                onUpdateProjectInfo(originalId, newProject.id, newProject.name);
            }
        } else if (isEditMode) {
            onUpdateProject(newProject as Project);
        } else {
            onAddProject(newProject as Project);
        }
        setShowAddModal(false);
        setNewProject(initialFormState);
    } else {
        alert('제번과 프로젝트명은 필수 입력입니다.');
    }
  };

  const handleStatusChange = (status: 'planning' | 'production' | 'completed') => {
    if (isReadOnly) return;
    if (editingStatusProject) {
        onUpdateProject({ ...editingStatusProject, status });
        setEditingStatusProject(null);
    }
  };

  const handleOpenModelSelectorForForm = () => {
    if (isReadOnly) return;
    setModelSelectionTarget({ type: 'form' });
    setShowModelSelector(true);
  };

  const handleOpenModelSelectorForDirect = (project: Project) => {
    if (isReadOnly) return;
    setModelSelectionTarget({ type: 'direct', project });
    setShowModelSelector(true);
  };

  const handleModelSelect = (selectedModel: string) => {
    if (modelSelectionTarget.type === 'form') {
        setNewProject({ ...newProject, modelType: selectedModel });
    } else {
        onUpdateProject({ ...modelSelectionTarget.project, modelType: selectedModel });
    }
    setShowModelSelector(false);
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'planning': return '계획';
          case 'production': return '진행';
          case 'completed': return '완료';
          default: return status;
      }
  };

  const getModelButtonColor = (model: string) => {
    switch (model) {
      case 'LV SWGR': return '#2563eb'; // Blue 600
      case 'MV SWGR (15kV)': return '#059669'; // Emerald 600
      case 'MV SWGR (38kV)': return '#ea580c'; // Orange 600
      case 'Junction': return '#374151'; // Gray 700
      case 'Control Panel': return '#16a34a'; // Green 600
      case 'HV SWGR': return '#9333ea'; // Purple 600
      default: return '#4b5563';
    }
  };
  
  const getModelBoxClass = (model: string) => {
      switch (model) {
        case 'LV SWGR': return 'bg-blue-600';
        case 'MV SWGR (15kV)': return 'bg-emerald-600';
        case 'MV SWGR (38kV)': return 'bg-orange-600';
        case 'HV SWGR': return 'bg-purple-600';
        default: return 'bg-slate-600';
      }
  };

  // Helper: Get Panel Button Style based on Inspection Status
  const getPanelStatusStyle = (project: Project, panelNum: number) => {
      const inspection = inspections.find(i => 
          i.projectId === project.id && 
          i.taskNumber === project.taskNumber && 
          i.panelId === panelNum
      );

      const baseStyle: React.CSSProperties = {
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      };

      if (!inspection) {
          // No inspection: White
          return { 
              ...baseStyle, 
              backgroundColor: '#ffffff', 
              color: '#374151', 
              border: '1px solid #cbd5e1' // Gray 300
          };
      }

      if (inspection.result === 'fail') {
          return { ...baseStyle, backgroundColor: '#dc2626', color: 'white', border: '1px solid #dc2626' }; // Red
      }

      // Check if all checked (status === 'OK' or 'N/A')
      const isAllChecked = inspection.checkList && inspection.checkList.length > 0 && inspection.checkList.every(item => item.status === 'OK' || item.status === 'N/A' || item.checked === true);

      if (isAllChecked && inspection.result === 'pass') {
          return { ...baseStyle, backgroundColor: '#16a34a', color: 'white', border: '1px solid #16a34a' }; // Green
      } else {
          // In Progress (Orange)
          return { ...baseStyle, backgroundColor: '#f97316', color: 'white', border: '1px solid #f97316' }; // Orange
      }
  };
  
  const getModalTitle = () => {
      if (isProjectInfoEditMode) return '프로젝트 기본 정보 수정';
      if (isEditMode) return 'Task 상세 정보 수정';
      if (isAddTaskMode) return '기존 프로젝트에 Task 추가';
      return '신규 프로젝트 등록';
  };

  // Inline styles for solid buttons (Unified Block Style - 44px Height)
  const blockBtnStyle: React.CSSProperties = {
      height: '44px',
      borderRadius: '8px', // Rounded-lg
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '0.875rem',
      width: '100%',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      border: 'none',
      textAlign: 'center',
      padding: '0 0.75rem'
  };

  return (
    <div className="flex-col flex gap-4">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">프로젝트 관리</h2>
        <div className="action-bar">
           <div className="search-wrapper flex-1 sm:flex-none">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제번 또는 프로젝트명 검색..." 
              className="input-field"
            />
          </div>
          {!isReadOnly && (
            <button 
                onClick={handleOpenNewProjectModal}
                className="btn btn-primary whitespace-nowrap"
            >
                <Plus size={18} />
                <span>신규 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* --- DESKTOP LIST VIEW (TABLE) --- */}
      <div className="table-container desktop-only">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>제번</th>
                <th style={{ width: '18%' }}>프로젝트명</th>
                <th style={{ width: '10%' }}>TASK</th>
                <th style={{ width: '12%' }}>기종</th>
                <th style={{ width: '10%' }}>단가(납기)</th>
                <th style={{ width: '8%' }}>수량</th>
                <th style={{ width: '8%' }}>상태</th>
                <th style={{ width: '8%' }}>QR</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(groupedProjects) as [string, Project[]][]).map(([id, group]) => (
                <React.Fragment key={id}>
                  {group.map((project, index) => (
                    <tr key={`${project.id}-${project.taskNumber}`}>
                      {index === 0 && (
                        <>
                          <td rowSpan={group.length} className="border-r border-gray-100 align-middle">
                            <button 
                                onClick={() => !isReadOnly && handleEditProjectInfo(project)}
                                disabled={isReadOnly}
                                style={{ ...blockBtnStyle, backgroundColor: '#1e293b', color: 'white', width: 'auto', padding: '0 1rem', margin: '0 auto', cursor: isReadOnly ? 'default' : 'pointer' }}
                            >
                                {project.id} {!isReadOnly && <Edit2 size={12} className="ml-1" />}
                            </button>
                          </td>
                          <td rowSpan={group.length} className="font-medium text-gray-900 border-r border-gray-100 align-middle">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span>{project.name}</span>
                                    {project.client && <span className="text-xs text-gray-400 font-normal">{project.client}</span>}
                                </div>
                                {!isReadOnly && (
                                    <button onClick={() => handleAddTaskToExisting(project)} className="text-gray-400 hover:text-blue-600" title="Task 추가">
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                          </td>
                        </>
                      )}
                      
                      {/* Task Column */}
                      <td className="align-middle">
                          <button 
                            onClick={() => !isReadOnly && handleEditTask(project)}
                            disabled={isReadOnly}
                            style={{ ...blockBtnStyle, backgroundColor: '#475569', color: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                          >
                              <Box size={14} className="mr-1" />
                              {project.taskNumber}
                              {!isReadOnly && <Edit2 size={12} className="ml-1 opacity-50" />}
                          </button>
                      </td>

                      {/* Model Column */}
                      <td className="align-middle">
                          <button 
                            onClick={() => !isReadOnly && handleOpenModelSelectorForDirect(project)}
                            disabled={isReadOnly}
                            style={{ ...blockBtnStyle, backgroundColor: project.modelType ? getModelButtonColor(project.modelType) : '#94a3b8', color: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                          >
                            {project.modelType || '선택'}
                          </button>
                      </td>

                      {/* Deadline */}
                      <td className="text-center text-gray-600 align-middle font-medium">
                          {project.deadline || '-'}
                      </td>

                      {/* Quantity Column */}
                      <td className="align-middle">
                          <button 
                            style={{ 
                                ...blockBtnStyle, 
                                backgroundColor: '#1e293b',
                                color: 'white',
                                flexDirection: 'column', 
                                gap: '0', 
                                lineHeight: '1' 
                            }}
                            onClick={() => setSelectedProject(project)}
                          >
                              <span style={{ fontSize: '1.1rem' }}>{project.panelCount}</span>
                              <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>EA</span>
                          </button>
                      </td>

                      {/* Status Column */}
                      <td className="align-middle">
                        <button
                            onClick={() => !isReadOnly && setEditingStatusProject(project)}
                            disabled={isReadOnly}
                            style={{ 
                                ...blockBtnStyle,
                                backgroundColor: project.status === 'planning' ? '#ffedd5' : project.status === 'production' ? '#e0f2fe' : '#dcfce7',
                                color: project.status === 'planning' ? '#c2410c' : project.status === 'production' ? '#0369a1' : '#15803d',
                                border: `1px solid ${project.status === 'planning' ? '#fdba74' : project.status === 'production' ? '#7dd3fc' : '#86efac'}`,
                                cursor: isReadOnly ? 'default' : 'pointer'
                            }}
                        >
                            {getStatusLabel(project.status)}
                        </button>
                      </td>

                      {/* QR Column */}
                      <td className="align-middle">
                        <button 
                            onClick={() => handlePrintQR(project)} 
                            style={{ ...blockBtnStyle, backgroundColor: '#334155', color: 'white' }}
                        >
                          <QrCode size={18} />
                        </button>
                      </td>

                      {/* Remarks */}
                      <td className="text-gray-500 text-sm truncate max-w-[150px] align-middle" title={project.remarks}>
                        {project.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="mobile-only">
         {(Object.entries(groupedProjects) as [string, Project[]][]).map(([projectId, group]) => (
            <div key={projectId} className="mobile-project-card">
                <div className="mobile-card-header">
                     <div className="flex items-center gap-3">
                         <span className="mobile-id-tag">{projectId}</span>
                         {!isReadOnly && (
                             <button onClick={() => handleEditProjectInfo(group[0])} className="text-gray-400 hover:text-white">
                                 <Edit2 size={16} />
                             </button>
                         )}
                     </div>
                     {!isReadOnly && (
                        <button 
                            onClick={() => handleAddTaskToExisting(group[0])}
                            className="bg-blue-600 text-white font-bold py-1 px-3 rounded-full text-sm shadow-md flex items-center gap-1 border border-blue-400"
                        >
                            <Plus size={14} /> Task
                        </button>
                     )}
                </div>
                <h3 className="text-xl font-bold text-white px-4 pb-4">
                    {group[0].name}
                    {group[0].client && <span className="block text-sm font-normal text-gray-300 mt-1">{group[0].client}</span>}
                </h3>

                <div className="p-4 bg-gray-50">
                    {group.map((project, index) => (
                        <div key={`${project.taskNumber}-${index}`} className="mobile-task-card">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                                         <Box size={18} />
                                    </div>
                                    <span className="text-lg font-bold text-gray-700">{project.taskNumber}</span>
                                    {!isReadOnly && (
                                        <button onClick={() => handleEditTask(project)} className="text-gray-300 hover:text-blue-600">
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => !isReadOnly && setEditingStatusProject(project)}
                                        disabled={isReadOnly}
                                        className="shadow-sm"
                                        style={{ 
                                            backgroundColor: 'transparent',
                                            color: '#6b7280',
                                            border: 'none',
                                            padding: 0,
                                            cursor: isReadOnly ? 'default' : 'pointer'
                                        }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    <button onClick={() => handlePrintQR(project)} className="p-1.5 bg-gray-800 rounded-lg text-white">
                                        <QrCode size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <button 
                                    onClick={() => !isReadOnly && handleOpenModelSelectorForDirect(project)}
                                    disabled={isReadOnly}
                                    className={`p-3 rounded-lg flex flex-col justify-start text-white shadow-sm border-none ${getModelBoxClass(project.modelType || '')}`}
                                    style={{ height: 'auto', minHeight: '50px', textAlign: 'left', cursor: isReadOnly ? 'default' : 'pointer' }}
                                >
                                    <div className="flex items-center gap-1 text-[10px] opacity-90 mb-1">
                                        <Wrench size={10} /> 기종 (Model)
                                    </div>
                                    <div className="text-sm font-extrabold leading-tight truncate w-full">
                                         {project.modelType || '선택 필요'}
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setSelectedProject(project)} 
                                    className="p-3 rounded-lg flex flex-col justify-start text-white shadow-sm cursor-pointer active:opacity-80 bg-violet-600 border-none"
                                    style={{ height: 'auto', minHeight: '50px', textAlign: 'left' }}
                                >
                                     <div className="flex items-center gap-1 text-[10px] opacity-90 mb-1">
                                        <Grid size={10} /> 수량 (Panel)
                                     </div>
                                     <div className="text-lg font-extrabold leading-tight">
                                         {project.panelCount} <span className="text-xs font-normal">EA</span>
                                     </div>
                                </button>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} />
                                    <span>{project.deadline || '-'}</span>
                                </div>
                                {project.remarks && (
                                    <div className="mobile-v3-remark-badge">
                                        <AlertCircle size={12} className="text-green-600" />
                                        <span>{project.remarks}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         ))}
      </div>

      {/* --- MODALS --- */}
      
      {/* Panel Grid Modal */}
      {selectedProject && !showAddModal && !showModelSelector && !editingStatusProject && (
          <div className="modal-backdrop" style={{ zIndex: 10000 }}>
              <div className="modal-panel" style={{ maxWidth: '800px', width: '90%' }}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">판넬 선택</h3>
                      <button onClick={() => setSelectedProject(null)} className="btn-icon"><X size={24} /></button>
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">{selectedProject.name} ({selectedProject.taskNumber})</p>
                  
                  <div className="responsive-modal-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                      {Array.from({ length: selectedProject.panelCount }).map((_, i) => {
                          const panelNum = i + 1;
                          const style = getPanelStatusStyle(selectedProject, panelNum);
                          return (
                              <button
                                  key={panelNum}
                                  onClick={() => {
                                      onSelectPanel(selectedProject, panelNum);
                                      setSelectedProject(null);
                                  }}
                                  style={{
                                      ...style,
                                      width: '100%', 
                                      aspectRatio: '1/1',
                                      height: 'auto',
                                      fontSize: '1.25rem',
                                      borderRadius: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                              >
                                  {panelNum}
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* Status Modal */}
      {editingStatusProject && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
            <div className="modal-panel" style={{ width: '90%', maxWidth: '600px', backgroundColor: 'white', borderRadius: '12px', padding: '24px' }}>
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold" style={{ fontSize: '1.25rem' }}>진행 상태 변경</h3>
                    <button onClick={() => setEditingStatusProject(null)} className="btn-icon"><X size={24} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {['planning', 'production', 'completed'].map((status) => (
                        <button 
                            key={status} 
                            onClick={() => handleStatusChange(status as any)}
                            style={{
                                backgroundColor: status === 'planning' ? '#f97316' : status === 'production' ? '#0ea5e9' : '#16a34a',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                height: '80px',
                                border: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                textAlign: 'center'
                            }}
                            className="hover:scale-105"
                        >
                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{getStatusLabel(status)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Model Selection Modal */}
      {showModelSelector && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>기종 선택</h3>
                    <button onClick={() => setShowModelSelector(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><X size={24} color="#6b7280" /></button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div className="responsive-modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {MODEL_OPTIONS.map((option) => (
                            <button key={option} onClick={() => handleModelSelect(option)} style={{ backgroundColor: getModelButtonColor(option), color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.2', height: '48px' }}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
            <div className="modal-panel" style={{ maxWidth: '600px' }}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">{getModalTitle()}</h3>
                    <button onClick={() => setShowAddModal(false)} className="btn-icon"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* ... Form Content ... */}
                    {isEditMode && (
                        <div className="mb-2 p-3 bg-gray-100 rounded text-sm text-gray-700 border border-gray-200">
                            <span className="block text-xs text-gray-500 mb-1">수정 대상 (기본 정보)</span>
                            <div className="font-bold text-lg">{newProject.id} - {newProject.taskNumber}</div>
                            <div>{newProject.name}</div>
                        </div>
                    )}
                    {!isEditMode && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label className="input-label">제번 (ID)</label>
                                    <input type="text" required readOnly={isAddTaskMode} value={newProject.id} onChange={(e) => setNewProject({...newProject, id: e.target.value})} placeholder="예: 4152221" className={`input-dark w-full rounded border ${isAddTaskMode ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                </div>
                                {!isProjectInfoEditMode && (
                                    <div className="input-group">
                                        <label className="input-label">Task 번호</label>
                                        <input type="text" autoFocus={!isAddTaskMode} required value={newProject.taskNumber} onChange={(e) => setNewProject({...newProject, taskNumber: e.target.value})} placeholder="예: T111" className="input-dark w-full rounded border" />
                                    </div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">프로젝트명</label>
                                <input type="text" required readOnly={isAddTaskMode} value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className={`input-dark w-full rounded border ${isAddTaskMode ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </div>
                            
                            <div className="input-group">
                                <label className="input-label">고객사 (Client)</label>
                                <input type="text" value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} placeholder="예: LG에너지솔루션" className="input-dark w-full rounded border" />
                            </div>
                            
                            {!isProjectInfoEditMode && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">도장 색상</label>
                                        <input type="text" readOnly={isAddTaskMode} value={newProject.color} onChange={(e) => setNewProject({...newProject, color: e.target.value})} className={`input-dark w-full rounded border ${isAddTaskMode ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">규격</label>
                                        <input type="text" readOnly={isAddTaskMode} value={newProject.spec} onChange={(e) => setNewProject({...newProject, spec: e.target.value})} className={`input-dark w-full rounded border ${isAddTaskMode ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {!isProjectInfoEditMode && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label className="input-label">기종 (Model)</label>
                                    <div onClick={handleOpenModelSelectorForForm} className="input-dark w-full rounded border flex items-center cursor-pointer hover:border-blue-500 justify-between">
                                        <span className={newProject.modelType ? 'text-white' : 'text-gray-400'}>{newProject.modelType || '기종 선택'}</span>
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">납기 (Deadline)</label>
                                    <input type="date" value={newProject.deadline} onChange={(e) => setNewProject({...newProject, deadline: e.target.value})} className="input-dark w-full rounded border" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">판넬 수량</label>
                                <input type="number" min="1" value={newProject.panelCount} onChange={(e) => setNewProject({...newProject, panelCount: parseInt(e.target.value) || 0})} className="input-dark w-full rounded border" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">비고 (Remarks)</label>
                                <textarea rows={3} value={newProject.remarks} onChange={(e) => setNewProject({...newProject, remarks: e.target.value})} className="input-dark w-full rounded border" style={{ height: 'auto', paddingTop: '0.5rem' }} />
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-600">
                        <button type="button" onClick={() => setShowAddModal(false)} className="btn bg-gray-600 text-white hover:bg-gray-500 flex-1">취소</button>
                        <button type="submit" className="btn btn-primary flex-1">{isEditMode ? '수정 내용 저장' : isProjectInfoEditMode ? '정보 수정 완료' : isAddTaskMode ? '저장 (Task 추가)' : '등록'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
