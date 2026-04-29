from django.db import models
from django.contrib.auth.models import User
from django.forms import ValidationError
from projects.models import Project


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('in_review', 'In Review'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    dependencies = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='blocked_tasks',
        help_text='Tasks that must be completed before this task can start.'
    )
    dependency_remark = models.TextField(blank=True, null=True)
    display_id = models.IntegerField(unique=True, editable=False, null=True)
    change_request_no = models.CharField(max_length=50, blank=True, null=True)
    change_request_type = models.CharField(
        max_length=10,
        choices=[('MAJOR', 'Major'), ('MINOR', 'Minor')],
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    progress = models.IntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    tags = models.CharField(max_length=200, blank=True, help_text='Comma-separated tags')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        if self.pk and self.dependencies.filter(pk=self.pk).exists():
            raise ValidationError('A task cannot depend on itself.')

        def detect_cycle(task, visited):
            if task == self:
                return True
            for dep in task.dependencies.all():
                if dep.pk not in visited:
                    visited.add(dep.pk)
                    if detect_cycle(dep, visited):
                        return True
            return False

        for dependency in self.dependencies.all():
            if detect_cycle(dependency, {self.pk}):
                raise ValidationError('Circular dependency detected.')

    def save(self, *args, **kwargs):
        self.full_clean()

        if self.status == 'completed' or self.progress == 100:
            self.status = 'completed'
            self.progress = 100
        elif self.progress == 0 and self.status != 'blocked':
            self.status = 'todo'
        elif 0 < self.progress < 100 and self.status in ['todo', 'completed']:
            self.status = 'in_progress'
        elif self.status == 'in_review' and self.progress < 90:
            self.progress = 90

        if not self.display_id:
            last_task = Task.objects.order_by('-display_id').first()
            self.display_id = last_task.display_id + 1 if last_task and last_task.display_id else 1

        super().save(*args, **kwargs)

    @property
    def tags_list(self):
        if self.tags:
            return [t.strip() for t in self.tags.split(',') if t.strip()]
        return []

    def get_status_color(self):
        colors = {
            'todo': '#6c757d',
            'in_progress': '#0d6efd',
            'in_review': '#6f42c1',
            'completed': '#198754',
            'blocked': '#dc3545',
        }
        return colors.get(self.status, '#6366f1')


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    commented_by = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.commented_by} on {self.task}"


class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name


class TaskHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.task.title}: {self.old_status} → {self.new_status}"
