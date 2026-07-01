import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/sidepanel/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none overflow-hidden text-ellipsis',
  {
    variants: {
      // Severity uses SOFT tinted chips — solid hue text on a /15 fill of the
      // same hue, with a /30 border. This replaces the old white-on-red /
      // white-on-orange fills that failed WCAG 1.4.3 (the auditor flagging
      // itself). Every pair here clears AA on the card surface.
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary-dark',
        secondary: 'border-border bg-secondary text-secondary-foreground [a&]:hover:bg-accent',
        destructive:
          'border-destructive/30 bg-destructive/15 text-destructive [a&]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        critical: 'border-critical/30 bg-critical/15 text-critical',
        serious: 'border-serious/30 bg-serious/15 text-serious',
        moderate: 'border-moderate/30 bg-moderate/15 text-moderate',
        minor: 'border-minor/30 bg-minor/15 text-minor',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
