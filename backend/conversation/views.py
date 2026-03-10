import os

from django.contrib.auth.models import AnonymousUser
from google import genai
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
MODEL_NAME = "gemini-2.5-flash-lite"

SYSTEM_PROMPT = """
You are an expert but friendly programming tutor specializing in:
- Python and the Django / Django REST Framework ecosystem
- JavaScript and the React.js ecosystem (hooks, components, state)

Your teaching style:
- Use clear, beginner-friendly language and avoid unnecessary jargon.
- Use short analogies or real-world examples to clarify concepts.
- When showing code, add brief inline comments explaining each key line.
- Keep answers focused and concise - avoid overwhelming beginners.
- Be encouraging: mistakes are a normal part of learning.

Scope -- THIS IS A STRICT RULE, NO EXCEPTIONS:
- You ONLY answer questions about Python, Django, JavaScript, and React.js.
- If the user asks about ANY other technology, framework, or topic - including but not limited to: Vue, Angular, Svelte, PHP, Ruby, Java, C++, machine learning, databases, CSS frameworks, cloud services, or anything else - you MUST REFUSE.
- When refusing, respond with EXACTLY this message and nothing else:
"I'm sorry! I'm only able to help with Python, Django, JavaScript, and React. Please ask me something new."
- Do NOT provide a partial answer then refuse. Do NOT make exceptions for "related" or "similar" topics. REFUSE immediately and completely.
"""


@api_view(["POST"])
def chat_view(request):
    user = request.user
    if isinstance(user, AnonymousUser):
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    title = request.data.get("title", "New Conversation").strip() or "New Conversation"
    user_message = request.data.get("message", "").strip()
    if not user_message:
        return Response(
            {"detail": "'message' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    conversation = Conversation.objects.create(title=title, user=user)
    Message.objects.create(
        conversation=conversation,
        role=Message.ROLE_USER,
        content=user_message,
    )

    try:
        full_message = f"{SYSTEM_PROMPT}\n\nUser question: {user_message}"
        ai_response = client.models.generate_content(model=MODEL_NAME, contents=full_message)
        ai_reply = ai_response.text or ""
    except Exception as error:
        return Response(
            {"detail": f"Failed to get response from AI model: {error}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    Message.objects.create(
        conversation=conversation,
        role=Message.ROLE_ASSISTANT,
        content=ai_reply,
    )

    serialized = ConversationSerializer(conversation)
    return Response(serialized.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def conversation_list_view(request):
    user = request.user
    if isinstance(user, AnonymousUser):
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    conversations = Conversation.objects.filter(user=user).order_by("-updated_at")
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def conversation_detail_view(request, id):
    user = request.user
    if isinstance(user, AnonymousUser):
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        conversation = Conversation.objects.get(id=id, user=user)
    except Conversation.DoesNotExist:
        return Response(
            {"detail": "Conversation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ConversationSerializer(conversation)
    return Response(serializer.data, status=status.HTTP_200_OK)