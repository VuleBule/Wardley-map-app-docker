import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Restore,
  CompareArrows,
  GetApp
} from '@mui/icons-material';
import { format } from 'date-fns';

const VersionHistory = ({ versions, onRestore, onCompare, onExport }) => {
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Version History
      </Typography>
      <List dense>
        {versions.map((version) => (
          <ListItem key={version.id}>
            <ListItemText
              primary={`Version ${version.version}`}
              secondary={`${format(new Date(version.created_at), 'PPpp')} - ${version.comment}`}
            />
            <ListItemSecondaryAction>
              <Tooltip title="Restore this version">
                <IconButton
                  edge="end"
                  aria-label="restore"
                  onClick={() => onRestore(version)}
                >
                  <Restore />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compare with current">
                <IconButton
                  edge="end"
                  aria-label="compare"
                  onClick={() => onCompare(version)}
                >
                  <CompareArrows />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export this version">
                <IconButton
                  edge="end"
                  aria-label="export"
                  onClick={() => onExport(version)}
                >
                  <GetApp />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default VersionHistory;
