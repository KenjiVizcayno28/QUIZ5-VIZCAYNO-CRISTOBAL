from django.contrib import admin
from django.urls import path
from conversation.views import chat_view
urlpatterns = [
    path('chat/', chat_view, name='chat'),
]