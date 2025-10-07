import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getStaffSalaries,
  getSalarySummary,
  approveStaffSalary,
  payStaffSalary,
  deleteStaffSalary,
  populateSampleSalaryData,
  createMissingSalaryRecords,
  generateStaffSalaryPDF,
  generateCombinedFinancePDF,
  addStaffMember,
  getHRStaffSalaryData,
  generateSalaryReport,
  generateSalaryReportPDF
} from '../../api/finance/financeService';

const StaffSalaryManagement = () => {
  const [salaries, setSalaries] = useState([]);
  const [hrStaffData, setHrStaffData] = useState([]);
  const [salaryReport, setSalaryReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank_transfer',
    bankDetails: {}
  });
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    address: '',
    basicSalary: 0,
    hourlyRate: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Debug - Starting API calls...');
      console.log('🔍 Debug - User token:', localStorage.getItem('token'));
      
      const [salariesRes, summaryRes] = await Promise.all([
        getStaffSalaries(),
        getSalarySummary()
      ]);
      
      console.log('🔍 Debug - API calls completed');

      console.log('🔍 Debug - salariesRes:', salariesRes);
      console.log('🔍 Debug - salariesRes.data:', salariesRes.data);
      console.log('🔍 Debug - salariesRes.data.data:', salariesRes.data.data);
      console.log('🔍 Debug - salariesRes.data.data.salaries:', salariesRes.data.data.salaries);
      console.log('🔍 Debug - salariesRes.data.salaries:', salariesRes.data.salaries);
      console.log('🔍 Debug - Full response structure:', JSON.stringify(salariesRes.data, null, 2));

      // The API returns: { success: true, data: salaries[], pagination: {...} }
      const salariesData = salariesRes.data.data || [];
      
      console.log('🔍 Debug - Setting salaries to:', salariesData);
      console.log('🔍 Debug - Salaries length:', salariesData.length);
      console.log('🔍 Debug - Response keys:', Object.keys(salariesRes.data));
      
      setSalaries(salariesData);
      console.log('🔍 Debug - summaryRes:', summaryRes);
      console.log('🔍 Debug - summaryRes.data:', summaryRes.data);
      setSummary(summaryRes.data.data || summaryRes.data);
      
      // Load HR staff data separately to avoid blocking the main data
      try {
        console.log('🔍 Debug - Loading HR staff data...');
        const hrStaffRes = await getHRStaffSalaryData();
        console.log('🔍 Debug - hrStaffRes:', hrStaffRes);
        console.log('🔍 Debug - hrStaffRes.data:', hrStaffRes.data);
        const hrStaffData = hrStaffRes.data.staff || [];
        
        // Calculate ETF/EPF deductions and final pay for each staff member
        const processedHrStaffData = hrStaffData.map(staff => {
          const totalPay = staff.totalPay || 0;
          const regularPay = staff.regularPay || 0;
          
          // ETF/EPF rates (Sri Lankan standards)
          const EPF_EMPLOYEE_RATE = 0.08; // 8% employee contribution
          const EPF_EMPLOYER_RATE = 0.12; // 12% employer contribution  
          const ETF_RATE = 0.03; // 3% ETF contribution
          
          // Calculate deductions
          const epfEmployeeContribution = Math.round(totalPay * EPF_EMPLOYEE_RATE);
          const epfEmployerContribution = Math.round(totalPay * EPF_EMPLOYER_RATE);
          const etfContribution = Math.round(totalPay * ETF_RATE);
          
          // Calculate final pay (after employee deductions)
          const totalDeductions = epfEmployeeContribution + etfContribution;
          const finalPay = totalPay - totalDeductions;
          
          return {
            ...staff,
            epfEmployee: epfEmployeeContribution,
            epfEmployer: epfEmployerContribution,
            etf: etfContribution,
            totalDeductions: totalDeductions,
            finalPay: finalPay
          };
        });
        
        console.log('🔍 Debug - Setting processed HR staff data to:', processedHrStaffData);
        setHrStaffData(processedHrStaffData);
      } catch (hrError) {
        console.warn('⚠️ Failed to load HR staff data:', hrError);
        // Don't set error for HR data failure, just log it
        setHrStaffData([]);
      }
    } catch (err) {
      console.error('Error loading salary data:', err);
      setError(`Failed to load salary data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (salaryId) => {
    try {
      await approveStaffSalary(salaryId);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to approve salary');
    }
  };

  const handlePay = async (salaryId) => {
    try {
      await payStaffSalary(salaryId, paymentData);
      setDialogOpen(false);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to process payment');
    }
  };

  const handleDelete = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    
    try {
      await deleteStaffSalary(salaryId);
      await loadData();
      setError('');
    } catch (err) {
      setError('Failed to delete salary record');
    }
  };

  const handlePopulateSampleData = async () => {
    if (!window.confirm('This will create sample staff data and salary records. Continue?')) return;
    
    try {
      setLoading(true);
      await populateSampleSalaryData();
      await loadData();
      setError('');
      setSuccess('Sample data populated successfully!');
    } catch (err) {
      setError('Failed to populate sample data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMissingRecords = async () => {
    if (!window.confirm('This will create salary records for all staff members who don\'t have them. Continue?')) return;
    
    try {
      setLoading(true);
      const response = await createMissingSalaryRecords();
      await loadData();
      setError('');
      setSuccess(response.data.message || 'Missing salary records created successfully!');
    } catch (err) {
      setError('Failed to create missing salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStaffSalaryPDF = async () => {
    try {
      setLoading(true);
      const response = await generateStaffSalaryPDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `staff-salary-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Staff salary report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate staff salary PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSalaryReport = async () => {
    try {
      setReportLoading(true);
      setError('');
      
      const response = await generateSalaryReport({
        includeOvertime: true,
        includeTotals: true,
        format: 'detailed'
      });
      
      setSalaryReport(response.data);
      setSuccess('Salary report generated successfully!');
    } catch (err) {
      setError('Failed to generate salary report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateSalaryReportPDF = async () => {
    try {
      setReportLoading(true);
      setError('');
      
      const response = await generateSalaryReportPDF({
        includeOvertime: true,
        includeTotals: true,
        format: 'detailed'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Salary report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate salary report PDF');
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateCombinedPDF = async () => {
    try {
      setLoading(true);
      const response = await generateCombinedFinancePDF();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `combined-finance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Combined finance report PDF generated successfully!');
    } catch (err) {
      setError('Failed to generate combined finance PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!newStaffData.name || !newStaffData.email || !newStaffData.role) {
        setError('Please fill in all required fields (Name, Email, Role)');
        return;
      }

      // Call the API to add staff member
      const response = await addStaffMember(newStaffData);
      
      setSuccess(response.data.message || 'Staff member added successfully!');
      setShowAddStaffDialog(false);
      setNewStaffData({
        name: '',
        email: '',
        role: '',
        phone: '',
        address: '',
        basicSalary: 0,
        hourlyRate: 0
      });
      
      // Refresh the data to show the new staff member
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type, salary = null) => {
    setDialogType(type);
    setSelectedSalary(salary);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedSalary(null);
    setPaymentData({
      paymentMethod: 'bank_transfer',
      bankDetails: {}
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'approved': return 'primary';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, format = 'currency' }) => {
    const formattedValue = (() => {
      if (format === 'number') {
        return value || 0;
      }

      const numeric = Number(value || 0);
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(isNaN(numeric) ? 0 : numeric);
    })();

    return (
      <div className="glass-panel p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">
              {format === 'number' ? formattedValue : `$${formattedValue}`}
            </p>
            {subtitle && (
              <p className="text-xs text-muted mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`text-3xl ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading Staff Salary Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold section-title mb-2">
          Staff Salary Management
        </h1>
        <p className="text-muted">
          Manage staff salaries, overtime, and payments
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleGenerateCombinedPDF}
          disabled={loading}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>📊</span>
          Combined Report
        </button>
        <button
          onClick={handlePopulateSampleData}
          disabled={loading}
          className="btn btn-warning flex items-center gap-2"
        >
          <span>🧪</span>
          Populate Sample Data
        </button>
        <button
          onClick={handleGenerateSalaryReport}
          disabled={reportLoading}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>📊</span>
          Generate Report
        </button>
        <button
          onClick={handleGenerateSalaryReportPDF}
          disabled={reportLoading}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>📄</span>
          Export PDF
        </button>
        <button
          onClick={() => setShowAddStaffDialog(true)}
          className="btn btn-success flex items-center gap-2"
        >
          <span>➕</span>
          Add Staff
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {success}
        </div>
      )}

      {/* HR Staff Summary */}
      {hrStaffData && hrStaffData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total HR Staff"
              value={hrStaffData.length}
              icon="👥"
              color="text-blue-400"
              format="number"
            />
            <StatCard
              title="Total HR Payroll"
              value={hrStaffData.reduce((sum, staff) => sum + (staff.totalPay || 0), 0)}
              icon="💰"
              color="text-green-400"
              subtitle="Before deductions"
            />
            <StatCard
              title="Total Final Pay"
              value={hrStaffData.reduce((sum, staff) => sum + (staff.finalPay || 0), 0)}
              icon="💵"
              color="text-purple-400"
              subtitle="After EPF 8% + ETF 3%"
            />
            <StatCard
              title="Total Deductions"
              value={hrStaffData.reduce((sum, staff) => sum + (staff.totalDeductions || 0), 0)}
              icon="📉"
              color="text-orange-400"
              subtitle="EPF + ETF"
            />
          </div>

          {/* HR Staff Salary Data Section */}
          <div className="glass-panel p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Staff Salary Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Staff Member</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Regular Pay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">OT Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Extra Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Extra Work Pay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Total Pay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">EPF (8%)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">ETF (3%)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Final Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {hrStaffData.map((staff, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{staff.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">{staff.email}</td>
                      <td className="py-3 px-4 text-sm font-medium">${staff.regularPay?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-sm">{staff.otRate > 0 ? `$${staff.otRate.toFixed(2)}/h` : '-'}</td>
                      <td className="py-3 px-4 text-sm">{staff.extraWorkHours?.toFixed(1) || '0.0'}h</td>
                      <td className="py-3 px-4 text-sm font-medium">${staff.extraWorkPay?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-blue-400">${staff.totalPay?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-orange-400">-${staff.epfEmployee?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-red-400">-${staff.etf?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-sm font-bold text-green-400 text-lg">${staff.finalPay?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-6 mb-8">
          <div className="text-center py-8">
            <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-white mb-2">No HR Staff Data Available</h3>
            <p className="text-muted">Staff members need to be created in the HR Manager Dashboard first before salary records can be managed.</p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Process Salary Payment</h2>
            {selectedSalary && (
              <div className="mb-4">
                <h3 className="font-medium text-white mb-2">Payment Details for {selectedSalary.staffName}</h3>
                <p className="text-muted">Net Amount: <span className="font-semibold text-green-400">${selectedSalary.calculations.netSalary.toFixed(2)}</span></p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Payment Method</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {paymentData.paymentMethod === 'bank_transfer' && (
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Account Number"
                  value={paymentData.bankDetails.accountNumber || ''}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    bankDetails: { ...paymentData.bankDetails, accountNumber: e.target.value }
                  })}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
                />
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={paymentData.bankDetails.bankName || ''}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    bankDetails: { ...paymentData.bankDetails, bankName: e.target.value }
                  })}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
                />
                <input
                  type="text"
                  placeholder="Branch"
                  value={paymentData.bankDetails.branch || ''}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    bankDetails: { ...paymentData.bankDetails, branch: e.target.value }
                  })}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDialog}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePay(selectedSalary._id)}
                className="btn btn-success flex-1"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Staff Member</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={newStaffData.name}
                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
              />
              <select
                value={newStaffData.role}
                onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select Role *</option>
                <option value="mechanic">Mechanic</option>
                <option value="advisor">Service Advisor</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
                <option value="receptionist">Receptionist</option>
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={newStaffData.phone}
                onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
              />
              <input
                type="number"
                placeholder="Basic Salary"
                value={newStaffData.basicSalary}
                onChange={(e) => setNewStaffData({ ...newStaffData, basicSalary: parseFloat(e.target.value) || 0 })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
              />
              <input
                type="number"
                placeholder="Hourly Rate"
                value={newStaffData.hourlyRate}
                onChange={(e) => setNewStaffData({ ...newStaffData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted"
              />
            </div>

            <textarea
              placeholder="Address"
              rows={3}
              value={newStaffData.address}
              onChange={(e) => setNewStaffData({ ...newStaffData, address: e.target.value })}
              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-muted mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddStaffDialog(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={loading}
                className="btn btn-success flex-1"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSalaryManagement;
