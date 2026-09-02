import { createTheme } from '@mui/material/styles'

/** MUI theme aligned with Tailwind stone/teal tokens and html.dark toggle. */
export function createAppTheme(dark) {
  return createTheme({
    direction: 'rtl',
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: {
        main: dark ? '#14b8a6' : '#0d9488',
      },
      error: {
        main: dark ? '#f87171' : '#dc2626',
      },
      text: {
        primary: dark ? '#e9e6e2' : '#1c1917',
        secondary: dark ? '#a8a29e' : '#78716c',
      },
      background: {
        default: 'transparent',
        paper: dark ? '#292524' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Google Sans", "Assistant", ui-sans-serif, system-ui, sans-serif',
      body1: { fontSize: '15px' },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(41, 37, 36, 0.6)' : '#ffffff',
          },
          input: {
            fontSize: '14px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '14px',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginInlineStart: 0,
            marginInlineEnd: 0,
            fontSize: '12px',
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            padding: 6,
          },
        },
      },
    },
  })
}
