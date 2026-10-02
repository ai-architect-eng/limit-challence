import { getSubmissionDetail } from '@/lib/server/submissions';
import SubmissionDetails from './submissionDetails';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const isIdValid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const returnTo = query.returnTo;
  const result = isIdValid ? await getSubmissionDetail(id) : null;

  return (
    <SubmissionDetails
      returnTo={Array.isArray(returnTo) ? returnTo[0] : returnTo}
      result={result}
    />
  );
}
