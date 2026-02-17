import { useState } from 'react'
import { ArrowLeft, User, Mail, Lock, Bell, Globe, Moon, Sun, Key, Shield, Trash2 } from 'lucide-react'

export default function Settings({ onBack }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      bio: 'Senior Web Developer with 5+ years of experience'
    },
    notifications: {
      emailNotifications: true,
      jobAlerts: true,
      interviewReminders: true,
      weeklyDigest: false,
      marketingEmails: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC-08:00'
    }
  })

  const handleSave = (section) => {
    // In real app, save to backend
    alert(`${section} settings saved successfully!`)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const currentPassword = formData.get('currentPassword')
    const newPassword = formData.get('newPassword')
    const confirmPassword = formData.get('confirmPassword')
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    
    alert('Password changed successfully!')
    e.target.reset()
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion requested. You will receive a confirmation email.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-gray-400">Manage your account preferences</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                    activeTab === 'profile' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                    activeTab === 'security' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                    activeTab === 'notifications' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                    activeTab === 'preferences' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span>Preferences</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, name: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, email: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, phone: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={settings.profile.location}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, location: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, bio: e.target.value }
                      })}
                      rows="4"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => handleSave('profile')}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                
                {/* Change Password */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Two-Factor Authentication */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorAuth: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                {/* Session Timeout */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Session Settings</h3>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <select
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {key === 'emailNotifications' && 'Receive email notifications'}
                          {key === 'jobAlerts' && 'Get alerts for new job matches'}
                          {key === 'interviewReminders' && 'Reminders for upcoming interviews'}
                          {key === 'weeklyDigest' && 'Weekly summary of your applications'}
                          {key === 'marketingEmails' && 'Product updates and promotions'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, [key]: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => handleSave('notifications')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, theme: 'dark' }
                        })}
                        className={`p-4 rounded-lg border-2 ${
                          settings.preferences.theme === 'dark' 
                            ? 'border-blue-500 bg-gray-900' 
                            : 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <Moon className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">Dark</p>
                        <p className="text-sm text-gray-400">Default theme</p>
                      </button>
                      
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, theme: 'light' }
                        })}
                        className={`p-4 rounded-lg border-2 ${
                          settings.preferences.theme === 'light' 
                            ? 'border-blue-500 bg-gray-900' 
                            : 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <Sun className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-gray-400">Light mode</p>
                      </button>
                    </div>
                  </div>
                  
                  {/* Language */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Language</h3>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, language: e.target.value }
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                  
                  {/* Timezone */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Timezone</h3>
                    <select
                      value={settings.preferences.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, timezone: e.target.value }
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5"
                    >
                      <option value="UTC-12:00">UTC-12:00</option>
                      <option value="UTC-08:00">Pacific Time (UTC-8)</option>
                      <option value="UTC-05:00">Eastern Time (UTC-5)</option>
                      <option value="UTC+00:00">GMT (UTC+0)</option>
                      <option value="UTC+01:00">Central European Time (UTC+1)</option>
                      <option value="UTC+05:30">Indian Standard Time (UTC+5:30)</option>
                      <option value="UTC+09:00">Japan Standard Time (UTC+9)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => handleSave('preferences')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-gray-400">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            
            <button
              onClick={handleDeleteAccount}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}