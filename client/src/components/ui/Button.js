import styled, { css } from 'styled-components';

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.text};
    color: #fff;
    backdrop-filter: blur(10px);
    border: 1px solid ${({ theme }) => theme.colors.text};
    &:hover { background: ${({ theme }) => theme.colors.Black}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.secondary};
    color: #fff;
    backdrop-filter: blur(70px);
    border: 1px solid ${({ theme }) => theme.colors.secondary};
    &:hover { background: ${({ theme }) => theme.colors.secondaryDark}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.Black};
    backdrop-filter: blur(10px);
    &:hover { background: ${({ theme }) => theme.colors.White}; }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
    backdrop-filter: blur(10px);
    border: 1px solid ${({ theme }) => theme.colors.accent};
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
  border-radius: ${({ theme }) => theme.radius.full};
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
