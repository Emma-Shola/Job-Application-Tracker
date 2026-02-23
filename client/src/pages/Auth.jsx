import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, Briefcase, Search, Plus, Edit, Trash2,
  Filter, BarChart3, Settings as SettingsIcon, Menu, X, 
  ChevronLeft, ChevronRight
} from 'lucide-react'
import Statistics from '../components/Statistics'
import Settings from '../components/Settings'

export default function Dashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  })
  const [notification, setNotification] = useState({ message: '', type: '' })
  const [showJobModal, setShowJobModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isFetching, setIsFetching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 6 // Fewer items per page on mobile

  const fetchJobs = useCallback(async () => {
    setIsFetching(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/auth')
        return
      }

      const API_URL = import.meta.env.VITE_API_URL;
      
      const res = await fetch(`${API_URL}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          navigate('/auth')
          return
        }
        throw new Error('Failed to fetch jobs')
      }
      
      const data = await res.json()
      setJobs(data.data || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      showNotification('Failed to load jobs', 'error')
    } finally {
      setIsFetching(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const filteredJobs = jobs.filter(job => {
    if (filters.status !== 'all' && job.status !== filters.status) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        job.company.toLowerCase().includes(searchLower) ||
        job.position.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: '', type: '' }), 3000)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddJob = () => {
    setSelectedJob(null)
    setIsEditing(false)
    setShowJobModal(true)
    setIsMobileMenuOpen(false)
  }

  const handleEditJob = (job) => {
    setSelectedJob(job)
    setIsEditing(true)
    setShowJobModal(true)
  }

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job application?')) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) throw new Error('Failed to delete job')
      
      setJobs(jobs.filter(job => job._id !== id))
      showNotification('Job deleted', 'success')
    } catch (error) {
      showNotification('Failed to delete job', 'error')
    }
  }

  const handleSaveJob = async (jobData) => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const url = isEditing && selectedJob 
        ? `http://localhost:5000/api/jobs/${selectedJob._id}`
        : 'http://localhost:5000/api/jobs'
      
      const method = isEditing && selectedJob ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      })
      
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'add'} job`)
      
      const data = await res.json()
      
      if (isEditing && selectedJob) {
        setJobs(jobs.map(job => 
          job._id === selectedJob._id ? data.data : job
        ))
        showNotification('Job updated', 'success')
      } else {
        setJobs([data.data, ...jobs])
        showNotification('Job added', 'success')
      }
      
      setShowJobModal(false)
      setSelectedJob(null)
      setIsEditing(false)
    } catch (error) {
      showNotification(`Failed to ${isEditing ? 'update' : 'add'} job`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/auth')
  }

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer: jobs.filter(j => j.status === 'offer').length,
  }

  const JobModal = () => (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={() => {
        setShowJobModal(false)
        setSelectedJob(null)
        setIsEditing(false)
      }}
    >
      <div 
        className="bg-gray-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5 sticky top-0 bg-gray-800 py-2">
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Edit Job' : 'Add New Job'}
            </h3>
            <button
              onClick={() => {
                setShowJobModal(false)
                setSelectedJob(null)
                setIsEditing(false)
              }}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            const jobData = {
              company: formData.get('company'),
              position: formData.get('position'),
              status: formData.get('status'),
              notes: formData.get('notes'),
              salary: formData.get('salary'),
              location: formData.get('location'),
            }
            handleSaveJob(jobData)
          }} className="space-y-4">
            <input
              type="text"
              name="company"
              placeholder="Company Name *"
              defaultValue={selectedJob?.company || ''}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            
            <input
              type="text"
              name="position"
              placeholder="Position *"
              defaultValue={selectedJob?.position || ''}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            
            <select
              name="status"
              defaultValue={selectedJob?.status || 'applied'}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="technical">Technical</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
            </select>
            
            <input
              type="text"
              name="salary"
              placeholder="Salary (optional)"
              defaultValue={selectedJob?.salary || ''}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            
            <input
              type="text"
              name="location"
              placeholder="Location (optional)"
              defaultValue={selectedJob?.location || ''}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              defaultValue={selectedJob?.notes || ''}
              rows="3"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
            
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowJobModal(false)
                  setSelectedJob(null)
                  setIsEditing(false)
                }}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isEditing ? 'Update' : 'Add Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  const FiltersDrawer = () => (
    <div 
      className={`fixed inset-0 z-50 bg-black/70 transition-opacity duration-300 ${
        showFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowFilters(false)}
    >
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl p-5 transform transition-transform duration-300 ${
          showFilters ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({...filters, status: e.target.value})
                setCurrentPage(1)
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="technical">Technical</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-3">
            <button
              onClick={() => {
                setFilters({status: 'all', search: ''})
                setShowFilters(false)
              }}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const MobileMenu = () => (
    <div 
      className={`fixed inset-0 z-50 bg-black/70 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div 
        className={`absolute left-0 top-0 bottom-0 w-64 bg-gray-800 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">JobTracker</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => {
                setActiveTab('dashboard')
                setIsMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('statistics')
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Statistics</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings')
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="absolute bottom-5 left-5 right-5">
            <button
              onClick={() => {
                handleLogout()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (activeTab === 'statistics') {
    return <Statistics jobs={jobs} onBack={() => setActiveTab('dashboard')} />
  }

  if (activeTab === 'settings') {
    return <Settings onBack={() => setActiveTab('dashboard')} />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">JobTracker</span>
            </div>
          </div>
          <button
            onClick={handleAddJob}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Search */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => {
                setFilters({...filters, search: e.target.value})
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-800 bg-gray-800 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">JobTracker</h1>
              <p className="text-xs text-gray-400">v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('statistics')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Statistics</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-400">Applied</span>
                <span>{stats.applied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-400">Interview</span>
                <span>{stats.interview}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-400">Offer</span>
                <span>{stats.offer}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-[116px] lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:block border-b border-gray-800 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Job Applications</h2>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({...filters, search: e.target.value})
                      setCurrentPage(1)
                    }}
                    className="w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <button
                  onClick={handleAddJob}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Job</span>
                </button>
              </div>
            </div>

            {/* Desktop Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({...filters, status: e.target.value})
                    setCurrentPage(1)
                  }}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="technical">Technical</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-400">
                {filteredJobs.length} applications
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Filter Button */}
        <div className="lg:hidden px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {filters.status !== 'all' && (
              <span className="w-5 h-5 bg-blue-600 rounded-full text-xs flex items-center justify-center">
                1
              </span>
            )}
          </button>
          
          <div className="text-sm text-gray-400">
            {filteredJobs.length} jobs
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            </div>
          ) : paginatedJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No jobs yet</h3>
              <p className="text-sm text-gray-400 mb-4">Start tracking your applications</p>
              <button
                onClick={handleAddJob}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
              >
                Add Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedJobs.map(job => (
                <div key={job._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-base">{job.company}</h3>
                      <p className="text-sm text-gray-400">{job.position}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                      job.status === 'applied' ? 'bg-blue-500/20 text-blue-300' :
                      job.status === 'interview' ? 'bg-yellow-500/20 text-yellow-300' :
                      job.status === 'technical' ? 'bg-purple-500/20 text-purple-300' :
                      job.status === 'offer' ? 'bg-green-500/20 text-green-300' :
                      job.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  {(job.salary || job.location) && (
                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                      {job.salary && <div>💰 {job.salary}</div>}
                      {job.location && <div>📍 {job.location}</div>}
                    </div>
                  )}
                  
                  {job.notes && (
                    <div className="text-xs text-gray-400 mb-3 line-clamp-2 border-t border-gray-700 pt-3">
                      {job.notes}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="flex-1 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="flex-1 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showJobModal && <JobModal />}
      <FiltersDrawer />
      <MobileMenu />

      {/* Notification */}
      {notification.message && (
        <div className={`fixed bottom-4 left-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
