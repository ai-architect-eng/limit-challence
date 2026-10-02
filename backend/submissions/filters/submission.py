from django import forms
from django_filters import rest_framework as filters

from backend.submissions.models import Submission


class IntegerFilter(filters.Filter):
    field_class = forms.IntegerField


class SubmissionFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Submission.Status.choices)
    brokerId = IntegerFilter(field_name="broker_id", min_value=1)
    companySearch = filters.CharFilter(field_name="company__legal_name", lookup_expr="icontains")

    class Meta:
        model = Submission
        fields = []
