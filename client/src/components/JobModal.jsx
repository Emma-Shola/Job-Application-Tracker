import { useState } from 'react'
import { 
  X, Calendar, Clock, MapPin, Mail, Phone, 
  ExternalLink, Save, Trash2, Globe, Users 
} from 'lucide-react'

export default function JobModal({ job, onClose, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(job)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
    setIsEditing(false)
  }

  const statusColors = {
    applied: 'border-blue-500 bg-blue-500/10 text-blue-400',
    interview: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    offer: 'border-green-500 bg-green-500/10 text-green-400',
    rejected: 'border-red-500 bg-red-500/10 text-red-400'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/95 backdrop-blur p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {job.company.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{job.company}</h2>
                <p className="text-gray-400">{job.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({...form, company: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm({...form, position: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['applied', 'interview', 'offer', 'rejected'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setForm({...form, status})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        form.status === status 
                          ? statusColors[status]
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-sm font-medium capitalize">
                        {status}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-32"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => onDelete(job._id)}
                  className="flex-1 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5 inline mr-2" />
                  Delete
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              <div className="inline-block">
                <span className={`px-4 py-2 rounded-full border ${statusColors[job.status]} font-medium`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>

              {/* Notes */}
              {job.notes && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Notes</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-400">Created</div>
                      <div className="text-gray-300">
                        {new Date(job.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-400">Updated</div>
                      <div className="text-gray-300">
                        {new Date(job.updatedAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}