from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Task, TaskComment, TaskAttachment, TaskHistory
from .serializers import TaskSerializer, TaskListSerializer, TaskCommentSerializer, TaskAttachmentSerializer


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact'],
        'priority': ['exact'],
        'project': ['exact'],
        'assigned_to': ['exact'],
        'assigned_by': ['exact'],
        'due_date': ['gte', 'lte'],
    }
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'due_date', 'priority', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.filter(
            Q(assigned_to=user) | Q(assigned_by=user) | Q(project__members=user)
        ).select_related('project', 'assigned_to', 'assigned_by').prefetch_related('dependencies', 'comments', 'attachments').distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    def perform_update(self, serializer):
        task = self.get_object()
        old_status = task.status
        updated_task = serializer.save()

        if old_status != updated_task.status:
            TaskHistory.objects.create(
                task=updated_task,
                old_status=old_status,
                new_status=updated_task.status,
                changed_by=self.request.user,
            )

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        tasks = Task.objects.filter(
            Q(assigned_to=user) | Q(project__members=user)
        ).distinct()

        stats = {
            'total': tasks.count(),
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'in_review': tasks.filter(status='in_review').count(),
            'completed': tasks.filter(status='completed').count(),
            'blocked': tasks.filter(status='blocked').count(),
            'urgent': tasks.filter(priority='urgent').count(),
        }

        urgent_tasks = tasks.filter(priority='urgent').exclude(status='completed')[:5]
        recent_tasks = tasks.order_by('-created_at')[:5]

        return Response({
            'stats': stats,
            'urgent_tasks': TaskListSerializer(urgent_tasks, many=True).data,
            'recent_tasks': TaskListSerializer(recent_tasks, many=True).data,
        })


class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskComment.objects.filter(task__id=self.kwargs.get('task_pk'))

    def perform_create(self, serializer):
        task = Task.objects.get(pk=self.kwargs['task_pk'])
        serializer.save(commented_by=self.request.user, task=task)


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskAttachment.objects.filter(task__id=self.kwargs.get('task_pk'))

    def perform_create(self, serializer):
        task = Task.objects.get(pk=self.kwargs['task_pk'])
        file = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            task=task,
            file_name=file.name if file else 'unknown'
        )
