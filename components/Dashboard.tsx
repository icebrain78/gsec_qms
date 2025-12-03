import React from 'react';
import { KPIData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle, Truck, ClipboardList } from 'lucide-react';

interface DashboardProps {
  kpi: KPIData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ kpi }) => {
  const defectData = [
    { name: '1월', defects: 4 },
    { name: '2월', defects: 3 },
    { name: '3월', defects: 2 },
    { name: '4월', defects: 5 },
    { name: '5월', defects: 2 },
  ];

  const defectTypeData = [
    { name: '도장', value: 40 },
    { name: '치수', value: 30 },
    { name: '부품', value: 20 },
    { name: '기타', value: 10 },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 className="page-title">품질 현황 대시보드</h2>
      
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <p className="kpi-label">불량률 (PPM)</p>
            <p className="kpi-value" style={{ color: 'var(--danger-color)' }}>{kpi.defectRate.toLocaleString()}</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: 'var(--danger-color)' }}>
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p className="kpi-label">공정 재작업률</p>
            <p className="kpi-value" style={{ color: 'var(--warning-color)' }}>{kpi.reworkRate}%</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#ffedd5', color: 'var(--warning-color)' }}>
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p className="kpi-label">납기 준수율</p>
            <p className="kpi-value" style={{ color: 'var(--success-color)' }}>{kpi.deliveryCompliance}%</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p className="kpi-label">고객 클레임</p>
            <p className="kpi-value" style={{ color: 'var(--primary-color)' }}>{kpi.claimCount}건</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#dbeafe', color: 'var(--primary-color)' }}>
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Monthly Defect Trend */}
        <div className="card">
          <h3 className="font-bold" style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>월별 불량 추이</h3>
          <div style={{ height: '16rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="defects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Type Distribution */}
        <div className="card">
          <h3 className="font-bold" style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>불량 유형 분석</h3>
          <div style={{ height: '16rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {defectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;