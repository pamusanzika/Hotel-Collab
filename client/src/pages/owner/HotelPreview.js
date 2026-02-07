import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

// ─── Styled components ─────────────────────────────────────────────────────────

const Wrapper = styled.div`
  max-width: 860px;
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const HeroImage = styled.div`
  width: 100%;
  height: 340px;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HeroBadge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  left: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
`;

const ThumbnailRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;
`;

const Thumb = styled.div`
  width: 100px;
  height: 70px;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.borderLight};
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HotelTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const LocationText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.textSecondary};
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
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
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

const ActionBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
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

const NoImage = styled.div`
  width: 100%;
  height: 340px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const PhotoItem = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  border: 2px solid
    ${({ theme, $isFeature }) =>
      $isFeature ? theme.colors.primary : theme.colors.borderLight};
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }
`;

const PhotoFeatureBadge = styled.span`
  position: absolute;
  top: 6px;
  left: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 0.65rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
`;

const PhotoCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLLAB_LABEL_MAP = {
  free_stay: 'Free Stay',
  discount_stay: 'Discount Stay',
  paid_collaboration: 'Paid Collaboration',
};

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// ─── Component ─────────────────────────────────────────────────────────────────

const HotelPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/hotels/${id}`);
        setHotel(data.hotel);
      } catch (err) {
        setError('Failed to load hotel details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingState>Loading hotel details...</LoadingState>;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!hotel) return <ErrorState>Hotel not found.</ErrorState>;

  const images = hotel.images || [];
  const featureIdx = hotel.featureImage
    ? images.indexOf(hotel.featureImage)
    : 0;
  const displayIdx = activeImg < images.length ? activeImg : 0;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <PageHeader title="Hotel Profile" subtitle="Preview of your hotel listing" />

      <Wrapper>
        {/* ── Hero image ──────────────────────────────────────────────── */}
        {images.length > 0 ? (
          <HeroImage>
            <img
              src={`${API_BASE}${images[displayIdx]}`}
              alt={hotel.name}
            />
            {displayIdx === featureIdx && <HeroBadge>Feature Image</HeroBadge>}
          </HeroImage>
        ) : (
          <NoImage>No images uploaded</NoImage>
        )}

        {/* ── Thumbnail strip ─────────────────────────────────────────── */}
        {images.length > 1 && (
          <ThumbnailRow>
            {images.map((img, idx) => (
              <Thumb
                key={idx}
                $active={idx === displayIdx}
                onClick={() => setActiveImg(idx)}
              >
                <img src={`${API_BASE}${img}`} alt={`Thumbnail ${idx + 1}`} />
              </Thumb>
            ))}
          </ThumbnailRow>
        )}

        {/* ── Title & location ────────────────────────────────────────── */}
        <HotelTitle>{hotel.name}</HotelTitle>
        <LocationText>
          {hotel.location || 'Location not specified'}
          {hotel.city ? `, ${hotel.city}` : ''}
        </LocationText>

        {/* ── Photos section ──────────────────────────────────────────── */}
        {images.length > 0 && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionLabel>
              Photos
              <PhotoCount>({images.length} image{images.length !== 1 ? 's' : ''})</PhotoCount>
            </SectionLabel>
            <PhotoGrid>
              {images.map((img, idx) => (
                <PhotoItem
                  key={idx}
                  $isFeature={idx === featureIdx}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={`${API_BASE}${img}`} alt={`${hotel.name} photo ${idx + 1}`} />
                  {idx === featureIdx && <PhotoFeatureBadge>Feature</PhotoFeatureBadge>}
                </PhotoItem>
              ))}
            </PhotoGrid>
          </Card>
        )}

        {/* ── Description ─────────────────────────────────────────────── */}
        {hotel.description && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionLabel>About this Hotel</SectionLabel>
            <Description>{hotel.description}</Description>
          </Card>
        )}

        {/* ── Details grid ────────────────────────────────────────────── */}
        <DetailGrid>
          {/* Collaboration Types */}
          <DetailCard>
            <DetailLabel>Collaboration Types</DetailLabel>
            {hotel.collaborationTypes && hotel.collaborationTypes.length > 0 ? (
              <TagRow>
                {hotel.collaborationTypes.map((ct) => (
                  <Badge key={ct} $variant="info">
                    {COLLAB_LABEL_MAP[ct] || ct}
                  </Badge>
                ))}
              </TagRow>
            ) : (
              <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Not specified
              </span>
            )}
          </DetailCard>

          {/* Availability */}
          <DetailCard>
            <DetailLabel>Availability</DetailLabel>
            <div>
              <Badge
                $variant={
                  hotel.availability?.status === 'available'
                    ? 'active'
                    : 'pending'
                }
              >
                {hotel.availability?.status === 'available'
                  ? 'Available'
                  : 'Unavailable'}
              </Badge>
              {hotel.availability?.status === 'available' &&
                hotel.availability?.startDate &&
                hotel.availability?.endDate && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      marginTop: '0.5rem',
                    }}
                  >
                    {formatDate(hotel.availability.startDate)} &mdash;{' '}
                    {formatDate(hotel.availability.endDate)}
                  </p>
                )}
            </div>
          </DetailCard>

          {/* Status */}
          <DetailCard>
            <DetailLabel>Listing Status</DetailLabel>
            <Badge $variant={hotel.isActive ? 'active' : 'banned'}>
              {hotel.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DetailCard>

          {/* Created */}
          <DetailCard>
            <DetailLabel>Listed On</DetailLabel>
            <span style={{ fontSize: '0.875rem' }}>
              {formatDate(hotel.createdAt)}
            </span>
          </DetailCard>
        </DetailGrid>

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <ActionBar>
          <Button
            $variant="ghost"
            onClick={() => navigate('/owner/hotels')}
          >
            Back to Hotels
          </Button>
          <Button
            $variant="primary"
            onClick={() => navigate(`/owner/hotels/edit/${hotel._id}`)}
          >
            Edit Listing
          </Button>
        </ActionBar>
      </Wrapper>
    </>
  );
};

export default HotelPreview;
