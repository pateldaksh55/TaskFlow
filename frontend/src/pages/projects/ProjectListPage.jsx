import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { projectStatusBadge, formatDate } from '../../utils/helpers'
import ProjectForm from './ProjectForm'

export default function ProjectListPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchProjects = () => {
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    api.get('/projects/', { params })
      .then(res => setProjects(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [search, statusFilter])

  const handleSaved = (project) => {
    setShowForm(false)
    fetchProjects()
  }

  return (
    <>
      <div className="header">
        <h1 className="page-title">Projects</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Project</button>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-control search-input"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/>
            </svg>
            <h3>No projects found</h3>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'box-shadow .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1, marginRight: 10 }}>{p.title}</h3>
                    {projectStatusBadge(p.status)}
                  </div>
                  {p.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    <span>📋 {p.task_count} tasks</span>
                    <span>✅ {p.completed_task_count} done</span>
                    {p.members_detail?.length > 0 && <span>👥 {p.members_detail.length} members</span>}
                  </div>
                  {p.task_count > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Progress</span>
                        <span>{Math.round((p.completed_task_count / p.task_count) * 100)}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${Math.round((p.completed_task_count / p.task_count) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {p.team_lead_detail && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      Lead: <strong>{p.team_lead_detail.full_name}</strong>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </>
  )
}
