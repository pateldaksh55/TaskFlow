from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import TaskViewSet, TaskCommentViewSet, TaskAttachmentViewSet

router = DefaultRouter()
router.register(r'', TaskViewSet, basename='task')

# Nested routes: /api/tasks/{task_pk}/comments/ and /attachments/
tasks_router = nested_routers.NestedDefaultRouter(router, r'', lookup='task')
tasks_router.register(r'comments', TaskCommentViewSet, basename='task-comments')
tasks_router.register(r'attachments', TaskAttachmentViewSet, basename='task-attachments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tasks_router.urls)),
]
