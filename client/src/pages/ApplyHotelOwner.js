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

const SuccessMsg = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ApplyHotelOwner = () => {
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
      await api.post('/auth/register', { ...form, role: 'hotel_owner' });
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
                  Please check your email to verify your account.
                </p>
                <Button
                  $variant="primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </SuccessMsg>
            ) : (
              <>
                <Title>Hotel Owner Signup</Title>
                <Subtitle>Create your account and start listing properties</Subtitle>
                <Form onSubmit={onSubmit}>
                  <InputWrapper>
                    <Label>Full Name</Label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="John Smith"
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
                      placeholder="john@hotel.com"
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
                  <Button $variant="primary" $fullWidth disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </Form>
              </>
            )}
          </Card>
        </FormWrapper>
      </Container>
    </>
  );
};

export default ApplyHotelOwner;
