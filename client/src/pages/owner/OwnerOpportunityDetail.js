import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

const ApplicantRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`;

const ApplicantInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  flex: 1;
`;

const ApplicantName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  &:hover { text-decoration: underline; }
`;

const ApplicantAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
`;

const ApplicantLeft = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const ImageGallery = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const GalleryImage = styled.img`
  width: 180px;
  height: 120px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100%;
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const TextArea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100%;
  resize: vertical;
  min-height: 80px;
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  width: 100%;
  outline: none;
  background: #fff;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const STATUS_VARIANT = { open: 'active', closed: 'pending', banned: 'banned' };
const APPLICANT_VARIANT = { pending: 'pending', accepted: 'active', rejected: 'banned' };

const EVENT_LABEL = {
  grand_opening: 'Grand Opening', seasonal_event: 'Seasonal Event', festival: 'Festival',
  product_launch: 'Product Launch', anniversary: 'Anniversary', holiday_special: 'Holiday Special',
  food_wine: 'Food & Wine', wellness_retreat: 'Wellness Retreat', other: 'Other',
};

const COMP_LABEL = {
  free_stay: 'Free Stay', paid: 'Paid', commission: 'Commission',
  discount_stay: 'Discount Stay', mixed: 'Mixed',
};

const OwnerOpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then(({ data }) => setOpp(data.opportunity))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    setEditForm({
      title: opp.title || '',
      description: opp.description || '',
      compensationType: opp.compensationType || 'free_stay',
      compensationDetails: opp.compensationDetails || '',
      maxApplicants: opp.maxApplicants || 10,
      minFollowers: opp.requirements?.minFollowers || 0,
      niches: opp.requirements?.niches?.join(', ') || '',
      deliverables: opp.requirements?.deliverables || '',
    });
    setEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        compensationType: editForm.compensationType,
        compensationDetails: editForm.compensationDetails,
        maxApplicants: Number(editForm.maxApplicants),
        requirements: {
          minFollowers: Number(editForm.minFollowers),
          niches: editForm.niches ? editForm.niches.split(',').map((s) => s.trim()).filter(Boolean) : [],
          deliverables: editForm.deliverables,
        },
      };
      const { data } = await api.put(`/opportunities/${id}`, payload);
      setOpp(data.opportunity);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApplicant = async (applicantId, action) => {
    setActing(applicantId);
    try {
      const { data } = await api.patch(`/opportunities/${id}/applicants/${applicantId}`, { action });
      setOpp((prev) => ({
        ...prev,
        applicants: prev.applicants.map((a) =>
          a._id === applicantId ? { ...a, status: action } : a
        ),
      }));
      if (action === 'accepted' && data.campaignId) {
        navigate(`/owner/collaborations/${data.campaignId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
    }
  };

  const handleClose = async () => {
    try {
      await api.put(`/opportunities/${id}`, { status: 'closed' });
      setOpp((prev) => ({ ...prev, status: 'closed' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = async () => {
    try {
      await api.put(`/opportunities/${id}`, { status: 'open' });
      setOpp((prev) => ({ ...prev, status: 'open' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      navigate('/owner/opportunities');
    } catch (err) {
      console.error(err);
    }
  };

  const viewProfile = (applicant) => {
    const profileId = applicant.influencerProfile?._id;
    if (profileId) {
      navigate(`/owner/influencers/${profileId}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!opp) return <p>Opportunity not found</p>;

  return (
    <>
      <PageHeader title={opp.title} subtitle={`${opp.hotelId?.name || ''} — ${EVENT_LABEL[opp.eventType] || opp.eventType}`} />

      {opp.images?.length > 0 && (
        <ImageGallery>
          {opp.images.map((img, idx) => (
            <GalleryImage key={idx} src={`${BASE_URL}${img}`} alt={`Event ${idx + 1}`} />
          ))}
        </ImageGallery>
      )}

      {editing ? (
        <Card>
          <FormGroup>
            <Label>Title</Label>
            <Input name="title" value={editForm.title} onChange={handleEditChange} maxLength={200} />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea name="description" value={editForm.description} onChange={handleEditChange} maxLength={3000} />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Compensation Type</Label>
              <Select name="compensationType" value={editForm.compensationType} onChange={handleEditChange}>
                <option value="free_stay">Free Stay</option>
                <option value="paid">Paid</option>
                <option value="commission">Commission</option>
                <option value="discount_stay">Discount Stay</option>
                <option value="mixed">Mixed</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Max Applicants</Label>
              <Input type="number" name="maxApplicants" value={editForm.maxApplicants} onChange={handleEditChange} min={1} />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Compensation Details</Label>
            <Input name="compensationDetails" value={editForm.compensationDetails} onChange={handleEditChange} maxLength={500} />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Min Followers</Label>
              <Input type="number" name="minFollowers" value={editForm.minFollowers} onChange={handleEditChange} min={0} />
            </FormGroup>
            <FormGroup>
              <Label>Preferred Niches (comma-separated)</Label>
              <Input name="niches" value={editForm.niches} onChange={handleEditChange} />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Deliverables</Label>
            <TextArea name="deliverables" value={editForm.deliverables} onChange={handleEditChange} maxLength={1000} />
          </FormGroup>

          <ButtonGroup>
            <Button $size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button $variant="ghost" $size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </ButtonGroup>
        </Card>
      ) : (
        <Card>
          <Grid>
            <Section>
              <Label>Description</Label>
              <Value>{opp.description || 'No description'}</Value>

              <Label>Event Type</Label>
              <Value>{EVENT_LABEL[opp.eventType] || opp.eventType}</Value>

              <Label>Compensation</Label>
              <Value>
                {COMP_LABEL[opp.compensationType] || opp.compensationType}
                {opp.compensationDetails && ` — ${opp.compensationDetails}`}
              </Value>

              <Label>Hotel</Label>
              <Value>
                {opp.hotelId?.name || 'N/A'}
                {opp.hotelId?.city && ` — ${opp.hotelId.city}`}
                {opp.hotelId?.starRating && ` — ${opp.hotelId.starRating} Star`}
              </Value>
              {opp.hotelId?.description && (
                <>
                  <Label>Hotel Description</Label>
                  <Value>{opp.hotelId.description}</Value>
                </>
              )}
            </Section>

            <Section>
              <Label>Event Dates</Label>
              <Value>{new Date(opp.eventStartDate).toLocaleDateString()} — {new Date(opp.eventEndDate).toLocaleDateString()}</Value>

              <Label>Application Deadline</Label>
              <Value>{new Date(opp.applicationDeadline).toLocaleDateString()}</Value>

              <Label>Max Applicants</Label>
              <Value>{opp.maxApplicants}</Value>

              {opp.requirements && (
                <>
                  <Label>Requirements</Label>
                  {opp.requirements.minFollowers > 0 && <Value>Min Followers: {opp.requirements.minFollowers.toLocaleString()}</Value>}
                  {opp.requirements.niches?.length > 0 && <Value>Niches: {opp.requirements.niches.join(', ')}</Value>}
                  {opp.requirements.deliverables && <Value>Deliverables: {opp.requirements.deliverables}</Value>}
                </>
              )}
            </Section>
          </Grid>
        </Card>
      )}

      <Card style={{ marginTop: '1rem' }}>
        <Label>Applicants ({opp.applicants?.length || 0} / {opp.maxApplicants})</Label>
        {opp.applicants?.length > 0 ? (
          opp.applicants.map((a) => (
            <ApplicantRow key={a._id}>
              <ApplicantLeft>
                {a.influencerProfile?.avatar && (
                  <ApplicantAvatar
                    src={`${BASE_URL}${a.influencerProfile.avatar}`}
                    alt={a.influencerProfile?.displayName || 'Avatar'}
                    onClick={() => viewProfile(a)}
                  />
                )}
                <ApplicantInfo>
                  <ApplicantName onClick={() => viewProfile(a)}>
                    {a.influencerProfile?.displayName || a.userId?.name || 'Unknown'}
                  </ApplicantName>
                  {a.influencerProfile?.niche && <span style={{ fontSize: '0.75rem', color: '#888' }}> · {a.influencerProfile.niche}</span>}
                  {a.influencerProfile?.location && <span style={{ fontSize: '0.75rem', color: '#888' }}> · {a.influencerProfile.location}</span>}
                  {a.userId?.email && <p style={{ fontSize: '0.75rem', margin: '2px 0 0', color: '#888' }}>{a.userId.email}</p>}
                  {a.message && <p style={{ fontSize: '0.8rem', margin: '4px 0 0', color: '#555' }}>{a.message}</p>}
                  <p style={{ fontSize: '0.7rem', margin: '2px 0 0', color: '#aaa' }}>Applied: {new Date(a.appliedAt).toLocaleDateString()}</p>
                </ApplicantInfo>
              </ApplicantLeft>
              <ButtonGroup>
                <Badge $variant={APPLICANT_VARIANT[a.status]}>{a.status}</Badge>
                {a.status === 'pending' && (
                  <>
                    <Button $variant="primary" $size="sm" disabled={acting === a._id} onClick={() => handleApplicant(a._id, 'accepted')}>Accept</Button>
                    <Button $variant="danger" $size="sm" disabled={acting === a._id} onClick={() => handleApplicant(a._id, 'rejected')}>Reject</Button>
                  </>
                )}
                <Button $variant="ghost" $size="sm" onClick={() => viewProfile(a)}>View Profile</Button>
              </ButtonGroup>
            </ApplicantRow>
          ))
        ) : (
          <Value>No applicants yet</Value>
        )}
      </Card>

      <Card style={{ marginTop: '1rem' }}>
        <Grid>
          <div>
            <Label>Status</Label>
            <Badge $variant={STATUS_VARIANT[opp.status]} style={{ marginBottom: '0.5rem' }}>{opp.status}</Badge>

            {opp.status === 'banned' && opp.banReason && (
              <>
                <Label style={{ marginTop: '1rem' }}>Ban Reason</Label>
                <Value style={{ color: '#DC2626' }}>{opp.banReason}</Value>
              </>
            )}

            <Label style={{ marginTop: '1rem' }}>Created</Label>
            <Value>{new Date(opp.createdAt).toLocaleDateString()}</Value>

            <Label>Last Updated</Label>
            <Value>{new Date(opp.updatedAt).toLocaleDateString()}</Value>
          </div>

        </Grid>

        <ButtonGroup style={{ flexWrap: 'wrap', marginTop: '1rem' }}>
          {opp.status !== 'banned' && !editing && (
            <Button $variant="secondary" $size="sm" onClick={startEdit}>Edit Opportunity</Button>
          )}
          {opp.status === 'open' && (
            <Button $variant="ghost" $size="sm" onClick={handleClose}>Close Applications</Button>
          )}
          {opp.status === 'closed' && (
            <Button $variant="primary" $size="sm" onClick={handleReopen}>Reopen</Button>
          )}
          {opp.status !== 'banned' && (
            <Button $variant="danger" $size="sm" onClick={handleDelete}>Delete</Button>
          )}
          <Button $variant="ghost" $size="sm" onClick={() => navigate('/owner/opportunities')}>Back to List</Button>
        </ButtonGroup>
      </Card>
    </>
  );
};

export default OwnerOpportunityDetail;
