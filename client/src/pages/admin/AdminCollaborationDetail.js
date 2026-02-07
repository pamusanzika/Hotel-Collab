import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const BackRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

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

const CancelReasonBox = styled.div`
  background: ${({ theme }) => theme.colors.dangerLight || '#FEF2F2'};
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder || '#FECACA'};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
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

const AdminCollaborationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/campaigns/${id}`);
      setCampaign(data.campaign);
    } catch (err) {
      setError('Failed to load collaboration details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <Card>
        <p style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading...</p>
      </Card>
    );
  if (error && !campaign)
    return (
      <Card>
        <p style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</p>
      </Card>
    );
  if (!campaign) return null;

  return (
    <>
      <BackRow>
        <Button $variant="ghost" $size="sm" onClick={() => navigate('/admin/collaborations')}>
          &larr; Back to Collaborations
        </Button>
      </BackRow>

      <PageHeader title={campaign.title} subtitle="Collaboration details" />

      {/* Status & Type */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <InfoRow>
          <InfoLabel>Status</InfoLabel>
          <Badge $variant={STATUS_VARIANT[campaign.status]}>
            {STATUS_LABEL[campaign.status]}
          </Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Type</InfoLabel>
          <Badge $variant="info">{TYPE_LABEL[campaign.campaignType]}</Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Dates</InfoLabel>
          <InfoValue>
            {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Created by</InfoLabel>
          <InfoValue>
            {campaign.createdBy?.name || 'Unknown'} ({campaign.creatorRole?.replace('_', ' ')})
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Created on</InfoLabel>
          <InfoValue>{formatDate(campaign.createdAt)}</InfoValue>
        </InfoRow>
      </Card>

      {/* Cancel Reason */}
      {campaign.status === 'cancelled' && campaign.cancelReason && (
        <CancelReasonBox>
          <CancelReasonLabel>Cancellation Reason</CancelReasonLabel>
          <CancelReasonText>{campaign.cancelReason}</CancelReasonText>
        </CancelReasonBox>
      )}

      {/* Parties */}
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
                {[campaign.hotelId?.city, campaign.hotelId?.location].filter(Boolean).join(', ') ||
                  'Location not set'}
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
              <PartyName>{campaign.influencerDisplayName || campaign.influencerId?.name || 'Influencer'}</PartyName>
              <PartyMeta>
                {[campaign.influencerNiche, campaign.influencerLocation].filter(Boolean).join(', ') || ''}
              </PartyMeta>
            </PartyInfo>
          </PartyCard>
        </div>
      </Grid>

      {/* Description */}
      {campaign.description && (
        <Section>
          <SectionTitle>Campaign Details</SectionTitle>
          <Card>
            <Description>{campaign.description}</Description>
          </Card>
        </Section>
      )}
    </>
  );
};

export default AdminCollaborationDetail;
