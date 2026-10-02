'use client';

import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SubmissionCard } from '@/components/submissions/submissionCard';
import { Filters } from '@/components/submissions/filters';
import type { FilterDraft } from '@/components/submissions/filters';
import type { ServerApiResult } from '@/lib/server/submissions';
import { listUrl } from '@/lib/submission-filters';
import type { ListState } from '@/lib/submission-filters';
import type { Broker, PaginatedResponse, SubmissionListItem } from '@/lib/types';
import { WorkspaceLayout } from '@/components/submissions/workspaceLayout';
import { SubmitionPagination } from '@/components/submissions/submitionPagination';

interface SubmissionsWorkspaceProps {
  filters: ListState;
  submissions: ServerApiResult<PaginatedResponse<SubmissionListItem>>;
  brokers: ServerApiResult<Broker[]>;
}

export default function SubmissionsWorkspace({
  filters,
  submissions,
  brokers,
}: SubmissionsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchKey = JSON.stringify(filters);

  function navigate(href: string) {
    startTransition(() => router.push(href, { scroll: false }));
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  function applyFilters(draft: FilterDraft) {
    navigate(
      listUrl({
        ...draft,
        brokerId: brokers.ok ? draft.brokerId : filters.brokerId,
        page: 1,
      }),
    );
  }

  return (
    <WorkspaceLayout maxWidth="lg">
      <Box>
        <Typography component="h1" variant="h4" fontWeight={700}>
          Submissions
        </Typography>
        <Typography color="text.secondary">
          Review broker opportunities and their latest context.
        </Typography>
      </Box>

      <Filters
        key={searchKey}
        filters={filters}
        brokers={brokers.ok ? brokers.data : undefined}
        brokersError={!brokers.ok}
        onApply={applyFilters}
        onReset={() => navigate('/submissions')}
        onRetryBrokers={refresh}
      />

      {!submissions.ok ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={refresh} type="button" disabled={isPending}>
              Retry submissions
            </Button>
          }
        >
          Could not load submissions. Check the backend connection and retry.
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Typography role="status" fontWeight={600}>
            {submissions.data.count} {submissions.data.count === 1 ? 'submission' : 'submissions'}
          </Typography>

          {submissions.data.results.length === 0 ? (
            <Stack spacing={1} alignItems="flex-start">
              <Typography>No submissions match these filters.</Typography>
            </Stack>
          ) : (
            <Box
              component="ul"
              aria-label="Submissions"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {submissions.data.results.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  href={`/submissions/${submission.id}?returnTo=${encodeURIComponent(listUrl(filters))}`}
                />
              ))}
            </Box>
          )}

          {submissions.data.count > 0 && (
            <SubmitionPagination
              page={filters.page}
              count={submissions.data.count}
              hasPrevious={Boolean(submissions.data.previous)}
              hasNext={Boolean(submissions.data.next)}
              isFetching={isPending}
              onPageChange={(page) => navigate(listUrl({ ...filters, page }))}
            />
          )}
        </Stack>
      )}
    </WorkspaceLayout>
  );
}
