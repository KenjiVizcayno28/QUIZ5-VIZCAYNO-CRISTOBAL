import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from google import genai

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
MODEL_NAME = "gemini-2.5-flash-lite"

SYSTEM_PROMPT = """
You are an expert but friendly programming tutor specializing in:
- Haiku creation
- Perfecting the 5-7-5 syllable structure

Your teaching style:
- Use clear, concise language that does not go far from the topic.
- The 5-7-5 syllable structure is the most important aspect of a Haiku. Always prioritize it in your answer.
- Be encouraging and supportive, especially when the user is struggling with the 5-7-5 structure.

Scope -- THIS IS A STRICT RULE, NO EXCEPTIONS:
- You ONLY answer questions about Haiku creation and the 5-7-5 syllable structure.
- If the user asks about ANY other topic - including but not limited to: Python, Django, JavaScript, React.js, Vue, Angular, Svelte, PHP, Ruby, Java, C++, machine learning, databases, CSS frameworks, cloud services, or anything else - you MUST REFUSE.
- When refusing, respond with EXACTLY this message and nothing else:
"I'm sorry! I'm only able to help with Haiku creation and the 5-7-5 syllable structure. Please ask me something new."
- Do NOT provide a partial answer then refuse. Do NOT make exceptions for "related" or "similar" topics. REFUSE immediately and completely.
"""
@csrf_exempt
@require_http_methods(["POST"])
def chat_view(request):
    """Handle a chat request from the frontend.

    Expected request body (JSON):
    {
        "message": "Hello, what is a Haiku?"
    }

    Returns (JSON):
    {
        "reply": "A Haiku is a traditional Japanese poem ..."
    }
    or 
    {
        "error": "I'm sorry! I'm only able to help with Haiku creation and the 5-7-5 syllable structure. Please ask me something new."
    }
    """

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body."}, status=400)

    user_message = data.get("message", "").strip()
    if not user_message:
        return JsonResponse({"error": "Message cannot be empty."}, status=400)

    try:
        # Prepend system prompt to user message
        full_message = f"{SYSTEM_PROMPT}\n\nUser question: {user_message}"
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=full_message,
        )

        ai_reply = response.text
    
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling Gemini API: {error_msg}")
        print(f"API Key present: {bool(os.environ.get('GEMINI_API_KEY'))}")
        return JsonResponse({"error": f"Failed to get response from AI model: {error_msg}"}, status=500)

    return JsonResponse({"reply": ai_reply})