import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge, type StatusVariant } from './StatusBadge';

const cases: Array<{ variant: StatusVariant; bg: string; text: string }> = [
  { variant: 'success', bg: 'bg-success-subtle', text: 'text-success' },
  { variant: 'warning', bg: 'bg-warning-subtle', text: 'text-warning' },
  { variant: 'danger', bg: 'bg-danger-subtle', text: 'text-danger' },
  { variant: 'info', bg: 'bg-info-subtle', text: 'text-info' },
  { variant: 'locked', bg: 'bg-locked-subtle', text: 'text-locked' },
  { variant: 'draft', bg: 'bg-draft-subtle', text: 'text-draft' },
];

describe('StatusBadge', () => {
  it.each(cases)('applies token classes for $variant', ({ variant, bg, text }) => {
    render(<StatusBadge variant={variant} label={variant} />);
    const badge = screen.getByText(variant);
    expect(badge).toHaveClass(bg);
    expect(badge).toHaveClass(text);
    expect(badge).toHaveAttribute('data-variant', variant);
  });

  it('does not render hardcoded hex colors', () => {
    const { container } = render(<StatusBadge variant="success" label="Delivered" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('hides the dot when showDot is false', () => {
    const { container } = render(
      <StatusBadge variant="success" label="Delivered" showDot={false} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
