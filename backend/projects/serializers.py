from rest_framework import serializers
from .models import Project
from accounts.serializers import UserSerializer


class ProjectSerializer(serializers.ModelSerializer):
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    team_lead_detail = UserSerializer(source='team_lead', read_only=True)
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    overall_progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'color',
            'created_by', 'created_by_detail',
            'team_lead', 'team_lead_detail',
            'members', 'members_detail',
            'start_date', 'end_date',
            'overall_progress', 'task_count', 'completed_task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'overall_progress']
