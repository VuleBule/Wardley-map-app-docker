import React, { useState } from 'react';
import {
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Chip, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Helper functions for evolution stage analysis
const getEvolutionStage = (normalizedX) => {
  if (normalizedX < 0.25) {
    return "Genesis";
  } else if (normalizedX < 0.5) {
    return "Custom";
  } else if (normalizedX < 0.75) {
    return "Product";
  } else {
    return "Commodity";
  }
};

const getVisibilityLevel = (normalizedY) => {
  if (normalizedY > 0.75) {
    return "Very High";
  } else if (normalizedY > 0.5) {
    return "High";
  } else if (normalizedY > 0.25) {
    return "Medium";
  } else {
    return "Low";
  }
};

// Color mapping for evolution stages
const evolutionColors = {
  Genesis: "#8884d8",
  Custom: "#82ca9d",
  Product: "#ffc658",
  Commodity: "#ff8042"
};

// Color mapping for visibility levels
const visibilityColors = {
  "Very High": "#e91e63",
  "High": "#9c27b0",
  "Medium": "#3f51b5",
  "Low": "#2196f3"
};

const MapAnalysisPanel = ({ mapData, loading }) => {
  const theme = useTheme();
  const [activeView, setActiveView] = useState('distribution');
  
  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 2, textAlign: 'center', borderRadius: 2, boxShadow: 3 }}>
        <CircularProgress size={40} sx={{ my: 3 }} />
        <Typography variant="body1" color="text.secondary">Analyzing your map...</Typography>
      </Paper>
    );
  }

  if (!mapData || !mapData.components || mapData.components.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 2, textAlign: 'center', borderRadius: 2, boxShadow: 3 }}>
        <InsightsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Map Analysis</Typography>
        <Typography color="text.secondary">
          Add components to the map to see analysis.
        </Typography>
      </Paper>
    );
  }

  // Calculate normalized positions for components
  const components = mapData.components.map(comp => {
    // Assuming canvas dimensions from WardleyMap component
    const width = 800;
    const height = 600;
    const normalizedX = ((comp.x - 40) / (width - 80));
    const normalizedY = ((height - 40 - comp.y) / (height - 80));
    
    return {
      ...comp,
      normalizedX,
      normalizedY,
      evolutionStage: getEvolutionStage(normalizedX),
      visibilityLevel: getVisibilityLevel(normalizedY)
    };
  });

  // Group components by evolution stage
  const componentsByEvolution = {
    Genesis: components.filter(c => c.evolutionStage === "Genesis"),
    Custom: components.filter(c => c.evolutionStage === "Custom"),
    Product: components.filter(c => c.evolutionStage === "Product"),
    Commodity: components.filter(c => c.evolutionStage === "Commodity")
  };

  // Group components by visibility
  const componentsByVisibility = {
    "Very High": components.filter(c => c.visibilityLevel === "Very High"),
    "High": components.filter(c => c.visibilityLevel === "High"),
    "Medium": components.filter(c => c.visibilityLevel === "Medium"),
    "Low": components.filter(c => c.visibilityLevel === "Low")
  };

  // Analyze relationships
  const relationships = mapData.relationships || [];
  
  // Find components with most dependencies (most incoming relationships)
  const dependencyCounts = {};
  relationships.forEach(rel => {
    const targetId = rel.target || rel.child;
    dependencyCounts[targetId] = (dependencyCounts[targetId] || 0) + 1;
  });
  
  // Sort components by dependency count
  const sortedByDependencies = [...components]
    .map(comp => ({
      ...comp,
      dependencyCount: dependencyCounts[comp.id] || 0
    }))
    .sort((a, b) => b.dependencyCount - a.dependencyCount);

  // Generate strategic insights
  const generateStrategicInsights = () => {
    const insights = [];
    
    // Check for high visibility components in early evolution stages
    const highVisibilityEarlyEvolution = components.filter(
      c => (c.visibilityLevel === "Very High" || c.visibilityLevel === "High") && 
           (c.evolutionStage === "Genesis" || c.evolutionStage === "Custom")
    );
    
    if (highVisibilityEarlyEvolution.length > 0) {
      insights.push({
        title: "High Visibility Components in Early Evolution",
        description: "You have highly visible components that are still in early evolution stages. These may represent innovation opportunities but also potential user experience risks.",
        components: highVisibilityEarlyEvolution,
        recommendation: "Consider accelerating the evolution of these components or managing user expectations carefully.",
        icon: <LightbulbIcon sx={{ color: "#ff9800" }} />
      });
    }
    
    // Check for commodity components that could be outsourced
    const commodityComponents = components.filter(c => c.evolutionStage === "Commodity");
    if (commodityComponents.length > 0) {
      insights.push({
        title: "Commodity Components",
        description: "You have components that have reached commodity status and could potentially be outsourced or replaced with utilities.",
        components: commodityComponents,
        recommendation: "Consider using third-party services, cloud solutions, or utilities for these components to reduce costs and maintenance burden.",
        icon: <LightbulbIcon sx={{ color: "#4caf50" }} />
      });
    }
    
    // Check for highly connected components (potential bottlenecks)
    const highDependencyComponents = sortedByDependencies.filter(c => c.dependencyCount > 1);
    if (highDependencyComponents.length > 0) {
      insights.push({
        title: "Highly Connected Components",
        description: "Some components have multiple dependencies and may represent bottlenecks or critical points of failure.",
        components: highDependencyComponents.slice(0, 3),
        recommendation: "Ensure these components are reliable and consider redundancy strategies for critical components.",
        icon: <LightbulbIcon sx={{ color: "#f44336" }} />
      });
    }
    
    // Check for evolution gaps in the value chain
    const hasGenesis = componentsByEvolution.Genesis.length > 0;
    const hasCommodity = componentsByEvolution.Commodity.length > 0;
    if (hasGenesis && hasCommodity) {
      insights.push({
        title: "Full Evolution Spectrum",
        description: "Your value chain spans the full evolution spectrum from Genesis to Commodity, which indicates a mature approach to innovation and efficiency.",
        recommendation: "Continue balancing innovation (Genesis) with efficiency (Commodity) to maintain competitive advantage.",
        icon: <LightbulbIcon sx={{ color: "#2196f3" }} />
      });
    }
    
    return insights;
  };

  const strategicInsights = generateStrategicInsights();

  // Distribution View
  const DistributionView = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ 
            mb: 2, 
            borderRadius: 2, 
            background: 'linear-gradient(120deg, #f5f7fa 0%, #e8ecf1 100%)',
            boxShadow: 2
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Component Distribution
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>By Evolution Stage:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {Object.entries(componentsByEvolution).map(([stage, comps]) => (
                  <Box key={stage} sx={{ textAlign: 'center', width: '22%' }}>
                    <Box sx={{ 
                      height: 100 * (comps.length / components.length || 0.05), 
                      minHeight: 20,
                      backgroundColor: evolutionColors[stage],
                      borderRadius: 1,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {comps.length}
                    </Box>
                    <Typography variant="body2">{stage}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((comps.length / components.length) * 100)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>By Visibility:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {Object.entries(componentsByVisibility).map(([level, comps]) => (
                  <Box key={level} sx={{ textAlign: 'center', width: '22%' }}>
                    <Box sx={{ 
                      height: 100 * (comps.length / components.length || 0.05), 
                      minHeight: 20,
                      backgroundColor: visibilityColors[level],
                      borderRadius: 1,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {comps.length}
                    </Box>
                    <Typography variant="body2">{level}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((comps.length / components.length) * 100)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Relationship View
  const RelationshipView = () => (
    <Box>
      <Card sx={{ 
        mb: 2, 
        borderRadius: 2, 
        background: 'linear-gradient(120deg, #f8f9fa 0%, #e9ecef 100%)',
        boxShadow: 2
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DeviceHubIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
            Relationship Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">{relationships.length}</Typography>
              <Typography variant="body2">Total Relationships</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main">
                {(relationships.length / Math.max(1, components.length)).toFixed(1)}
              </Typography>
              <Typography variant="body2">Avg. per Component</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {Math.min(100, Math.round((relationships.length / Math.max(1, components.length * (components.length - 1) / 2)) * 100))}%
              </Typography>
              <Typography variant="body2">Network Density</Typography>
            </Box>
          </Box>
          
          {sortedByDependencies.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Top Connected Components:
              </Typography>
              <Grid container spacing={1}>
                {sortedByDependencies.slice(0, 4).map(comp => (
                  <Grid item xs={6} key={comp.id}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                          {comp.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comp.evolutionStage}
                        </Typography>
                      </Box>
                      <Chip 
                        label={comp.dependencyCount} 
                        size="small" 
                        color={comp.dependencyCount > 2 ? "error" : "primary"}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  // Insights View
  const InsightsView = () => (
    <Box>
      {strategicInsights.length > 0 ? (
        strategicInsights.map((insight, index) => (
          <Card key={index} sx={{ 
            mb: 2, 
            borderRadius: 2, 
            background: index % 2 === 0 
              ? 'linear-gradient(120deg, #f8f9fa 0%, #e9ecef 100%)' 
              : 'linear-gradient(120deg, #f5f7fa 0%, #e8ecf1 100%)',
            boxShadow: 2
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                {insight.icon}
                <Box sx={{ ml: 1 }}>{insight.title}</Box>
              </Typography>
              
              <Typography variant="body2" paragraph>
                {insight.description}
              </Typography>
              
              {insight.components && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Affected components:
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {insight.components.map(comp => (
                      <Chip 
                        key={comp.id} 
                        label={comp.name} 
                        size="small" 
                        sx={{ 
                          mr: 0.5, 
                          mb: 0.5,
                          backgroundColor: evolutionColors[comp.evolutionStage],
                          color: 'white'
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 1, 
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderLeft: '4px solid',
                borderColor: 'primary.main'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {insight.recommendation}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 2 }}>
          <LightbulbIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            Add more components and relationships to generate strategic insights.
          </Typography>
        </Card>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: 3, mb: 2, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 500, color: theme.palette.primary.main }}>
          Map Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Component Distribution">
            <IconButton 
              color={activeView === 'distribution' ? 'primary' : 'default'} 
              onClick={() => setActiveView('distribution')}
              sx={{ 
                bgcolor: activeView === 'distribution' ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': { bgcolor: activeView === 'distribution' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <BarChartIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Relationships">
            <IconButton 
              color={activeView === 'relationships' ? 'primary' : 'default'} 
              onClick={() => setActiveView('relationships')}
              sx={{ 
                bgcolor: activeView === 'relationships' ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': { bgcolor: activeView === 'relationships' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <DeviceHubIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Strategic Insights">
            <IconButton 
              color={activeView === 'insights' ? 'primary' : 'default'} 
              onClick={() => setActiveView('insights')}
              sx={{ 
                bgcolor: activeView === 'insights' ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': { bgcolor: activeView === 'insights' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <LightbulbIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ position: 'relative', minHeight: 300 }}>
        {activeView === 'distribution' && <DistributionView />}
        {activeView === 'relationships' && <RelationshipView />}
        {activeView === 'insights' && <InsightsView />}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<ArrowBackIcon />}
          disabled={activeView === 'distribution'}
          onClick={() => {
            if (activeView === 'relationships') setActiveView('distribution');
            if (activeView === 'insights') setActiveView('relationships');
          }}
          sx={{ mr: 1 }}
        >
          Previous
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          disabled={activeView === 'insights'}
          onClick={() => {
            if (activeView === 'distribution') setActiveView('relationships');
            if (activeView === 'relationships') setActiveView('insights');
          }}
          sx={{ ml: 1 }}
        >
          Next
        </Button>
      </Box>
      
      <Box sx={{ mt: 3, pt: 1, borderTop: '1px dashed #ccc', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Analysis based on Wardley Mapping principles • Simon Wardley's methodology
        </Typography>
      </Box>
    </Paper>
  );
};

export default MapAnalysisPanel;
