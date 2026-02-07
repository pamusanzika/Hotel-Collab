import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 100px;
`;

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.7;
  white-space: pre-wrap;
`;

const PartyCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ $round, theme }) => ($round ? theme.radius.full : theme.radius.md)};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PartyInfo = styled.div`
  flex: 1;
`;

const PartyName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const PartyMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ReviewCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ReviewerName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ReviewDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ReviewComment = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

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
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background || '#fff'};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const CancelReasonBox = styled.div`
  background: ${({ theme }) => theme.colors.dangerLight || '#FEF2F2'};
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder || '#FECACA'};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CancelReasonLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.danger || '#EF4444'};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CancelReasonText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;

const STATUS_VARIANT = {
  pending: 'pending',
  upcoming: 'info',
  ongoing: 'active',
  done: 'active',
  cancelled: 'banned',
  rejected: 'banned',
};

const STATUS_LABEL = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  done: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const TYPE_LABEL = {
  free_stay: 'Free Stay',
  paid_collaboration: 'Paid Collaboration',
  discount_stay: 'Discount Stay',
};

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const CampaignDetail = ({ campaignId, onStatusChange }) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/campaigns/${campaignId}`);
      setCampaign(data.campaign);
      setReviews(data.reviews || []);
    } catch (err) {
      setError('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (newStatus, extra = {}) => {
    setActionLoading(newStatus);
    try {
      await api.patch(`/campaigns/${campaignId}/status`, { status: newStatus, ...extra });
      await load();
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelClick = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) return;
    setShowCancelModal(false);
    await handleStatusChange('cancelled', { cancelReason: cancelReason.trim() });
  };

  if (loading) return <Card><p style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading...</p></Card>;
  if (error && !campaign) return <Card><p style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</p></Card>;
  if (!campaign) return null;

  const isCreator = campaign.createdBy?._id
    ? campaign.createdBy._id.toString() === user._id
    : campaign.createdBy?.toString() === user._id;
  const isRecipient = !isCreator;
  const currentStatus = campaign.status;

  // Can the current user leave a review?
  const isDone = currentStatus === 'done';
  const hasReviewed = reviews.some((r) => r.reviewerId?._id === user._id || r.reviewerId === user._id);

  return (
    <>
      {/* ── Status & Type ────────────────────────────── */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <InfoRow>
          <InfoLabel>Status</InfoLabel>
          <Badge $variant={STATUS_VARIANT[currentStatus]}>
            {STATUS_LABEL[currentStatus]}
          </Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Type</InfoLabel>
          <Badge $variant="info">{TYPE_LABEL[campaign.campaignType]}</Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Dates</InfoLabel>
          <InfoValue>{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Created by</InfoLabel>
          <InfoValue>{campaign.createdBy?.name || 'Unknown'}</InfoValue>
        </InfoRow>
      </Card>

      {/* ── Cancel Reason ─────────────────────────────── */}
      {currentStatus === 'cancelled' && campaign.cancelReason && (
        <CancelReasonBox>
          <CancelReasonLabel>Cancellation Reason</CancelReasonLabel>
          <CancelReasonText>{campaign.cancelReason}</CancelReasonText>
        </CancelReasonBox>
      )}

      {/* ── Parties ──────────────────────────────────── */}
      <Grid>
        <div>
          <SectionTitle>Hotel</SectionTitle>
          <PartyCard>
            <Avatar>
              {campaign.hotelId?.featureImage && (
                <img src={`${API_BASE}${campaign.hotelId.featureImage}`} alt="" />
              )}
            </Avatar>
            <PartyInfo>
              <PartyName>{campaign.hotelId?.name || 'Hotel'}</PartyName>
              <PartyMeta>
                {[campaign.hotelId?.city, campaign.hotelId?.location].filter(Boolean).join(', ') || 'Location not set'}
              </PartyMeta>
            </PartyInfo>
          </PartyCard>
        </div>
        <div>
          <SectionTitle>Influencer</SectionTitle>
          <PartyCard>
            <Avatar $round>
              {campaign.influencerAvatar && (
                <img src={`${API_BASE}${campaign.influencerAvatar}`} alt="" />
              )}
            </Avatar>
            <PartyInfo>
              <PartyName>{campaign.influencerDisplayName || 'Influencer'}</PartyName>
              <PartyMeta>
                {[campaign.influencerNiche, campaign.influencerLocation].filter(Boolean).join(', ') || ''}
              </PartyMeta>
            </PartyInfo>
          </PartyCard>
        </div>
      </Grid>

      {/* ── Description ──────────────────────────────── */}
      {campaign.description && (
        <Section>
          <SectionTitle>Campaign Details</SectionTitle>
          <Card>
            <Description>{campaign.description}</Description>
          </Card>
        </Section>
      )}

      {/* ── Actions ──────────────────────────────────── */}
      <ActionBar>
        {currentStatus === 'pending' && isRecipient && (
          <>
            <Button
              $variant="primary"
              disabled={!!actionLoading}
              onClick={() => handleStatusChange('upcoming')}
            >
              {actionLoading === 'upcoming' ? 'Approving...' : 'Approve Campaign'}
            </Button>
            <Button
              $variant="danger"
              disabled={!!actionLoading}
              onClick={() => handleStatusChange('rejected')}
            >
              {actionLoading === 'rejected' ? 'Rejecting...' : 'Reject Campaign'}
            </Button>
          </>
        )}
        {currentStatus === 'upcoming' && (
          <>
            <Button
              $variant="primary"
              disabled={!!actionLoading}
              onClick={() => handleStatusChange('ongoing')}
            >
              {actionLoading === 'ongoing' ? 'Starting...' : 'Start Campaign'}
            </Button>
            <Button
              $variant="danger"
              disabled={!!actionLoading}
              onClick={handleCancelClick}
            >
              Cancel Campaign
            </Button>
          </>
        )}
        {currentStatus === 'ongoing' && (
          <>
            <Button
              $variant="primary"
              disabled={!!actionLoading}
              onClick={() => handleStatusChange('done')}
            >
              {actionLoading === 'done' ? 'Completing...' : 'Mark as Done'}
            </Button>
            <Button
              $variant="danger"
              disabled={!!actionLoading}
              onClick={handleCancelClick}
            >
              Cancel Campaign
            </Button>
          </>
        )}
      </ActionBar>

      {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}

      {/* ── Reviews ──────────────────────────────────── */}
      <Section style={{ marginTop: '2rem' }}>
        <SectionTitle>Reviews</SectionTitle>
        {reviews.length > 0 ? (
          <Card>
            {reviews.map((review) => (
              <ReviewCard key={review._id}>
                <ReviewHeader>
                  <ReviewerName>{review.reviewerId?.name || 'User'}</ReviewerName>
                  <ReviewDate>{formatDate(review.createdAt)}</ReviewDate>
                </ReviewHeader>
                <StarRating rating={review.rating} size="0.85rem" />
                {review.comment && <ReviewComment>{review.comment}</ReviewComment>}
              </ReviewCard>
            ))}
          </Card>
        ) : isDone ? null : (
          <Card><p style={{ color: '#9CA3AF', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
            Reviews will be available once the campaign is completed.
          </p></Card>
        )}

        {isDone && !hasReviewed && (
          <Card style={{ marginTop: '1rem' }}>
            <SectionTitle>Leave a Review</SectionTitle>
            <ReviewForm campaignId={campaignId} onSuccess={load} />
          </Card>
        )}
      </Section>

      {/* ── Cancel Reason Modal ────────────────────────── */}
      {showCancelModal && (
        <ModalOverlay onClick={() => setShowCancelModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Cancel Campaign</ModalTitle>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
              Please provide a reason for cancelling this campaign.
            </p>
            <TextArea
              placeholder="Enter cancellation reason..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
            />
            <ModalActions>
              <Button $variant="ghost" onClick={() => setShowCancelModal(false)}>
                Go Back
              </Button>
              <Button
                $variant="danger"
                disabled={!cancelReason.trim() || !!actionLoading}
                onClick={handleCancelConfirm}
              >
                {actionLoading === 'cancelled' ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default CampaignDetail;
