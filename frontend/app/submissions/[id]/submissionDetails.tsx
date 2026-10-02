'use client';

import { Alert, Box, Button, Chip, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SubmissionCompanyMeta } from '@/components/submissions/companyMeta';
import { SubmissionSection } from '@/components/submissions/submissionSection';
import { SubmissionStatusChip } from '@/components/submissions/statusChip';
import { documentUrl, returnUrl } from '@/lib/detail-navigation';
import { formatDate } from '@/lib/format-date';
import type { ServerApiResult } from '@/lib/server/submissions';
import type { SubmissionDetail } from '@/lib/types';
import { WorkspaceLayout } from '@/components/submissions/workspaceLayout';

interface SubmissionDetailWorkspaceProps {
  returnTo?: string;
  result: ServerApiResult<SubmissionDetail> | null;
}

export default function SubmissionDetails({ returnTo, result }: SubmissionDetailWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const notFound = result !== null && !result.ok && result.status === 404;

  function retry() {
    startTransition(() => router.refresh());
  }

  return (
    <WorkspaceLayout maxWidth="md" spacing={3} overflowWrap="anywhere">
      <MuiLink
        component={Link}
        href={returnUrl(returnTo ?? null)}
        sx={{
          display: 'inline-flex',
          minHeight: 44,
          alignItems: 'center',
          alignSelf: 'flex-start',
        }}
      >
        Back to list
      </MuiLink>

      {result === null ? (
        <Alert severity="warning">Invalid submission ID.</Alert>
      ) : !result.ok ? (
        <Alert
          severity={notFound ? 'warning' : 'error'}
          action={
            !notFound ? (
              <Button color="inherit" onClick={retry} disabled={isPending}>
                Retry submission
              </Button>
            ) : undefined
          }
        >
          {notFound
            ? 'Submission not found.'
            : 'Could not load submission. Check the backend connection and retry.'}
        </Alert>
      ) : (
        <>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={700}>
              {result.data.company.legalName}
            </Typography>
            <SubmissionCompanyMeta
              industry={result.data.company.industry}
              headquartersCity={result.data.company.headquartersCity}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              <SubmissionStatusChip status={result.data.status} size="medium" />
              <Chip variant="outlined" label={`Priority: ${result.data.priority}`} />
            </Stack>
          </Box>

          <SubmissionSection title="Summary">
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {result.data.summary || 'No summary provided.'}
            </Typography>
            <Typography>Broker: {result.data.broker.name}</Typography>
            <Typography>
              Broker email: {result.data.broker.primaryContactEmail || 'Not provided'}
            </Typography>
            <Typography>
              Owner: {result.data.owner.fullName} · {result.data.owner.email}
            </Typography>
            <Typography color="text.secondary">
              Created {formatDate(result.data.createdAt)} · Updated{' '}
              {formatDate(result.data.updatedAt)}
            </Typography>
          </SubmissionSection>

          <SubmissionSection title="Contacts">
            {result.data.contacts.length === 0 ? (
              <Typography>No contacts provided.</Typography>
            ) : (
              result.data.contacts.map((contact) => (
                <Box key={contact.id}>
                  <Typography fontWeight={600}>{contact.name}</Typography>
                  <Typography>{contact.role || 'Role not provided'}</Typography>
                  <Typography>
                    Email: {contact.email || 'Not provided'} · Phone:{' '}
                    {contact.phone || 'Not provided'}
                  </Typography>
                </Box>
              ))
            )}
          </SubmissionSection>

          <SubmissionSection title="Documents">
            {result.data.documents.length === 0 ? (
              <Typography>No documents provided.</Typography>
            ) : (
              result.data.documents.map((document) => {
                const url = documentUrl(document.fileUrl);
                return (
                  <Box key={document.id}>
                    {url ? (
                      <MuiLink
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
                      >
                        {document.title}
                      </MuiLink>
                    ) : (
                      <Typography>{document.title} · Link unavailable</Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {document.docType} · Uploaded {formatDate(document.uploadedAt)}
                    </Typography>
                  </Box>
                );
              })
            )}
          </SubmissionSection>

          <SubmissionSection title="Notes">
            {result.data.notes.length === 0 ? (
              <Typography>No notes yet.</Typography>
            ) : (
              result.data.notes.map((note) => (
                <Box key={note.id} sx={{ borderLeft: 2, borderColor: 'divider', pl: 2 }}>
                  <Typography fontWeight={600}>{note.authorName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(note.createdAt)}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{note.body}</Typography>
                </Box>
              ))
            )}
          </SubmissionSection>
        </>
      )}
    </WorkspaceLayout>
  );
}
