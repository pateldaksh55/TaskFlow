from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'created_by', 'team_lead', 'created_at']
    list_filter = ['status']
    search_fields = ['title']
    filter_horizontal = ['members']
