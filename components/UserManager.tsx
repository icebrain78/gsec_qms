
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { UserPlus, Search, MoreVertical, Shield, Mail, Lock, Check, X } from 'lucide-react';
import { fetchUsers, addUserToDB, updateUserInDB } from '../services/firestoreService';

interface UserManagerProps {
  initialUsers: User[];
}

const UserManager: React.FC<UserManagerProps> = ({ initialUsers }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const initialFormState: User = {
    name: '',
    id: '',
    role: UserRole.INSPECTOR,
    department: '',
    email: '',
    status: 'active',
    joinedDate: '',
    password: ''
  };

  const [formData, setFormData] = useState<User>(initialFormState);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const dbUsers = await fetchUsers();
      
      if (dbUsers && dbUsers.length > 0) {
        // 중복 제거 로직 강화: ID를 키로 사용하여 중복 제거
        const uniqueUsersMap = new Map();
        dbUsers.forEach(user => {
            // 이미 같은 ID가 있다면 덮어쓰기 (또는 무시)
            uniqueUsersMap.set(user.id, user);
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values()) as User[];
        setUsers(uniqueUsers);
      } else {
        setUsers(initialUsers); 
      }
    } catch (e) {
      console.error("Failed to load users", e);
      setUsers(initialUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ ...initialFormState, role: UserRole.INSPECTOR });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({ ...user, password: '' }); // Don't load existing password
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.id || !formData.name) {
      alert("ID와 이름은 필수입니다.");
      return;
    }

    const userToSave: User = {
      ...formData,
      joinedDate: isEditMode ? formData.joinedDate : new Date().toISOString().split('T')[0]
    };
    
    try {
        if (isEditMode) {
          if (!userToSave.password) {
              const existingUser = users.find(u => u.id === userToSave.id);
              if (existingUser) {
                  userToSave.password = existingUser.password;
              }
          }
          
          await updateUserInDB(userToSave);
          // 상태 업데이트 시에도 중복 방지
          setUsers(prev => prev.map(u => u.id === userToSave.id ? userToSave : u));
          alert("사용자 정보가 수정되었습니다.");
        } else {
          if (users.some(u => u.id === userToSave.id)) {
            alert("이미 존재하는 ID입니다.");
            return;
          }
          await addUserToDB(userToSave); 
          setUsers(prev => [...prev, userToSave]);
          alert("사용자가 등록되었습니다.");
        }
        setShowModal(false);
    } catch (e) {
        console.error(e);
        alert("저장 실패: 데이터베이스 오류");
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus: 'active' | 'inactive' = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser: User = { ...user, status: newStatus };

    try {
      await updateUserInDB(updatedUser);
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (e) {
      alert("상태 변경 실패");
    }
  };

  const handleResetPassword = () => {
    setFormData({ ...formData, password: '1212' });
    alert("비밀번호가 '1212'로 설정되었습니다. 저장 버튼을 눌러 확정하세요.");
  };

  const getRoleBadgeClass = (role: UserRole) => {
      switch (role) {
          case UserRole.ADMIN: return 'badge-purple';
          case UserRole.MANAGER: return 'badge-indigo';
          case UserRole.INSPECTOR: return 'badge-blue';
          default: return 'badge-gray';
      }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
           <h2 className="page-title">사용자 관리</h2>
           <p className="page-subtitle">시스템 접근 권한 및 계정 관리</p>
        </div>
        
        <div className="action-bar">
           <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="이름 또는 ID 검색..." 
              className="input-field"
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            <UserPlus size={18} />
            <span className="hidden md:inline">사용자 등록</span>
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="table-container">
        <div className="table-wrapper table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>사용자 정보</th>
                <th>부서 / 직책</th>
                <th>권한 (Role)</th>
                <th>가입일</th>
                <th>상태</th>
                <th className="text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                  <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>로딩 중...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} style={{ opacity: user.status === 'inactive' ? 0.6 : 1 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar" style={{ backgroundColor: '#dbeafe', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail size={10} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p>{user.department}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {user.id}</p>
                  </td>
                  <td>
                     <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      <Shield size={12} />
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: '#4b5563' }}>{user.joinedDate}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${user.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {user.status === 'active' ? '정상' : '중지'}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleStatusToggle(user)}
                        className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={user.status === 'active' ? "계정 비활성화" : "계정 활성화"}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${user.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="btn-icon" 
                        title="정보 수정"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="modal-title">{isEditMode ? '사용자 정보 수정' : '신규 사용자 등록'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label-text">이름</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-control"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              {/* Password Field Moved Up */}
              <div className="form-group">
                 <label className="label-text">비밀번호 {isEditMode ? '(변경시에만 입력)' : '(필수)'}</label>
                 <div className="relative">
                   <input 
                    type="password" 
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="form-control pl-10"
                    placeholder={isEditMode ? "비밀번호 변경 (미입력시 유지)" : "비밀번호를 입력하세요"}
                   />
                   <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                   <label className="label-text">사번 (ID)</label>
                   <input 
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    className={`form-control ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={isEditMode}
                    placeholder="예: QM-001"
                   />
                </div>
                <div className="form-group">
                   <label className="label-text">부서</label>
                   <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="form-control"
                    placeholder="예: 품질관리팀"
                   />
                </div>
              </div>

              <div className="form-group">
                <label className="label-text">이메일</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="label-text">권한</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="form-control"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {isEditMode && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Shield size={16} /> 비밀번호 관리
                    </div>
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors font-bold text-slate-600"
                    >
                      비밀번호 초기화 (1212)
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    * 초기화 시 비밀번호는 '1212'로 설정됩니다.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-outline flex-1 justify-center"
              >
                취소
              </button>
              <button 
                onClick={handleSaveUser}
                className="btn btn-primary flex-1 justify-center"
              >
                <Check size={18} />
                {isEditMode ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
