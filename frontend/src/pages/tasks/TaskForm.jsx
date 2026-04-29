import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import { getErrorMessage } from '../../utils/helpers'

const empty = {
  title: '', description: '', project: '', assigned_to: '',
  status: 'todo', priority: 'medium', progress: 0,
  due_date: '', estimated_hours: '', actual_hours: '', tags: ''
}

export default function TaskForm({ task, defaultProjectId, onClose, onSaved }) {
  const [form, setForm] = useState(task ? {
    title: task.title,
    description: task.description || '',
    project: task.project,
    assigned_to: task.assigned_to || '',
    status: task.status,
    priority: task.priority,
    progress: task.progress,
    due_date: task.due_date || '',
    estimated_hours: task.estimated_hours || '',
    actual_hours: task.actual_hours || '',
    tags: task.tags || '',
  } : { ...empty, project: defaultProjectId || '' })

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/projects/'),
      api.get('/auth/users/')
    ]).then(([pRes, uRes]) => {
      setProjects(pRes.data.results || pRes.data)
      setUsers(uRes.data)
    }).catch(() => {})
  }, [])

  const handleChange = e => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        assigned_to: form.assigned_to || null,
        estimated_hours: form.estimated_hours || null,
        actual_hours: form.actual_hours || null,
        due_date: form.due_date || null,
      }
      let res
      if (task) {
        res = await api.patch(`/tasks/${task.id}/`, payload)
      } else {
        res = await api.post('/tasks/', payload)
      }
      onSaved(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose} size="lg">
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input name="title" className="form-control" value={form.title} onChange={handleChange} required placeholder="Task title" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="Describe this task…" style={{ minHeight: 90 }} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select name="project" className="form-control" value={form.project} onChange={handleChange} required>
              <option value="">— Select Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select name="assigned_to" className="form-control" value={form.assigned_to} onChange={handleChange}>
              <option value="">— Unassigned —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-control" value={form.status} onChange={handleChange}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" name="due_date" className="form-control" value={form.due_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Progress: {form.progress}%</label>
            <input type="range" name="progress" min="0" max="100" step="5" value={form.progress} onChange={handleChange}
              style={{ width: '100%', marginTop: 8 }} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <input type="number" name="estimated_hours" className="form-control" value={form.estimated_hours} onChange={handleChange} placeholder="e.g. 4.5" min="0" step="0.5" />
          </div>
          <div className="form-group">
            <label className="form-label">Actual Hours</label>
            <input type="number" name="actual_hours" className="form-control" value={form.actual_hours} onChange={handleChange} placeholder="e.g. 3.0" min="0" step="0.5" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input name="tags" className="form-control" value={form.tags} onChange={handleChange} placeholder="e.g. frontend, bug, api" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : (task ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
