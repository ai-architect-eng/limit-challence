import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SubmissionCompanyMeta } from '@/components/submissions/companyMeta';
import { Filters } from '@/components/submissions/filters';
import { brokers } from './fixtures';
import { SubmissionStatusChip } from '@/components/submissions/statusChip';

describe('shared submission components', () => {
  it('renders the same company metadata used by list and detail views', () => {
    render(<SubmissionCompanyMeta industry="FinTech" headquartersCity="London" />);

    expect(screen.getByText('FinTech · London')).toBeInTheDocument();
  });

  it('falls back when company metadata is missing', () => {
    render(<SubmissionCompanyMeta industry="" headquartersCity="" />);

    expect(screen.getByText('Industry not provided · Location not provided')).toBeInTheDocument();
  });

  it('renders the shared label for a submission status', () => {
    render(<SubmissionStatusChip status="in_review" />);

    expect(screen.getByText('In review')).toBeInTheDocument();
  });

  it('resets draft filter values before they are applied', () => {
    const onReset = vi.fn();
    render(
      <Filters
        filters={{ page: 1 }}
        brokers={brokers}
        brokersError={false}
        onApply={() => {}}
        onReset={onReset}
        onRetryBrokers={() => {}}
      />,
    );

    const status = screen.getByRole('combobox', { name: 'Status' });
    fireEvent.mouseDown(status);
    fireEvent.click(screen.getByRole('option', { name: 'New' }));
    const broker = screen.getByRole('combobox', { name: 'Broker' });
    fireEvent.mouseDown(broker);
    fireEvent.click(screen.getByRole('option', { name: 'Zenith' }));
    const companySearch = screen.getByLabelText('Company search');
    fireEvent.change(companySearch, { target: { value: 'Acme' } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(status).toHaveTextContent('All statuses');
    expect(broker).toHaveTextContent('All brokers');
    expect(companySearch).toHaveValue('');
    expect(onReset).toHaveBeenCalledOnce();
  });
});
