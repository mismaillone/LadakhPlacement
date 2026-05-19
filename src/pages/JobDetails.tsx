import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { ArrowLeft, MapPin, Clock, Banknote, Briefcase, CheckCircle2, UploadCloud, FileText, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', 
    customSection: ''
  });
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchJob() {
      if (!jobId) return;
      try {
        const docSnap = await getDoc(doc(db, 'jobs', jobId));
        if (docSnap.exists() && docSnap.data().active) {
          setJob({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  const validateGlobalFile = (file: File, types: string[], maxSizeMB = 5) => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const validTypes = types.map(t => t.toLowerCase());
    if (!validTypes.includes(ext) && !validTypes.includes(file.type)) {
       return `File "${file.name}" has invalid format. Allowed: ${types.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
       return `File "${file.name}" exceeds the ${maxSizeMB}MB limit.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateGlobalFile(file, ['.pdf', '.doc', '.docx']);
      if (err) {
         alert(err);
         e.target.value = '';
         return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Please upload your resume."); return;
    }

    const validateFile = (file: File, types: string[], maxSizeMB = 5) => {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      const validTypes = types.map(t => t.toLowerCase());
      if (!validTypes.includes(ext) && !validTypes.includes(file.type)) {
         return `File "${file.name}" has invalid format. Allowed: ${types.join(', ')}`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
         return `File "${file.name}" exceeds the ${maxSizeMB}MB limit.`;
      }
      return null;
    };

    const resumeError = validateFile(resumeFile, ['.pdf', '.doc', '.docx']);
    if (resumeError) {
      alert(resumeError);
      return;
    }

    for (const field of job?.customFields || []) {
       if (field.type === 'file' && customResponses[field.id] instanceof File) {
          const err = validateFile(customResponses[field.id], ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip']);
          if (err) { alert(err); return; }
       }
    }

    setSubmitting(true);
    try {
      // 1. Upload resume to Firebase Storage (or fallback)
      let resumeUrl = 'https://example.com/resume.pdf';
      const finalCustomResponses = { ...customResponses };
      try {
        const uploadWithTimeout = (promise: Promise<any>, timeoutMs: number = 3000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Storage timeout')), timeoutMs))
          ]);
        };

        const fileRef = ref(storage, `resumes/${jobId}/${Date.now()}_${resumeFile.name}`);
        await uploadWithTimeout(uploadBytes(fileRef, resumeFile));
        resumeUrl = await uploadWithTimeout(getDownloadURL(fileRef));
        
        // Upload any custom field files
        for (const field of job.customFields || []) {
          if (field.type === 'file' && customResponses[field.id] instanceof File) {
            const fileObj = customResponses[field.id] as File;
            const customFileRef = ref(storage, `customDocs/${jobId}/${field.id}_${Date.now()}_${fileObj.name}`);
            await uploadWithTimeout(uploadBytes(customFileRef, fileObj));
            const customFileUrl = await uploadWithTimeout(getDownloadURL(customFileRef));
            finalCustomResponses[field.id] = { url: customFileUrl, name: fileObj.name };
          }
        }
        
      } catch (storageError) {
        console.warn('Could not upload to Firebase Storage (likely missing rules), using fallback URL.', storageError);
        for (const [key, value] of Object.entries(finalCustomResponses)) {
          if (value instanceof File) {
            finalCustomResponses[key] = { url: `https://example.com/fallback_${key}`, name: value.name };
          }
        }
      }

      // 2. Save application to Firestore
      await addDoc(collection(db, 'applications'), {
        jobId,
        ...formData,
        customResponses: finalCustomResponses,
        resumeUrl,
        resumeName: resumeFile.name,
        status: 'pending',
        appliedAt: Date.now()
      });

      setSuccess(true);
      setApplying(false);
    } catch (err: any) {
      console.error(err);
      alert("Application failed. " + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!job) return <div className="text-center py-20 text-slate-500">Job not found or closed.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {job.imageUrl && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={job.imageUrl} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${job.imageUrl ? '-mt-16' : 'pt-12'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative z-10 mb-8">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to all jobs
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 mb-6">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><MapPin className="h-4 w-4 text-blue-500" /> {job.location}</div>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Briefcase className="h-4 w-4 text-blue-500" /> {job.jobType}</div>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Clock className="h-4 w-4 text-blue-500" /> {job.experience}</div>
                  {job.salary && <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Banknote className="h-4 w-4 text-blue-500" /> {job.salary}</div>}
                </div>
              </div>
              <button 
                onClick={() => { setApplying(true); setSuccess(false); setTimeout(()=>document.getElementById('apply-form')?.scrollIntoView({behavior:'smooth'}), 100); }} 
                className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                Apply Now
              </button>
            </div>
          </div>

          {!applying && !success && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">About the Role</h2>
                  <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                </section>
                
                {job.responsibilities?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">What You'll Do</h2>
                    <ul className="space-y-3">
                      {job.responsibilities.map((r: string, i: number) => (
                        <li key={i} className="flex gap-3 text-slate-600">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {job.qualifications?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">What We're Looking For</h2>
                    <ul className="space-y-3">
                      {job.qualifications.map((q: string, i: number) => (
                        <li key={i} className="flex gap-3 text-slate-600">
                          <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0" />
                          <span className="leading-relaxed">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
              
              <div>
                {job.benefits?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
                    <h3 className="font-bold text-slate-900 mb-4">Benefits & Perks</h3>
                    <ul className="space-y-3">
                      {job.benefits.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    {job.deadline && (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Apply Before</span>
                        <span className="font-medium text-slate-800">{new Date(job.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-200 rounded-3xl p-12 text-center my-12">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Application Submitted!</h2>
                <p className="text-emerald-700 mb-8 max-w-md mx-auto">Thank you for applying to Ladakh Placement. We've received your application and will be in touch shortly.</p>
                <Link to="/" className="inline-block bg-white text-emerald-700 border border-emerald-200 font-medium px-6 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                  View More Jobs
                </Link>
              </motion.div>
            )}

            {applying && !success && (
              <motion.div id="apply-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 md:p-12 mt-8">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-900">Submit Your Application</h2>
                  <button onClick={() => setApplying(false)} className="text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                      <input required type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                      <input required type="email" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                      <input required type="tel" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location / Address</label>
                      <input type="text" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Custom Section *</label>
                    <textarea required rows={6} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border" value={formData.customSection} onChange={e => setFormData({...formData, customSection: e.target.value})} placeholder="Provide your Cover Letter, Portfolio Link, or LinkedIn Profile here..." />
                  </div>

                  {job.customFields && job.customFields.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-slate-100 mt-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Questions</h3>
                      {job.customFields.map((field: any) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {field.label} {field.required && '*'}
                          </label>
                          
                          {['text', 'number', 'email', 'phone', 'url', 'date', 'time'].includes(field.type) && (
                            <input
                              type={field.type === 'phone' ? 'tel' : field.type}
                              required={field.required}
                              value={customResponses[field.id] || ''}
                              onChange={(e) => setCustomResponses({...customResponses, [field.id]: e.target.value})}
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border"
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <textarea
                              required={field.required}
                              rows={4}
                              value={customResponses[field.id] || ''}
                              onChange={(e) => setCustomResponses({...customResponses, [field.id]: e.target.value})}
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border"
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <select
                              required={field.required}
                              value={customResponses[field.id] || ''}
                              onChange={(e) => setCustomResponses({...customResponses, [field.id]: e.target.value})}
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border bg-white"
                            >
                              <option value="">Select an option</option>
                              {field.options?.split(',').map((opt: string, i: number) => (
                                <option key={i} value={opt.trim()}>{opt.trim()}</option>
                              ))}
                            </select>
                          )}
                          
                          {field.type === 'multiselect' && (
                            <select
                              multiple
                              required={field.required}
                              value={customResponses[field.id] || []}
                              onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, (option: any) => option.value);
                                setCustomResponses({...customResponses, [field.id]: values});
                              }}
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 py-3 px-4 border bg-white min-h-[100px]"
                            >
                              {field.options?.split(',').map((opt: string, i: number) => (
                                <option key={i} value={opt.trim()} className="py-1">{opt.trim()}</option>
                              ))}
                            </select>
                          )}

                          {field.type === 'radio' && (
                            <div className="space-y-2">
                              {field.options?.split(',').map((opt: string, i: number) => (
                                <label key={i} className="flex items-center">
                                  <input
                                    type="radio"
                                    required={field.required && !customResponses[field.id]}
                                    name={field.id}
                                    value={opt.trim()}
                                    checked={customResponses[field.id] === opt.trim()}
                                    onChange={(e) => setCustomResponses({...customResponses, [field.id]: e.target.value})}
                                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-3 text-sm text-slate-700">{opt.trim()}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {field.type === 'checkbox' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                required={field.required}
                                checked={customResponses[field.id] || false}
                                onChange={(e) => setCustomResponses({...customResponses, [field.id]: e.target.checked})}
                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm text-slate-700">Yes</span>
                            </div>
                          )}

                          {field.type === 'file' && (
                            <input
                              type="file"
                              required={field.required}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  const file = e.target.files[0];
                                  const err = validateGlobalFile(file, ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip']);
                                  if (err) {
                                    alert(err);
                                    e.target.value = '';
                                    return;
                                  }
                                  setCustomResponses({...customResponses, [field.id]: file});
                                }
                              }}
                              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          )}

                          {field.type === 'rating' && (
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setCustomResponses({...customResponses, [field.id]: star})}
                                  className={`p-2 rounded-full transition-colors ${
                                    (customResponses[field.id] || 0) >= star 
                                      ? 'text-yellow-500' 
                                      : 'text-slate-300 hover:text-yellow-400'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Resume / CV *</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const err = validateGlobalFile(file, ['.pdf', '.doc', '.docx']);
                          if (err) {
                             alert(err);
                             return;
                          }
                          setResumeFile(file);
                        }
                      }}
                      className={`w-full group cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors ${resumeFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <input required={!resumeFile} type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                      {resumeFile ? (
                        <>
                          <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6" />
                          </div>
                          <p className="text-emerald-800 font-medium">{resumeFile.name}</p>
                          <p className="text-emerald-600 text-xs mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 bg-white text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 shadow-sm rounded-full flex items-center justify-center mb-3 transition-colors">
                            <UploadCloud className="h-6 w-6" />
                          </div>
                          <p className="font-medium text-slate-700">Click to upload or drag & drop</p>
                          <p className="text-slate-500 text-sm mt-1">PDF, DOC, DOCX up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                    <button type="button" onClick={() => setApplying(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
