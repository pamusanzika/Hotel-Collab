import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReviewsList from '../../components/campaigns/ReviewsList';
import api from '../../api/axios';

// ─── Styled components ─────────────────────────────────────────────────────────

const Wrapper = styled.div`
  max-width: 860px;
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const AvatarHero = styled.div`
  width: 160px;
  height: 160px;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 160px;
  height: 160px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`;

const InfluencerName = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const NicheText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const LocationText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.7;
  white-space: pre-wrap;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const DetailLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PortfolioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const PortfolioItem = styled.a`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const PortfolioThumb = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PortfolioFileIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PortfolioItemName = styled.div`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionBar = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.error};
`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLLAB_LABEL_MAP = {
  free_stay: 'Free Stay',
  discount_stay: 'Discount Stay',
  paid_collaboration: 'Paid Collaboration',
};

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// ─── Component ─────────────────────────────────────────────────────────────────

const InfluencerProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/influencer-listing/${id}`);
        setInfluencer(data.influencer);

        // Fetch reviews for this influencer
        if (data.influencer?.userId) {
          try {
            const reviewRes = await api.get(`/reviews/user/${data.influencer.userId}`);
            setReviews(reviewRes.data.reviews || []);
            setReviewStats({
              averageRating: reviewRes.data.averageRating || 0,
              totalReviews: reviewRes.data.totalReviews || 0,
            });
          } catch (_) {}
        }
      } catch (err) {
        setError('Failed to load content creator details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingState>Loading content creator details...</LoadingState>;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!influencer) return <ErrorState>Content creator not found.</ErrorState>;

  return (
    <>
      <PageHeader title="Content Creator Profile" subtitle="Full information about this content creator" />

      <Wrapper>
        {/* ── Avatar ──────────────────────────────────────────────────── */}
        {influencer.avatar ? (
          <AvatarHero>
            <img src={`${API_BASE}${influencer.avatar}`} alt={influencer.displayName} />
          </AvatarHero>
        ) : (
          <AvatarPlaceholder>No Photo</AvatarPlaceholder>
        )}

        {/* ── Name & niche ────────────────────────────────────────────── */}
        <InfluencerName>
          {influencer.displayName || influencer.userName || 'Unnamed Content Creator'}
        </InfluencerName>
        <NicheText>{influencer.niche || 'Type not specified'}</NicheText>
        {influencer.location && <LocationText>{influencer.location}</LocationText>}

        {/* ── Bio ─────────────────────────────────────────────────────── */}
        {influencer.bio && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionLabel>About</SectionLabel>
            <Description>{influencer.bio}</Description>
          </Card>
        )}

        {/* ── Details grid ────────────────────────────────────────────── */}
        <DetailGrid>
          {/* Collaboration Types */}
          <DetailCard>
            <DetailLabel>Collaboration Types</DetailLabel>
            {influencer.collaborationTypes && influencer.collaborationTypes.length > 0 ? (
              <TagRow>
                {influencer.collaborationTypes.map((ct) => (
                  <Badge key={ct} $variant="info">
                    {COLLAB_LABEL_MAP[ct] || ct}
                  </Badge>
                ))}
              </TagRow>
            ) : (
              <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Not specified</span>
            )}
          </DetailCard>

          {/* Location */}
          <DetailCard>
            <DetailLabel>Location</DetailLabel>
            <span style={{ fontSize: '0.875rem' }}>
              {influencer.location || 'Not specified'}
            </span>
          </DetailCard>

          {/* Linked Platforms */}
          <DetailCard>
            <DetailLabel>Linked Platforms</DetailLabel>
            {influencer.linkedPlatforms && influencer.linkedPlatforms.length > 0 ? (
              <TagRow>
                {influencer.linkedPlatforms.map((p) => (
                  <Badge key={p.provider} $variant="active">
                    {p.provider}{p.username ? ` (@${p.username})` : ''}
                  </Badge>
                ))}
              </TagRow>
            ) : (
              <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>None linked</span>
            )}
          </DetailCard>
        </DetailGrid>

        {/* ── Portfolio ────────────────────────────────────────────── */}
        {influencer.portfolio && influencer.portfolio.length > 0 && (
          <Card style={{ marginTop: '1.5rem' }}>
            <SectionLabel>Portfolio ({influencer.portfolio.length})</SectionLabel>
            <PortfolioGrid>
              {influencer.portfolio.map((item) => {
                const fullUrl = `${API_BASE}${item.url}`;
                const isImage = item.fileType === 'image';
                const isVideo = item.fileType === 'video';
                const isPdf = item.fileType === 'pdf';
                return (
                  <PortfolioItem
                    key={item._id}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PortfolioThumb>
                      {isImage && <img src={fullUrl} alt={item.title || item.originalName} />}
                      {isVideo && <video src={fullUrl} muted />}
                      {isPdf && <PortfolioFileIcon><span style={{ fontSize: '2.5rem' }}>&#128196;</span>PDF</PortfolioFileIcon>}
                      {!isImage && !isVideo && !isPdf && (
                        <PortfolioFileIcon><span style={{ fontSize: '2.5rem' }}>&#128193;</span>File</PortfolioFileIcon>
                      )}
                    </PortfolioThumb>
                  </PortfolioItem>
                );
              })}
            </PortfolioGrid>
          </Card>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <ActionBar>
          <Button $variant="ghost" onClick={() => navigate('/owner/influencers')}>
            Back to Content Creators
          </Button>
          <Button
            $variant="primary"
            disabled={msgLoading}
            onClick={async () => {
              setMsgLoading(true);
              try {
                const { data } = await api.post('/chat/conversations', {
                  participantId: influencer.userId,
                });
                navigate(`/owner/messages/${data.conversation._id}`);
              } catch (err) {
                setError(err.response?.data?.error || 'Failed to start conversation');
                setMsgLoading(false);
              }
            }}
          >
            {msgLoading ? 'Opening...' : 'Message Content Creator'}
          </Button>
          <Button
            $variant="secondary"
            onClick={() =>
              navigate('/owner/collaborations/create', {
                state: {
                  preSelectedInfluencer: {
                    userId: influencer.userId,
                    displayName: influencer.displayName,
                    avatar: influencer.avatar,
                  },
                },
              })
            }
          >
            Create Campaign
          </Button>
        </ActionBar>

        {/* ── Reviews ─────────────────────────────────────────────── */}
        <div style={{ marginTop: '2rem' }}>
          <SectionLabel>Reviews</SectionLabel>
          <ReviewsList
            reviews={reviews}
            averageRating={reviewStats.averageRating}
            totalReviews={reviewStats.totalReviews}
          />
        </div>
      </Wrapper>
    </>
  );
};

export default InfluencerProfileView;
