from django.urls import path

from .views import MyTokenObtainPairView, register_view

urlpatterns = [
    path("signup/", register_view, name="auth-signup"),
    path("signin/", MyTokenObtainPairView.as_view(), name="auth-signin"),
]
