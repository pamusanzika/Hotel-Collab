import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const Filters = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FilterBtn = styled(Button)`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  vertical-align: middle;
`;

const MonoText = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const STATUS_VARIANT = {
  succeeded: 'active',
  failed: 'banned',
  refunded: 'banned',
  pending: 'pending',
  requires_payment: 'pending',
  processing: 'pending',
  cancelled: 'banned',
};

const STATUS_LABEL = {
  succeeded: 'Succeeded',
  failed: 'Failed',
  refunded: 'Refunded',
  pending: 'Pending',
  requires_payment: 'Awaiting',
  processing: 'Processing',
  cancelled: 'Cancelled',
};

const FILTER_STATUSES = ['', 'succeeded', 'failed', 'refunded', 'requires_payment'];

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/payments', { params });
      setPayments(data.payments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <>
      <PageHeader title="Payments" subtitle="All platform payment transactions" />

      <Filters>
        {FILTER_STATUSES.map((s) => (
          <FilterBtn
            key={s}
            $variant={statusFilter === s ? 'primary' : 'ghost'}
            $size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : STATUS_LABEL[s] || s}
          </FilterBtn>
        ))}
      </Filters>

      <Card $padding="0">
        <Table>
          <thead>
            <tr>
              <Th>Campaign</Th>
              <Th>Payer</Th>
              <Th>Recipient</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Stripe ID</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <Td>{p.campaignId?.title || 'N/A'}</Td>
                <Td>{p.payerId?.name || 'N/A'}</Td>
                <Td>{p.recipientId?.name || 'N/A'}</Td>
                <Td style={{ fontWeight: 600 }}>${p.amount.toFixed(2)}</Td>
                <Td>
                  <Badge $variant={STATUS_VARIANT[p.status] || 'pending'}>
                    {STATUS_LABEL[p.status] || p.status}
                  </Badge>
                </Td>
                <Td>
                  <MonoText>{p.stripePaymentIntentId?.slice(0, 20)}...</MonoText>
                </Td>
                <Td>{new Date(p.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {loading ? 'Loading...' : 'No payments found'}
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default AdminPayments;
