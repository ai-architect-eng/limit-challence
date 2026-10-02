import Typography from '@mui/material/Typography';
import type { Company } from '@/lib/types';

type SubmissionCompanyMetaProps = Pick<Company, 'industry' | 'headquartersCity'>;

export function SubmissionCompanyMeta({ industry, headquartersCity }: SubmissionCompanyMetaProps) {
  return (
    <Typography color="text.secondary">
      {industry || 'Industry not provided'} · {headquartersCity || 'Location not provided'}
    </Typography>
  );
}
