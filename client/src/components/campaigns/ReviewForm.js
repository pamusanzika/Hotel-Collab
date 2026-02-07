import React, { useState } from 'react';
import styled from 'styled-components';
import StarRating from './StarRating';
import Button from '../ui/Button';
import api from '../../api/axios';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
`;

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.success};
`;

const ReviewForm = ({ campaignId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/campaigns/${campaignId}/reviews`, { rating, comment });
      setSuccess('Review submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessText>{success}</SuccessText>;

  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <Label>Your Rating</Label>
        <StarRating rating={rating} interactive onChange={setRating} size="1.5rem" />
      </div>
      <div>
        <Label>Comment (optional)</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          maxLength={1000}
        />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" $variant="primary" $size="sm" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </Form>
  );
};

export default ReviewForm;
