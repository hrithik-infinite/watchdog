import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/a11y';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../card';

describe('Card', () => {
  it('renders children and the card data-slot', () => {
    render(<Card>card body</Card>);

    const card = screen.getByText('card body');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('data-slot', 'card');
  });

  it('merges a custom className with the base classes', () => {
    render(<Card className="custom-card">body</Card>);

    const card = screen.getByText('body');
    expect(card).toHaveClass('custom-card');
    expect(card).toHaveClass('bg-card');
  });

  it('forwards arbitrary div props', () => {
    render(
      <Card id="my-card" aria-label="My card">
        body
      </Card>
    );

    const card = screen.getByLabelText('My card');
    expect(card).toHaveAttribute('id', 'my-card');
  });

  it('has no accessibility violations when fully composed', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>
            <button type="button">Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Card subcomponents', () => {
  const cases = [
    { name: 'CardHeader', Component: CardHeader, slot: 'card-header' },
    { name: 'CardTitle', Component: CardTitle, slot: 'card-title' },
    { name: 'CardDescription', Component: CardDescription, slot: 'card-description' },
    { name: 'CardAction', Component: CardAction, slot: 'card-action' },
    { name: 'CardContent', Component: CardContent, slot: 'card-content' },
    { name: 'CardFooter', Component: CardFooter, slot: 'card-footer' },
  ] as const;

  it.each(cases)('$name renders children with its data-slot', ({ Component, slot }) => {
    render(<Component>{slot} child</Component>);

    const el = screen.getByText(`${slot} child`);
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('data-slot', slot);
  });

  it.each(cases)('$name merges a custom className', ({ Component, slot }) => {
    render(<Component className="extra-class">{slot} body</Component>);

    expect(screen.getByText(`${slot} body`)).toHaveClass('extra-class');
  });

  it.each(cases)('$name forwards arbitrary props', ({ Component, slot }) => {
    render(
      <Component data-testid={`test-${slot}`} title="tooltip">
        {slot}
      </Component>
    );

    const el = screen.getByTestId(`test-${slot}`);
    expect(el).toHaveAttribute('title', 'tooltip');
  });
});
