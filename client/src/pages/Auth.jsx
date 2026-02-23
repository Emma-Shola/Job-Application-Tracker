import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, Briefcase, Search, Plus, Edit, Trash2,
  Filter, ChevronDown, Download, Share2, Eye, 
  EyeOff, BarChart3, Settings as SettingsIcon, Menu, X, FileText, 
  Check, Printer, ChevronLeft, ChevronRight, Bell,
  User, Mail, Lock, Globe
} from 'lucide-react'
import Statistics from '../components/Statistics'
import Settings from '../components/Settings'

export default function Dashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all'
  })
  const [notification, setNotification] = useState({ message: '', type: '' })
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showJobModal, setShowJobModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isFetching, setIsFetching] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const itemsPerPage = 8

  // Mobile detection with proper breakpoints
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

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
      if (error.message !== 'Failed to fetch jobs') {
        showNotification('Failed to load jobs', 'error')
      }
    } finally {
      setIsFetching(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Pagination logic
  const filteredJobs = jobs.filter(job => {
    if (filters.status !== 'all' && job.status !== filters.status) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        job.company.toLowerCase().includes(searchLower) ||
        job.position.toLowerCase().includes(searchLower) ||
        (job.notes && job.notes.toLowerCase().includes(searchLower))
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

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top on page change for mobile
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Generate page numbers (responsive - fewer on mobile)
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = isMobile ? 3 : 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  // Add new job
  const handleAddJob = () => {
    setSelectedJob(null)
    setIsEditing(false)
    setShowJobModal(true)
    // Close mobile menu if open
    setIsMobileMenuOpen(false)
  }

  // Edit job
  const handleEditJob = (job) => {
    setSelectedJob(job)
    setIsEditing(true)
    setShowJobModal(true)
  }

  // Delete job
  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job application?')) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.msg || 'Failed to delete job')
      }
      
      setJobs(jobs.filter(job => job._id !== id))
      showNotification('Job deleted successfully', 'success')
    } catch (error) {
      console.error('Delete failed:', error)
      showNotification(error.message || 'Failed to delete job', 'error')
    }
  }

  // Save job (add or update)
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
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.msg || `Failed to ${isEditing ? 'update' : 'add'} job`)
      }
      
      const data = await res.json()
      
      if (isEditing && selectedJob) {
        setJobs(jobs.map(job => 
          job._id === selectedJob._id ? data.data : job
        ))
        showNotification('Job updated successfully', 'success')
      } else {
        setJobs([data.data, ...jobs])
        showNotification('Job added successfully', 'success')
      }
      
      setShowJobModal(false)
      setSelectedJob(null)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
      showNotification(error.message || `Failed to ${isEditing ? 'update' : 'add'} job`, 'error')
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
    technical: jobs.filter(j => j.status === 'technical').length,
    offer: jobs.filter(j => j.status === 'offer').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
    accepted: jobs.filter(j => j.status === 'accepted').length,
  }

  // Job Modal Component (responsive)
  const JobModal = () => (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => {
        setShowJobModal(false)
        setSelectedJob(null)
        setIsEditing(false)
      }}
    >
      <div 
        className="bg-gray-800 rounded-t-xl sm:rounded-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-gray-800 py-2">
            <h3 className="text-lg sm:text-xl font-semibold">
              {isEditing ? 'Edit Job Application' : 'Add New Job Application'}
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
              contact: formData.get('contact'),
              jobUrl: formData.get('jobUrl')
            }
            handleSaveJob(jobData)
          }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={selectedJob?.company || ''}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Apple Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  defaultValue={selectedJob?.position || ''}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Senior Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  defaultValue={selectedJob?.status || 'applied'}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="technical">Technical Round</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Salary
                </label>
                <input
                  type="text"
                  name="salary"
                  defaultValue={selectedJob?.salary || ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., $120,000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={selectedJob?.location || ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Remote, SF"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact"
                  defaultValue={selectedJob?.contact || ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Job URL
              </label>
              <input
                type="url"
                name="jobUrl"
                defaultValue={selectedJob?.jobUrl || ''}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://company.com/careers/job-id"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                defaultValue={selectedJob?.notes || ''}
                rows={isMobile ? "3" : "4"}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Any additional notes, interview dates, follow-up actions..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowJobModal(false)
                  setSelectedJob(null)
                  setIsEditing(false)
                }}
                className="w-full sm:flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isEditing ? 'Update' : 'Add Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  // Render pagination controls (responsive)
  const renderPagination = () => {
    const pageNumbers = getPageNumbers()
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 px-4 py-3 bg-gray-800/50 rounded-lg gap-4 sm:gap-0">
        <div className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-gray-500">...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                {page}
              </button>
            )
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Mobile Filter Drawer
  const MobileFilters = () => (
    <div 
      className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
        showMobileFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowMobileFilters(false)}
    >
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-xl p-6 transform transition-transform duration-300 ${
          showMobileFilters ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setShowMobileFilters(false)}
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
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Sort By
            </label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Company Name</option>
              <option>Status</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setFilters({status: 'all', search: '', dateRange: 'all'})
              setShowMobileFilters(false)
            }}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            Reset
          </button>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Apply
          </button>
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
      <div className="lg:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg"
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
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">JobTracker</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg"
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
                  activeTab === 'dashboard' ? 'bg-gray-800' : 'hover:bg-gray-800'
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
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Statistics</span>
              </button>
              <button 
                onClick={() => {
                  setActiveTab('settings')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
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
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-800 bg-gray-900 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-800">
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
                activeTab === 'dashboard' ? 'bg-gray-800' : 'hover:bg-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('statistics')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Statistics</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Stats</h3>
            <div className="space-y-3">
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

        <div className="p-6 border-t border-gray-800">
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
      <main className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:justify-start">
                <h2 className="text-lg sm:text-xl font-semibold">Job Applications</h2>
                <div className="flex items-center gap-2 sm:hidden">
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                  >
                    {viewMode === 'grid' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search - hidden on mobile, shown in header */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({...filters, search: e.target.value})
                      setCurrentPage(1)
                    }}
                    className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                
                {/* Desktop view toggle */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                    title="Grid View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                    title="List View"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={handleAddJob}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add Job</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({...filters, status: e.target.value})
                    setCurrentPage(1)
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                {filteredJobs.length} applications found
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="sm:hidden mt-3">
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-400">Loading your jobs...</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginatedJobs.length === 0 ? (
                <div className="col-span-full text-center py-12 sm:py-20">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No jobs yet</h3>
                  <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-4">Start tracking your job applications</p>
                  <button
                    onClick={handleAddJob}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm sm:text-base"
                  >
                    Add Your First Job
                  </button>
                </div>
              ) : (
                paginatedJobs.map(job => (
                  <div key={job._id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 hover:border-gray-600 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{job.company}</h3>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">{job.position}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded whitespace-nowrap self-start ${
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
                    
                    <div className="space-y-1.5 mb-3 text-xs sm:text-sm">
                      {job.salary && (
                        <div>
                          <span className="text-gray-400">Salary: </span>
                          <span className="text-gray-300">{job.salary}</span>
                        </div>
                      )}
                      {job.location && (
                        <div>
                          <span className="text-gray-400">Location: </span>
                          <span className="text-gray-300">{job.location}</span>
                        </div>
                      )}
                      <div className="text-gray-400">
                        Applied: {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {job.notes && (
                      <div className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 border-t border-gray-700 pt-3">
                        {job.notes}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => handleEditJob(job)}
                        className="flex-1 py-2 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="flex-1 py-2 text-xs sm:text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-700/50 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Position</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salary</th>
                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {paginatedJobs.map(job => (
                        <tr key={job._id} className="hover:bg-gray-800/30">
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div>
                              <div className="font-medium text-sm sm:text-base">{job.company}</div>
                              <div className="text-xs text-gray-400 sm:hidden">{job.position}</div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-4">
                            <div className="text-sm text-gray-300">{job.position}</div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
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
                          </td>
                          <td className="hidden lg:table-cell px-4 py-4">
                            <div className="text-sm text-gray-300">{job.salary || '-'}</div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-4">
                            <div className="text-sm text-gray-400">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button 
                                onClick={() => handleEditJob(job)}
                                className="p-1.5 hover:bg-gray-700 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteJob(job._id)}
                                className="p-1.5 hover:bg-gray-700 rounded text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredJobs.length > 0 && renderPagination()}
        </div>
      </main>

      {/* Job Modal */}
      {showJobModal && <JobModal />}

      {/* Mobile Filters */}
      <MobileFilters />

      {/* Notification */}
      {notification.message && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:min-w-[300px] px-4 py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base ${
          notification.type === 'success' ? 'bg-green-500/90 text-white' :
          notification.type === 'error' ? 'bg-red-500/90 text-white' :
          'bg-blue-500/90 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
