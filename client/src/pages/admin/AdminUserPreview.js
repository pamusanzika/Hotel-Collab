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
  min-width: 120px;
`;

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProfileName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const ProfileMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const HotelCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const HotelImage = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HotelInfo = styled.div`
  flex: 1;
`;

const HotelName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const HotelMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
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

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Tag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.text};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const Stars = styled.span`
  color: #f59e0b;
`;

const ReviewCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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
  color: ${({ theme }) => theme.colors.text};
`;

const ReviewDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ReviewComment = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const statusVariant = (status) => {
  if (status === 'active') return 'active';
  if (status === 'banned') return 'banned';
  return 'pending';
};

const campaignStatusVariant = {
  pending: 'pending',
  upcoming: 'info',
  ongoing: 'active',
  done: 'active',
  cancelled: 'banned',
  rejected: 'banned',
};

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

const AdminUserPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/admin/users/${id}`);
      setData(res);
    } catch (err) {
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBan = async () => {
    if (!window.confirm('Ban this user?')) return;
    try {
      await api.post(`/admin/users/${id}/ban`, { reason: 'Admin action' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnban = async () => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <Card>
        <p style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading...</p>
      </Card>
    );
  if (error && !data)
    return (
      <Card>
        <p style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</p>
      </Card>
    );
  if (!data) return null;

  const { user, ownerProfile, hotels, influencerProfile, campaigns, reviews, banHistory } = data;

  return (
    <>
      <BackRow>
        <Button $variant="ghost" $size="sm" onClick={() => navigate('/admin/users')}>
          &larr; Back to Users
        </Button>
      </BackRow>

      <PageHeader title={user.name} subtitle="User Details" />

      {/* User Info */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <InfoRow>
          <InfoLabel>Email</InfoLabel>
          <InfoValue>{user.email}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Role</InfoLabel>
          <InfoValue style={{ textTransform: 'capitalize' }}>{user.role?.replace('_', ' ')}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Status</InfoLabel>
          <Badge $variant={statusVariant(user.status)}>
            {user.status === 'pending_verification' ? 'Pending' : user.status}
          </Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Email Verified</InfoLabel>
          <Badge $variant={user.isEmailVerified ? 'active' : 'pending'}>
            {user.isEmailVerified ? 'Yes' : 'No'}
          </Badge>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Joined</InfoLabel>
          <InfoValue>{formatDate(user.createdAt)}</InfoValue>
        </InfoRow>

        {user.role !== 'admin' && (
          <ActionRow>
            {user.status === 'banned' ? (
              <Button $variant="primary" $size="sm" onClick={handleUnban}>
                Unban User
              </Button>
            ) : (
              <Button $variant="danger" $size="sm" onClick={handleBan}>
                Ban User
              </Button>
            )}
          </ActionRow>
        )}
      </Card>

      {/* Hotel Owner Profile */}
      {user.role === 'hotel_owner' && (
        <>
          {ownerProfile && (
            <Section>
              <SectionTitle>Owner Profile</SectionTitle>
              <Card>
                {ownerProfile.companyName && (
                  <InfoRow>
                    <InfoLabel>Company</InfoLabel>
                    <InfoValue>{ownerProfile.companyName}</InfoValue>
                  </InfoRow>
                )}
                {ownerProfile.phone && (
                  <InfoRow>
                    <InfoLabel>Phone</InfoLabel>
                    <InfoValue>{ownerProfile.phone}</InfoValue>
                  </InfoRow>
                )}
                {ownerProfile.location && (
                  <InfoRow>
                    <InfoLabel>Location</InfoLabel>
                    <InfoValue>{ownerProfile.location}</InfoValue>
                  </InfoRow>
                )}
                {ownerProfile.website && (
                  <InfoRow>
                    <InfoLabel>Website</InfoLabel>
                    <InfoValue>{ownerProfile.website}</InfoValue>
                  </InfoRow>
                )}
                {ownerProfile.bio && (
                  <InfoRow>
                    <InfoLabel>Bio</InfoLabel>
                    <InfoValue>{ownerProfile.bio}</InfoValue>
                  </InfoRow>
                )}
              </Card>
            </Section>
          )}

          <Section>
            <SectionTitle>Hotels ({hotels?.length || 0})</SectionTitle>
            {hotels && hotels.length > 0 ? (
              <Grid>
                {hotels.map((hotel) => (
                  <HotelCard key={hotel._id}>
                    <HotelImage>
                      {hotel.featureImage && (
                        <img src={`${API_BASE}${hotel.featureImage}`} alt="" />
                      )}
                    </HotelImage>
                    <HotelInfo>
                      <HotelName>{hotel.name}</HotelName>
                      <HotelMeta>
                        {[hotel.city, hotel.location].filter(Boolean).join(', ')}
                      </HotelMeta>
                      <HotelMeta>
                        {hotel.starRating && (
                          <Stars>{renderStars(hotel.starRating)}</Stars>
                        )}
                        {' '}
                        <Badge $variant={hotel.isActive ? 'active' : 'pending'}>
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </HotelMeta>
                    </HotelInfo>
                  </HotelCard>
                ))}
              </Grid>
            ) : (
              <Card>
                <EmptyText>No hotels listed</EmptyText>
              </Card>
            )}
          </Section>
        </>
      )}

      {/* Influencer Profile */}
      {user.role === 'influencer' && influencerProfile && (
        <Section>
          <SectionTitle>Content Creator Profile</SectionTitle>
          <Card>
            <ProfileHeader>
              <Avatar>
                {influencerProfile.avatar && (
                  <img src={`${API_BASE}${influencerProfile.avatar}`} alt="" />
                )}
              </Avatar>
              <div>
                <ProfileName>{influencerProfile.displayName || user.name}</ProfileName>
                <ProfileMeta>
                  {[influencerProfile.niche, influencerProfile.location].filter(Boolean).join(' · ')}
                </ProfileMeta>
              </div>
            </ProfileHeader>

            {influencerProfile.bio && (
              <InfoRow>
                <InfoLabel>Bio</InfoLabel>
                <InfoValue>{influencerProfile.bio}</InfoValue>
              </InfoRow>
            )}

            {influencerProfile.collaborationTypes?.length > 0 && (
              <InfoRow>
                <InfoLabel>Collab Types</InfoLabel>
                <TagList>
                  {influencerProfile.collaborationTypes.map((t) => (
                    <Tag key={t}>{t.replace('_', ' ')}</Tag>
                  ))}
                </TagList>
              </InfoRow>
            )}

            {influencerProfile.linkedPlatforms?.length > 0 && (
              <InfoRow>
                <InfoLabel>Platforms</InfoLabel>
                <TagList>
                  {influencerProfile.linkedPlatforms.map((p) => (
                    <Tag key={p.platform}>{p.platform}: {p.handle || p.url}</Tag>
                  ))}
                </TagList>
              </InfoRow>
            )}
          </Card>
        </Section>
      )}

      {/* Recent Campaigns */}
      <Section>
        <SectionTitle>Recent Campaigns ({campaigns?.length || 0})</SectionTitle>
        <Card $padding="0">
          {campaigns && campaigns.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Hotel</Th>
                  <Th>Status</Th>
                  <Th>Dates</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id}>
                    <Td>{c.title}</Td>
                    <Td>{c.hotelId?.name || '—'}</Td>
                    <Td>
                      <Badge $variant={campaignStatusVariant[c.status]}>
                        {c.status}
                      </Badge>
                    </Td>
                    <Td>
                      {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyText>No campaigns</EmptyText>
          )}
        </Card>
      </Section>

      {/* Reviews */}
      <Section>
        <SectionTitle>Reviews Received ({reviews?.length || 0})</SectionTitle>
        {reviews && reviews.length > 0 ? (
          reviews.map((r) => (
            <ReviewCard key={r._id}>
              <ReviewHeader>
                <div>
                  <ReviewerName>{r.reviewerId?.name || 'Unknown'}</ReviewerName>
                  {r.campaignId?.title && (
                    <ProfileMeta> on {r.campaignId.title}</ProfileMeta>
                  )}
                </div>
                <ReviewDate>{formatDate(r.createdAt)}</ReviewDate>
              </ReviewHeader>
              <Stars>{renderStars(r.rating)}</Stars>
              {r.comment && <ReviewComment>{r.comment}</ReviewComment>}
            </ReviewCard>
          ))
        ) : (
          <Card>
            <EmptyText>No reviews received</EmptyText>
          </Card>
        )}
      </Section>

      {/* Ban History */}
      {banHistory && banHistory.length > 0 && (
        <Section>
          <SectionTitle>Ban History</SectionTitle>
          <Card $padding="0">
            <Table>
              <thead>
                <tr>
                  <Th>Action</Th>
                  <Th>By</Th>
                  <Th>Reason</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {banHistory.map((b) => (
                  <tr key={b._id}>
                    <Td>
                      <Badge $variant={b.action === 'ban' ? 'banned' : 'active'}>
                        {b.action}
                      </Badge>
                    </Td>
                    <Td>{b.adminId?.name || 'Unknown'}</Td>
                    <Td>{b.reason || '—'}</Td>
                    <Td>{formatDate(b.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Section>
      )}
    </>
  );
};

export default AdminUserPreview;
