import { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { createCollection, insertVectors, searchVectors } from './services/qdrantService';

type SearchResult = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

function App() {
  const [collectionName, setCollectionName] = useState('');
  const [searchVector, setSearchVector] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCollection = async () => {
    try {
      setLoading(true);
      setError('');
      await createCollection(collectionName);
      
      // Sample data - in a real application, you would use actual vector embeddings
      const samplePoints = [
        {
          id: 1,
          vector: Array(384).fill(0).map(() => Math.random()),
          payload: { text: 'Sample document 1' }
        },
        {
          id: 2,
          vector: Array(384).fill(0).map(() => Math.random()),
          payload: { text: 'Sample document 2' }
        }
      ];
      
      await insertVectors(collectionName, samplePoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      // Convert the input string to a vector (in a real app, you'd use an embedding model)
      const searchVectorArray = Array(384).fill(0).map(() => Math.random());
      const searchResults = await searchVectors(collectionName, searchVectorArray);
      setResults(searchResults as SearchResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vector Search Demo
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Collection
          </Typography>
          <TextField
            fullWidth
            label="Collection Name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleCreateCollection}
            disabled={loading || !collectionName}
            sx={{ mt: 2 }}
          >
            Create Collection
          </Button>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Vectors
          </Typography>
          <TextField
            fullWidth
            label="Search Query"
            value={searchVector}
            onChange={(e) => setSearchVector(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !collectionName || !searchVector}
            sx={{ mt: 2 }}
          >
            Search
          </Button>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {results.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>
              <List>
                {results.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Score: ${result.score.toFixed(4)}`}
                      secondary={(result.payload?.text as string) || 'No text available'}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
