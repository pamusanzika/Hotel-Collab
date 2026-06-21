import React from 'react';
import styled from 'styled-components';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const CardInner = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const Thumbnail = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ $round, theme }) => ($round ? theme.radius.full : theme.radius.md)};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Placeholder = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PartyName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DateRange = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
  align-items: flex-start;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }
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
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const CampaignCard = ({
  campaign,
  currentUserRole,
  currentUserId,
  onViewDetails,
  onApprove,
  onReject,
}) => {
  const isOwnerView = currentUserRole === 'hotel_owner';
  const isRecipient = campaign.createdBy?._id
    ? campaign.createdBy._id.toString() !== currentUserId
    : campaign.createdBy?.toString() !== currentUserId;
  const isPending = campaign.status === 'pending';
  const isWaitingForApproval = isPending && !isRecipient;

  // Show the other party's info
  const otherName = isOwnerView
    ? campaign.influencerDisplayName || 'Content Creator'
    : campaign.hotelId?.name || 'Hotel';

  const otherImage = isOwnerView
    ? campaign.influencerAvatar
      ? `${API_BASE}${campaign.influencerAvatar}`
      : null
    : campaign.hotelId?.featureImage
      ? `${API_BASE}${campaign.hotelId.featureImage}`
      : null;

  return (
    <Card>
      <CardInner>
        <Thumbnail $round={isOwnerView}>
          {otherImage ? (
            <img src={otherImage} alt={otherName} />
          ) : (
            <Placeholder>No img</Placeholder>
          )}
        </Thumbnail>

        <Content>
          <Title>{campaign.title}</Title>
          <PartyName>{otherName}</PartyName>
          <Meta>
            <Badge $variant={isWaitingForApproval ? 'pending' : (STATUS_VARIANT[campaign.status] || 'info')}>
              {isWaitingForApproval ? 'Waiting for Approval' : (STATUS_LABEL[campaign.status] || campaign.status)}
            </Badge>
            <Badge $variant="info">{TYPE_LABEL[campaign.campaignType] || campaign.campaignType}</Badge>
            <DateRange>
              {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
            </DateRange>
          </Meta>
        </Content>

        <Actions>
          {isPending && isRecipient && onApprove && (
            <Button $variant="primary" $size="sm" onClick={() => onApprove(campaign._id)}>
              Approve
            </Button>
          )}
          {isPending && isRecipient && onReject && (
            <Button $variant="danger" $size="sm" onClick={() => onReject(campaign._id)}>
              Reject
            </Button>
          )}
          <Button $variant="ghost" $size="sm" onClick={() => onViewDetails(campaign._id)}>
            View
          </Button>
        </Actions>
      </CardInner>
    </Card>
  );
};

export default CampaignCard;
