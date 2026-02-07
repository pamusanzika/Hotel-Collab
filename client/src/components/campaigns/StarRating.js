import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-flex;
  gap: 2px;
  align-items: center;
`;

const Star = styled.span`
  font-size: ${({ $size }) => $size || '1.25rem'};
  color: ${({ $filled, theme }) => ($filled ? theme.colors.warning : theme.colors.borderLight)};
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  transition: color 0.15s;

  ${({ $interactive, theme }) =>
    $interactive &&
    `&:hover { color: ${theme.colors.warning}; }`}
`;

const RatingText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

const StarRating = ({ rating = 0, max = 5, size, interactive = false, onChange, showValue = false }) => {
  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <Wrapper>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          $filled={i < rating}
          $size={size}
          $interactive={interactive}
          onClick={() => handleClick(i + 1)}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${i + 1} star${i > 0 ? 's' : ''}` : undefined}
        >
          ★
        </Star>
      ))}
      {showValue && rating > 0 && <RatingText>{rating}/{max}</RatingText>}
    </Wrapper>
  );
};

export default StarRating;
