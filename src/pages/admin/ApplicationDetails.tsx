import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, ExternalLink, Download, Clock, Star, XCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function ApplicationDetails() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (!applicationId) return;
        const appSnap = await getDoc(doc(db, 'applications', applicationId));
        if (!appSnap.exists()) {
          alert('Application not found');
          navigate('/admin/applications');
          return;
        }
        
        const data = appSnap.data();
        setAppData({ id: appSnap.id, ...data });

        if (data.jobId) {
          const jobSnap = await getDoc(doc(db, 'jobs', data.jobId));
          if (jobSnap.exists()) {
            setJobData({ id: jobSnap.id, ...jobSnap.data() });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [applicationId, navigate]);

  const updateStatus = async (status: string) => {
    if (!appData) return;
    try {
      await updateDoc(doc(db, 'applications', appData.id), { status });
      setAppData({ ...appData, status });
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDelete = async () => {
    if (!appData) return;
    try {
      await deleteDoc(doc(db, 'applications', appData.id));
      navigate('/admin/applications');
    } catch (err) {
      console.error(err);
      alert('Failed to delete application');
    }
  };

  if (loading) return <div className="p-8">Loading application...</div>;
  if (!appData) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/admin/applications" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Applications
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{appData.fullName}</h1>
          <p className="text-slate-500 mt-1">Applied for <strong>{jobData?.title || 'Unknown Job'}</strong> on {new Date(appData.appliedAt).toLocaleDateString()}</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <button 
            onClick={() => updateStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appData.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => updateStatus('shortlisted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appData.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             Shortlisted
          </button>
          <button 
            onClick={() => updateStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${appData.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
              <div><strong className="block text-slate-900 mb-1">Email</strong> <a href={`mailto:${appData.email}`} className="text-blue-600 hover:underline">{appData.email}</a></div>
              <div><strong className="block text-slate-900 mb-1">Phone</strong> <a href={`tel:${appData.phone}`} className="text-blue-600 hover:underline">{appData.phone}</a></div>
              <div className="sm:col-span-2"><strong className="block text-slate-900 mb-1">Address</strong> {appData.address || <span className="text-slate-400 italic">Not provided</span>}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Cover Letter</h2>
            {appData.coverLetter ? (
              <div className="text-sm text-slate-600 whitespace-pre-wrap font-serif leading-relaxed">
                {appData.coverLetter}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No cover letter provided.</p>
            )}
          </div>

          {jobData?.customFields && appData.customResponses && Object.keys(appData.customResponses).length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Questions</h2>
              <div className="space-y-4">
                {jobData.customFields.map((field: any) => (
                  <div key={field.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-900 mb-1">{field.label}</p>
                    <p className="text-sm text-slate-600">
                      {(() => {
                        const val = appData.customResponses[field.id];
                        if (val === undefined || val === null || val === '') return <span className="italic text-slate-400">Not answered</span>;
                        
                        if (field.type === 'checkbox') return val ? 'Yes' : 'No';
                        if (field.type === 'rating') return `${val} / 5 Stars`;
                        if (Array.isArray(val)) return val.join(', ');
                        if (field.type === 'file' && typeof val === 'object' && val.url) {
                          return (
                            <a href={val.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 text-sm mt-1">
                              <Download className="h-4 w-4 mr-1" /> Download {val.name || 'File'}
                            </a>
                          );
                        }
                        
                        return String(val);
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Links & Documents</h2>
            <div className="space-y-3">
              {appData.resumeUrl && (
                <a href={appData.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Download className="h-4 w-4" /></div>
                    <span className="text-sm font-medium text-slate-700 truncate">{appData.resumeName || 'Resume.pdf'}</span>
                  </div>
                </a>
              )}
              {appData.otherDocsUrls?.map((url: string, index: number) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Download className="h-4 w-4" /></div>
                    <span className="text-sm font-medium text-slate-700 truncate">{appData.otherDocsNames?.[index] || `Document ${index + 1}`}</span>
                  </div>
                </a>
              ))}
              {appData.portfolio && (
                <a href={appData.portfolio.startsWith('http') ? appData.portfolio : `https://${appData.portfolio}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Portfolio</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>
              )}
              {appData.linkedin && (
                <a href={appData.linkedin.startsWith('http') ? appData.linkedin : `https://${appData.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>
              )} 
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h2 className="text-lg font-semibold text-slate-900 mb-4 text-red-600">Danger Zone</h2>
             <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
               <Trash2 className="h-4 w-4" />
               Delete Application
             </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Application"
        message="Are you sure you want to permanently delete this application and all associated data? This action cannot be undone."
        confirmText="Delete Application"
        isDestructive={true}
      />
    </div>
  );
}
