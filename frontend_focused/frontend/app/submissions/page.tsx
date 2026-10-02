import { readFilters } from '@/lib/submission-filters';
import { getBrokers, getSubmissions } from '@/lib/server/submissions';
import SubmissionsWorkspace from './submissionsWorkspace';
import { SearchParams, toURLSearchParams } from '@/lib/toUrlSearchParams';

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = readFilters(toURLSearchParams(await searchParams));
  const [submissions, brokers] = await Promise.all([getSubmissions(filters), getBrokers()]);

  return <SubmissionsWorkspace filters={filters} submissions={submissions} brokers={brokers} />;
}
