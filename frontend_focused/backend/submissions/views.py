from django.db.models import Count, OuterRef, Prefetch, Subquery
from rest_framework.generics import ListAPIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from submissions.filters.submission import SubmissionFilter
from submissions.models import Broker, Note, Submission
from submissions.serializers import BrokerSerializer, SubmissionDetailSerializer, SubmissionListSerializer


class SubmissionViewSet(ReadOnlyModelViewSet):
    queryset = Submission.objects.all()
    filterset_class = SubmissionFilter

    def get_serializer_class(self):
        return SubmissionListSerializer if self.action == "list" else SubmissionDetailSerializer

    def get_queryset(self):
        queryset = Submission.objects.select_related("company", "broker", "owner").order_by("-created_at", "-id")
        if self.action == "list":
            latest = Note.objects.filter(submission_id=OuterRef("pk")).order_by("-created_at", "-id")
            return queryset.annotate(
                document_count=Count("documents", distinct=True),
                note_count=Count("notes", distinct=True),
                latest_note_author=Subquery(latest.values("author_name")[:1]),
                latest_note_body=Subquery(latest.values("body")[:1]),
                latest_note_created_at=Subquery(latest.values("created_at")[:1]),
            )
        return queryset.prefetch_related(
            "contacts", "documents",
            Prefetch("notes", queryset=Note.objects.order_by("-created_at", "-id")),
        )


class BrokerListView(ListAPIView):
    queryset = Broker.objects.order_by("name", "id")
    serializer_class = BrokerSerializer
    pagination_class = None
