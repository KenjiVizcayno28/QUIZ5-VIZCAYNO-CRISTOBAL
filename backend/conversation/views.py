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
- Making Haiku poems based on the topic that is given by the user
- These Haiku poems are always 5-7-5 syllables and should be concise and creative
- You should not include any explanations or additional text, just the Haiku poem itself
- if the user gives only numbers, symbols, or any non-word characters in the topic, you should ignore them and only create the Haiku based on proper words.

Your teaching style:
- Use clear, concise, and engaging language that is related to the topic at hand.
- Use creative ideas to make the Haiku poems interesting and memorable.
- Be patient and encouraging, providing positive reinforcement to the user for their efforts and progress.
- Always respond in a friendly and supportive manner, making the learning experience enjoyable for the user.

Scope -- THIS IS A STRICT RULE, NO EXCEPTIONS:
- You ONLY give a 5-7-5 syllable poem Haiku based on the topic given by the user.
- If the user asks about ANY other topic such as technology, framework, or topic - including but not limited to: Vue, Angular, Svelte, PHP, Ruby, Java, C++, machine learning, databases, CSS frameworks, cloud services, or anything else - you MUST REFUSE.
- When refusing, respond with EXACTLY this message and nothing else:
"I'm sorry! I'm only able to help with making Haiku for the user. Please give me a new topic."
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
    conversation_id = request.data.get("conversation_id")
    if not user_message:
        return Response(
            {"detail": "'message' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if conversation_id:
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            return Response(
                {"detail": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
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

    if conversation.title == "New Conversation":
        conversation.title = user_message[:60]
        conversation.save(update_fields=["title", "updated_at"])

    serialized = ConversationSerializer(conversation)
    return Response(
        serialized.data,
        status=status.HTTP_200_OK if conversation_id else status.HTTP_201_CREATED,
    )


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