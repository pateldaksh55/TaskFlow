import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import { getErrorMessage } from '../../utils/helpers'

const empty = { title: '', description: '', status: 'active', team_lead: '', members: [], start_date: '', end_date: '' }

export default function ProjectForm({ project, onClose, onSaved }) {
  const [form, setForm] = useState(project ? {
    title: project.title,
    description: project.description || '',
    status: project.status,
    team_lead: project.team_lead || '',
    members: project.members?.map(m => m) || [],
    start_date: project.start_date || '',
    end_date: project.end_date || '',
  } : empty)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/users/').then(res => setUsers(res.data)).catch(() => {})
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleMembersChange = e => {
    const selected = Array.from(e.target.selectedOptions).map(o => Number(o.value))
    setForm({ ...form, members: selected })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, team_lead: form.team_lead || null }
      let res
      if (project) {
        res = await api.patch(`/projects/${project.id}/`, payload)
      } else {
        res = await api.post('/projects/', payload)
      }
      onSaved(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input name="title" className="form-control" value={form.title} onChange={handleChange} required placeholder="Project name" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="What is this project about?" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-control" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Team Lead</label>
            <select name="team_lead" className="form-control" value={form.team_lead} onChange={handleChange}>
              <option value="">— None —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" name="end_date" className="form-control" value={form.end_date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Members (hold Ctrl/Cmd to select multiple)</label>
          <select multiple className="form-control" value={form.members} onChange={handleMembersChange} style={{ height: 100 }}>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : (project ? 'Save Changes' : 'Create Project')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
