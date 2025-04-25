import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import WardleyMap from './WardleyMap';

const VersionComparison = ({ open, onClose, currentVersion, compareVersion }) => {
  // Prevent crash if either version is missing
  if (!open || !currentVersion || !compareVersion) {
    return null;
  }

  const findChanges = () => {
    const changes = {
      components: {
        added: [],
        removed: [],
        moved: []
      },
      relationships: {
        added: [],
        removed: []
      }
    };

    // Check components
    const currentComponents = new Set(currentVersion.components.map(c => c.id));
    const compareComponents = new Set(compareVersion.components.map(c => c.id));

    // Find added and removed components
    for (const comp of currentVersion.components) {
      if (!compareComponents.has(comp.id)) {
        changes.components.added.push(comp);
      }
    }

    for (const comp of compareVersion.components) {
      if (!currentComponents.has(comp.id)) {
        changes.components.removed.push(comp);
      }
    }

    // Find moved components
    for (const currentComp of currentVersion.components) {
      const compareComp = compareVersion.components.find(c => c.id === currentComp.id);
      if (compareComp && (currentComp.x !== compareComp.x || currentComp.y !== compareComp.y)) {
        changes.components.moved.push({
          id: currentComp.id,
          name: currentComp.name,
          from: { x: compareComp.x, y: compareComp.y },
          to: { x: currentComp.x, y: currentComp.y }
        });
      }
    }

    // Check relationships
    const currentRels = new Set(
      currentVersion.relationships.map(r => `${r.source}-${r.target}-${r.type}`)
    );
    const compareRels = new Set(
      compareVersion.relationships.map(r => `${r.source}-${r.target}-${r.type}`)
    );

    for (const rel of currentVersion.relationships) {
      const key = `${rel.source}-${rel.target}-${rel.type}`;
      if (!compareRels.has(key)) {
        changes.relationships.added.push(rel);
      }
    }

    for (const rel of compareVersion.relationships) {
      const key = `${rel.source}-${rel.target}-${rel.type}`;
      if (!currentRels.has(key)) {
        changes.relationships.removed.push(rel);
      }
    }

    return changes;
  };

  const changes = findChanges();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Compare Versions</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Previous Version</Typography>
              <Box sx={{ height: 400 }}>
                <WardleyMap
                  data={compareVersion}
                  isComparison
                  highlightChanges={changes}
                  version="old"
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Current Version</Typography>
              <Box sx={{ height: 400 }}>
                <WardleyMap
                  data={currentVersion}
                  isComparison
                  highlightChanges={changes}
                  version="new"
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Changes Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">Components</Typography>
                  <List dense>
                    {changes.components.added.map(comp => (
                      <ListItem key={`added-${comp.id}`}>
                        <ListItemText
                          primary={comp.name}
                          secondary={
                            <Chip
                              label="Added"
                              size="small"
                              color="success"
                            />
                          }
                        />
                      </ListItem>
                    ))}
                    {changes.components.removed.map(comp => (
                      <ListItem key={`removed-${comp.id}`}>
                        <ListItemText
                          primary={comp.name}
                          secondary={
                            <Chip
                              label="Removed"
                              size="small"
                              color="error"
                            />
                          }
                        />
                      </ListItem>
                    ))}
                    {changes.components.moved.map(comp => (
                      <ListItem key={`moved-${comp.id}`}>
                        <ListItemText
                          primary={comp.name}
                          secondary={
                            <Chip
                              label="Moved"
                              size="small"
                              color="warning"
                            />
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">Added Relationships</Typography>
                  <List dense>
                    {changes.relationships.added.map((rel, idx) => (
                      <ListItem key={`added-rel-${idx}`}>
                        <ListItemText
                          primary={`${rel.source} → ${rel.target}`}
                          secondary={rel.type}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">Removed Relationships</Typography>
                  <List dense>
                    {changes.relationships.removed.map((rel, idx) => (
                      <ListItem key={`removed-rel-${idx}`}>
                        <ListItemText
                          primary={`${rel.source} → ${rel.target}`}
                          secondary={rel.type}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionComparison;
