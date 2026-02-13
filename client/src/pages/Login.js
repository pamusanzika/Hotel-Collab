import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/landing/Header';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { InputWrapper, Label, ErrorText } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

const FormWrapper = styled.div`
  max-width: 400px;
  margin: ${({ theme }) => theme.spacing['2xl']} auto;
  padding-top: 100px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ForgotLink = styled.p`
  text-align: right;
  margin-top: -${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    cursor: pointer;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    cursor: pointer;
  }
`;

const Login = () => {
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
      // Redirect based on role
      if (user.role === 'hotel_owner') navigate('/owner');
      else if (user.role === 'influencer') navigate('/influencer');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
            <Title>Welcome Back</Title>
            <Form onSubmit={onSubmit}>
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
                  placeholder="Your password"
                  required
                />
              </InputWrapper>
              <ForgotLink>
                <a onClick={() => navigate('/forgot-password')}>Forgot password?</a>
              </ForgotLink>
              {error && <ErrorText>{error}</ErrorText>}
              <Button $variant="primary" $fullWidth disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form>
            <FooterText>
              Don't have an account?{' '}
              <a onClick={() => navigate('/apply')}>Apply now</a>
            </FooterText>
          </Card>
        </FormWrapper>
      </Container>
    </>
  );
};

export default Login;
