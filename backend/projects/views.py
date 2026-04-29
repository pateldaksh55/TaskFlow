from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project
from .serializers import ProjectSerializer
from django.db.models import Q


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact'],
        'team_lead': ['exact'],
        'members': ['exact'],
    }
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title']

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(
            Q(members=user) |
            Q(created_by=user) |
            Q(team_lead=user) |
            Q(tasks__assigned_to=user)
        ).prefetch_related('members').distinct()

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        # Auto-add creator as member
        project.members.add(self.request.user)
