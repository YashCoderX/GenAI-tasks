import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Container,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Send as SendIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import type { ChatMessage } from "../types";
import { searchReviews } from "../ingestion/search";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchUseful, setSearchUseful] = useState(true);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const startTime = performance.now();
      const result = await searchReviews(input, 5, searchUseful);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.answer,
        sources: result.relevantReviews,
        responseTime,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Customer Service Assistant
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={searchUseful}
                onChange={(e) => setSearchUseful(e.target.checked)}
                color="default"
              />
            }
            label="Search Useful Reviews"
          />
          <Tooltip title="About">
            <IconButton color="inherit">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          py: 2,
          height: "calc(100vh - 64px)",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: "auto",
              p: 2,
              bgcolor: "background.paper",
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  p: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "primary.main",
                    mb: 2,
                  }}
                >
                  CS
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Welcome to Customer Service Assistant
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ask questions about our products and get answers based on
                  customer reviews
                </Typography>
              </Box>
            ) : (
              <List>
                {messages.map((message, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        justifyContent:
                          message.role === "user" ? "flex-end" : "flex-start",
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection:
                            message.role === "user" ? "row-reverse" : "row",
                          alignItems: "flex-start",
                          gap: 1,
                          maxWidth: "80%",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              message.role === "user"
                                ? "primary.main"
                                : "secondary.main",
                          }}
                        >
                          {message.role === "user" ? "U" : "CS"}
                        </Avatar>
                        <Box>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              bgcolor:
                                message.role === "user"
                                  ? "primary.light"
                                  : "grey.100",
                              borderRadius: 2,
                              color:
                                message.role === "user"
                                  ? "primary.contrastText"
                                  : "text.primary",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                whiteSpace: "pre-line",
                                wordBreak: "break-word",
                              }}
                            >
                              {message.content}
                            </Typography>
                          </Paper>
                          {message.role === "assistant" && (
                            <Box
                              sx={{
                                mt: 1,
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {message.sources &&
                                message.sources.length > 0 &&
                                message.sources.map((source, idx) => (
                                  <Chip
                                    key={idx}
                                    size="small"
                                    icon={<StarIcon />}
                                    label={`${source.rating}/5`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: "0.75rem" }}
                                  />
                                ))}
                              {message.responseTime && (
                                <Chip
                                  size="small"
                                  icon={<TimerIcon />}
                                  label={`${message.responseTime.toFixed(0)}ms`}
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                    {index < messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                disabled={loading}
                multiline
                maxRows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                sx={{
                  minWidth: 100,
                  borderRadius: 2,
                }}
                endIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
              >
                {loading ? "Sending" : "Send"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Chat;
