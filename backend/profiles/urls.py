from django.contrib.auth.views import LogoutView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, RegisterView, LoginView, MyProfileView, MessageViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)

router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view()), # Было 'api/register/'
    path('login/', LoginView.as_view()),       # Было 'api/login/'
    path('me/', MyProfileView.as_view()),      # Было 'api/me/'
    path('', LogoutView.as_view()),
]