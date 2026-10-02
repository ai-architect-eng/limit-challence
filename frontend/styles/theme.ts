import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#174EA6' },
    background: { default: '#F6F7F9', paper: '#FFFFFF' },
    text: { primary: '#17212F', secondary: '#526171' },
  },
  typography: { fontFamily: 'var(--font-geist-sans), sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44, textTransform: 'none' } } },
    MuiLink: { styleOverrides: { root: { overflowWrap: 'anywhere' } } },
  },
});
