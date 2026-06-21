import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axios';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
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
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  background: #fff;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const TextArea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: vertical;
  min-height: 100px;
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const DropZone = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: border-color 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const ImageGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ImageThumb = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OwnerOpportunityCreate = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = React.useRef(null);
  const [form, setForm] = useState({
    hotelId: '',
    title: '',
    description: '',
    eventType: 'seasonal_event',
    compensationType: 'free_stay',
    compensationDetails: '',
    eventStartDate: '',
    eventEndDate: '',
    applicationDeadline: '',
    maxApplicants: 10,
    minFollowers: 0,
    niches: '',
    deliverables: '',
  });

  useEffect(() => {
    api.get('/hotels').then(({ data }) => {
      const list = data.hotels || data;
      setHotels(list);
      if (list.length > 0) setForm((f) => ({ ...f, hotelId: list[0]._id }));
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).filter((f) =>
      /image\/(jpeg|jpg|png|webp)/.test(f.type)
    );
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('hotelId', form.hotelId);
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('eventType', form.eventType);
      data.append('compensationType', form.compensationType);
      data.append('compensationDetails', form.compensationDetails);
      data.append('eventStartDate', form.eventStartDate);
      data.append('eventEndDate', form.eventEndDate);
      data.append('applicationDeadline', form.applicationDeadline);
      data.append('maxApplicants', String(form.maxApplicants));
      data.append('requirements', JSON.stringify({
        minFollowers: Number(form.minFollowers),
        niches: form.niches ? form.niches.split(',').map((s) => s.trim()).filter(Boolean) : [],
        deliverables: form.deliverables,
      }));
      images.forEach((img) => data.append('images', img.file));

      await api.post('/opportunities', data);
      navigate('/owner/opportunities');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Create Event Opportunity" subtitle="Publish a collaboration opportunity for content creators" />
      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Hotel</Label>
            <Select name="hotelId" value={form.hotelId} onChange={handleChange} required>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Title</Label>
            <Input name="title" value={form.title} onChange={handleChange} required maxLength={200} placeholder="e.g. NYE Gala Influencer Collab" />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea name="description" value={form.description} onChange={handleChange} maxLength={3000} placeholder="Describe the event and what you're looking for..." />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Event Type</Label>
              <Select name="eventType" value={form.eventType} onChange={handleChange}>
                <option value="grand_opening">Grand Opening</option>
                <option value="seasonal_event">Seasonal Event</option>
                <option value="festival">Festival</option>
                <option value="product_launch">Product Launch</option>
                <option value="anniversary">Anniversary</option>
                <option value="holiday_special">Holiday Special</option>
                <option value="food_wine">Food & Wine</option>
                <option value="wellness_retreat">Wellness Retreat</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Compensation Type</Label>
              <Select name="compensationType" value={form.compensationType} onChange={handleChange}>
                <option value="free_stay">Free Stay</option>
                <option value="paid">Paid</option>
                <option value="commission">Commission</option>
                <option value="discount_stay">Discount Stay</option>
                <option value="mixed">Mixed</option>
              </Select>
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Compensation Details (optional)</Label>
            <Input name="compensationDetails" value={form.compensationDetails} onChange={handleChange} maxLength={500} placeholder="e.g. 3-night stay + $500 content fee" />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Event Start Date</Label>
              <Input type="date" name="eventStartDate" value={form.eventStartDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
            </FormGroup>
            <FormGroup>
              <Label>Event End Date</Label>
              <Input type="date" name="eventEndDate" value={form.eventEndDate} onChange={handleChange} required min={form.eventStartDate || new Date().toISOString().split('T')[0]} />
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Application Deadline</Label>
              <Input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} max={form.eventStartDate || undefined} />
            </FormGroup>
            <FormGroup>
              <Label>Max Applicants</Label>
              <Input type="number" name="maxApplicants" value={form.maxApplicants} onChange={handleChange} min={1} />
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Min Followers (optional)</Label>
              <Input type="number" name="minFollowers" value={form.minFollowers} onChange={handleChange} min={0} />
            </FormGroup>
            <FormGroup>
              <Label>Preferred Niches (comma-separated)</Label>
              <Input name="niches" value={form.niches} onChange={handleChange} placeholder="e.g. travel, food, luxury" />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Deliverables (optional)</Label>
            <TextArea name="deliverables" value={form.deliverables} onChange={handleChange} maxLength={1000} placeholder="e.g. 2 Instagram posts, 3 stories, 1 reel" />
          </FormGroup>

          <FormGroup>
            <Label>Event Images (up to 5)</Label>
            <DropZone onClick={() => fileInputRef.current?.click()}>
              {images.length >= 5 ? 'Maximum 5 images reached' : 'Click to upload images'}
            </DropZone>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleFiles}
            />
            {images.length > 0 && (
              <ImageGrid>
                {images.map((img, idx) => (
                  <ImageThumb key={idx}>
                    <img src={img.preview} alt={`Upload ${idx + 1}`} />
                    <RemoveBtn type="button" onClick={() => removeImage(idx)}>&times;</RemoveBtn>
                  </ImageThumb>
                ))}
              </ImageGrid>
            )}
          </FormGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <ButtonRow>
            <Button type="button" $variant="ghost" onClick={() => navigate('/owner/opportunities')}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Publish Opportunity'}</Button>
          </ButtonRow>
        </Form>
      </Card>
    </>
  );
};

export default OwnerOpportunityCreate;
