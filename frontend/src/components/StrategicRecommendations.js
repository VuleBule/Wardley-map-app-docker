import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Chip,
  LinearProgress,
  Tooltip,
  Grid,
  CircularProgress
} from '@mui/material';

const PriorityColor = {
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50'
};

const StrategicRecommendations = ({ recommendations, loading }) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Strategic Recommendations
        </Typography>
        <Typography color="text.secondary" align="center">
          No recommendations available yet. Try adding more details to your value chain description.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Strategic Recommendations
      </Typography>
      <List>
        {recommendations.map((rec, index) => (
          <ListItem key={index} alignItems="flex-start">
            <Box sx={{ width: '100%' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {rec.recommendation}
                    </Typography>
                    <Chip
                      label={rec.priority}
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: PriorityColor[rec.priority],
                        color: 'white'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Tooltip title="Expected impact of implementing this recommendation" arrow>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Impact
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={rec.impact * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#2196f3',
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Tooltip title="Estimated effort required" arrow>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Effort
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={rec.effort * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#ff9800',
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {rec.rationale}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StrategicRecommendations;
