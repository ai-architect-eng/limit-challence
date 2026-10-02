import { AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import type { Broker, SubmissionDetail, SubmissionListItem } from '@/lib/types';

export const brokers: Broker[] = [
  { id: 1, name: 'Apollo', primaryContactEmail: 'broker@example.com' },
  { id: 2, name: 'Zenith', primaryContactEmail: null },
];

export function listItem(id = 1): SubmissionListItem {
  return {
    id,
    status: id % 2 ? 'new' : 'in_review',
    priority: 'high',
    summary: 'Review coverage',
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-02T12:00:00Z',
    broker: brokers[id % 2 ? 0 : 1],
    company: { id, legalName: `Acme ${id}`, industry: 'Insurance', headquartersCity: 'London' },
    owner: { id: 1, fullName: 'Alex Owner', email: 'owner@example.com' },
    documentCount: 1,
    noteCount: 1,
    latestNote: {
      authorName: 'Alex Owner',
      bodyPreview: 'Review terms',
      createdAt: '2026-09-02T12:00:00Z',
    },
  };
}

export function detailItem(id = 1): SubmissionDetail {
  const { documentCount, noteCount, latestNote, ...base } = listItem(id);
  void documentCount;
  void noteCount;
  void latestNote;
  return {
    ...base,
    contacts: [
      { id: 1, name: 'Jamie Contact', role: 'CFO', email: 'jamie@example.com', phone: '' },
    ],
    documents: [
      {
        id: 1,
        title: 'Contract',
        docType: 'Contract',
        uploadedAt: base.createdAt,
        fileUrl: 'https://example.com/contract',
      },
    ],
    notes: [{ id: 1, authorName: 'Alex Owner', body: 'Review terms', createdAt: base.createdAt }],
  };
}

export function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}
