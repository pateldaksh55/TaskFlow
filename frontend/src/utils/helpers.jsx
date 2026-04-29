import React from 'react'

export function statusBadge(status) {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    completed: 'Completed',
    blocked: 'Blocked',
  }
  return React.createElement('span', { className: `badge badge-${status}` }, labels[status] || status)
}

export function priorityBadge(priority) {
  const labels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
  return React.createElement('span', { className: `badge badge-${priority}` }, labels[priority] || priority)
}

export function projectStatusBadge(status) {
  const labels = { active: 'Active', inactive: 'Inactive', completed: 'Completed', on_hold: 'On Hold' }
  return React.createElement('span', { className: `badge badge-${status}` }, labels[status] || status)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getErrorMessage(err) {
  const data = err?.response?.data
  if (!data) return 'Something went wrong.'
  if (typeof data === 'string') return data
  const msgs = Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' | ')
  return msgs
}
