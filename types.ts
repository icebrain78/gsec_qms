
// User Roles
export enum UserRole {
  ADMIN = '최고관리자',
  MANAGER = '현장관리자',
  INSPECTOR = '검사자',
  WORKER = '작업자',
  CUSTOMER = '고객',
  PRODUCTION_LEADER = '생산책임자' // Added
}

// User (User Management)
export interface User {
  id: string; // 사번 or ID
  name: string;
  role: UserRole;
  department: string; // 고객일 경우 회사명으로 사용
  email: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  password?: string; // 비밀번호 필드 추가 (Optional)
}

// Project (Project Table)
export interface Project {
  id: string; // 제번
  name: string; // 프로젝트명
  client?: string; // 고객사 (Added)
  taskNumber: string; // Task 번호
  panelCount: number; // 판넬수량
  color: string; // 도장색상
  spec: string; // 볼트규격 등
  
  // New Fields
  modelType?: string; // 기종
  deadline?: string; // 납기
  remarks?: string; // 비고

  status: 'planning' | 'production' | 'completed';
  startDate: string;
}

// Inspection Checklist Item Structure
export interface InspectionChecklistItem {
  item: string; // 검사 내용
  criteria?: string; // 검사 기준 (For PDF Form)
  category?: string; // 1Level (For PDF Form)
  subCategory?: string; // 2Level (For PDF Form)
  
  status: 'OK' | 'NG' | 'N/A' | 'pending'; // 결과 (기존 checked 대체)
  value?: string; // 측정값 (Optional)
  
  inspector?: string; // 작업자 (1차 검사자)
  inspectionDate?: string; // 검사일
  
  // QC Confirmation (2차 검사자)
  qcInspector?: string; // 최종 확인자
  qcDate?: string;      // 확인일
  
  // Legacy support for simple checklist
  checked?: boolean; 
}

// Defect Item for Inspection Form (New)
export interface InspectionDefect {
  id: string;
  category: 'enclosure' | 'system'; // Added: 외함/시스템 구분
  content: string;      // 불량내용
  date: string;         // 작성일
  writer: string;       // 작성자
  
  // 1단계: 작업자 조치
  actionDate?: string;  // 조치일
  actionBy?: string;    // 조치자
  completed: boolean;   // 조치 완료 여부 (작업자)

  // 2단계: 책임자 확인
  verified?: boolean;      // 확인 여부 (생산책임자)
  verifiedDate?: string;   // 확인일
  verifiedBy?: string;     // 확인자
}

// Inspection (Inspection Table)
export interface Inspection {
  id: string;
  projectId: string;
  taskNumber: string; // Added: Task 식별
  panelId: number;    // Added: 몇 번째 판넬인지
  type: 'receiving' | 'process' | 'final'; // 입고/공정/최종
  result: 'pass' | 'fail' | 'pending';
  inspector: string; // 담당자
  date: string;
  checkList: InspectionChecklistItem[];
  defectList?: InspectionDefect[]; // Added: 불량 조치 사항 리스트
}

// Defect (Defect Table - Global Issue Tracking)
export interface Defect {
  id: string;
  projectId: string;
  type: string; // 불량유형
  cause: string; // 원인
  action: string; // 조치
  status: 'open' | 'resolved';
  date: string;
}

// Claim (Claim Table)
export interface Claim {
  id: string;
  customerName: string;
  description: string;
  date: string;
  status: 'received' | 'analyzing' | 'resolved';
}

// KPI Data Structure
export interface KPIData {
  defectRate: number; // PPM
  reworkRate: number; // %
  deliveryCompliance: number; // %
  claimCount: number;
}
