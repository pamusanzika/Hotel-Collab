import { useState, useRef, useCallback, useEffect } from 'react';
import styled, { css } from 'styled-components';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input, { InputWrapper, Label, ErrorText } from '../../components/ui/Input';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

/* ──────────── Shared styled helpers ──────────── */

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 500px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

/* ──────────── Profile Picture styles ──────────── */

const AvatarArea = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const AvatarPreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarPlaceholder = styled.span`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const HiddenInput = styled.input`
  display: none;
`;

const SmallText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/* ──────────── Collaboration types styles ──────────── */

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.2s ease;

  ${({ $checked, theme }) =>
    $checked &&
    css`
      border-color: ${theme.colors.primary};
      background: ${theme.colors.primary}08;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;

/* ──────────── Platform / Social styles ──────────── */

const PlatformList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlatformCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PlatformInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlatformIcon = styled.span`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ $color }) => $color};
`;

const PlatformName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: capitalize;
`;

const PlatformMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DisabledMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`;

/* ──────────── My Content grid styles ──────────── */

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ContentCard = styled.a`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s ease, transform 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const ContentThumb = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContentBody = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const ContentTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
`;

const ContentDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Loader = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FallbackBox = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

/* ──────────── Portfolio styles ──────────── */

const PortfolioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const PortfolioItem = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
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
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm};
`;

const PortfolioItemFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const PortfolioItemName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const RemoveBtn = styled.button`
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.7rem;
  padding: 2px 6px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DropZone = styled.div`
  border: 2px dashed ${({ theme, $dragOver }) => $dragOver ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: ${({ theme, $dragOver }) => $dragOver ? `${theme.colors.primary}08` : 'transparent'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropZoneText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0;
`;

const UploadProgress = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary};
`;

/* ──────────── Profile Preview styles ──────────── */

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PreviewAvatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewName = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
`;

const PreviewBio = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
`;

const PreviewSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PreviewLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

/* ──────────── Constants ──────────── */

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'YT' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'IG' },
  { id: 'tiktok', label: 'TikTok', color: '#000000', icon: 'TK' },
];

const COLLAB_OPTIONS = [
  { value: 'free_stay', label: 'Free Stay' },
  { value: 'discount_stay', label: 'Discount Stay' },
  { value: 'paid_collaboration', label: 'Paid Collaboration' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const PORTFOLIO_ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  'application/pdf',
];
const PORTFOLIO_MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const SERVER_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

const toFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};

/* ──────────── Component ──────────── */

const InfluencerProfile = () => {
  const { user } = useAuth();

  // ── Basic info state ──
  const [displayName, setDisplayName] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // ── Profile picture state ──
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarSaved, setAvatarSaved] = useState(null); // URL from server
  const [avatarError, setAvatarError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Collaboration types state ──
  const [collabTypes, setCollabTypes] = useState([]);

  // ── Social account state ──
  const [connectedPlatform, setConnectedPlatform] = useState(null); // { id, label, username }
  const [disconnecting, setDisconnecting] = useState(false);

  // ── My Content state ──
  const [contentItems, setContentItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── Portfolio state ──
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const portfolioInputRef = useRef(null);

  // ── Profile preview modal ──
  const [showPreview, setShowPreview] = useState(false);

  // ── Load existing profile data ──
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/influencer/profile');
        if (data.displayName) setDisplayName(data.displayName);
        if (data.niche) setNiche(data.niche);
        if (data.location) setLocation(data.location);
        if (data.bio) setBio(data.bio);
        if (data.avatar) setAvatarSaved(toFullUrl(data.avatar));
        if (data.collaborationTypes) setCollabTypes(data.collaborationTypes);
        if (data.portfolio) setPortfolio(data.portfolio);
        if (data.connectedPlatform) {
          setConnectedPlatform(data.connectedPlatform);
        }
      } catch {
        // Profile not set up yet — fine
      }
    };
    loadProfile();
  }, []);

  // ── Fetch content when a platform is connected ──
  useEffect(() => {
    if (!connectedPlatform) {
      setContentItems([]);
      return;
    }

    const fetchContent = async () => {
      setContentLoading(true);
      setContentError('');
      try {
        const { data } = await api.get(
          `/oauth/${connectedPlatform.id}/content`
        );
        setContentItems(data.items || []);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'Unable to fetch content. API permissions may not allow reading posts.';
        setContentError(msg);
      } finally {
        setContentLoading(false);
      }
    };
    fetchContent();
  }, [connectedPlatform]);

  /* ──────── Profile Picture handlers ──────── */

  const uploadFile = async (file) => {
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/influencer/avatar', fd);
      setAvatarSaved(toFullUrl(data.url));
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG, and WebP files are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError('File size must be under 5 MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Auto-upload to server
    uploadFile(file);
  }, []);

  const handleAvatarRemove = async () => {
    setAvatarPreview(null);
    setAvatarError('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (avatarSaved) {
      try {
        await api.delete('/influencer/avatar');
      } catch {
        // ignore
      }
      setAvatarSaved(null);
    }
  };

  /* ──────── Collaboration type handler ──────── */

  const toggleCollab = (value) => {
    setCollabTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  /* ──────── Social account handlers ──────── */

  const handleLink = async (provider) => {
    try {
      const { data } = await api.get(`/oauth/${provider}/start`);
      window.location.href = data.authUrl;
    } catch (err) {
      console.error(`Failed to start ${provider} OAuth:`, err);
    }
  };

  const handleDisconnect = async () => {
    if (!connectedPlatform) return;
    if (!window.confirm(`Disconnect ${connectedPlatform.label}?`)) return;
    setDisconnecting(true);
    try {
      await api.delete(`/oauth/${connectedPlatform.id}/unlink`);
      setConnectedPlatform(null);
      setContentItems([]);
      setContentError('');
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnecting(false);
    }
  };

  /* ──────── Portfolio handlers ──────── */

  const handlePortfolioUpload = async (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setPortfolioError('');

    for (const file of fileList) {
      if (!PORTFOLIO_ALLOWED_TYPES.includes(file.type)) {
        setPortfolioError(`"${file.name}" is not a supported file type. Use images, videos, or PDFs.`);
        return;
      }
      if (file.size > PORTFOLIO_MAX_SIZE) {
        setPortfolioError(`"${file.name}" exceeds the 50 MB limit.`);
        return;
      }
    }

    if (portfolio.length + fileList.length > 20) {
      setPortfolioError(`Portfolio limit is 20 items. You have ${portfolio.length} already.`);
      return;
    }

    setPortfolioUploading(true);
    try {
      const fd = new FormData();
      fileList.forEach((f) => fd.append('files', f));
      const { data } = await api.post('/influencer/portfolio', fd);
      setPortfolio((prev) => [...prev, ...data.items]);
    } catch (err) {
      setPortfolioError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setPortfolioUploading(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  };

  const handlePortfolioDelete = async (itemId) => {
    if (!window.confirm('Remove this portfolio item?')) return;
    try {
      await api.delete(`/influencer/portfolio/${itemId}`);
      setPortfolio((prev) => prev.filter((p) => p._id !== itemId));
    } catch {
      setPortfolioError('Failed to remove item.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handlePortfolioUpload(e.dataTransfer.files);
  };

  const renderPortfolioThumb = (item) => {
    const fullUrl = toFullUrl(item.url);
    if (item.fileType === 'image') return <img src={fullUrl} alt={item.title || item.originalName} />;
    if (item.fileType === 'video') return <video src={fullUrl} muted />;
    if (item.fileType === 'pdf') return <PortfolioFileIcon><span style={{ fontSize: '2rem' }}>&#128196;</span>PDF</PortfolioFileIcon>;
    return <PortfolioFileIcon><span style={{ fontSize: '2rem' }}>&#128193;</span>{item.originalName}</PortfolioFileIcon>;
  };

  /* ──────── Save basic info + collab types ──────── */

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await api.put('/influencer/profile', {
        displayName,
        niche,
        location,
        bio,
        collaborationTypes: collabTypes,
      });
      setSaveMsg('Profile saved successfully.');
    } catch (err) {
      setSaveMsg('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ──────── Derived helpers ──────── */

  const currentAvatarSrc = avatarPreview || avatarSaved;
  const platformLabel = PLATFORMS.find(
    (p) => p.id === connectedPlatform?.id
  )?.label;

  /* ──────── Render ──────── */

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Manage your profile, linked platform, and collaboration preferences"
      />

      {/* ── Profile Picture ── */}
      <Section>
        <SectionTitle>Profile Picture</SectionTitle>
        <Card>
          <AvatarArea>
            <AvatarPreview>
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt="Avatar" />
              ) : (
                <AvatarPlaceholder>&#128100;</AvatarPlaceholder>
              )}
            </AvatarPreview>

            <div>
              <Row>
                <Button
                  type="button"
                  $variant="secondary"
                  $size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Uploading…' : 'Choose Photo'}
                </Button>

                {(avatarSaved || avatarPreview) && !avatarUploading && (
                  <Button
                    type="button"
                    $variant="danger"
                    $size="sm"
                    onClick={handleAvatarRemove}
                  >
                    Remove
                  </Button>
                )}
              </Row>

              <SmallText>JPG, PNG, or WebP. Max 5 MB.</SmallText>
              {avatarError && <ErrorText>{avatarError}</ErrorText>}
            </div>
          </AvatarArea>

          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
          />
        </Card>
      </Section>

      {/* ── Basic Info ── */}
      <Section>
        <SectionTitle>Basic Info</SectionTitle>
        <Card>
          <Form onSubmit={handleSave}>
            <InputWrapper>
              <Label>Display Name</Label>
              <Input
                placeholder="Your public name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </InputWrapper>
            <InputWrapper>
              <Label>Niche</Label>
              <Input
                placeholder="e.g. Travel, Luxury, Food"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </InputWrapper>
            <InputWrapper>
              <Label>Location</Label>
              <Input
                placeholder="e.g. New York, USA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </InputWrapper>
            <InputWrapper>
              <Label>Bio</Label>
              <Input
                as="textarea"
                rows={3}
                placeholder="Tell hotels about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </InputWrapper>

            {/* ── Collaboration Types (inside the form so they save together) ── */}
            <InputWrapper>
              <Label>Collaboration Types</Label>
              <CheckboxGroup>
                {COLLAB_OPTIONS.map((opt) => {
                  const checked = collabTypes.includes(opt.value);
                  return (
                    <CheckboxLabel key={opt.value} $checked={checked}>
                      <Checkbox
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCollab(opt.value)}
                      />
                      {opt.label}
                    </CheckboxLabel>
                  );
                })}
              </CheckboxGroup>
            </InputWrapper>

            <Button
              type="submit"
              $variant="secondary"
              style={{ alignSelf: 'flex-start' }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            {saveMsg && (
              <SmallText style={{ color: saveMsg.includes('success') ? '#10B981' : '#EF4444' }}>
                {saveMsg}
              </SmallText>
            )}
          </Form>
        </Card>
      </Section>

      {/* ── Portfolio ── */}
      <Section>
        <SectionTitle>Portfolio</SectionTitle>
        <Card>
          <SmallText style={{ marginBottom: '1rem', marginTop: 0 }}>
            Upload images, videos, or PDFs to showcase your work. Max 50 MB per file, up to 20 items.
          </SmallText>

          <DropZone
            $dragOver={dragOver}
            onClick={() => portfolioInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <DropZoneText>
              {portfolioUploading
                ? 'Uploading...'
                : 'Drag & drop files here, or click to browse'}
            </DropZoneText>
          </DropZone>

          <HiddenInput
            ref={portfolioInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.webm,.pdf"
            onChange={(e) => handlePortfolioUpload(e.target.files)}
          />

          {portfolioUploading && <UploadProgress>Uploading files...</UploadProgress>}
          {portfolioError && <ErrorText>{portfolioError}</ErrorText>}

          {portfolio.length > 0 && (
            <PortfolioGrid style={{ marginTop: '1rem' }}>
              {portfolio.map((item) => (
                <PortfolioItem key={item._id}>
                  <PortfolioThumb>
                    {renderPortfolioThumb(item)}
                  </PortfolioThumb>
                  <PortfolioItemFooter>
                    <RemoveBtn
                      onClick={() => handlePortfolioDelete(item._id)}
                      disabled={portfolioUploading}
                    >
                      Remove
                    </RemoveBtn>
                  </PortfolioItemFooter>
                </PortfolioItem>
              ))}
            </PortfolioGrid>
          )}

          {portfolio.length === 0 && !portfolioUploading && (
            <FallbackBox style={{ marginTop: '1rem' }}>
              No portfolio items yet. Upload your best work to attract hotels.
            </FallbackBox>
          )}
        </Card>
      </Section>

      {/* ── Social Account (single platform) ── */}
      <Section>
        <SectionTitle>Social Account</SectionTitle>
        <PlatformList>
          {PLATFORMS.map((p) => {
            const isConnected = connectedPlatform?.id === p.id;
            const anotherConnected =
              connectedPlatform && connectedPlatform.id !== p.id;

            return (
              <PlatformCard key={p.id}>
                <PlatformInfo>
                  <PlatformIcon $color={p.color}>{p.icon}</PlatformIcon>
                  <div>
                    <PlatformName>{p.label}</PlatformName>
                    <br />
                    {isConnected ? (
                      <PlatformMeta>
                        Connected
                        {connectedPlatform.username &&
                          ` as @${connectedPlatform.username}`}
                      </PlatformMeta>
                    ) : (
                      <PlatformMeta>Not connected</PlatformMeta>
                    )}
                  </div>
                </PlatformInfo>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isConnected ? (
                    <Button
                      $variant="danger"
                      $size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                    </Button>
                  ) : anotherConnected ? (
                    <DisabledMessage>
                      Only one social account can be connected.
                    </DisabledMessage>
                  ) : (
                    <Button
                      $variant="secondary"
                      $size="sm"
                      onClick={() => handleLink(p.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </PlatformCard>
            );
          })}
        </PlatformList>

        <SmallText style={{ marginTop: '0.75rem' }}>
          You can connect one social account at a time. Disconnect the current
          account to switch platforms.
        </SmallText>
      </Section>

      {/* ── My Content (visible when a platform is connected) ── */}
      {connectedPlatform && (
        <Section>
          <SectionTitle>My Content — {platformLabel}</SectionTitle>
          <Card>
            {contentLoading && <Loader>Loading your content…</Loader>}

            {!contentLoading && contentError && (
              <FallbackBox>
                <p>{contentError}</p>
                {connectedPlatform.username && (
                  <p style={{ marginTop: '0.5rem' }}>
                    Connected as{' '}
                    <strong>@{connectedPlatform.username}</strong>
                  </p>
                )}
              </FallbackBox>
            )}

            {!contentLoading && !contentError && contentItems.length === 0 && (
              <FallbackBox>No content found for this account.</FallbackBox>
            )}

            {!contentLoading && !contentError && contentItems.length > 0 && (
              <ContentGrid>
                {contentItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ContentThumb>
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title || ''} />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9CA3AF',
                          }}
                        >
                          No preview
                        </div>
                      )}
                    </ContentThumb>
                    <ContentBody>
                      <ContentTitle>
                        {item.title || item.caption || 'Untitled'}
                      </ContentTitle>
                      {item.date && (
                        <ContentDate>
                          {new Date(item.date).toLocaleDateString()}
                        </ContentDate>
                      )}
                    </ContentBody>
                  </ContentCard>
                ))}
              </ContentGrid>
            )}
          </Card>
        </Section>
      )}

      {/* ── Profile Preview Button ── */}
      <Section>
        <Button
          $variant="ghost"
          onClick={() => setShowPreview(true)}
        >
          Preview My Profile
        </Button>
      </Section>

      {/* ── Profile Preview Modal ── */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
        <PreviewHeader>
          <PreviewAvatar>
            {currentAvatarSrc ? (
              <img src={currentAvatarSrc} alt="Avatar" />
            ) : (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  fontSize: '1.75rem',
                  color: '#9CA3AF',
                }}
              >
                &#128100;
              </span>
            )}
          </PreviewAvatar>

          <div>
            <PreviewName>
              {displayName || user?.name || 'Your Name'}
            </PreviewName>
            {niche && (
              <PreviewBio>{niche}</PreviewBio>
            )}
            {location && (
              <PreviewBio>{location}</PreviewBio>
            )}
          </div>
        </PreviewHeader>

        {bio && (
          <PreviewSection>
            <PreviewLabel>About</PreviewLabel>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.875rem',
                color: '#4B5563',
              }}
            >
              {bio}
            </p>
          </PreviewSection>
        )}

        {collabTypes.length > 0 && (
          <PreviewSection>
            <PreviewLabel>Open to</PreviewLabel>
            <TagList>
              {collabTypes.map((v) => {
                const label = COLLAB_OPTIONS.find(
                  (o) => o.value === v
                )?.label;
                return (
                  <Badge key={v} $variant="info">
                    {label}
                  </Badge>
                );
              })}
            </TagList>
          </PreviewSection>
        )}

        {portfolio.length > 0 && (
          <PreviewSection>
            <PreviewLabel>Portfolio ({portfolio.length})</PreviewLabel>
            <PortfolioGrid style={{ marginTop: '0.5rem' }}>
              {portfolio.slice(0, 6).map((item) => (
                <PortfolioItem key={item._id}>
                  <PortfolioThumb>{renderPortfolioThumb(item)}</PortfolioThumb>
                </PortfolioItem>
              ))}
            </PortfolioGrid>
          </PreviewSection>
        )}

        {connectedPlatform && (
          <PreviewSection>
            <PreviewLabel>Social</PreviewLabel>
            <div
              style={{
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Badge $variant="active">
                {platformLabel}
              </Badge>
              {connectedPlatform.username && (
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  @{connectedPlatform.username}
                </span>
              )}
            </div>
          </PreviewSection>
        )}
      </Modal>
    </>
  );
};

export default InfluencerProfile;
