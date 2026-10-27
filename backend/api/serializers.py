from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "is_pinned", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}


class StrictBooleanField(serializers.BooleanField):
    def to_internal_value(self, data):
        if not isinstance(data, bool):
            raise serializers.ValidationError(self.error_messages["invalid"], code="invalid")
        return data


class NotePinSerializer(serializers.Serializer):
    is_pinned = StrictBooleanField()

    def validate(self, attrs):
        unexpected_fields = set(self.initial_data) - set(self.fields)
        if unexpected_fields:
            raise serializers.ValidationError(
                {"non_field_errors": ["Only is_pinned may be updated."]}
            )
        return attrs

    def update(self, instance, validated_data):
        instance.is_pinned = validated_data["is_pinned"]
        instance.save(update_fields=["is_pinned"])
        return instance
