import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { statusBadge, priorityBadge, formatDate, initials } from '../../utils/helpers'
import TaskForm from './TaskForm'

export default function TaskListPage() {
  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    project: searchParams.get('project') || '',
  })

  const fetchTasks = () => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.project) params.project = filters.project
    api.get('/tasks/', { params })
      .then(res => setTasks(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/projects/').then(res => setProjects(res.data.results || res.data))
  }, [])

  useEffect(() => { fetchTasks() }, [filters])

  const handleFilter = e => setFilters({ ...filters, [e.target.name]: e.target.value })

  return (
    <>
      <div className="header">
        <h1 className="page-title">My Tasks</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Task</button>
        </div>
      </div>

      <div className="page-body">
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-input-wrap" style={{ minWidth: 220 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input name="search" className="form-control search-input" placeholder="Search tasks…"
              value={filters.search} onChange={handleFilter} />
          </div>
          <select name="status" className="form-control" style={{ width: 150 }} value={filters.status} onChange={handleFilter}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
          <select name="priority" className="form-control" style={{ width: 140 }} value={filters.priority} onChange={handleFilter}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select name="project" className="form-control" style={{ width: 180 }} value={filters.project} onChange={handleFilter}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {(filters.status || filters.priority || filters.project || filters.search) && (
            <button className="btn btn-secondary btn-sm"
              onClick={() => setFilters({ search: '', status: '', priority: '', project: '' })}>
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <h3>No tasks found</h3>
            <p>Try adjusting the filters or create a new task</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <Link to={`/tasks/${t.id}`} style={{ fontWeight: 500, color: 'var(--text)' }}>
                          #{t.display_id} {t.title}
                        </Link>
                        {t.comment_count > 0 && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                            💬 {t.comment_count}
                          </span>
                        )}
                        {t.tags && (
                          <div style={{ marginTop: 4 }}>
                            {t.tags.split(',').filter(Boolean).slice(0, 3).map(tag => (
                              <span key={tag} className="tag">{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link to={`/projects/${t.project}`} style={{ fontSize: 13, color: 'var(--primary)' }}>
                          {t.project_title}
                        </Link>
                      </td>
                      <td>
                        {t.assigned_to_detail
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="avatar sm">{initials(t.assigned_to_detail.full_name)}</div>
                              <span style={{ fontSize: 13 }}>{t.assigned_to_detail.full_name}</span>
                            </div>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unassigned</span>
                        }
                      </td>
                      <td>{statusBadge(t.status)}</td>
                      <td>{priorityBadge(t.priority)}</td>
                      <td style={{ fontSize: 12, color: t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {formatDate(t.due_date)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 80 }}>
                          <div className="progress-bar-wrap" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTasks() }}
        />
      )}
    </>
  )
}
