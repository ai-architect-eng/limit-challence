import { Box, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { SubmissionCompanyMeta } from '@/components/submissions/companyMeta';
import { SubmissionStatusChip } from '@/components/submissions/statusChip';
import { formatDate } from '@/lib/format-date';
import type { SubmissionListItem } from '@/lib/types';

interface SubmissionCardProps {
  submission: SubmissionListItem;
  href: string;
}

export function SubmissionCard({ submission, href }: SubmissionCardProps) {
  return (
    <Card component="li" variant="outlined" sx={{ minWidth: 0 }}>
      <CardContent>
        <Stack spacing={1.5} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
            <Typography component="h2" variant="h6" sx={{ minWidth: 0 }}>
              <MuiLink
                component={Link}
                href={href}
                sx={{
                  display: 'inline-flex',
                  minHeight: 44,
                  alignItems: 'center',
                  overflowWrap: 'anywhere',
                }}
              >
                {submission.company.legalName}
              </MuiLink>
            </Typography>
            <SubmissionStatusChip status={submission.status} />
          </Stack>
          <SubmissionCompanyMeta {...submission.company} />
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {submission.summary || 'No summary provided.'}
          </Typography>
          <Typography variant="body2">
            Broker: {submission.broker.name} · Owner: {submission.owner.fullName}
          </Typography>
          <Typography variant="body2">
            Priority: {submission.priority} · Created {formatDate(submission.createdAt)}
          </Typography>
          <Typography variant="body2">
            {submission.documentCount} documents · {submission.noteCount} notes
          </Typography>
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {submission.latestNote
                ? `${submission.latestNote.authorName}: ${submission.latestNote.bodyPreview}`
                : 'No notes yet.'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
