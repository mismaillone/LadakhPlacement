import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, newApplications: 0 });
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Jobs
        const jobsSnap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
        const jobsData = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setJobs(jobsData);
        
        // Fetch Apps to get stats
        const appsSnap = await getDocs(collection(db, 'applications'));
        
        let pending = 0;
        appsSnap.forEach(d => {
          if (d.data().status === 'pending') pending++;
        });

        setStats({
          totalJobs: jobsData.length,
          totalApplications: appsSnap.size,
          newApplications: pending
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { active: !currentStatus });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, active: !currentStatus } : j));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobToDelete));
      setJobs(jobs.filter(j => j.id !== jobToDelete));
    } catch (err) {
      console.error(err);
      alert("Failed to delete job");
    } finally {
      setJobToDelete(null);
    }
  };

  const duplicateJob = async (jobId: string) => {
    try {
      const jobToCopy = jobs.find(j => j.id === jobId);
      if (!jobToCopy) return;
      
      const { id, ...jobData } = jobToCopy;
      
      const newJob = {
        ...jobData,
        title: `${jobData.title} (Copy)`,
        createdAt: Date.now(),
        active: false // Keep closed by default until they edit
      };
      
      const docRef = await addDoc(collection(db, 'jobs'), newJob);
      setJobs([{ id: docRef.id, ...newJob }, ...jobs]);
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate job");
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <Link 
          to="/admin/jobs/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Job Posting
        </Link>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-xl"><Briefcase className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Jobs</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalJobs}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Applicants</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalApplications}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-4 rounded-xl"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">New Applications</p>
            <p className="text-3xl font-bold text-slate-900">{stats.newApplications}</p>
          </div>
        </div>
      </div>

      {/* Jobs Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Manage Job Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Posted Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                  <td className="px-6 py-4">{job.jobType}</td>
                  <td className="px-6 py-4">{job.location}</td>
                  <td className="px-6 py-4">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleJobStatus(job.id, job.active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${job.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      {job.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {job.active ? 'Active' : 'Closed'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                     <Link to={`/admin/jobs/edit/${job.id}`} className="inline-block text-slate-600 hover:text-slate-800 font-medium text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-300 transition-all">Edit</Link>
                     <button onClick={() => duplicateJob(job.id)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all ml-2">Duplicate</button>
                     <button onClick={() => setJobToDelete(job.id)} className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all ml-2">Delete</button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No job postings found. Click "Create Job Posting" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDeleteJob}
        title="Delete Job Posting"
        message="Are you sure you want to permanently delete this job posting? This action cannot be undone."
        confirmText="Delete Job"
        isDestructive={true}
      />
    </div>
  );
}
