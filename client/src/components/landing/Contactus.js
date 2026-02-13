import { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import api from '../../api/axios';

const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
  { code: '+91',  flag: '🇮🇳', label: 'IN' },
  { code: '+61',  flag: '🇦🇺', label: 'AU' },
  { code: '+49',  flag: '🇩🇪', label: 'DE' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+81',  flag: '🇯🇵', label: 'JP' },
  { code: '+86',  flag: '🇨🇳', label: 'CN' },
  { code: '+55',  flag: '🇧🇷', label: 'BR' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+94',  flag: '🇱🇰', label: 'LK' },
  { code: '+65',  flag: '🇸🇬', label: 'SG' },
  { code: '+82',  flag: '🇰🇷', label: 'KR' },
  { code: '+39',  flag: '🇮🇹', label: 'IT' },
  { code: '+34',  flag: '🇪🇸', label: 'ES' },
  { code: '+52',  flag: '🇲🇽', label: 'MX' },
  { code: '+7',   flag: '🇷🇺', label: 'RU' },
  { code: '+27',  flag: '🇿🇦', label: 'ZA' },
  { code: '+60',  flag: '🇲🇾', label: 'MY' },
  { code: '+66',  flag: '🇹🇭', label: 'TH' },
];

const MAX_MESSAGE = 500;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ── Section ── */
const Section = styled.section`
  position: relative;
  padding: 80px 24px 100px;
  background: ${({ theme }) => theme.colors.background};
`;

const Wrapper = styled.div`
  max-width: 560px;
  margin: 0 auto;
  animation: ${fadeInUp} 0.7s ease-out;
`;

/* ── Header ── */
const BadgeWrap = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1.5px solid ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.5px;
`;

const Heading = styled.h2`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.15;
  margin-bottom: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 40px;

  a {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    &:hover { text-decoration: underline; }
  }
`;

/* ── Form ── */
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.text};
    box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.1);
  }
`;

const InputIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/* ── Phone field ── */
const PhoneWrap = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.text};
    box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.1);
  }
`;

const CountryCodeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 12px 12px 14px;
  border: none;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const DropdownWrap = styled.div`
  position: relative;
`;

const Dropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  width: 220px;
  max-height: 240px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 4px 0;
  margin: 0;
  list-style: none;
`;

const DropdownItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: background 0.15s;
  background: ${({ $active, theme }) => $active ? theme.colors.borderLight : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  span:first-child {
    font-size: 1.15rem;
  }
`;

const PhoneInput = styled.input`
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/* ── Textarea ── */
const TextAreaWrap = styled.div`
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.text};
    box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.1);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const CharCount = styled.span`
  position: absolute;
  bottom: 10px;
  left: 14px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none;
`;

/* ── Submit button ── */
const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.text};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.textDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* ── Feedback messages ── */
const SuccessMessage = styled.div`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: center;
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: center;
`;

/* ── Component ── */
const Contactus = () => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', message: '' });
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > MAX_MESSAGE) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        phone: form.phone ? `${countryCode.code} ${form.phone}` : '',
      };
      await api.post('/contact', payload);
      setStatus('success');
      setForm({ fullName: '', email: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setStatus('error');
      const data = err.response?.data;
      const detail = data?.details?.[0]?.message;
      setErrorMsg(detail || data?.error || 'Failed to send message. Please try again.');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <Section id="contact">
      <Wrapper>

        <Heading>Let's Get In Touch.</Heading>

        <Subtitle>
          Or just reach out manually to{' '}
          <a href="mailto:hello@influspark.com">hello@influspark.com</a>.
        </Subtitle>

        <Form onSubmit={handleSubmit}>
          {/* Full Name */}
          <FieldGroup>
            <Label htmlFor="fullName">Full Name</Label>
            <InputWrap>
              <InputIcon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </InputIcon>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Enter your full name..."
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </InputWrap>
          </FieldGroup>

          {/* Email Address */}
          <FieldGroup>
            <Label htmlFor="email">Email Address</Label>
            <InputWrap>
              <InputIcon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </InputIcon>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address..."
                value={form.email}
                onChange={handleChange}
                required
              />
            </InputWrap>
          </FieldGroup>

          {/* Phone Number */}
          <FieldGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneWrap>
              <DropdownWrap ref={dropdownRef}>
                <CountryCodeBtn type="button" onClick={() => setDropdownOpen((o) => !o)}>
                  <span>{countryCode.flag}</span>
                  <span>{countryCode.code}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </CountryCodeBtn>
                {dropdownOpen && (
                  <Dropdown>
                    {COUNTRY_CODES.map((c) => (
                      <DropdownItem
                        key={c.code + c.label}
                        $active={c.code === countryCode.code}
                        onClick={() => { setCountryCode(c); setDropdownOpen(false); }}
                      >
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                        <span style={{ marginLeft: 'auto', color: '#9CA3AF' }}>{c.code}</span>
                      </DropdownItem>
                    ))}
                  </Dropdown>
                )}
              </DropdownWrap>
              <PhoneInput
                id="phone"
                name="phone"
                type="tel"
                placeholder="(000) 000-0000"
                value={form.phone}
                onChange={handleChange}
              />
            </PhoneWrap>
          </FieldGroup>

          {/* Message */}
          <FieldGroup>
            <Label htmlFor="message">Message</Label>
            <TextAreaWrap>
              <TextArea
                id="message"
                name="message"
                placeholder="Enter your main text here..."
                value={form.message}
                onChange={handleChange}
                required
              />
              <CharCount>
                {form.message.length}/{MAX_MESSAGE}
              </CharCount>
            </TextAreaWrap>
          </FieldGroup>



          {/* Feedback messages */}
          {status === 'success' && (
            <SuccessMessage>
              Thank you! Your message has been sent successfully.
            </SuccessMessage>
          )}
          {status === 'error' && (
            <ErrorMessage>{errorMsg}</ErrorMessage>
          )}

          {/* Submit */}
          <SubmitButton type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Submit Form'}
            {status !== 'loading' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </SubmitButton>
        </Form>
      </Wrapper>
    </Section>
  );
};

export default Contactus;
