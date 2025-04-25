import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Chip, Box, CircularProgress } from '@mui/material';

const AnalysisPanel = ({ analysis, loading }) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (!analysis) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Analysis</Typography>
        <Typography color="text.secondary" align="center">
          No analysis available. Click Analyze Map to generate.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Analysis</Typography>
      <List>
        {analysis.overall && Object.entries(analysis.overall).map(([key, value]) => (
          <ListItem key={key}>
            <ListItemText
              primary={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              secondary={typeof value === 'number' ? value.toFixed(3) : String(value)}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default AnalysisPanel;
