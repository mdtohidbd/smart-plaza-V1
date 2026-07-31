import { createTheme } from '@mui/material/styles';

// Colors based on Clean White Admin Design
const colors = {
  background: {
    sidebar: '#FFFFFF', // Clean white sidebar
    main: '#F5F7FA', // Very light grey main background
    card: '#FFFFFF', // White card surface
    hover: '#F0F2F5', // Light hover surface
  },
  primary: {
    main: '#14B8A6', // Muted Emerald/Teal Action
    light: '#5EEAD4',
    dark: '#0F766E',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#818CF8', // Subdued Slate Blue for secondary
    light: '#A5B4FC',
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  text: {
    primary: '#1E293B', // Dark slate for readability
    secondary: '#64748B', // Medium grey
    disabled: '#94A3B8',
  },
  status: {
    success: '#10B981', // Muted Emerald
    warning: '#FBBF24', // Muted Amber
    error: '#EF4444', // Brick Red
    info: '#3B82F6', // Muted Blue
  },
  border: {
    subtle: '#E2E8F0' // Light border
  }
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: {
      default: colors.background.main,
      paper: colors.background.card,
    },
    text: colors.text,
    divider: colors.border.subtle,
    success: { main: colors.status.success },
    warning: { main: colors.status.warning },
    error: { main: colors.status.error },
    info: { main: colors.status.info },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'system-ui',
      'sans-serif',
    ].join(','),
    h1: { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '2.441rem' },
    h2: { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.953rem' },
    h3: { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.563rem' },
    h4: { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem' },
    h5: { fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '1rem' },
    h6: { fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '0.875rem' },
    subtitle1: { fontSize: '1rem', fontWeight: 500, color: colors.text.primary },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, color: colors.text.secondary },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.75rem', lineHeight: 1.6, color: colors.text.secondary },
    button: { fontWeight: 500, textTransform: 'none', fontFamily: 'Inter, sans-serif' },
  },
  shape: {
    borderRadius: 4, // Sharp, industrial radius
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.main,
          color: colors.text.primary,
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.border.subtle} transparent`,
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.border.subtle,
            borderRadius: '0px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: colors.text.disabled,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.background.card,
          border: `1px solid ${colors.border.subtle}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          backgroundColor: colors.background.card,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            opacity: 0.9,
          },
        },
        outlined: {
          borderColor: colors.border.subtle,
          color: colors.text.primary,
          '&:hover': {
            backgroundColor: colors.background.hover,
            borderColor: colors.text.disabled,
          }
        }
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.sidebar,
          borderRight: `1px solid ${colors.border.subtle}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.sidebar,
          borderBottom: `1px solid ${colors.border.subtle}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.border.subtle}`,
          padding: '16px', // Generous padding
        },
        head: {
          color: colors.text.secondary,
          fontWeight: 500,
          backgroundColor: '#F8FAFC',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: colors.background.hover,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.subtle,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.text.disabled,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.main,
            borderWidth: '1px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: colors.text.secondary,
          '&.Mui-focused': {
            color: colors.primary.main,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${colors.border.subtle}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${colors.border.subtle}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${colors.border.subtle}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
  },
});

export default theme;
