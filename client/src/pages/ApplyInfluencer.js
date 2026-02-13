import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { InputWrapper, Label, ErrorText } from '../components/ui/Input';
import api from '../api/axios';

const FormWrapper = styled.div`
  max-width: 440px;
  margin: ${({ theme }) => theme.spacing['2xl']} auto;
  padding-top: 100px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Divider = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: ${({ theme }) => theme.spacing.sm} 0;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
  &::before { left: 0; }
  &::after { right: 0; }
`;

const SocialNote = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const SuccessMsg = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ApplyInfluencer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: 'influencer' });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Container>
        <FormWrapper>
          <Card>
            {success ? (
              <SuccessMsg>
                <p>Registration successful!</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                  Verify your email, then log in to link your social accounts.
                </p>
                <Button
                  $variant="secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </SuccessMsg>
            ) : (
              <>
                <Title>Influencer Signup</Title>
                <Subtitle>Create your account, then link platforms after verification</Subtitle>
                <Form onSubmit={onSubmit}>
                  <InputWrapper>
                    <Label>Display Name</Label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Your name"
                      required
                    />
                  </InputWrapper>
                  <InputWrapper>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="you@email.com"
                      required
                    />
                  </InputWrapper>
                  <InputWrapper>
                    <Label>Password</Label>
                    <Input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                      placeholder="Min 8 characters"
                      minLength={8}
                      required
                    />
                  </InputWrapper>
                  {error && <ErrorText>{error}</ErrorText>}
                  <Button $variant="secondary" $fullWidth disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </Form>
                <Divider>then</Divider>
                <SocialNote>
                  After verifying your email, you can link YouTube, Instagram, and TikTok
                  from your dashboard to showcase your reach.
                </SocialNote>
              </>
            )}
          </Card>
        </FormWrapper>
      </Container>
    </>
  );
};

export default ApplyInfluencer;
