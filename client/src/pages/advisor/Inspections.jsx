import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PendingJobsList from '../../components/advisor/PendingJobsList';
import { inspectionApi } from '../../services/advisor/inspectionApi';

export default function Inspections() {
  const navigate = useNavigate();
  const normalizeJobType = (serviceType) => {
    if (!serviceType) return '';
    const s = serviceType.toLowerCase();
    if (s.includes('general')) return 'general-inspection';
    if (s.includes('oil')) return 'oil-change';
    if (s.includes('brake')) return 'brake-service';
    if (s.includes('engine')) return 'engine-repair';
    if (s.includes('tire')) return 'tire-rotation';
    if (s.includes('battery')) return 'battery-check';
    return 'general-inspection';
  };
  const [formData, setFormData] = useState({
    vehiclePlate: '',
    jobType: '',
    engineOil: 'good',
    brakeFluid: 'good',
    coolant: 'good',
    battery: 'good',
    tires: '',
    lights: '',
    airFilter: '',
    transmissionFluid: '',
    notes: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setFormData(prev => ({
      ...prev,
      vehiclePlate: job.vehiclePlate,
      jobType: normalizeJobType(job.serviceType),
      notes: job.notes || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) {
      setMessage('Please select a job from the pending jobs list first');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const inspectionData = {
        bookingId: selectedJob.bookingId || selectedJob.id,
        inspectionData: {
          vehiclePlate: formData.vehiclePlate,
          jobType: normalizeJobType(formData.jobType || selectedJob?.serviceType),
          engineOil: formData.engineOil,
          brakeFluid: formData.brakeFluid,
          coolant: formData.coolant,
          battery: formData.battery,
          tires: formData.tires || undefined,
          lights: formData.lights || undefined,
          airFilter: formData.airFilter || undefined,
          transmissionFluid: formData.transmissionFluid || undefined,
          notes: formData.notes
        }
      };

      await inspectionApi.createInspection(inspectionData);
      setMessage('Inspection started successfully! Job status changed to "In Progress".');

      // Navigate to Assign Jobs with prefilled data
      navigate('/advisor/assign', {
        state: {
          bookingId: inspectionData.bookingId,
          vehiclePlate: formData.vehiclePlate,
          jobType: inspectionData.inspectionData.jobType,
          notes: formData.notes
        }
      });
      
      // Reset form
      setFormData({
        vehiclePlate: '',
        jobType: '',
        engineOil: 'good',
        brakeFluid: 'good',
        coolant: 'good',
        battery: 'good',
        tires: '',
        lights: '',
        airFilter: '',
        transmissionFluid: '',
        notes: ''
      });
      setSelectedJob(null);
      
      // Do not hard reload; navigation handles flow
    } catch (error) {
      console.error('Error creating inspection:', error);
      setMessage('Failed to create inspection. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Vehicle Inspections</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PendingJobsList onJobSelect={handleJobSelect} selectedJob={selectedJob} />
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-white mb-6">Inspection Form</h2>
          
          {message && (
            <div className={`mb-4 p-4 rounded ${
              message.includes('successfully') 
                ? 'bg-green-900/20 border border-green-500 text-green-400' 
                : 'bg-red-900/20 border border-red-500 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {selectedJob && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500 text-blue-400 rounded">
              <strong>Selected Job:</strong> {selectedJob.vehiclePlate} - {selectedJob.serviceType} ({selectedJob.customerName})
            </div>
          )}

          <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Info */}
            <div>
              <label className="block text-white mb-2">Vehicle Plate Number</label>
              <input
                type="text"
                name="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                placeholder="ABC-1234"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Job Type</label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                required
              >
                <option value="">Select Job Type</option>
                <option value="oil-change">Oil Change</option>
                <option value="brake-service">Brake Service</option>
                <option value="engine-repair">Engine Repair</option>
                <option value="general-inspection">General Inspection</option>
              </select>
            </div>

            {/* Inspection Checklist */}
            <div>
              <label className="block text-white mb-2">Engine Oil</label>
              <select
                name="engineOil"
                value={formData.engineOil}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                required
              >
                <option value="good">Good</option>
                <option value="needs-change">Needs Change</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Brake Fluid</label>
              <select
                name="brakeFluid"
                value={formData.brakeFluid}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                required
              >
                <option value="good">Good</option>
                <option value="needs-change">Needs Change</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Coolant</label>
              <select
                name="coolant"
                value={formData.coolant}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                required
              >
                <option value="good">Good</option>
                <option value="needs-change">Needs Change</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Battery</label>
              <select
                name="battery"
                value={formData.battery}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
                required
              >
                <option value="good">Good</option>
                <option value="weak">Weak</option>
                <option value="dead">Dead</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Tires</label>
              <select
                name="tires"
                value={formData.tires}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              >
                <option value="">Not Checked</option>
                <option value="good">Good</option>
                <option value="needs-rotation">Needs Rotation</option>
                <option value="needs-replacement">Needs Replacement</option>
                <option value="low-pressure">Low Pressure</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Lights</label>
              <select
                name="lights"
                value={formData.lights}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              >
                <option value="">Not Checked</option>
                <option value="good">Good</option>
                <option value="bulb-out">Bulb Out</option>
                <option value="dim">Dim</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Air Filter</label>
              <select
                name="airFilter"
                value={formData.airFilter}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              >
                <option value="">Not Checked</option>
                <option value="good">Good</option>
                <option value="dirty">Dirty</option>
                <option value="clogged">Clogged</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Transmission Fluid</label>
              <select
                name="transmissionFluid"
                value={formData.transmissionFluid}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              >
                <option value="">Not Checked</option>
                <option value="good">Good</option>
                <option value="needs-change">Needs Change</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-white mb-2">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600"
              placeholder="Any additional observations or recommendations..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading || !selectedJob}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-medium"
            >
              {loading ? 'Starting...' : 'Start Inspection'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedJob(null);
                setFormData({
                  vehiclePlate: '',
                  jobType: '',
                  engineOil: 'good',
                  brakeFluid: 'good',
                  coolant: 'good',
                  battery: 'good',
                  tires: '',
                  lights: '',
                  airFilter: '',
                  transmissionFluid: '',
                  notes: ''
                });
                setMessage('');
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded font-medium"
            >
              Cancel
            </button>
          </div>
          </form>
        </div>
      </div>

    </div>
  );
}
