import React, { useState } from 'react';
import { School, Lock, RefreshCw } from 'lucide-react';
import { FormData } from '../utils/constants';

interface IssuerPanelProps {
  onIssue: (formData: FormData) => void;
  issuerName: string;
}

const IssuerPanel: React.FC<IssuerPanelProps> = ({ onIssue, issuerName }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nim: '',
    program: '',
    gpa: '',
    graduationDate: new Date().toISOString().split('T')[0]
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onIssue(formData);
    setIsProcessing(false);
    setFormData({ name: '', nim: '', program: '', gpa: '', graduationDate: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <School size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{issuerName || "Institusi Akademik"}</h2>
            <p className="text-sm text-slate-500">Authorized Issuer Dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mahasiswa</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Budi Santoso"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Induk (NIM)</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: 12345678"
                value={formData.nim}
                onChange={(e) => setFormData({...formData, nim: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program Studi</label>
              <select 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.program}
                onChange={(e) => setFormData({...formData, program: e.target.value})}
              >
                <option>Teknik Informatika</option>
                <option>Sistem Informasi</option>
                <option>Manajemen Bisnis</option>
                <option>Hukum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IPK Akhir</label>
              <input 
                required
                type="number" 
                step="0.01" 
                max="4.00"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: 3.85"
                value={formData.gpa}
                onChange={(e) => setFormData({...formData, gpa: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t mt-4">
             <button 
              disabled={isProcessing}
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Signing & Hashing to Blockchain...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Terbitkan Verifiable Credential (VC)
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-3">
              *Tindakan ini akan membuat hash kredensial dan mencatatnya di Smart Contract Registry.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssuerPanel;