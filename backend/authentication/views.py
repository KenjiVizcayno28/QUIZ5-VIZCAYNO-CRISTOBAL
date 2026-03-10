from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import MyTokenObtainPairSerializer, RegisterSerializer


@api_view(["POST"])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        status=status.HTTP_201_CREATED,
    )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
