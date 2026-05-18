import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Search, Eye, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { utils, writeFile } from 'xlsx';

export default function ViewApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Jobs to create map for fast lookup
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const jMap: Record<string, string> = {};
        jobsSnap.forEach(d => { jMap[d.id] = d.data().title });
        setJobsMap(jMap);

        // Fetch Applications
        const querySnapshot = await getDocs(query(collection(db, 'applications'), orderBy('appliedAt', 'desc')));
        const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApplications(apps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading applications...</div>;

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.jobId === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const exportToExcel = () => {
    if (filteredApps.length === 0) return;
    
    // Prepare data
    const exportData = filteredApps.map(app => ({
      'Applicant Name': app.fullName || '',
      'Email': app.email || '',
      'Phone': app.phone || '',
      'Job Title': jobsMap[app.jobId] || 'Unknown Job',
      'Status': app.status || 'pending',
      'Applied At': new Date(app.appliedAt).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Applications');
    
    // Write and save
    writeFile(workbook, `applications_export_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage candidates.</p>
        </div>
        <button 
          onClick={exportToExcel}
          disabled={filteredApps.length === 0}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search name or email..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="all">All Jobs</option>
          {Object.entries(jobsMap).map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
        <select 
          className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Applied For</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{app.fullName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{app.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {jobsMap[app.jobId] || <span className="italic text-slate-400">Archived Job</span>}
                  </td>
                  <td className="px-6 py-4">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      app.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      app.status === 'shortlisted' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/applications/${app.id}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No applications found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
