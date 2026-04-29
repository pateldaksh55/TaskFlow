import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { projectStatusBadge, statusBadge, priorityBadge, formatDate, initials } from '../../utils/helpers'
import ProjectForm from './ProjectForm'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/`),
      api.get('/tasks/', { params: { project: id } })
    ])
      .then(([pRes, tRes]) => {
        setProject(pRes.data)
        setTasks(tRes.data.results || tRes.data)
      })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this project?')) return
    await api.delete(`/projects/${id}/`)
    navigate('/projects')
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!project) return null

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/projects" className="btn btn-ghost btn-sm">← Back</Link>
          <div style={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            backgroundColor: project.color,
            flexShrink: 0 
          }} />
          <h1 className="page-title">{project.title}</h1>
          {projectStatusBadge(project.status)}
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-grid">
          {/* Left: tasks */}
          <div>
            {project.description && (
              <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{project.description}</p>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <span className="card-title">Tasks ({tasks.length})</span>
                <Link to={`/tasks?project=${id}`} className="btn btn-primary btn-sm">+ Add Task</Link>
              </div>
              {tasks.length === 0 ? (
                <div className="empty-state"><p>No tasks in this project yet</p></div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Assignee</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => (
                        <tr key={t.id}>
                          <td>
                            <Link to={`/tasks/${t.id}`} style={{ fontWeight: 500, color: 'var(--primary)' }}>{t.title}</Link>
                          </td>
                          <td>
                            {t.assigned_to_detail
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div className="avatar sm">{initials(t.assigned_to_detail.full_name)}</div>
                                  <span style={{ fontSize: 13 }}>{t.assigned_to_detail.full_name}</span>
                                </div>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>
                            }
                          </td>
                          <td>{statusBadge(t.status)}</td>
                          <td>{priorityBadge(t.priority)}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(t.due_date)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar-wrap" style={{ flex: 1 }}>
                                <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28 }}>{t.progress}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Project Info</h3>
              <div className="detail-meta">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Status</span>
                  <span>{projectStatusBadge(project.status)}</span>
                </div>
                {project.team_lead_detail && (
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">Team Lead</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar sm">{initials(project.team_lead_detail.full_name)}</div>
                      <span className="detail-meta-value">{project.team_lead_detail.full_name}</span>
                    </div>
                  </div>
                )}
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Start Date</span>
                  <span className="detail-meta-value">{formatDate(project.start_date)}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">End Date</span>
                  <span className="detail-meta-value">{formatDate(project.end_date)}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Created</span>
                  <span className="detail-meta-value">{formatDate(project.created_at)}</span>
                </div>
              </div>
            </div>

            {project.members_detail?.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Team Members</h3>
                {project.members_detail.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <div className="avatar sm">{initials(m.full_name)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.profile?.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Progress</h3>
                <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{project.completed_task_count} / {project.task_count} tasks done</span>
                  <span style={{ fontWeight: 600 }}>
                    {project.overall_progress}%
                  </span>
                </div>
                <div className="progress-bar-wrap" style={{ height: 10 }}>
                  <div className="progress-bar-fill" style={{ width: `${project.overall_progress}%`, backgroundColor: project.color }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <ProjectForm
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={p => { setProject(p); setShowEdit(false) }}
        />
      )}
    </>
  )
}
