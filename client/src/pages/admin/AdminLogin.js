import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { InputWrapper, Label, ErrorText } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const FormCard = styled(Card)`
  max-width: 400px;
  width: 100%;
`;

const Logo = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Title = styled.h2`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(form.email, form.password);
      if (user.role !== 'admin') {
        setError('Admin access only');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Container $maxWidth="440px">
        <FormCard $padding="2.5rem">
          <Logo>HotelCollab</Logo>
          <Title>Admin Panel</Title>
          <Form onSubmit={onSubmit}>
            <InputWrapper>
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="admin@hotelcollab.dev"
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
                required
              />
            </InputWrapper>
            {error && <ErrorText>{error}</ErrorText>}
            <Button $variant="secondary" $fullWidth disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </FormCard>
      </Container>
    </Wrapper>
  );
};

export default AdminLogin;
