
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardCheck, AlertTriangle, Layers, Menu, X, User as UserIcon, Users, LogOut, ClipboardList, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectManager from './components/ProjectManager';
import InspectionManager from './components/InspectionManager';
import UserManager from './components/UserManager';
import Login from './components/Login';
import { mockKPI, mockInspections, mockUsers } from './services/mockData';
import { fetchProjects, addProjectToDB, updateProjectInDB, updateProjectBatchInDB, fetchInspections, addInspectionToDB } from './services/firestoreService';
import { Project, Inspection, User, UserRole } from './types';

// Tab Definition Updated: Merged inspection tabs
type Tab = 'dashboard' | 'projects' | 'inspection' | 'inspection-settings' | 'defects' | 'users';

const App: React.FC = () => {
  // User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Main App State
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected Panel Context for Inspection
  const [selectedPanelContext, setSelectedPanelContext] = useState<{ project: Project; panelId: number } | null>(null);

  // Check for persisted login (Simple localStorage implementation)
  useEffect(() => {
      const savedUser = localStorage.getItem('qms_user');
      if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
      }
  }, []);

  // Load Data ONLY when authenticated
  useEffect(() => {
    if (currentUser) {
        const loadData = async () => {
            setIsLoading(true);
            try {
              const [dbProjects, dbInspections] = await Promise.all([
                fetchProjects(),
                fetchInspections()
              ]);
              setProjects(dbProjects);
              setInspections(dbInspections);
            } catch (e) {
              console.error("데이터 로드 실패:", e);
            }
            setIsLoading(false);
        };
        loadData();
    }
  }, [currentUser]);

  // Filter Projects for Customer
  const filteredProjects = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === UserRole.CUSTOMER) {
          return projects.filter(p => p.client === currentUser.department);
      }
      return projects;
  }, [projects, currentUser]);

  // Deep Linking Logic
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const pId = params.get('project');
      const tId = params.get('task');
      const panel = params.get('panel');

      if (pId && tId && panel) {
        const targetProject = projects.find(p => p.id === pId && p.taskNumber === tId);
        if (targetProject) {
          console.log("Deep link detected:", pId, tId, panel);
          setSelectedPanelContext({ project: targetProject, panelId: Number(panel) });
          setActiveTab('inspection');
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [projects, currentUser]);

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('qms_user', JSON.stringify(user));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('qms_user');
      setActiveTab('dashboard');
  };

  const handleAddProject = async (newProject: Project) => {
    try {
        setProjects((prev) => [newProject, ...prev]);
        await addProjectToDB(newProject);
    } catch (e: any) {
        console.error(e);
        alert(`DB 저장 실패: ${e.message || "알 수 없는 오류"}`);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
        setProjects((prev) => prev.map(p => 
        (p.id === updatedProject.id && p.taskNumber === updatedProject.taskNumber) 
            ? updatedProject 
            : p
        ));
        await updateProjectInDB(updatedProject);
    } catch (e: any) {
        console.error(e);
        alert(`DB 업데이트 실패: ${e.message || "알 수 없는 오류"}`);
    }
  };

  const handleUpdateProjectInfo = async (oldId: string, newId: string, newName: string) => {
    try {
        setProjects((prev) => prev.map(p => {
            if (p.id === oldId) {
                return { ...p, id: newId, name: newName };
            }
            return p;
        }));
        await updateProjectBatchInDB(oldId, newId, newName);
    } catch (e: any) {
        console.error(e);
        alert(`프로젝트 일괄 수정 실패: ${e.message}`);
    }
  };

  const handleSelectPanel = (project: Project, panelIndex: number) => {
    setSelectedPanelContext({ project, panelId: panelIndex });
    setActiveTab('inspection');
  };

  const handleAddInspection = async (newInspection: Inspection) => {
    try {
      await addInspectionToDB(newInspection);
      setInspections(prev => {
        const index = prev.findIndex(i => 
          i.projectId === newInspection.projectId && 
          i.taskNumber === newInspection.taskNumber && 
          i.panelId === newInspection.panelId && 
          i.type === newInspection.type // Ensure type matches (process vs final)
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = newInspection;
          return updated;
        } else {
          return [...prev, newInspection];
        }
      });
    } catch (e: any) {
      console.error("Failed to add inspection", e);
      if (e.code === 'permission-denied') {
        alert("저장 권한이 없습니다. Firebase Console 규칙을 확인해주세요.");
      } else {
        alert(`검사 결과 DB 저장 실패: ${e.message}`);
      }
      throw e;
    }
  };

  const handleTabChange = (tab: Tab) => {
      setActiveTab(tab);
      setMobileMenuOpen(false);
      if (tab !== 'inspection') {
          setSelectedPanelContext(null);
      }
  };

  // Menu items definition based on Role
  const navItems = useMemo(() => {
      if (!currentUser) return [];
      
      const role = currentUser.role;
      const items: { id: Tab; label: string; icon: React.ElementType }[] = [];

      // 1. Dashboard (Everyone)
      items.push({ id: 'dashboard', label: '대시보드', icon: LayoutDashboard });

      // Customer sees ONLY Dashboard
      if (role === UserRole.CUSTOMER) {
          return items; 
      }

      // 2. Project Management (Everyone except Customer)
      items.push({ id: 'projects', label: '프로젝트 관리', icon: Layers });

      // 3. Inspection Management (Merged)
      items.push({ id: 'inspection', label: '검사 관리', icon: ClipboardCheck });

      // 4. Inspection Settings (Admin/Manager/Inspector Only)
      if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSPECTOR].includes(role)) {
          items.push({ id: 'inspection-settings', label: '검사 항목 관리', icon: Settings });
      }

      // 5. Defects (Everyone except Customer)
      items.push({ id: 'defects', label: '불량/클레임', icon: AlertTriangle });

      // 6. User Management (Only Admin)
      if (role === UserRole.ADMIN) {
           items.push({ id: 'users', label: '사용자 관리', icon: Users });
      }
      
      return items;
  }, [currentUser]);

  const renderContent = () => {
    if (!currentUser) return null;

    // Guard for Customer Accessing other tabs
    if (currentUser.role === UserRole.CUSTOMER && activeTab !== 'dashboard') {
        return <div className="p-8">권한이 없습니다.</div>;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard kpi={mockKPI} />;
      case 'projects': return (
          <ProjectManager 
            projects={filteredProjects} 
            inspections={inspections}
            onAddProject={handleAddProject} 
            onUpdateProject={handleUpdateProject} 
            onUpdateProjectInfo={handleUpdateProjectInfo}
            onSelectPanel={handleSelectPanel}
            userRole={currentUser.role} 
          />
      );
      case 'inspection': return (
        <InspectionManager 
            inspections={inspections} 
            projects={filteredProjects} 
            selectedPanelContext={selectedPanelContext}
            onClearContext={() => setSelectedPanelContext(null)}
            onAddInspection={handleAddInspection}
            currentUser={currentUser}
            isSettingsMode={false}
        />
      );
      case 'inspection-settings': return (
          <InspectionManager 
            inspections={inspections} 
            projects={filteredProjects} 
            selectedPanelContext={null}
            onClearContext={() => {}}
            onAddInspection={async () => {}}
            currentUser={currentUser}
            isSettingsMode={true}
        />
      );
      case 'defects': return <div className="p-8 text-center text-gray-500">준비 중입니다.</div>;
      case 'users': return <UserManager initialUsers={mockUsers} />;
      default: return <Dashboard kpi={mockKPI} />;
    }
  };

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="layout-container">
      <aside className={`layout-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="text-white">QMS System</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="flex items-center justify-between">
            <div className="user-profile">
                <div className="avatar-circle">{currentUser.name[0]}</div>
                <div>
                <div className="text-sm font-bold text-white">{currentUser.name}</div>
                <div className="text-xs text-gray-400">{currentUser.department} ({currentUser.role})</div>
                </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2" title="로그아웃">
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>
      <div className="layout-main">
        <header className="layout-header">
          <div className="font-bold text-lg text-blue-900 flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs">Q</div>
            QMS
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="btn-icon">
            <Menu size={24} />
          </button>
        </header>
        <main className="layout-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
