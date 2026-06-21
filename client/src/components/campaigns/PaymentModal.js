import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components';
import Button from '../ui/Button';
import api from '../../api/axios';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.surface || '#fff'};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 480px;
  margin: ${({ theme }) => theme.spacing.md};
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Amount = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl || '1.25rem'};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold || 700};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

let stripePromise = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = api.get('/payments/config').then(({ data }) => loadStripe(data.publishableKey));
  }
  return stripePromise;
}

const CheckoutForm = ({ onSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Amount>${amount.toFixed(2)} USD</Amount>
      <PaymentElement />
      {error && <ErrorText>{error}</ErrorText>}
      <Actions>
        <Button type="button" $variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" $variant="primary" disabled={!stripe || loading}>
          {loading ? 'Processing...' : 'Pay & Approve'}
        </Button>
      </Actions>
    </form>
  );
};

const PaymentModal = ({ campaignId, amount, onSuccess, onClose }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');
  const [stripeObj, setStripeObj] = useState(null);

  useEffect(() => {
    getStripe().then(setStripeObj).catch(() => setError('Failed to load payment provider'));
  }, []);

  useEffect(() => {
    api
      .post(`/payments/campaigns/${campaignId}`)
      .then(({ data }) => setClientSecret(data.clientSecret))
      .catch((err) => setError(err.response?.data?.error || 'Failed to initialize payment'));
  }, [campaignId]);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Campaign Payment</ModalTitle>
        {error && <ErrorText>{error}</ErrorText>}
        {clientSecret && stripeObj ? (
          <Elements stripe={stripeObj} options={{ clientSecret }}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onClose} />
          </Elements>
        ) : !error ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Loading payment form...</p>
        ) : null}
      </ModalContent>
    </ModalOverlay>
  );
};

export default PaymentModal;
