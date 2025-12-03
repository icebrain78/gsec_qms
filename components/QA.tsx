import React from 'react';
import { FileText } from 'lucide-react';

const QA: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FileText size={24} />
             </div>
             <h2 className="text-2xl font-bold text-gray-800">QA 및 개발 문서</h2>
        </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Q: PRD 기반 품질관리 시스템 구축 요청</h3>
        <p className="text-gray-600 mb-4">
          <strong>요구사항:</strong> 첨부된 PRD를 바탕으로 Nginx + PHP + MySQL 스택을 목표로 하는 품질관리 시스템(QMS)을 구축. 
          현재는 React Frontend 코드를 작성하되, 추후 백엔드 연결을 고려한 설계가 필요함. 
          또한 이 대화 내용을 기억할 수 있도록 QA 문서를 작성해야 함.
        </p>

        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4 mt-8">A: 시스템 설계 및 구현 전략</h3>
        
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2">1. 아키텍처 설계</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>Frontend:</strong> React + TypeScript + Tailwind CSS (현재 구현)</li>
                    <li><strong>Backend (Target):</strong> Nginx + PHP + MySQL</li>
                    <li><strong>Data Integration:</strong> RESTful API 구조를 가정하여 Service Layer 분리</li>
                </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2">2. 주요 기능 구현 현황</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>대시보드:</strong> KPI(불량률, 납기 준수율 등) 및 차트(Recharts) 구현</li>
                    <li><strong>프로젝트 관리:</strong> Mock Data 기반 목록 조회 및 QR 코드 생성 시뮬레이션</li>
                    <li><strong>검사 관리:</strong> 입고/공정/최종 검사 리스트 및 결과 입력 폼 (모바일 대응)</li>
                    <li><strong>불량/클레임:</strong> 데이터 구조 설계 반영 (Types.ts 정의)</li>
                </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2">3. 데이터베이스 스키마 전략 (PHP/MySQL)</h4>
                <p className="text-gray-700 text-sm mb-2">추후 MySQL 구현 시 참고할 테이블 구조입니다.</p>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`-- Projects Table
CREATE TABLE projects (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    status ENUM('planning', 'production', 'completed'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inspections Table
CREATE TABLE inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(20),
    type ENUM('receiving', 'process', 'final'),
    result ENUM('pass', 'fail'),
    inspector_id INT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);`}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QA;