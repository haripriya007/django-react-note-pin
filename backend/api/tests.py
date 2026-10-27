from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


from .models import Note


class NotePinApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="safe-password")
        self.other_user = User.objects.create_user(
            username="other-user", password="safe-password"
        )
        self.note = Note.objects.create(
            title="Important note", content="Keep this", author=self.owner
        )
        self.pin_url = reverse("note-pin-update", kwargs={"pk": self.note.pk})
        self.client.force_authenticate(user=self.owner)

    def test_notes_are_unpinned_by_default(self):
        self.assertFalse(self.note.is_pinned)

    def test_owner_can_pin_and_unpin_a_note(self):
        pin_response = self.client.patch(self.pin_url, {"is_pinned": True}, format="json")

        self.assertEqual(pin_response.status_code, status.HTTP_200_OK)
        self.assertTrue(pin_response.data["is_pinned"])
        self.note.refresh_from_db()
        self.assertTrue(self.note.is_pinned)

        unpin_response = self.client.patch(
            self.pin_url, {"is_pinned": False}, format="json"
        )

        self.assertEqual(unpin_response.status_code, status.HTTP_200_OK)
        self.assertFalse(unpin_response.data["is_pinned"])
        self.note.refresh_from_db()
        self.assertFalse(self.note.is_pinned)

    def test_pinned_state_is_returned_by_the_notes_list(self):
        self.client.patch(self.pin_url, {"is_pinned": True}, format="json")

        response = self.client.get(reverse("note-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["id"], self.note.pk)
        self.assertTrue(response.data[0]["is_pinned"])

    def test_unauthenticated_requests_are_rejected(self):
        self.client.force_authenticate(user=None)

        response = self.client.patch(self.pin_url, {"is_pinned": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_update_another_users_note(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.patch(self.pin_url, {"is_pinned": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.note.refresh_from_db()
        self.assertFalse(self.note.is_pinned)

    def test_pin_update_requires_a_boolean_value(self):
        response = self.client.patch(
            self.pin_url, {"is_pinned": "true"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_pinned", response.data)
        self.note.refresh_from_db()
        self.assertFalse(self.note.is_pinned)

    def test_pin_update_rejects_missing_or_disallowed_fields(self):
        missing_response = self.client.patch(self.pin_url, {}, format="json")
        disallowed_response = self.client.patch(
            self.pin_url,
            {"is_pinned": True, "title": "Renamed", "author": self.other_user.pk},
            format="json",
        )

        self.assertEqual(missing_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_pinned", missing_response.data)
        self.assertEqual(disallowed_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", disallowed_response.data)
        self.note.refresh_from_db()
        self.assertEqual(self.note.title, "Important note")
        self.assertEqual(self.note.author, self.owner)
        self.assertFalse(self.note.is_pinned)


class NoteApiRegressionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="safe-password")
        self.other_user = User.objects.create_user(
            username="other-user", password="safe-password"
        )
        self.client.force_authenticate(user=self.owner)

    def test_owner_can_create_list_and_delete_only_their_notes(self):
        create_response = self.client.post(
            reverse("note-list"),
            {"title": "New note", "content": "Created through the API"},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        note_id = create_response.data["id"]
        self.assertFalse(create_response.data["is_pinned"])
        other_note = Note.objects.create(
            title="Other note", content="Private", author=self.other_user
        )

        list_response = self.client.get(reverse("note-list"))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([note["id"] for note in list_response.data], [note_id])

        delete_response = self.client.delete(
            reverse("delete-note", kwargs={"pk": note_id})
        )

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=note_id).exists())
        self.assertTrue(Note.objects.filter(pk=other_note.pk).exists())
