import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input, { InputWrapper, Label, ErrorText } from '../../components/ui/Input';
import api from '../../api/axios';

// ─── Layout ────────────────────────────────────────────────────────────────────

const FormWrapper = styled.div`
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

// ─── Image upload ──────────────────────────────────────────────────────────────

const UploadZone = styled.div`
  border: 2px dashed ${({ theme, $isDragging }) =>
    $isDragging ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: ${({ theme, $isDragging }) =>
    $isDragging ? `${theme.colors.primary}08` : theme.colors.surface};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const UploadText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const UploadIcon = styled.span`
  font-size: 2rem;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ImageThumb = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  border: 3px solid
    ${({ theme, $isFeature }) =>
      $isFeature ? theme.colors.primary : theme.colors.borderLight};
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
  }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  line-height: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.85);
  }
`;

const FeatureBadge = styled.span`
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 0.65rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
`;

// ─── Checkboxes ────────────────────────────────────────────────────────────────

const CheckGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  input:checked + span {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }
`;

// ─── Availability toggle ───────────────────────────────────────────────────────

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ToggleBtn = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.surface};
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
  cursor: pointer;
  transition: all 0.2s;
`;

// ─── Preview overlay ───────────────────────────────────────────────────────────

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
`;

const PreviewBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const PreviewClose = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  border: none;
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PreviewTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PreviewField = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PreviewLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  margin-bottom: 2px;
`;

const PreviewValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text};
`;

const PreviewImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const PreviewImg = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  border: 2px solid
    ${({ theme, $isFeature }) =>
      $isFeature ? theme.colors.primary : theme.colors.borderLight};

  img {
    width: 100%;
    height: 90px;
    object-fit: cover;
    display: block;
  }
`;

const PreviewActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLLAB_OPTIONS = [
  { value: 'free_stay', label: 'Free Stay' },
  { value: 'discount_stay', label: 'Discount Stay' },
  { value: 'paid_collaboration', label: 'Paid Collaboration' },
];

const COLLAB_LABEL_MAP = {
  free_stay: 'Free Stay',
  discount_stay: 'Discount Stay',
  paid_collaboration: 'Paid Collaboration',
};

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// ─── Component ─────────────────────────────────────────────────────────────────

const EditHotelListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    location: '',
    city: '',
    description: '',
  });
  // existingImages = URLs already saved on server
  // newImages = { file, preview } freshly picked by user
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [collabTypes, setCollabTypes] = useState([]);
  const [availability, setAvailability] = useState({
    status: 'available',
    startDate: '',
    endDate: '',
  });

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const allImages = [
    ...existingImages.map((url) => ({ type: 'existing', url, preview: `${API_BASE}${url}` })),
    ...newImages.map((img) => ({ type: 'new', file: img.file, preview: img.preview })),
  ];

  // ── Load hotel data ────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/hotels/${id}`);
        const h = data.hotel;
        setForm({
          name: h.name || '',
          location: h.location || '',
          city: h.city || '',
          description: h.description || '',
        });
        setExistingImages(h.images || []);
        setCollabTypes(h.collaborationTypes || []);
        setAvailability({
          status: h.availability?.status || 'available',
          startDate: h.availability?.startDate ? h.availability.startDate.slice(0, 10) : '',
          endDate: h.availability?.endDate ? h.availability.endDate.slice(0, 10) : '',
        });
        // Resolve feature index
        if (h.featureImage && h.images?.length) {
          const idx = h.images.indexOf(h.featureImage);
          setFeatureIndex(idx >= 0 ? idx : 0);
        }
      } catch (err) {
        setErrors({ submit: 'Failed to load hotel data.' });
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      /image\/(jpeg|jpg|png|webp)/.test(f.type)
    );
    const totalNow = existingImages.length + newImages.length;
    const remaining = 5 - totalNow;
    if (remaining <= 0) return;
    const toAdd = incoming.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...toAdd]);
    if (errors.images) setErrors({ ...errors, images: '' });
  };

  const onFileChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    if (idx < existingImages.length) {
      // removing an existing server image
      setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    } else {
      // removing a newly added image
      const newIdx = idx - existingImages.length;
      URL.revokeObjectURL(newImages[newIdx].preview);
      setNewImages((prev) => prev.filter((_, i) => i !== newIdx));
    }
    if (featureIndex === idx) setFeatureIndex(0);
    else if (featureIndex > idx) setFeatureIndex(featureIndex - 1);
  };

  const toggleCollab = (value) => {
    setCollabTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    if (errors.collabTypes) setErrors({ ...errors, collabTypes: '' });
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Hotel name is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (allImages.length === 0) errs.images = 'Upload at least one image';
    if (collabTypes.length === 0) errs.collabTypes = 'Select at least one collaboration type';
    if (
      availability.status === 'available' &&
      availability.startDate &&
      availability.endDate &&
      availability.startDate > availability.endDate
    ) {
      errs.dates = 'End date must be after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreview = () => {
    if (validate()) setShowPreview(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('location', form.location.trim());
      data.append('city', form.city.trim());
      data.append('description', form.description.trim());
      data.append('existingImages', JSON.stringify(existingImages));
      data.append('collaborationTypes', JSON.stringify(collabTypes));
      data.append(
        'availability',
        JSON.stringify({
          status: availability.status,
          startDate: availability.startDate || null,
          endDate: availability.endDate || null,
        })
      );
      data.append('featureImage', String(featureIndex));

      newImages.forEach((img) => data.append('images', img.file));

      await api.put(`/hotels/${id}`, data);

      navigate('/owner/hotels');
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to update hotel. Please try again.',
      });
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (pageLoading) return <LoadingState>Loading hotel data...</LoadingState>;

  return (
    <>
      <PageHeader
        title="Edit Hotel Listing"
        subtitle="Update your hotel details below"
      />

      <FormWrapper>
        {/* ── Section 1: Basic Details ─────────────────────────────────── */}
        <Card>
          <SectionTitle>Basic Details</SectionTitle>

          <InputWrapper style={{ marginBottom: '1rem' }}>
            <Label>Hotel Name *</Label>
            <Input
              name="name"
              placeholder="e.g. Grand Horizon Resort"
              value={form.name}
              onChange={onChange}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </InputWrapper>

          <FieldRow style={{ marginBottom: '1rem' }}>
            <InputWrapper>
              <Label>Location *</Label>
              <Input
                name="location"
                placeholder="e.g. 123 Beach Road"
                value={form.location}
                onChange={onChange}
              />
              {errors.location && <ErrorText>{errors.location}</ErrorText>}
            </InputWrapper>
            <InputWrapper>
              <Label>City *</Label>
              <Input
                name="city"
                placeholder="e.g. Colombo"
                value={form.city}
                onChange={onChange}
              />
              {errors.city && <ErrorText>{errors.city}</ErrorText>}
            </InputWrapper>
          </FieldRow>

          <InputWrapper>
            <Label>Description</Label>
            <Input
              as="textarea"
              name="description"
              placeholder="Describe your hotel, amenities, and what makes it special..."
              value={form.description}
              onChange={onChange}
              rows={4}
              maxLength={1000}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: '#9CA3AF',
                textAlign: 'right',
                display: 'block',
              }}
            >
              {form.description.length}/1000
            </span>
          </InputWrapper>
        </Card>

        {/* ── Section 2: Hotel Images ──────────────────────────────────── */}
        <Card>
          <SectionTitle>Hotel Images</SectionTitle>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              marginBottom: '0.75rem',
            }}
          >
            Upload up to 5 images. Click an image to set it as the Feature Image.
          </p>

          <UploadZone
            $isDragging={isDragging}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <UploadIcon>&#128247;</UploadIcon>
            <UploadText>
              {allImages.length >= 5
                ? 'Maximum 5 images reached'
                : 'Drag & drop images here or click to browse'}
            </UploadText>
            <UploadText style={{ fontSize: '0.75rem' }}>
              JPEG, PNG, or WebP (max 5 MB each)
            </UploadText>
          </UploadZone>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          {allImages.length > 0 && (
            <ImageGrid>
              {allImages.map((img, idx) => (
                <ImageThumb
                  key={idx}
                  $isFeature={idx === featureIndex}
                  onClick={() => setFeatureIndex(idx)}
                  title={
                    idx === featureIndex
                      ? 'Feature image'
                      : 'Click to set as feature image'
                  }
                >
                  <img src={img.preview} alt={`Hotel image ${idx + 1}`} />
                  <RemoveBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    title="Remove image"
                  >
                    &#x2715;
                  </RemoveBtn>
                  {idx === featureIndex && (
                    <FeatureBadge>Feature</FeatureBadge>
                  )}
                </ImageThumb>
              ))}
            </ImageGrid>
          )}
          {errors.images && (
            <ErrorText style={{ marginTop: '0.5rem' }}>{errors.images}</ErrorText>
          )}
        </Card>

        {/* ── Section 3: Collaboration Types ───────────────────────────── */}
        <Card>
          <SectionTitle>Collaboration Types *</SectionTitle>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              marginBottom: '0.75rem',
            }}
          >
            Select the types of collaborations you offer to content creators.
          </p>

          <CheckGroup>
            {COLLAB_OPTIONS.map((opt) => (
              <CheckLabel key={opt.value}>
                <input
                  type="checkbox"
                  checked={collabTypes.includes(opt.value)}
                  onChange={() => toggleCollab(opt.value)}
                />
                <span>{opt.label}</span>
              </CheckLabel>
            ))}
          </CheckGroup>
          {errors.collabTypes && (
            <ErrorText style={{ marginTop: '0.5rem' }}>
              {errors.collabTypes}
            </ErrorText>
          )}
        </Card>

        {/* ── Section 4: Availability ──────────────────────────────────── */}
        <Card>
          <SectionTitle>Availability</SectionTitle>

          <ToggleRow>
            <ToggleBtn
              type="button"
              $active={availability.status === 'available'}
              onClick={() =>
                setAvailability({ ...availability, status: 'available' })
              }
            >
              Available
            </ToggleBtn>
            <ToggleBtn
              type="button"
              $active={availability.status === 'unavailable'}
              onClick={() =>
                setAvailability({ ...availability, status: 'unavailable' })
              }
            >
              Unavailable
            </ToggleBtn>
          </ToggleRow>

          {availability.status === 'available' && (
            <FieldRow>
              <InputWrapper>
                <Label>Available From</Label>
                <Input
                  type="date"
                  value={availability.startDate}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      startDate: e.target.value,
                    })
                  }
                />
              </InputWrapper>
              <InputWrapper>
                <Label>Available Until</Label>
                <Input
                  type="date"
                  value={availability.endDate}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      endDate: e.target.value,
                    })
                  }
                />
              </InputWrapper>
            </FieldRow>
          )}
          {errors.dates && (
            <ErrorText style={{ marginTop: '0.5rem' }}>{errors.dates}</ErrorText>
          )}
        </Card>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        {errors.submit && (
          <ErrorText style={{ textAlign: 'center' }}>{errors.submit}</ErrorText>
        )}

        <ActionBar>
          <Button
            $variant="ghost"
            type="button"
            onClick={() => navigate('/owner/hotels')}
          >
            Cancel
          </Button>
          <Button $variant="primary" type="button" onClick={handlePreview}>
            Preview Changes
          </Button>
        </ActionBar>
      </FormWrapper>

      {/* ── Preview Modal ────────────────────────────────────────────── */}
      {showPreview && (
        <PreviewOverlay onClick={() => setShowPreview(false)}>
          <PreviewBox onClick={(e) => e.stopPropagation()}>
            <PreviewClose onClick={() => setShowPreview(false)}>
              &#x2715;
            </PreviewClose>

            <PreviewTitle>Preview Your Changes</PreviewTitle>

            <PreviewField>
              <PreviewLabel>Hotel Name</PreviewLabel>
              <PreviewValue>{form.name}</PreviewValue>
            </PreviewField>

            <PreviewField>
              <PreviewLabel>Location</PreviewLabel>
              <PreviewValue>{form.location}</PreviewValue>
            </PreviewField>

            <PreviewField>
              <PreviewLabel>City</PreviewLabel>
              <PreviewValue>{form.city}</PreviewValue>
            </PreviewField>

            {form.description && (
              <PreviewField>
                <PreviewLabel>Description</PreviewLabel>
                <PreviewValue>{form.description}</PreviewValue>
              </PreviewField>
            )}

            <PreviewField>
              <PreviewLabel>
                Images ({allImages.length}) — Featured image highlighted
              </PreviewLabel>
              <PreviewImageGrid>
                {allImages.map((img, idx) => (
                  <PreviewImg key={idx} $isFeature={idx === featureIndex}>
                    <img src={img.preview} alt={`Preview ${idx + 1}`} />
                    {idx === featureIndex && (
                      <FeatureBadge>Feature</FeatureBadge>
                    )}
                  </PreviewImg>
                ))}
              </PreviewImageGrid>
            </PreviewField>

            <PreviewField>
              <PreviewLabel>Collaboration Types</PreviewLabel>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '4px' }}>
                {collabTypes.map((ct) => (
                  <Badge key={ct} $variant="info">
                    {COLLAB_LABEL_MAP[ct]}
                  </Badge>
                ))}
              </div>
            </PreviewField>

            <PreviewField>
              <PreviewLabel>Availability</PreviewLabel>
              <PreviewValue>
                <Badge
                  $variant={
                    availability.status === 'available' ? 'active' : 'pending'
                  }
                >
                  {availability.status === 'available'
                    ? 'Available'
                    : 'Unavailable'}
                </Badge>
                {availability.status === 'available' &&
                  availability.startDate &&
                  availability.endDate && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                      {availability.startDate} to {availability.endDate}
                    </span>
                  )}
              </PreviewValue>
            </PreviewField>

            <PreviewActions>
              <Button
                $variant="ghost"
                type="button"
                onClick={() => setShowPreview(false)}
              >
                Edit
              </Button>
              <Button
                $variant="primary"
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </PreviewActions>
          </PreviewBox>
        </PreviewOverlay>
      )}
    </>
  );
};

export default EditHotelListing;
