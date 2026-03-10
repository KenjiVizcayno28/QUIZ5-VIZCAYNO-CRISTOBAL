from django.urls import path

from conversation.views import (
    chat_view,
    conversation_detail_view,
    conversation_list_view,
)

urlpatterns = [
    path('conversation/', chat_view, name='conversation-create'),
    path('conversations/', conversation_list_view, name='conversation-list'),
    path('conversations/<int:id>/', conversation_detail_view, name='conversation-detail'),
]