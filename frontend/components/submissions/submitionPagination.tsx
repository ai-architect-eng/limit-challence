import { Button, Stack, Typography } from '@mui/material';

interface SubmissionsPaginationProps {
  page: number;
  count: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function SubmitionPagination({
  page,
  count,
  hasPrevious,
  hasNext,
  isFetching,
  onPageChange,
}: SubmissionsPaginationProps) {
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
      <Button
        type="button"
        disabled={!hasPrevious || isFetching}
        onClick={() => onPageChange(page - 1)}
      >
        Previous page
      </Button>
      <Typography variant="body2" aria-label={`Page ${page}`}>
        Page {page} of {Math.max(1, Math.ceil(count / 10))}
      </Typography>
      <Button
        type="button"
        disabled={!hasNext || isFetching}
        onClick={() => onPageChange(page + 1)}
      >
        Next page
      </Button>
    </Stack>
  );
}
