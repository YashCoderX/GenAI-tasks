import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
  LinearProgress,
  Alert,
} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import debounce from 'lodash/debounce';

interface SentencePair {
  text1: string;
  text2: string;
  loading?: boolean;
}

interface Result {
  text1: string;
  text2: string;
  cosineSimilarity: string;
  euclideanDistance: string;
}

function App() {
  const [sentencePairs, setSentencePairs] = useState<SentencePair[]>([
    { text1: "", text2: "" },
  ]);
  const [results, setResults] = useState<Result[]>([]);
  const [model, setModel] = useState<any>(null);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setModelLoadingProgress(10);
        const loadedModel = await use.load();
        setModelLoadingProgress(100);
        setModel(loadedModel);
      } catch (error) {
        console.error("Error loading model:", error);
        setError("Failed to load the model. Please refresh the page.");
      }
    };
    loadModel();
  }, []);

  const debouncedProcessPair = useMemo(
    () => {
      const processPair = async (pair: SentencePair, index: number) => {
        if (!model || !pair.text1 || !pair.text2) return;

        try {
          const newPairs = [...sentencePairs];
          newPairs[index].loading = true;
          setSentencePairs(newPairs);

          const embeddings = await model.embed([pair.text1, pair.text2]);
          const embedding1 = tf.slice(embeddings, [0, 0], [1, -1]).squeeze();
          const embedding2 = tf.slice(embeddings, [1, 0], [1, -1]).squeeze();

          const cosineSimilarity = calculateCosineSimilarity(embedding1, embedding2);
          const euclideanDistance = calculateEuclideanDistance(embedding1, embedding2);

          const newResults = [...results];
          newResults[index] = {
            text1: pair.text1,
            text2: pair.text2,
            cosineSimilarity: cosineSimilarity.toFixed(4),
            euclideanDistance: euclideanDistance.toFixed(4),
          };
          setResults(newResults);

          embedding1.dispose();
          embedding2.dispose();
          embeddings.dispose();
        } catch (error) {
          console.error("Error processing pair:", error);
          setError("Error processing text pair. Please try again.");
        } finally {
          const newPairs = [...sentencePairs];
          newPairs[index].loading = false;
          setSentencePairs(newPairs);
        }
      };
      return debounce(processPair, 500);
    },
    [model, sentencePairs, results]
  );

  const handleInputChange = (
    index: number,
    field: 'text1' | 'text2',
    value: string
  ) => {
    const newPairs = [...sentencePairs];
    newPairs[index][field] = value;
    setSentencePairs(newPairs);
    debouncedProcessPair(newPairs[index], index);
  };

  const addNewPair = () => {
    setSentencePairs([...sentencePairs, { text1: "", text2: "" }]);
  };

  const removePair = (index: number) => {
    const newPairs = sentencePairs.filter((_, i) => i !== index);
    setSentencePairs(newPairs);
    const newResults = results.filter((_, i) => i !== index);
    setResults(newResults);
  };

  const calculateCosineSimilarity = (vec1: tf.Tensor, vec2: tf.Tensor) => {
    const dotProduct = tf.matMul(vec1.expandDims(0), vec2.expandDims(1)).squeeze();
    const norm1 = tf.sqrt(tf.sum(tf.square(vec1)));
    const norm2 = tf.sqrt(tf.sum(tf.square(vec2)));
    return dotProduct.div(norm1.mul(norm2)).dataSync()[0];
  };

  const calculateEuclideanDistance = (vec1: tf.Tensor, vec2: tf.Tensor) => {
    const diff = tf.sub(vec1, vec2);
    return tf.sqrt(tf.sum(tf.square(diff))).dataSync()[0];
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return '#4caf50';
    if (similarity >= 0.5) return '#ff9800';
    return '#f44336';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Text Similarity Search
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Compare text pairs to find their semantic similarity
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!model && (
        <Box sx={{ width: '100%', mb: 4 }}>
          <Typography variant="body1" gutterBottom>
            Loading model... {modelLoadingProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={modelLoadingProgress} />
        </Box>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Text Pairs</Typography>
          <Tooltip title="Add new text pair">
            <IconButton onClick={addNewPair} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {sentencePairs.map((pair, index) => (
            <Grid item xs={12} key={index}>
              <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Pair {index + 1}
                  </Typography>
                  {sentencePairs.length > 1 && (
                    <Tooltip title="Remove pair">
                      <IconButton onClick={() => removePair(index)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Sentence"
                      value={pair.text1}
                      onChange={(e) => handleInputChange(index, "text1", e.target.value)}
                      variant="outlined"
                      multiline
                      rows={2}
                      placeholder="Enter first sentence..."
                      disabled={!model}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Second Sentence"
                      value={pair.text2}
                      onChange={(e) => handleInputChange(index, "text2", e.target.value)}
                      variant="outlined"
                      multiline
                      rows={2}
                      placeholder="Enter second sentence..."
                      disabled={!model}
                    />
                  </Grid>
                </Grid>
                {pair.loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Calculating similarity...
                    </Typography>
                  </Box>
                )}
                {results[index] && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Results
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Cosine Similarity:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: getSimilarityColor(parseFloat(results[index].cosineSimilarity)),
                          fontWeight: 'bold'
                        }}
                      >
                        {results[index].cosineSimilarity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Euclidean Distance:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {results[index].euclideanDistance}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Add new text pair">
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNewPair}
            disabled={!model}
          >
            Add Pair
          </Button>
        </Tooltip>
        <Tooltip title="Learn more about text similarity">
          <IconButton
            component="a"
            href="https://www.tensorflow.org/hub/tutorials/semantic_similarity_with_tf_hub_universal_encoder"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Container>
  );
}

export default App;
