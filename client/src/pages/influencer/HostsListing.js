import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import api from '../../api/axios';

// ─── Styled components ─────────────────────────────────────────────────────────

const SearchBar = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SearchInput = styled(Input)`
  max-width: 480px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const HostCard = styled(Card)`
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 200px;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const NoImage = styled.div`
  width: 100%;
  height: 200px;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const HostName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const LocationText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// ─── Component ─────────────────────────────────────────────────────────────────

const HostsListing = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const { data } = await api.get('/hosts');
        setHotels(data.hotels);
      } catch (err) {
        setError('Failed to load hosts.');
      } finally {
        setLoading(false);
      }
    };
    fetchHosts();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return hotels;
    const term = search.toLowerCase();
    return hotels.filter(
      (h) =>
        h.name?.toLowerCase().includes(term) ||
        h.city?.toLowerCase().includes(term) ||
        h.location?.toLowerCase().includes(term) ||
        h.availability?.status?.toLowerCase().includes(term)
    );
  }, [hotels, search]);

  if (loading) return <LoadingState>Loading hosts...</LoadingState>;
  if (error) return <ErrorState>{error}</ErrorState>;

  const buildLocation = (hotel) => {
    const parts = [hotel.location, hotel.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  return (
    <>
      <PageHeader title="Hosts" subtitle="Browse all registered hotels and hosts" />

      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search by name, city, location, or availability..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchBar>

      {filtered.length === 0 ? (
        <EmptyState>
          {search ? 'No hosts match your search.' : 'No hosts available at the moment.'}
        </EmptyState>
      ) : (
        <Grid>
          {filtered.map((hotel) => (
            <HostCard
              key={hotel._id}
              onClick={() => navigate(`/influencer/hosts/${hotel._id}`)}
            >
              {hotel.featureImage || (hotel.images && hotel.images.length > 0) ? (
                <CardImage>
                  <img
                    src={`${API_BASE}${hotel.featureImage || hotel.images[0]}`}
                    alt={hotel.name}
                  />
                </CardImage>
              ) : (
                <NoImage>No image available</NoImage>
              )}

              <CardBody>
                <HostName>{hotel.name}</HostName>
                <LocationText>{buildLocation(hotel)}</LocationText>
                <CardFooter>
                  <Badge
                    $variant={
                      hotel.availability?.status === 'available' ? 'active' : 'pending'
                    }
                  >
                    {hotel.availability?.status === 'available'
                      ? 'Available'
                      : 'Unavailable'}
                  </Badge>
                </CardFooter>
              </CardBody>
            </HostCard>
          ))}
        </Grid>
      )}
    </>
  );
};

export default HostsListing;
