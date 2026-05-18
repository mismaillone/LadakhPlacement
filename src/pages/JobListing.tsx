import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Banknote, ArrowRight } from 'lucide-react';

export default function JobListing() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const q = query(collection(db, 'jobs'), where('active', '==', true), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const jobsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobs(jobsList);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-slate-900 py-24 text-center text-white sm:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8"
        >
          <span className="mb-4 inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
            We are hiring
          </span>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Join the team at <span className="text-blue-500">Ladakh Placement</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 sm:text-xl">
            Discover your next career opportunity and help us build the future of software. 
            We offer competitive benefits and a culture of continuous learning.
          </p>
        </motion.div>
      </section>

      {/* Job Listings Grid */}
      <section className="container mx-auto -mt-12 px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">No open positions</h3>
            <p className="mt-2 text-slate-500">Check back later or subscribe to our newsletter for updates.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {job.jobType}
                  </span>
                  <span className="text-xs text-slate-500">
                    Added {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  <Link to={`/jobs/${job.id}`}>
                    <span className="absolute inset-0"></span>
                    {job.title}
                  </Link>
                </h3>
                <div className="mb-6 flex flex-col gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location}</div>
                  <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> {job.salary}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {job.experience}</div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-sm font-semibold text-blue-600">
                  View Details <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
