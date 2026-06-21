import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
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

const InfluencerCard = styled(Card)`
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const AvatarSection = styled.div`
  width: 100%;
  height: 200px;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const AvatarPlaceholder = styled.div`
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

const InfluencerName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const NicheText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
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

const InfluencersListing = () => {
  const navigate = useNavigate();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const { data } = await api.get('/influencer-listing');
        setInfluencers(data.influencers);
      } catch (err) {
        setError('Failed to load content creators.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfluencers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return influencers;
    const term = search.toLowerCase();
    return influencers.filter(
      (inf) =>
        inf.displayName?.toLowerCase().includes(term) ||
        inf.niche?.toLowerCase().includes(term)
    );
  }, [influencers, search]);

  if (loading) return <LoadingState>Loading content creators...</LoadingState>;
  if (error) return <ErrorState>{error}</ErrorState>;

  return (
    <>
      <PageHeader title="Content Creators" subtitle="Browse all registered content creators" />

      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchBar>

      {filtered.length === 0 ? (
        <EmptyState>
          {search ? 'No content creators match your search.' : 'No content creators available at the moment.'}
        </EmptyState>
      ) : (
        <Grid>
          {filtered.map((inf) => (
            <InfluencerCard
              key={inf._id}
              onClick={() => navigate(`/owner/influencers/${inf._id}`)}
            >
              {inf.avatar ? (
                <AvatarSection>
                  <img src={`${API_BASE}${inf.avatar}`} alt={inf.displayName} />
                </AvatarSection>
              ) : (
                <AvatarPlaceholder>No Photo</AvatarPlaceholder>
              )}

              <CardBody>
                <InfluencerName>{inf.displayName || 'Unnamed Content Creator'}</InfluencerName>
                <NicheText>{inf.niche || 'Type not specified'}</NicheText>
              </CardBody>
            </InfluencerCard>
          ))}
        </Grid>
      )}
    </>
  );
};

export default InfluencersListing;
