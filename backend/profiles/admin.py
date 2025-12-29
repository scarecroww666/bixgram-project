from django.contrib import admin
from .models import Profile, Message

admin.site.register(Message)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    # Добавляем колонку почты из связанной модели User в общий список
    list_display = ['user', 'get_email', 'location']

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email' # Название колонки