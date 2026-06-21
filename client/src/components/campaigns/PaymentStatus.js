import React from 'react';
import styled from 'styled-components';
import Badge from '../ui/Badge';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const AmountText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const STATUS_CONFIG = {
  not_required: { label: 'No Payment', variant: 'info' },
  pending: { label: 'Payment Pending', variant: 'pending' },
  requires_payment: { label: 'Awaiting Payment', variant: 'pending' },
  processing: { label: 'Processing', variant: 'pending' },
  paid: { label: 'Paid', variant: 'active' },
  refunded: { label: 'Refunded', variant: 'banned' },
  failed: { label: 'Payment Failed', variant: 'banned' },
};

const PaymentStatus = ({ paymentStatus, amount }) => {
  if (paymentStatus === 'not_required') return null;

  const config = STATUS_CONFIG[paymentStatus] || STATUS_CONFIG.pending;

  return (
    <Wrapper>
      <Badge $variant={config.variant}>{config.label}</Badge>
      {amount > 0 && <AmountText>${amount.toFixed(2)}</AmountText>}
    </Wrapper>
  );
};

export default PaymentStatus;
