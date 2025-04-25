import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Snackbar, 
  Alert, 
  CircularProgress, 
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import axios from 'axios';
import WardleyMap from './components/WardleyMap';
import VersionHistory from './components/VersionHistory';
import VersionComparison from './components/VersionComparison';
import ErrorBoundary from './ErrorBoundary'; // NEW: Error boundary
import MapAnalysisPanel from './components/MapAnalysisPanel'; // NEW: Map analysis panel

// API endpoint URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Main App component
function App() {
  // State definitions
  const [mapData, setMapData] = useState({ components: [], relationships: [] });
  const [analysis, setAnalysis] = useState(null);
  const [currentMapId, setCurrentMapId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [compareVersion, setCompareVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [linkMode, setLinkMode] = useState(false); // NEW: relationship creation mode
  const [linkSource, setLinkSource] = useState(null); // NEW: first node selected

  // Utility to fetch analysis from backend
  const fetchAnalysis = async (components, relationships) => {
    // Prepare payload with string IDs
    const payloadComps = components.map(c => ({ ...c, id: String(c.id) }));
    // Ensure relationships match backend expectations (source/target format)
    const rels = relationships.map(r => {
      const source = String(r.source || r.parent);
      const target = String(r.target || r.child);
      return {
        source: source,
        target: target,
        type: r.type || 'default'
      };
    });
    console.log('Sending analyze payload', { components: payloadComps, relationships: rels });
    try {
      const response = await axios.post(
        `${API_URL}/analyze-map`,
        { components: payloadComps, relationships: rels }
      );
      return response.data;
    } catch (error) {
      console.error('Analyze error response', error.response?.data);
      handleErrorNotification(error, 'Error fetching map analysis.');
      return null;
    }
  };

  // Update component position in mapData when moved on the map
  const handleComponentMove = (id, newX, newY) => {
    setMapData(prev => {
      const updatedComponents = prev.components.map(comp =>
        comp.id === id ? { ...comp, x: newX, y: newY } : comp
      );
      // Optionally, you could trigger saveNewVersion here
      return { ...prev, components: updatedComponents };
    });
  };

  // Handler to add a new relationship
  const handleAddRelationship = (sourceId, targetId, type = 'depends_on') => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    
    // Convert IDs to strings to match backend expectations
    const source = String(sourceId);
    const target = String(targetId);
    
    setMapData(prev => {
      // Prevent duplicate relationships
      const exists = prev.relationships.some(r => 
        (r.source === source && r.target === target) || 
        (r.parent === source && r.child === target)
      );
      if (exists) return prev;
      
      // Create relationship with both naming conventions to ensure compatibility
      const newRelationship = { 
        source: source,
        target: target,
        parent: source,
        child: target,
        type: type 
      };
      
      return {
        ...prev,
        relationships: [...prev.relationships, newRelationship]
      };
    });
    
    setLinkMode(false);
    setLinkSource(null);
  };

  // Trigger map analysis
  const handleAnalyze = async () => {
    console.log('Analyze Map clicked, mapData:', mapData);
    setLoading(true);
    const result = await fetchAnalysis(mapData.components, mapData.relationships);
    console.log('Analysis result:', result);
    setAnalysis(result);
    setLoading(false);
  };

  // Robust error notification handler
  const handleErrorNotification = (error, fallbackMsg) => {
    let msg = fallbackMsg;
    if (error?.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        msg = data;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation error array
        msg = data.detail.map(e => e.msg).join('; ');
      } else if (typeof data.detail === 'string') {
        msg = data.detail;
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        msg = JSON.stringify(data.detail);
      } else {
        msg = JSON.stringify(data);
      }
    } else if (error?.message) {
      msg = error.message;
    }
    // Defensive: always ensure string
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }
    showNotification(msg, 'error');
  };

  // Show notification
  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Load versions
  const loadVersions = async (mapId) => {
    try {
      const response = await axios.get(`${API_URL}/maps/${mapId}/versions`);
      setVersions(response.data);
    } catch (error) {
      handleErrorNotification(error, 'Error loading versions. Please try again.');
    }
  };

  // Handle restore
  const handleRestore = async (version) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/maps/${currentMapId}/versions/${version.version}`
      );
      setMapData({
        components: response.data.components,
        relationships: response.data.relationships
      });
      // Fetch analysis for the restored version
      const analysisResult = await fetchAnalysis(response.data.components, response.data.relationships);
      setAnalysis(analysisResult);
      showNotification('Version restored', 'success');
    } catch (error) {
      handleErrorNotification(error, 'Error restoring version. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle compare
  const handleCompare = (version) => {
    setCompareVersion(version);
    setShowComparison(true);
  };

  // Create new map
  const createNewMap = async (mapData) => {
    try {
      const payload = {
        name: 'New Map',
        description: 'Created manually',
        owner_id: "1", // Must be a string per backend Pydantic model
        current_version: {
          components: mapData.components,
          relationships: mapData.relationships,
          description: 'Created manually' // Required by backend model
        }
      };
      const response = await axios.post(`${API_URL}/maps/`, payload);
      const mapId = response.data.id;
      if (!mapId || isNaN(mapId)) {
        console.trace('createNewMap: Invalid mapId after map creation:', response.data.id);
        showNotification('Error: Received invalid map ID from backend.', 'error');
        return;
      }
      setCurrentMapId(mapId);
      loadVersions(mapId);
      showNotification('New map created', 'success');
      // Immediately save the version using the new mapId
      await saveNewVersionWithId({ components: mapData.components, relationships: mapData.relationships }, mapId);
      // Fetch analysis for the new map
      const analysisResult = await fetchAnalysis(mapData.components, mapData.relationships);
      setAnalysis(analysisResult);
    } catch (error) {
      handleErrorNotification(error, 'Error creating map. Please try again.');
    }
  };

  // Helper to save new version with explicit mapId
  const saveNewVersionWithId = async (mapData, mapId) => {
    if (!mapId || isNaN(Number(mapId))) {
      console.trace('saveNewVersionWithId: Attempted to save version with invalid mapId:', mapId);
      showNotification('Error: Map ID is missing or invalid when trying to save a version.', 'error');
      return;
    }
    try {
      const payload = {
        components: mapData.components,
        relationships: mapData.relationships,
        comment: 'Updated from text input'
      };
      console.log('saveNewVersionWithId: POST', `${API_URL}/maps/${mapId}/versions`, payload);
      await axios.post(`${API_URL}/maps/${mapId}/versions`, payload);
      loadVersions(mapId);
      showNotification('New version saved', 'success');
    } catch (error) {
      handleErrorNotification(error, 'Error saving version. Please try again.');
    }
  };

  // Save new version (uses currentMapId for existing maps)
  const saveNewVersion = async (mapData) => {
    console.log('saveNewVersion: currentMapId =', currentMapId);
    if (!currentMapId || isNaN(Number(currentMapId))) {
      console.trace('saveNewVersion: Attempted to save version with invalid currentMapId:', currentMapId);
      showNotification('Error: Map ID is missing or invalid when trying to save a version.', 'error');
      return;
    }
    try {
      const payload = {
        components: mapData.components,
        relationships: mapData.relationships,
        comment: 'Updated from text input'
      };
      console.log('saveNewVersion: POST', `${API_URL}/maps/${currentMapId}/versions`, payload);
      await axios.post(`${API_URL}/maps/${currentMapId}/versions`, payload);
      loadVersions(currentMapId);
      showNotification('New version saved', 'success');
    } catch (error) {
      handleErrorNotification(error, 'Error saving version. Please try again.');
    }
  };

  return (
    <ThemeProvider theme={createTheme({
      palette: {
        primary: {
          main: '#2196f3',
        },
        secondary: {
          main: '#ff9800',
        },
        background: {
          default: '#f5f8fa',
          paper: '#ffffff',
        },
      },
      typography: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 600,
        },
        h6: {
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            },
          },
        },
      },
    })}>
    <CssBaseline />
    <Container maxWidth="lg">
      <Box sx={{ my: 4, px: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          textAlign: 'center', 
          color: 'primary.main',
          mb: 3,
          fontWeight: 700,
          backgroundImage: 'linear-gradient(90deg, #2196f3, #3f51b5)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Wardley Maps Generator
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ 
              p: 3, 
              position: 'relative', 
              minHeight: '400px',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #ffffff, #f9fafc)',
            }}>
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={60} thickness={4} />
                </Box>
              )}
              <WardleyMap
                data={mapData}
                analysis={analysis}
                onComponentMove={handleComponentMove}
                linkMode={linkMode}
                linkSource={linkSource}
                setLinkSource={setLinkSource}
                onToggleRelationship={() => {
                  setLinkMode(!linkMode);
                  setLinkSource(null);
                }}
                onAddRelationship={handleAddRelationship}
                onAnalyze={handleAnalyze}
                onMapChange={(components, relationships) => setMapData({ components, relationships })}
              />
            </Paper>
            <VersionHistory
              versions={versions}
              onRestore={handleRestore}
              onCompare={handleCompare}
              sx={{ 
                mt: 3,
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <MapAnalysisPanel mapData={mapData} loading={loading} />
          </Grid>
        </Grid>
      </Box>

      <VersionComparison
        open={showComparison}
        onClose={() => setShowComparison(false)}
        currentVersion={mapData}
        compareVersion={compareVersion}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {/* Defensive: only render string */}
          {typeof notification.message === 'string' ? notification.message : JSON.stringify(notification.message)}
        </Alert>
      </Snackbar>
    </Container>
    </ThemeProvider>
  );
}

// Wrap App in ErrorBoundary for robust error handling
const WrappedApp = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default WrappedApp;
