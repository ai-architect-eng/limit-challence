from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from submissions.views import BrokerListView, SubmissionViewSet

router = DefaultRouter()
router.register("submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/brokers/", BrokerListView.as_view(), name="broker-list"),
    path("api/", include(router.urls)),
]
