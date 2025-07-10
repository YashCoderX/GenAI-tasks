import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Box } from '@mui/material';
import Chat from './components/Chat';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Customer Service RAG System
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Ask questions about our products and get answers based on customer reviews
          </Typography>
          <Chat />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
