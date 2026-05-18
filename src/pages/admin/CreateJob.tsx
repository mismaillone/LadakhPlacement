import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    experience: '',
    jobType: 'Full-time',
    salary: '',
    deadline: '',
    imageUrl: '', // Optional Banner/Logo
  });

  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [qualifications, setQualifications] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  
  const [customFields, setCustomFields] = useState<any[]>([]);

  const handleArrayChange = (setter: any, index: number, value: string) => {
    setter((prev: any[]) => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFieldIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIdx === null || draggedFieldIdx === index) {
      setDraggedFieldIdx(null);
      return;
    }
    
    setCustomFields(prev => {
      const newFields = [...prev];
      const draggedItem = newFields[draggedFieldIdx];
      newFields.splice(draggedFieldIdx, 1);
      newFields.splice(index, 0, draggedItem);
      return newFields;
    });
    setDraggedFieldIdx(null);
  };

  const addArrayItem = (setter: any) => {
    setter((prev: any[]) => [...prev, '']);
  };

  const removeArrayItem = (setter: any, index: number) => {
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jobData = {
        ...formData,
        responsibilities: responsibilities.filter(r => r.trim() !== ''),
        qualifications: qualifications.filter(q => q.trim() !== ''),
        benefits: benefits.filter(b => b.trim() !== ''),
        customFields: customFields.filter(f => f.label.trim() !== ''),
        active: true,
        createdAt: Date.now(),
      };
      
      await addDoc(collection(db, 'jobs'), jobData);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert("Failed to create job posting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create New Job Posting</h1>
        <p className="text-slate-500 mt-1">Fill out the details below to publish a new open position.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
              <input required type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Description *</label>
              <textarea required rows={4} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="General overview of the role..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
              <input required type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Remote, New York, NY" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
              <select className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border bg-white" value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level *</label>
              <input required type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="e.g. 3-5 years" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Salary Range (Optional)</label>
              <input type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. $100k - $120k" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Application Deadline (Optional)</label>
              <input type="date" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border text-slate-500" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
            </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Banner Image URL (Optional)</label>
              <input type="url" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2.5 px-3 border" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Dynamic Lists */}
        {[
          { title: 'Responsibilities', state: responsibilities, setter: setResponsibilities, placeholder: 'e.g. Build and maintain UI components...' },
          { title: 'Requirements & Qualifications', state: qualifications, setter: setQualifications, placeholder: 'e.g. 3+ years of React experience...' },
          { title: 'Benefits', state: benefits, setter: setBenefits, placeholder: 'e.g. Health insurance, 401k matching...' },
        ].map((section, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.state.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={item} 
                    onChange={e => handleArrayChange(section.setter, i, e.target.value)} 
                    className="flex-1 rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2 px-3 border"
                    placeholder={section.placeholder}
                  />
                  {section.state.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem(section.setter, i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => addArrayItem(section.setter)}
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Item
              </button>
            </div>
          </div>
        ))}

        {/* Dynamic Form Builder for Applicants */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Custom Application Fields (Optional)</h2>
              <p className="text-sm text-slate-500 mt-1">Add custom questions or form fields that applicants must fill out.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {customFields.map((field, i) => (
              <div 
                key={field.id} 
                className={`p-5 border rounded-xl bg-slate-50 relative group transition-all ${draggedFieldIdx === i ? 'opacity-50 border-blue-400' : 'border-slate-200'}`}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, i)}
              >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div 
                        className="cursor-move hover:text-blue-600 mr-2 p-1 bg-slate-200 rounded text-slate-500 transition-colors" 
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Field {i + 1}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCustomFields(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Field Label *</label>
                      <input 
                        type="text" 
                        required
                        value={field.label} 
                        onChange={e => setCustomFields(prev => { const n = [...prev]; n[i].label = e.target.value; return n; })} 
                        className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2 px-3 border"
                        placeholder="e.g. Portfolio URL, Why do you want to join us?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Field Type</label>
                      <select 
                        value={field.type} 
                        onChange={e => setCustomFields(prev => { const n = [...prev]; n[i].type = e.target.value; return n; })} 
                        className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2 px-3 border bg-white"
                      >
                        <optgroup label="Text & Input">
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text (Paragraph)</option>
                          <option value="number">Number</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="url">URL / Website</option>
                        </optgroup>
                        <optgroup label="Selection">
                          <option value="select">Dropdown (Select)</option>
                          <option value="multiselect">Multi Select</option>
                          <option value="radio">Radio Buttons</option>
                          <option value="checkbox">Checkbox (Yes/No)</option>
                        </optgroup>
                        <optgroup label="Date & Time">
                          <option value="date">Date Picker</option>
                          <option value="time">Time Picker</option>
                        </optgroup>
                        <optgroup label="Advanced">
                          <option value="file">File Upload</option>
                          <option value="rating">Rating / Scale</option>
                        </optgroup>
                      </select>
                    </div>
                    {['select', 'multiselect', 'radio'].includes(field.type) && (
                      <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Options (comma separated) *</label>
                         <input 
                          type="text"
                          required
                          value={field.options || ''} 
                          onChange={e => setCustomFields(prev => { const n = [...prev]; n[i].options = e.target.value; return n; })} 
                          className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-2 px-3 border"
                          placeholder="e.g. Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2 pt-2 flex items-center">
                      <input 
                        type="checkbox"
                        id={`req_${field.id}`}
                        checked={field.required}
                        onChange={e => setCustomFields(prev => { const n = [...prev]; n[i].required = e.target.checked; return n; })} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor={`req_${field.id}`} className="ml-2 text-sm text-slate-700">Required Field</label>
                    </div>
                  </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => setCustomFields(prev => [...prev, { id: `field_${Date.now()}`, label: '', type: 'text', required: false, options: '' }])}
              className="inline-flex items-center text-sm font-medium text-blue-600 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Custom Field
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/admin/dashboard')} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center">
            {loading ? 'Publishing...' : 'Publish Job Advertisement'}
          </button>
        </div>
      </form>
    </div>
  );
}
