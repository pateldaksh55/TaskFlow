import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { statusBadge, priorityBadge, formatDate, initials } from '../../utils/helpers'
import TaskForm from './TaskForm'
import { useAuth } from '../../context/AuthContext'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const loadTask = () => {
    api.get(`/tasks/${id}/`)
      .then(res => setTask(res.data))
      .catch(() => navigate('/tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTask() }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${id}/`)
    navigate('/tasks')
  }

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault()
    const text = parentId ? replyText : comment
    if (!text.trim()) return
    setSubmittingComment(true)
    try {
      await api.post(`/tasks/${id}/comments/`, { comment: text, parent: parentId })
      if (parentId) setReplyText('')
      else setComment('')
      setReplyingTo(null)
      loadTask()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return
    try {
      await api.patch(`/tasks/${id}/comments/${commentId}/`, { comment: editCommentText })
      setEditingComment(null)
      setEditCommentText('')
      loadTask()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete comment?')) return
    await api.delete(`/tasks/${id}/comments/${commentId}/`)
    loadTask()
  }

  const renderComments = (comments, parentId = null) => {
    return comments.filter(c => c.parent === parentId).map(c => (
      <div key={c.id} className="comment-item" style={{ marginLeft: parentId ? 40 : 0 }}>
        <div className="avatar sm">{initials(c.commented_by_detail?.full_name)}</div>
        <div className="comment-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="comment-author">{c.commented_by_detail?.full_name}</span>
              <span className="comment-time" style={{ marginLeft: 8 }}>{formatDate(c.created_at)}</span>
            </div>
            {c.commented_by === user?.id && (
              <div>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}
                  onClick={() => { setEditingComment(c.id); setEditCommentText(c.comment) }}>Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--danger)' }}
                  onClick={() => handleDeleteComment(c.id)}>Delete</button>
              </div>
            )}
          </div>
          {editingComment === c.id ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                className="form-control"
                value={editCommentText}
                onChange={e => setEditCommentText(e.target.value)}
                style={{ minHeight: 60, resize: 'none' }}
              />
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(c.id)}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <p className="comment-text">{c.comment}</p>
          )}
          {!editingComment && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginTop: 4 }}
              onClick={() => setReplyingTo(c.id)}>Reply</button>
          )}
          {replyingTo === c.id && (
            <form onSubmit={(e) => handleCommentSubmit(e, c.id)} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div className="avatar sm">{initials(user?.full_name || user?.username)}</div>
              <textarea
                className="form-control"
                placeholder="Write a reply…"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                style={{ flex: 1, minHeight: 40, resize: 'none' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !replyText.trim()}>
                Reply
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyingTo(null)}>Cancel</button>
            </form>
          )}
        </div>
        {renderComments(comments, c.id)}
      </div>
    ))
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!task) return null

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/tasks" className="btn btn-ghost btn-sm">← Back</Link>
          <h1 className="page-title" style={{ fontSize: 16 }}>#{task.display_id} {task.title}</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Description */}
            {task.description && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Description</h3>
                <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{task.description}</p>
              </div>
            )}

            {/* Dependencies */}
            {task.dependencies?.length > 0 && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Dependencies</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {task.dependencies.map(dep => (
                    <Link key={dep.id} to={`/tasks/${dep.id}`} style={{ color: 'var(--primary)', fontSize: 13 }}>
                      #{dep.display_id} {dep.title}
                    </Link>
                  ))}
                </div>
                {task.dependency_remark && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{task.dependency_remark}</p>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</h3>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{task.progress}%</span>
              </div>
              <div className="progress-bar-wrap" style={{ height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
              </div>
            </div>

            {/* Tags */}
            {task.tags_list?.length > 0 && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Tags</h3>
                <div>{task.tags_list.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
              </div>
            )}

            {/* History */}
            {task.history?.length > 0 && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {task.history.map(h => (
                    <div key={h.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{h.changed_by_detail?.full_name || 'System'}</span> changed status from {statusBadge(h.old_status)} to {statusBadge(h.new_status)} on {formatDate(h.changed_at)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">💬 Comments ({task.comments?.length || 0})</span>
              </div>
              <div style={{ padding: '0 20px' }}>
                {task.comments?.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>No comments yet. Be the first!</p>
                )}
                {renderComments(task.comments || [])}
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div className="avatar sm">{initials(user?.full_name || user?.username)}</div>
                  <textarea
                    className="form-control"
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{ flex: 1, minHeight: 60, resize: 'none' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !comment.trim()}>
                    {submittingComment ? '…' : 'Post'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right: meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Task Details</h3>
              <div className="detail-meta">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Status</span>
                  <span>{statusBadge(task.status)}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Priority</span>
                  <span>{priorityBadge(task.priority)}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Project</span>
                  <Link to={`/projects/${task.project}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    {task.project_title}
                  </Link>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Assigned To</span>
                  {task.assigned_to_detail
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar sm">{initials(task.assigned_to_detail.full_name)}</div>
                        <span className="detail-meta-value">{task.assigned_to_detail.full_name}</span>
                      </div>
                    : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  }
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Assigned By</span>
                  <span className="detail-meta-value">{task.assigned_by_detail?.full_name || '—'}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Due Date</span>
                  <span className="detail-meta-value" style={{
                    color: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                      ? 'var(--danger)' : undefined
                  }}>
                    {formatDate(task.due_date)}
                  </span>
                </div>
                {task.estimated_hours && (
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">Estimated</span>
                    <span className="detail-meta-value">{task.estimated_hours}h</span>
                  </div>
                )}
                {task.actual_hours && (
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">Actual</span>
                    <span className="detail-meta-value">{task.actual_hours}h</span>
                  </div>
                )}
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Created</span>
                  <span className="detail-meta-value">{formatDate(task.created_at)}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Last Updated</span>
                  <span className="detail-meta-value">{formatDate(task.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <TaskForm
          task={task}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setTask(updated); setShowEdit(false) }}
        />
      )}
    </>
  )
}
