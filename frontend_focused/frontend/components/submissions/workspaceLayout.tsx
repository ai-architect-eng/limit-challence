import { Container, Stack } from '@mui/material';
import type { ContainerProps, StackProps } from '@mui/material';
import type { PropsWithChildren } from 'react';

interface WorkspaceLayoutProps extends PropsWithChildren {
  maxWidth: ContainerProps['maxWidth'];
  spacing?: StackProps['spacing'];
  overflowWrap?: 'anywhere';
}

export function WorkspaceLayout({
  children,
  maxWidth,
  spacing = { xs: 2.5, md: 3 },
  overflowWrap,
}: WorkspaceLayoutProps) {
  return (
    <Container
      component="main"
      maxWidth={maxWidth}
      sx={{ py: { xs: 3, md: 6 }, ...(overflowWrap ? { overflowWrap } : {}) }}
    >
      <Stack spacing={spacing}>{children}</Stack>
    </Container>
  );
}
