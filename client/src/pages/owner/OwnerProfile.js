import { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { InputWrapper, Label } from '../../components/ui/Input';
import styled from 'styled-components';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 500px;
`;

const Message = styled.p`
  color: ${({ $error, theme }) => ($error ? theme.colors.error || '#e53e3e' : theme.colors.success || '#38a169')};
  font-size: 0.9rem;
  margin: 0;
`;

const OwnerProfile = () => {
  const [form, setForm] = useState({
    companyName: '',
    phone: '',
    website: '',
    location: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/owner/profile');
        setForm({
          companyName: data.companyName || '',
          phone: data.phone || '',
          website: data.website || '',
          location: data.location || '',
          bio: data.bio || '',
        });
      } catch {
        setMessage({ text: 'Failed to load profile', error: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.put('/owner/profile', form);
      setForm({
        companyName: data.companyName || '',
        phone: data.phone || '',
        website: data.website || '',
        location: data.location || '',
        bio: data.bio || '',
      });
      setMessage({ text: 'Profile saved successfully', error: false });
    } catch {
      setMessage({ text: 'Failed to save profile', error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your hotel owner profile" />
      <Card>
        <Form onSubmit={handleSubmit}>
          <InputWrapper>
            <Label>Company Name</Label>
            <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Your hotel company" />
          </InputWrapper>
          <InputWrapper>
            <Label>Phone</Label>
            <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          </InputWrapper>
          <InputWrapper>
            <Label>Website</Label>
            <Input name="website" value={form.website} onChange={handleChange} placeholder="https://yourhotel.com" />
          </InputWrapper>
          <InputWrapper>
            <Label>Location</Label>
            <Input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" />
          </InputWrapper>
          <InputWrapper>
            <Label>Bio</Label>
            <Input as="textarea" rows={3} name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your hotel business" />
          </InputWrapper>
          {message && <Message $error={message.error}>{message.text}</Message>}
          <Button type="submit" $variant="primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </Card>
    </>
  );
};

export default OwnerProfile;
