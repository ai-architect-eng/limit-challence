import Chip from '@mui/material/Chip';
import type { SubmissionStatus } from '@/lib/types';

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  new: 'New',
  in_review: 'In review',
  closed: 'Closed',
  lost: 'Lost',
};

export const submissionStatusOptions: readonly {
  value: SubmissionStatus;
  label: string;
}[] = [
  { value: 'new', label: submissionStatusLabels.new },
  { value: 'in_review', label: submissionStatusLabels.in_review },
  { value: 'closed', label: submissionStatusLabels.closed },
  { value: 'lost', label: submissionStatusLabels.lost },
];

interface SubmissionStatusChipProps {
  status: SubmissionStatus;
  size?: 'small' | 'medium';
}

export function SubmissionStatusChip({ status, size = 'small' }: SubmissionStatusChipProps) {
  return <Chip label={submissionStatusLabels[status]} size={size} />;
}
