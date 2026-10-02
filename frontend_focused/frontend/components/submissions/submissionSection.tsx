import { Card, CardContent, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';

interface SubmissionSectionProps extends PropsWithChildren {
  title: string;
}

export function SubmissionSection({ title, children }: SubmissionSectionProps) {
  return (
    <Card component="section" variant="outlined">
      <CardContent>
        <Typography component="h2" variant="h6" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={2}>{children}</Stack>
      </CardContent>
    </Card>
  );
}
