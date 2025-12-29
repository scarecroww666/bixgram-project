from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Message

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Profile
        fields = ['user', 'username', 'email', 'location', 'bio', 'avatar']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'text', 'timestamp']
        read_only_fields = ['sender']  # Отправителя ставит сервер сам


class RegisterSerializer(serializers.ModelSerializer):
    location = serializers.CharField(write_only=True, required=False)
    bio = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        # Убедись, что 'email' включен в список полей
        fields = ('username', 'password', 'email', 'location', 'bio')

    def create(self, validated_data):
        # 1. Извлекаем данные профиля
        location = validated_data.pop('location', '')
        bio = validated_data.pop('bio', '')

        # 2. Извлекаем email (если он пустой, ставим пустую строку)
        email = validated_data.get('email', '')

        # 3. Создаем юзера со ВСЕМИ данными, включая email
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=email  # ЭТО ГАРАНТИРУЕТ СОХРАНЕНИЕ ПОЧТЫ
        )

        # 4. Создаем профиль
        Profile.objects.create(user=user, location=location, bio=bio)

        return user