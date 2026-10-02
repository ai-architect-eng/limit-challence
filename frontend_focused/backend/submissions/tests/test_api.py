from datetime import timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APITestCase

from submissions.models import Broker, Company, Contact, Document, Note, Submission, TeamMember


class SubmissionApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.broker = Broker.objects.create(name="Apollo", primary_contact_email="broker@example.com")
        cls.other_broker = Broker.objects.create(name="Zenith")
        cls.company = Company.objects.create(
            legal_name="Acme Insurance", industry="Insurance", headquarters_city="London"
        )
        cls.owner = TeamMember.objects.create(full_name="Alex Owner", email="owner@example.com")
        cls.record = Submission.objects.create(
            company=cls.company, broker=cls.broker, owner=cls.owner,
            status="new", priority="high", summary="Review coverage", created_at=timezone.now()
        )
        cls.contact = Contact.objects.create(
            submission=cls.record, name="Jamie Contact", role="CFO", email="jamie@example.com", phone=""
        )
        for title in ("Contract", "Spreadsheet"):
            Document.objects.create(
                submission=cls.record, title=title, doc_type=title,
                file_url="https://example.com/document"
            )
        old = timezone.now() - timedelta(days=1)
        Note.objects.create(submission=cls.record, author_name="Old author", body="Old note", created_at=old)
        cls.note = Note.objects.create(
            submission=cls.record, author_name="Latest author", body="x" * 200,
            created_at=old + timedelta(hours=1)
        )
        cls.other = Submission.objects.create(
            company=cls.company, broker=cls.other_broker, owner=cls.owner,
            status="in_review", summary="No related records", created_at=old
        )

    def test_list_wire_contract_counts_and_latest_note(self):
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["count"], 2)
        self.assertEqual(set(body), {"count", "next", "previous", "results"})
        row = body["results"][0]
        self.assertEqual(row["id"], self.record.id)
        self.assertEqual(row["company"]["legalName"], "Acme Insurance")
        self.assertEqual(row["broker"]["primaryContactEmail"], "broker@example.com")
        self.assertEqual(row["owner"]["fullName"], "Alex Owner")
        self.assertEqual(row["documentCount"], 2)
        self.assertEqual(row["noteCount"], 2)
        self.assertEqual(row["latestNote"]["authorName"], "Latest author")
        self.assertEqual(row["latestNote"]["bodyPreview"], "x" * 160)
        self.assertIn("createdAt", row["latestNote"])
        self.assertNotIn("created_at", row)
        empty = body["results"][1]
        self.assertEqual(empty["documentCount"], 0)
        self.assertEqual(empty["noteCount"], 0)
        self.assertIsNone(empty["latestNote"])

    def test_detail_returns_all_related_records(self):
        response = self.client.get(f"/api/submissions/{self.record.id}/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["summary"], "Review coverage")
        self.assertEqual(body["contacts"][0]["name"], "Jamie Contact")
        self.assertEqual(len(body["documents"]), 2)
        self.assertIn("fileUrl", body["documents"][0])
        self.assertEqual(body["notes"][0]["body"], "x" * 200)
        self.assertEqual(body["notes"][0]["authorName"], "Latest author")
        self.assertNotIn("latestNote", body)

    def test_brokers_are_an_unpaginated_sorted_array(self):
        response = self.client.get("/api/brokers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            {"id": self.broker.id, "name": "Apollo", "primaryContactEmail": "broker@example.com"},
            {"id": self.other_broker.id, "name": "Zenith", "primaryContactEmail": None},
        ])

    def test_required_filters_combine_and_company_search_is_case_insensitive(self):
        response = self.client.get("/api/submissions/", {
            "status": "new", "brokerId": self.broker.id, "companySearch": "  ACME  "
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.json()["results"]], [self.record.id])
        for filters, expected in (
            ({"status": "in_review"}, [self.other.id]),
            ({"brokerId": self.other_broker.id}, [self.other.id]),
            ({"companySearch": "nonexistent"}, []),
            ({"brokerId": self.other_broker.id, "status": "new"}, []),
        ):
            with self.subTest(filters=filters):
                result = self.client.get("/api/submissions/", filters)
                self.assertEqual(result.status_code, 200)
                self.assertEqual([row["id"] for row in result.json()["results"]], expected)

    def test_invalid_filters_return_400(self):
        for filters in ({"status": "invalid"}, {"brokerId": "abc"}, {"brokerId": "1.5"}, {"brokerId": "0"}):
            with self.subTest(filters=filters):
                self.assertEqual(self.client.get("/api/submissions/", filters).status_code, 400)

    def test_pagination_is_stable_and_page_size_is_ten(self):
        stamp = self.other.created_at - timedelta(days=1)
        extras = [Submission.objects.create(
            company=self.company, broker=self.broker, owner=self.owner, created_at=stamp
        ) for _ in range(10)]
        first = self.client.get("/api/submissions/").json()
        second = self.client.get("/api/submissions/", {"page": 2}).json()
        self.assertEqual(first["count"], 12)
        self.assertEqual(len(first["results"]), 10)
        self.assertEqual(len(second["results"]), 2)
        self.assertIsNotNone(first["next"])
        self.assertIsNotNone(second["previous"])
        ids = [row["id"] for row in first["results"] + second["results"]]
        self.assertEqual(ids, [self.record.id, self.other.id] + [obj.id for obj in reversed(extras)])
        self.assertEqual(self.client.get("/api/submissions/", {"page": 999}).status_code, 404)

    def test_detail_404_and_empty_arrays(self):
        self.assertEqual(self.client.get("/api/submissions/999999/").status_code, 404)
        body = self.client.get(f"/api/submissions/{self.other.id}/").json()
        self.assertEqual([body["contacts"], body["documents"], body["notes"]], [[], [], []])

    def test_post_is_not_allowed(self):
        self.assertEqual(self.client.post("/api/submissions/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.post("/api/brokers/", {}, format="json").status_code, 405)

    def test_latest_note_uses_id_as_timestamp_tiebreaker(self):
        latest = Note.objects.create(
            submission=self.record, author_name="Tie winner", body="Newest by id", created_at=self.note.created_at
        )
        row = self.client.get("/api/submissions/").json()["results"][0]
        self.assertEqual(row["latestNote"]["bodyPreview"], latest.body)
        self.assertEqual(row["noteCount"], 3)

    def test_list_query_count_does_not_grow_with_rows(self):
        for _ in range(5):
            record = Submission.objects.create(company=self.company, broker=self.broker, owner=self.owner)
            Note.objects.create(submission=record, author_name="Author", body="Context")
            Document.objects.create(submission=record, title="File", doc_type="Contract")
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get("/api/submissions/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json()["results"]), 7)
        self.assertEqual(len(queries), 2, [query["sql"] for query in queries])

    def test_detail_uses_one_query_plus_three_prefetches(self):
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(f"/api/submissions/{self.record.id}/")
            self.assertEqual(response.status_code, 200)
            response.json()
        self.assertEqual(len(queries), 4, [query["sql"] for query in queries])

    def test_database_path_can_be_overridden_for_isolated_browser_runs(self):
        import os
        import runpy
        from pathlib import Path
        from unittest.mock import patch

        settings_path = Path(__file__).resolve().parents[2] / "server" / "settings.py"
        with patch.dict(os.environ, {"SUBMISSION_TRACKER_DB": "/isolated/submissions.sqlite3"}):
            settings = runpy.run_path(str(settings_path))
        self.assertEqual(settings["DATABASES"]["default"]["NAME"], "/isolated/submissions.sqlite3")
