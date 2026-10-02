'use client';

import { Box, Button, Card, CardContent, MenuItem, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { submissionStatusOptions } from '@/components/submissions/statusChip';
import { readFilters } from '@/lib/submission-filters';
import type { Broker, SubmissionListFilters, SubmissionStatus } from '@/lib/types';

export type FilterDraft = Pick<SubmissionListFilters, 'status' | 'brokerId' | 'companySearch'>;

interface SubmissionFiltersProps {
  filters: ReturnType<typeof readFilters>;
  brokers?: Broker[];
  brokersError: boolean;
  onApply: (filters: FilterDraft) => void;
  onReset: () => void;
  onRetryBrokers: () => void;
}

export function Filters({
  filters,
  brokers,
  brokersError,
  onApply,
  onReset,
  onRetryBrokers,
}: SubmissionFiltersProps) {
  const [status, setStatus] = useState<SubmissionStatus | ''>(filters.status ?? '');
  const [brokerId, setBrokerId] = useState(filters.brokerId ?? '');
  const [companySearch, setCompanySearch] = useState(filters.companySearch ?? '');

  const brokerMissing =
    filters.brokerId && !brokers?.some((broker) => String(broker.id) === filters.brokerId);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({
      status: status || undefined,
      brokerId: brokerId || undefined,
      companySearch: companySearch || undefined,
    });
  }

  function reset() {
    setStatus('');
    setBrokerId('');
    setCompanySearch('');
    onReset();
  }

  return (
    <Card component="section" variant="outlined" aria-label="Submission filters">
      <CardContent>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Status"
                name="status"
                value={status}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                onChange={(event) => setStatus(event.target.value as SubmissionStatus | '')}
                fullWidth
              >
                <MenuItem value="">All statuses</MenuItem>
                {submissionStatusOptions.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Broker"
                name="brokerId"
                value={brokerId}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                onChange={(event) => setBrokerId(event.target.value)}
                fullWidth
                disabled={!brokers}
                helperText={
                  brokersError ? 'Broker options unavailable.' : 'Filter by submitting broker.'
                }
              >
                <MenuItem value="">All brokers</MenuItem>
                {brokerMissing && (
                  <MenuItem value={filters.brokerId}>Broker #{filters.brokerId}</MenuItem>
                )}
                {brokers?.map((broker) => (
                  <MenuItem key={broker.id} value={String(broker.id)}>
                    {broker.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Company search"
                name="companySearch"
                type="search"
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                autoComplete="off"
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { minHeight: 56 } }}
                helperText="Search legal company name."
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" type="submit">
                Apply filters
              </Button>
              <Button type="button" onClick={reset}>
                Reset filters
              </Button>
              {brokersError && (
                <Button type="button" onClick={onRetryBrokers}>
                  Retry brokers
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
