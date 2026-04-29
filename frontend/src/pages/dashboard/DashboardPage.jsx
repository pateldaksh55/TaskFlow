import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { statusBadge, priorityBadge, formatDate } from '../../utils/helpers'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tasks/dashboard_stats/')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const stats = data?.stats || {}

  const statCards = [
    { label: 'Total Tasks', value: stats.total || 0, color: '#6366f1' },
    { label: 'To Do', value: stats.todo || 0, color: '#64748b' },
    { label: 'In Progress', value: stats.in_progress || 0, color: '#1d4ed8' },
    { label: 'In Review', value: stats.in_review || 0, color: '#92400e' },
    { label: 'Completed', value: stats.completed || 0, color: '#15803d' },
    { label: 'Blocked', value: stats.blocked || 0, color: '#b91c1c' },
    { label: 'Urgent', value: stats.urgent || 0, color: '#dc2626' },
  ]

  return (
    <>
      <div className="header">
        <h1 className="page-title">
          👋 Welcome, {user?.first_name || user?.username}!
        </h1>
        <div className="header-actions">
          <Link to="/tasks" className="btn btn-primary">+ New Task</Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {statCards.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Urgent Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔥 Urgent Tasks</span>
              <Link to="/tasks?priority=urgent" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {data?.urgent_tasks?.length === 0 && (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p>No urgent tasks 🎉</p>
                </div>
              )}
              {data?.urgent_tasks?.map(task => (
                <Link to={`/tasks/${task.id}`} key={task.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.project_title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {statusBadge(task.status)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🕐 Recent Tasks</span>
              <Link to="/tasks" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {data?.recent_tasks?.length === 0 && (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p>No tasks yet</p>
                </div>
              )}
              {data?.recent_tasks?.map(task => (
                <Link to={`/tasks/${task.id}`} key={task.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {task.project_title} · {formatDate(task.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {priorityBadge(task.priority)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
