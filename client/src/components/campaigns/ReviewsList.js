import React from 'react';
import styled from 'styled-components';
import StarRating from './StarRating';
import Card from '../ui/Card';

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AverageRating = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const ReviewCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ReviewCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ReviewerName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const ReviewDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ReviewComment = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const CampaignLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`;

const EmptyState = styled.p`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const ReviewsList = ({ reviews = [], averageRating = 0, totalReviews = 0 }) => {
  if (!reviews.length) {
    return (
      <Card>
        <EmptyState>No reviews yet.</EmptyState>
      </Card>
    );
  }

  return (
    <Card>
      <Header>
        <AverageRating>{averageRating}</AverageRating>
        <div>
          <StarRating rating={Math.round(averageRating)} size="1rem" />
          <ReviewCount> ({totalReviews} review{totalReviews !== 1 ? 's' : ''})</ReviewCount>
        </div>
      </Header>

      {reviews.map((review) => (
        <ReviewCard key={review._id}>
          <ReviewHeader>
            <div>
              <ReviewerName>{review.reviewerId?.name || 'User'}</ReviewerName>
              {review.campaignId?.title && (
                <CampaignLabel> - {review.campaignId.title}</CampaignLabel>
              )}
            </div>
            <ReviewDate>{formatDate(review.createdAt)}</ReviewDate>
          </ReviewHeader>
          <StarRating rating={review.rating} size="0.85rem" />
          {review.comment && <ReviewComment>{review.comment}</ReviewComment>}
        </ReviewCard>
      ))}
    </Card>
  );
};

export default ReviewsList;
