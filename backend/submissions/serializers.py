from rest_framework import serializers

from backend.submissions.models import Broker, Company, Contact, Document, Note, Submission, TeamMember


class BrokerSerializer(serializers.ModelSerializer):
    primary_contact_email = serializers.SerializerMethodField()

    class Meta:
        model = Broker
        fields = ("id", "name", "primary_contact_email")

    def get_primary_contact_email(self, obj):
        return obj.primary_contact_email or None


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "legal_name", "industry", "headquarters_city")


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ("id", "full_name", "email")


class NotePreviewSerializer(serializers.Serializer):
    author_name = serializers.CharField()
    body_preview = serializers.CharField()
    created_at = serializers.DateTimeField()


class SubmissionBaseSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    broker = BrokerSerializer(read_only=True)
    owner = TeamMemberSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id", "status", "priority", "summary", "created_at", "updated_at",
            "company", "broker", "owner",
        )


class SubmissionListSerializer(SubmissionBaseSerializer):
    document_count = serializers.IntegerField(read_only=True)
    note_count = serializers.IntegerField(read_only=True)
    latest_note = serializers.SerializerMethodField()

    class Meta(SubmissionBaseSerializer.Meta):
        fields = SubmissionBaseSerializer.Meta.fields + ("document_count", "note_count", "latest_note")

    def get_latest_note(self, obj):
        if obj.latest_note_created_at is None:
            return None
        return NotePreviewSerializer({
            "author_name": obj.latest_note_author,
            "body_preview": obj.latest_note_body[:160],
            "created_at": obj.latest_note_created_at,
        }).data


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ("id", "name", "role", "email", "phone")


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("id", "title", "doc_type", "uploaded_at", "file_url")


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "author_name", "body", "created_at")


class SubmissionDetailSerializer(SubmissionBaseSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)

    class Meta(SubmissionBaseSerializer.Meta):
        fields = SubmissionBaseSerializer.Meta.fields + ("contacts", "documents", "notes")
