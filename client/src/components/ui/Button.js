import styled, { css } from 'styled-components';

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    &:hover { background: ${({ theme }) => theme.colors.primaryDark}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.secondary};
    color: #fff;
    &:hover { background: ${({ theme }) => theme.colors.secondaryDark}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};
    &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
    &:hover { background: ${({ theme }) => theme.colors.accentDark}; }
  `,
};

const sizes = {
  sm: css`
    padding: 0.4rem 0.85rem;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  `,
  md: css`
    padding: 0.6rem 1.25rem;
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  `,
  lg: css`
    padding: 0.75rem 1.75rem;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  `,
};

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${({ $variant = 'primary' }) => variants[$variant]}
  ${({ $size = 'md' }) => sizes[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
`;

export default Button;
