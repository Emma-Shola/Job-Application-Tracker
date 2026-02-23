import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const endpoint = isLogin ? 'login' : 'register'
    const body = isLogin 
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      // ✅ FIX: API_BASE_URL should NOT include /api
      
      // ✅ FIX: Add /api/ in the fetch URL
      const url = `${API_BASE_URL}/api/auth/${endpoint}`
      console.log('🔍 Sending request to:', url)
      console.log('📦 Request body:', body)
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      console.log('📥 Full response:', data)
      
      if (!res.ok) {
        const errorMsg = data.msg || data.message || data.error || 'Authentication failed'
        throw new Error(errorMsg)
      }

      // 🔥 Check for token in response
      let token = null
      
      if (data.token) {
        token = data.token
        console.log('✅ Token found at: data.token')
      } else if (data.data?.token) {
        token = data.data.token
        console.log('✅ Token found at: data.data.token')
      } else if (data.accessToken) {
        token = data.accessToken
        console.log('✅ Token found at: data.accessToken')
      }
      
      if (token) {
        localStorage.setItem('token', token)
        console.log('💾 Token stored in localStorage')
        navigate('/')
      } else {
        console.error('❌ No token found in response:', data)
        throw new Error('Authentication succeeded but no token received')
      }
    } catch (err) {
      console.error('❌ Auth error:', err)
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-signal rounded mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold">JobTracker</h1>
        </div>

        <div className="border border-edge p-8">
          <div className="flex border-b border-edge mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 ${isLogin ? 'border-b-2 border-signal' : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 ${!isLogin ? 'border-b-2 border-signal' : ''}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full p-3 border border-edge bg-void"
                required
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full p-3 border border-edge bg-void"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full p-3 border border-edge bg-void"
              required
              minLength={6}
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full p-3 bg-signal text-paper font-medium hover:bg-signal/90"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
