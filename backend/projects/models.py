from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg


class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    ]

    COLOR_CHOICES = [
        ('#4F46E5', 'Indigo'),
        ('#10B981', 'Emerald'),
        ('#F59E0B', 'Amber'),
        ('#EF4444', 'Rose'),
        ('#8B5CF6', 'Violet'),
        ('#06B6D4', 'Cyan'),
        ('#EC4899', 'Pink'),
    ]

    color = models.CharField(max_length=7, choices=COLOR_CHOICES, default='#4F46E5')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    team_lead = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_projects')
    members = models.ManyToManyField(User, related_name='projects', blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    overall_progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def task_count(self):
        return self.tasks.count()

    @property
    def completed_task_count(self):
        return self.tasks.filter(status='completed').count()


@receiver(post_save, sender='tasks.Task')
def sync_project_progress(sender, instance, **kwargs):
    project = instance.project
    if not project:
        return

    if project.status in ['on_hold', 'inactive']:
        return

    stats = project.tasks.aggregate(avg=Avg('progress'))
    new_progress = stats['avg'] or 0
    has_uncompleted_tasks = project.tasks.exclude(status='completed').exists()
    new_status = 'completed' if not has_uncompleted_tasks else 'active'

    if project.overall_progress != new_progress or project.status != new_status:
        project.overall_progress = new_progress
        project.status = new_status
        project.save(update_fields=['status', 'overall_progress'])
