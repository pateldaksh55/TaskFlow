from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment, TaskHistory
from accounts.serializers import UserSerializer


class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by_detail = UserSerializer(source='changed_by', read_only=True)

    class Meta:
        model = TaskHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by', 'changed_by_detail', 'changed_at']
        read_only_fields = ['changed_by', 'changed_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    commented_by_detail = UserSerializer(source='commented_by', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'commented_by', 'commented_by_detail', 'parent', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['task', 'commented_by', 'created_at', 'updated_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserSerializer(source='uploaded_by', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'uploaded_by', 'uploaded_by_detail', 'file', 'file_name', 'uploaded_at']
        read_only_fields = ['uploaded_by', 'uploaded_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    assigned_by_detail = UserSerializer(source='assigned_by', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    dependencies = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all(), many=True, required=False)
    tags_list = serializers.ListField(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    def validate_dependencies(self, value):
        if self.instance and self.instance in value:
            raise serializers.ValidationError('A task cannot depend on itself.')

        def has_cycle(task, target, visited):
            if task == target:
                return True
            for dep in task.dependencies.all():
                if dep.pk not in visited:
                    visited.add(dep.pk)
                    if has_cycle(dep, target, visited):
                        return True
            return False

        if self.instance:
            for dep in value:
                if has_cycle(dep, self.instance, {dep.pk}):
                    raise serializers.ValidationError('Circular dependency detected.')

        return value

    class Meta:
        model = Task
        fields = [
            'id', 'display_id', 'title', 'description',
            'project', 'project_title',
            'assigned_to', 'assigned_to_detail',
            'assigned_by', 'assigned_by_detail',
            'status', 'priority', 'progress',
            'due_date', 'estimated_hours', 'actual_hours',
            'tags', 'tags_list',
            'dependencies', 'dependency_remark',
            'change_request_no', 'change_request_type',
            'comments', 'attachments', 'history',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['assigned_by', 'display_id', 'created_at', 'updated_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views (no nested comments/attachments)"""
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'display_id', 'title', 'project', 'project_title',
            'assigned_to', 'assigned_to_detail',
            'status', 'priority', 'progress',
            'due_date', 'tags', 'comment_count',
            'created_at', 'updated_at',
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()
