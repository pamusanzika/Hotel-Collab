import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 640px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  max-height: 240px;
  overflow-y: auto;
  z-index: 20;
`;

const SearchItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const SearchAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ $round, theme }) => ($round ? theme.radius.full : theme.radius.sm)};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const SearchName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const SelectedChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary}08;
`;

const ChipRemove = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  font-size: 1rem;
  padding: 0 4px;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

const CampaignForm = ({ preSelectedHotel, preSelectedInfluencer, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'hotel_owner';

  // Hotel selection (for owners: select from own hotels; for influencers: search all hotels)
  const [selectedHotel, setSelectedHotel] = useState(preSelectedHotel || null);
  const [hotelSearch, setHotelSearch] = useState('');
  const [hotelResults, setHotelResults] = useState([]);
  const [myHotels, setMyHotels] = useState([]);

  // Influencer selection (for owners: search influencers)
  const [selectedInfluencer, setSelectedInfluencer] = useState(preSelectedInfluencer || null);
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [influencerResults, setInfluencerResults] = useState([]);

  // Form fields
  const [campaignType, setCampaignType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load owner's hotels for the hotel dropdown
  useEffect(() => {
    if (isOwner && !preSelectedHotel) {
      api.get('/hotels').then(({ data }) => {
        setMyHotels(data.hotels || []);
      }).catch(() => {});
    }
  }, [isOwner, preSelectedHotel]);

  // Search influencers (owner flow)
  useEffect(() => {
    if (!isOwner || preSelectedInfluencer || !influencerSearch.trim()) {
      setInfluencerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/influencer-listing?search=${encodeURIComponent(influencerSearch)}`);
        setInfluencerResults(data.influencers || []);
      } catch (_) {
        setInfluencerResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [influencerSearch, isOwner, preSelectedInfluencer]);

  // Search hotels (influencer flow)
  useEffect(() => {
    if (isOwner || preSelectedHotel || !hotelSearch.trim()) {
      setHotelResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/hosts?search=${encodeURIComponent(hotelSearch)}`);
        setHotelResults(data.hotels || []);
      } catch (_) {
        setHotelResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [hotelSearch, isOwner, preSelectedHotel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hotelId = selectedHotel?._id;
    const influencerId = isOwner ? selectedInfluencer?.userId : user.id;

    if (!hotelId) {
      setError('Please select a hotel');
      return;
    }
    if (isOwner && !influencerId) {
      setError('Please select a content creator');
      return;
    }
    if (!campaignType) {
      setError('Please select a campaign type');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a campaign title');
      return;
    }
    if (campaignType === 'paid_collaboration' && (!amount || parseFloat(amount) <= 0)) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hotelId,
        influencerId,
        campaignType,
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
      };
      if (campaignType === 'paid_collaboration') {
        payload.amount = parseFloat(amount);
      }
      await api.post('/campaigns', payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Memoized today string for min date
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        {/* ── Hotel Selection ──────────────────────────────────── */}
        {isOwner ? (
          // Owner selects from their own hotels
          <FieldGroup>
            <Label>Select Your Hotel</Label>
            {preSelectedHotel ? (
              <SelectedChip>
                <SearchName>{preSelectedHotel.name}</SearchName>
              </SelectedChip>
            ) : (
              <Select
                value={selectedHotel?._id || ''}
                onChange={(e) => {
                  const hotel = myHotels.find((h) => h._id === e.target.value);
                  setSelectedHotel(hotel || null);
                }}
                required
              >
                <option value="">Choose a hotel...</option>
                {myHotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            )}
          </FieldGroup>
        ) : (
          // Influencer searches hotels
          <FieldGroup>
            <Label>Select Hotel</Label>
            {selectedHotel ? (
              <SelectedChip>
                {selectedHotel.featureImage && (
                  <SearchAvatar>
                    <img src={`${API_BASE}${selectedHotel.featureImage}`} alt="" />
                  </SearchAvatar>
                )}
                <SearchName>{selectedHotel.name}</SearchName>
                {!preSelectedHotel && (
                  <ChipRemove type="button" onClick={() => setSelectedHotel(null)}>
                    ×
                  </ChipRemove>
                )}
              </SelectedChip>
            ) : (
              <SearchWrapper>
                <Input
                  type="text"
                  placeholder="Search hotels by name..."
                  value={hotelSearch}
                  onChange={(e) => setHotelSearch(e.target.value)}
                />
                {hotelResults.length > 0 && (
                  <SearchResults>
                    {hotelResults.map((h) => (
                      <SearchItem
                        key={h._id}
                        onClick={() => {
                          setSelectedHotel(h);
                          setHotelSearch('');
                          setHotelResults([]);
                        }}
                      >
                        <SearchAvatar>
                          {h.featureImage ? (
                            <img src={`${API_BASE}${h.featureImage}`} alt="" />
                          ) : null}
                        </SearchAvatar>
                        <SearchName>{h.name}</SearchName>
                      </SearchItem>
                    ))}
                  </SearchResults>
                )}
              </SearchWrapper>
            )}
          </FieldGroup>
        )}

        {/* ── Influencer Selection (owner only) ───────────────── */}
        {isOwner && (
          <FieldGroup>
            <Label>Select Content Creator</Label>
            {selectedInfluencer ? (
              <SelectedChip>
                {selectedInfluencer.avatar && (
                  <SearchAvatar $round>
                    <img src={`${API_BASE}${selectedInfluencer.avatar}`} alt="" />
                  </SearchAvatar>
                )}
                <SearchName>{selectedInfluencer.displayName || 'Content Creator'}</SearchName>
                {!preSelectedInfluencer && (
                  <ChipRemove type="button" onClick={() => setSelectedInfluencer(null)}>
                    ×
                  </ChipRemove>
                )}
              </SelectedChip>
            ) : (
              <SearchWrapper>
                <Input
                  type="text"
                  placeholder="Search content creators by name..."
                  value={influencerSearch}
                  onChange={(e) => setInfluencerSearch(e.target.value)}
                />
                {influencerResults.length > 0 && (
                  <SearchResults>
                    {influencerResults.map((inf) => (
                      <SearchItem
                        key={inf._id}
                        onClick={() => {
                          setSelectedInfluencer(inf);
                          setInfluencerSearch('');
                          setInfluencerResults([]);
                        }}
                      >
                        <SearchAvatar $round>
                          {inf.avatar ? (
                            <img src={`${API_BASE}${inf.avatar}`} alt="" />
                          ) : null}
                        </SearchAvatar>
                        <SearchName>{inf.displayName || 'Content Creator'}</SearchName>
                      </SearchItem>
                    ))}
                  </SearchResults>
                )}
              </SearchWrapper>
            )}
          </FieldGroup>
        )}

        {/* ── Campaign Type ──────────────────────────────────── */}
        <FieldGroup>
          <Label>Campaign Type</Label>
          <Select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} required>
            <option value="">Select type...</option>
            <option value="free_stay">Free Stay</option>
            <option value="paid_collaboration">Paid Collaboration</option>
            <option value="discount_stay">Discount Stay</option>
          </Select>
        </FieldGroup>

        {/* ── Amount (paid only) ─────────────────────────────── */}
        {campaignType === 'paid_collaboration' && (
          <FieldGroup>
            <Label>Payment Amount (USD)</Label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
            />
          </FieldGroup>
        )}

        {/* ── Title ──────────────────────────────────────────── */}
        <FieldGroup>
          <Label>Campaign Title</Label>
          <Input
            type="text"
            placeholder="e.g. Summer Getaway Content Creation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </FieldGroup>

        {/* ── Description ────────────────────────────────────── */}
        <FieldGroup>
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the campaign details, expectations, deliverables..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </FieldGroup>

        {/* ── Dates ──────────────────────────────────────────── */}
        <DateRow>
          <FieldGroup>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
              required
            />
          </FieldGroup>
        </DateRow>

        {error && <ErrorText>{error}</ErrorText>}

        <ButtonRow>
          {onCancel && (
            <Button type="button" $variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" $variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </ButtonRow>
      </Form>
    </Card>
  );
};

export default CampaignForm;
