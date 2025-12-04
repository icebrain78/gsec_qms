
import { Project, Inspection, Defect, Claim, KPIData, User, UserRole } from '../types';

export const mockProjects: Project[] = [
  // Grouping Test Data (Battery Factory)
  { 
    id: '4152221', name: '배터리공장', client: 'LG에너지솔루션', taskNumber: 'T111', panelCount: 10, color: '5Y 7/1', spec: 'Standard', 
    modelType: 'LV SWGR', deadline: '2024-12-31', remarks: '긴급 제작 요망',
    status: 'planning', startDate: '2024-06-01' 
  },
  { 
    id: '4152221', name: '배터리공장', client: 'LG에너지솔루션', taskNumber: 'T112', panelCount: 24, color: '5Y 7/1', spec: 'Standard', 
    modelType: 'LV SWGR', deadline: '2024-12-31', remarks: '',
    status: 'planning', startDate: '2024-06-01' 
  },
  { 
    id: '4152221', name: '배터리공장', client: 'LG에너지솔루션', taskNumber: 'T203', panelCount: 51, color: '5Y 7/1', spec: 'Standard', 
    modelType: 'MV SWGR (15kV)', deadline: '2025-01-15', remarks: 'CT 사양 확인 필요',
    status: 'planning', startDate: '2024-06-01' 
  },
  
  // Existing Data
  { 
    id: 'P24-001', name: 'A사 배전반 증설', client: 'A사', taskNumber: 'T-101', panelCount: 5, color: '5Y 7/1', spec: 'M12, M10', 
    modelType: 'Junction', deadline: '2024-08-20', remarks: '',
    status: 'production', startDate: '2024-05-01' 
  },
  { 
    id: 'P24-002', name: 'B공장 메인 판넬', client: 'B공장', taskNumber: 'T-102', panelCount: 2, color: 'N7.0', spec: 'M8', 
    modelType: 'Control Panel', deadline: '2024-09-01', remarks: '도어 두께 변경',
    status: 'planning', startDate: '2024-05-10' 
  },
  { 
    id: 'P24-003', name: 'C빌딩 분전반', client: 'C건설', taskNumber: 'T-103', panelCount: 10, color: '5Y 7/1', spec: 'Standard', 
    modelType: 'HV SWGR', deadline: '2024-06-30', remarks: '',
    status: 'completed', startDate: '2024-04-15' 
  },
];

export const mockInspections: Inspection[] = [
  { 
    id: 'INS-001', projectId: 'P24-001', taskNumber: 'T-101', panelId: 1, type: 'process', result: 'pass', inspector: '김철수', date: '2024-05-12',
    checkList: [{ item: '외관 상태', status: 'OK' }, { item: '치수 확인', status: 'OK' }] 
  },
  { 
    id: 'INS-002', projectId: 'P24-001', taskNumber: 'T-101', panelId: 2, type: 'final', result: 'fail', inspector: '이영희', date: '2024-05-14',
    checkList: [{ item: '절연 저항', status: 'OK' }, { item: '도장 상태', status: 'NG' }] 
  },
  { 
    id: 'INS-003', projectId: 'P24-003', taskNumber: 'T-103', panelId: 1, type: 'receiving', result: 'pass', inspector: '박자재', date: '2024-04-16',
    checkList: [{ item: '수량 확인', status: 'OK' }, { item: '파손 여부', status: 'OK' }] 
  },
];

export const mockDefects: Defect[] = [
  { id: 'DEF-001', projectId: 'P24-001', type: '도장 불량', cause: '이물질 흡착', action: '재도장', status: 'resolved', date: '2024-05-14' },
  { id: 'DEF-002', projectId: 'P24-002', type: '치수 오차', cause: '절곡 오류', action: '재제작 대기', status: 'open', date: '2024-05-15' },
];

export const mockClaims: Claim[] = [
  { id: 'CLM-001', customerName: 'A사', description: '도어 개폐 소음', date: '2024-05-20', status: 'analyzing' },
];

export const mockKPI: KPIData = {
  defectRate: 1500, // PPM
  reworkRate: 2.5, // %
  deliveryCompliance: 98, // %
  claimCount: 1
};

export const mockUsers: User[] = [
  { id: 'admin', name: '관리자', role: UserRole.ADMIN, department: '경영지원팀', email: 'admin@qms.com', status: 'active', joinedDate: '2023-01-01' },
  { id: 'QM-001', name: '김철수', role: UserRole.INSPECTOR, department: '품질경영부', email: 'cs.kim@company.com', status: 'active', joinedDate: '2023-03-15' },
  { id: 'PROD-001', name: '이영희', role: UserRole.MANAGER, department: '생산부', email: 'yh.lee@company.com', status: 'active', joinedDate: '2023-04-01' },
  { id: 'PL-001', name: '이책임', role: UserRole.PRODUCTION_LEADER, department: '생산부', email: 'pl@company.com', status: 'active', joinedDate: '2023-04-05' },
  { id: 'WORK-001', name: '박작업', role: UserRole.WORKER, department: '생산팀', email: 'worker@company.com', status: 'active', joinedDate: '2023-06-01' },
  { id: 'CUST-001', name: '고객담당자', role: UserRole.CUSTOMER, department: 'LG에너지솔루션', email: 'cust@client.com', status: 'active', joinedDate: '2023-07-01' },
];
