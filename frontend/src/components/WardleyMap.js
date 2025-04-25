import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Table, TableBody, TableRow, TableCell, Typography, CircularProgress } from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';

const INITIAL_COMPONENTS = [];

const WardleyMap = ({ 
  data = { components: [], relationships: [] }, 
  onAnalyze, 
  onMapChange,
  linkMode = false,
  linkSource,
  setLinkSource,
  onToggleRelationship,
  onAddRelationship
}) => {
  const canvasRef = useRef();
  const wrapperRef = useRef();
  const [components, setComponents] = useState(data.components || INITIAL_COMPONENTS);
  const [relationships, setRelationships] = useState(data.relationships || []);
  const [openNested, setOpenNested] = useState(false);
  const [nestedRows, setNestedRows] = useState([{ name: '', indent: 0 }]);
  const [dragged, setDragged] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [openImport, setOpenImport] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedComponents, setExtractedComponents] = useState([]);
  const [extractedRelationships, setExtractedRelationships] = useState([]);
  const [draggingComponent, setDraggingComponent] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [orientationPoints, setOrientationPoints] = useState({
    bottomLeft: { x: 0, y: 0 },
    topLeft: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 }
  });
  const fileInputRef = useRef(null);

  // sync with parent data - only on initial render and explicit updates
  useEffect(() => {
    if (data.components) setComponents(data.components);
    if (data.relationships) setRelationships(data.relationships);
  }, [data.components, data.relationships]);

  // Canvas dimensions
  const width = 800;
  const height = 600;

  // Color palette for consistent design
  const colors = {
    background: '#f9fafc',
    gridLines: '#e0e0e0',
    axisLabels: '#546e7a',
    components: {
      default: '#2196f3',
      selected: '#ff9800',
      stroke: '#1565c0',
      selectedStroke: '#e65100',
      text: '#263238'
    },
    relationships: {
      line: '#455a64',
      arrow: '#37474f'
    }
  };

  // Draw all components
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // Set canvas background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 40; y <= height - 40; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 40; x <= width - 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height - 40);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(40, height - 40);
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.axisLabels;
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = colors.axisLabels;
    ctx.font = '14px Poppins, sans-serif';
    ctx.fontWeight = '500';
    ctx.textAlign = 'center';
    ctx.fillText('Genesis', 40, height - 20);
    ctx.fillText('Commodity', width - 40, height - 20);
    
    // Y-axis label
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Visibility', 0, 0);
    ctx.restore();
    
    // Draw relationship lines
    ctx.strokeStyle = colors.relationships.line;
    ctx.lineWidth = 2;
    relationships.forEach(r => {
      // Support both naming conventions (parent/child and source/target)
      const sourceId = r.parent || r.source;
      const targetId = r.child || r.target;
      const a = components.find(c => String(c.id) === String(sourceId));
      const b = components.find(c => String(c.id) === String(targetId));
      if (a && b) {
        // Draw arrow from parent to child (value flows down)
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.fillStyle = colors.relationships.arrow;
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const headlen = 10; // length of arrow head
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - headlen * Math.cos(angle - Math.PI/6), b.y - headlen * Math.sin(angle - Math.PI/6));
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - headlen * Math.cos(angle + Math.PI/6), b.y - headlen * Math.sin(angle + Math.PI/6));
        ctx.stroke();
        
        // Optional: Draw relationship type label
        if (r.type && r.type !== 'default') {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          ctx.fillStyle = colors.axisLabels;
          ctx.font = '10px Poppins, sans-serif';
          ctx.fillText(r.type, midX, midY - 5);
        }
      }
    });
    
    // Draw circles (components)
    components.forEach(comp => {
      // Highlight selected component
      const isSelected = selectedComponent && comp.id === selectedComponent.id;
      
      // Draw component shadow for depth
      ctx.beginPath();
      ctx.arc(comp.x, comp.y + 2, 18, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(comp.x, comp.y, 18, 0, 2 * Math.PI);
      
      // Create gradient fill for components
      const gradient = ctx.createRadialGradient(
        comp.x - 5, comp.y - 5, 2,
        comp.x, comp.y, 18
      );
      
      if (isSelected) {
        gradient.addColorStop(0, '#ffb74d');
        gradient.addColorStop(1, colors.components.selected);
        ctx.fillStyle = gradient;
      } else {
        gradient.addColorStop(0, '#64b5f6');
        gradient.addColorStop(1, colors.components.default);
        ctx.fillStyle = gradient;
      }
      
      ctx.fill();
      ctx.strokeStyle = isSelected ? colors.components.selectedStroke : colors.components.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      
      // Draw component label with shadow for better readability
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(comp.name || comp.id, comp.x, comp.y + 4);
      
      // Draw component label below
      ctx.fillStyle = colors.components.text;
      ctx.font = '11px Poppins, sans-serif';
      ctx.fillText(comp.name || comp.id, comp.x, comp.y + 32);
      
      // Draw evolution and visibility labels for selected component
      if (isSelected) {
        // Calculate normalized position (0-100%)
        const normalizedX = Math.round(((comp.x - 40) / (width - 80)) * 100);
        const normalizedY = Math.round(((height - 40 - comp.y) / (height - 80)) * 100);
        
        // Draw position indicators
        ctx.fillStyle = colors.components.selectedStroke;
        ctx.font = 'bold 12px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Evolution: ${normalizedX}%`, comp.x, comp.y - 20);
        ctx.fillText(`Visibility: ${normalizedY}%`, comp.x, comp.y - 36);
      }
    });
  }, [components, relationships, selectedComponent]);

  // Add a new component at a random location with prompt for name
  const handleAddComponentWithUpdate = () => {
    const id = Date.now();
    const defaultName = `C${components.length + 1}`;
    const name = window.prompt('Enter component name:', defaultName) || defaultName;
    const x = 100 + Math.random() * 600;
    const y = 100 + Math.random() * 400;
    const updatedComponents = [...components, { id, x, y, name }];
    setComponents(updatedComponents);
    if (onMapChange) onMapChange(updatedComponents, relationships);
  };

  // Rename component on double-click
  const handleDoubleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const comp = getComponentAt(x, y);
    if (comp) {
      const newName = window.prompt('Rename component:', comp.name) || comp.name;
      setComponents(prevComps => prevComps.map(c =>
        c.id === comp.id ? { ...c, name: newName } : c
      ));
      if (onMapChange) onMapChange(components, relationships);
    }
  };

  // Mouse event helpers
  const getComponentAt = (x, y) => {
    return components.find(c => Math.hypot(c.x - x, c.y - y) < 16);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const comp = getComponentAt(x, y);
    if (comp) {
      setDragged(comp.id);
      setDragOffset({ x: x - comp.x, y: y - comp.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragged !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const updatedComponents = components.map(c =>
        c.id === dragged ? { ...c, x: x - dragOffset.x, y: y - dragOffset.y } : c
      );
      setComponents(updatedComponents);
      if (onMapChange) onMapChange(updatedComponents, relationships);
    }
  };

  const handleMouseUp = () => {
    setDragged(null);
  };

  // Handle canvas click for relationship creation
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const comp = getComponentAt(x, y);
    
    if (!linkMode) {
      // If not in link mode, select the component for analysis
      setSelectedComponent(comp || null);
      return;
    }
    
    if (comp) {
      if (!linkSource) {
        // First component selected
        setLinkSource(comp.id);
      } else if (linkSource !== comp.id) {
        // Second component selected, create relationship
        const type = window.prompt('Enter relationship type (or leave blank):', '');
        // Create relationship with both naming conventions to ensure backend compatibility
        const newRelationship = {
          parent: String(linkSource),
          child: String(comp.id),
          source: String(linkSource),
          target: String(comp.id),
          type: type || 'default'
        };
        
        // Add relationship
        const updatedRelationships = [...relationships, newRelationship];
        setRelationships(updatedRelationships);
        
        // Notify parent
        if (onMapChange) onMapChange(components, updatedRelationships);
        
        // If onAddRelationship is provided, call it
        if (onAddRelationship) {
          onAddRelationship(linkSource, comp.id, type || 'default');
        }
        
        // Reset link source
        setLinkSource(null);
        
        // Exit link mode if we're not continuing to add more relationships
        if (onToggleRelationship && !e.shiftKey) {
          onToggleRelationship();
        }
      }
    }
  };

  // Handle adding a new row to the nested value chain
  const handleAddRow = () => {
    setNestedRows([...nestedRows, { name: '', indent: 0 }]);
  };

  // Process the image to detect components
  const processImage = () => {
    setProcessing(true);
    
    // Simulate processing with setTimeout (in a real app, this would be an API call or image processing library)
    setTimeout(() => {
      try {
        // Create a temporary image element to get dimensions
        const img = new Image();
        img.src = imagePreview;
        
        // Set initial orientation points at the corners of the image
        setOrientationPoints({
          bottomLeft: { x: img.width * 0.05, y: img.height * 0.95 },  // Bottom left (Genesis/Invisible)
          topLeft: { x: img.width * 0.05, y: img.height * 0.05 },     // Top left (Genesis/Visible)
          bottomRight: { x: img.width * 0.95, y: img.height * 0.95 }, // Bottom right (Commodity/Invisible)
        });
        
        // Simulate detected components based on the Wardley Map image shared by the user
        // These positions are more accurately mapped to the example image
        const detectedComponents = [
          { id: "c1", x: img.width * 0.196, y: img.height * 0.110, name: "Customer" },
          { id: "c2", x: img.width * 0.118, y: img.height * 0.151, name: "Online Image Manipulation" },
          { id: "c3", x: img.width * 0.168, y: img.height * 0.192, name: "Online Photo Storage" },
          { id: "c4", x: img.width * 0.338, y: img.height * 0.134, name: "Print" },
          { id: "c5", x: img.width * 0.396, y: img.height * 0.205, name: "Web Site" },
          { id: "c6", x: img.width * 0.413, y: img.height * 0.251, name: "CRM" },
          { id: "c7", x: img.width * 0.298, y: img.height * 0.339, name: "Platform" },
          { id: "c8", x: img.width * 0.401, y: img.height * 0.445, name: "Compute" },
          { id: "c9", x: img.width * 0.318, y: img.height * 0.509, name: "Data Centre" },
          { id: "c10", x: img.width * 0.499, y: img.height * 0.509, name: "Power" }
        ];
        
        // Simulate detected relationships based on the example map
        // These relationships match the connections shown in the image
        const detectedRelationships = [
          { source: "c1", target: "c2", type: "depends_on" },
          { source: "c1", target: "c4", type: "depends_on" },
          { source: "c1", target: "c5", type: "depends_on" },
          { source: "c2", target: "c3", type: "depends_on" },
          { source: "c3", target: "c5", type: "depends_on" },
          { source: "c4", target: "c5", type: "depends_on" },
          { source: "c5", target: "c6", type: "depends_on" },
          { source: "c5", target: "c7", type: "depends_on" },
          { source: "c6", target: "c8", type: "depends_on" },
          { source: "c7", target: "c8", type: "depends_on" },
          { source: "c8", target: "c9", type: "depends_on" },
          { source: "c8", target: "c10", type: "depends_on" },
          { source: "c9", target: "c10", type: "depends_on" }
        ];
        
        setExtractedComponents(detectedComponents);
        setExtractedRelationships(detectedRelationships);
        setProcessing(false);
      } catch (error) {
        console.error("Error processing image:", error);
        setProcessing(false);
      }
    }, 1500); // Simulate processing time
  };
  
  // Import the detected components to the map
  const importDetectedComponents = () => {
    if (extractedComponents.length === 0 && extractedRelationships.length === 0) return;
    
    // Get the canvas dimensions for scaling
    const canvasWidth = width - 80; // Accounting for margins
    const canvasHeight = height - 80;
    
    // Create a temporary image to get dimensions
    const img = new Image();
    img.src = imagePreview;
    
    // Use orientation points for precise mapping
    const newComponents = extractedComponents.map((comp, index) => {
      // Define canvas orientation points
      const canvasBottomLeft = { x: 40, y: height - 40 };
      const canvasTopLeft = { x: 40, y: 40 };
      const canvasBottomRight = { x: width - 40, y: height - 40 };
      
      // Calculate relative position using orientation points
      // This uses barycentric coordinates for precise mapping
      
      // Calculate vectors from orientation points to the component
      const vBL = {
        x: comp.x - orientationPoints.bottomLeft.x,
        y: comp.y - orientationPoints.bottomLeft.y
      };
      
      // Calculate vectors between orientation points
      const vBLTL = {
        x: orientationPoints.topLeft.x - orientationPoints.bottomLeft.x,
        y: orientationPoints.topLeft.y - orientationPoints.bottomLeft.y
      };
      
      const vBLBR = {
        x: orientationPoints.bottomRight.x - orientationPoints.bottomLeft.x,
        y: orientationPoints.bottomRight.y - orientationPoints.bottomLeft.y
      };
      
      // Calculate relative position (0-1) within the orientation triangle
      // Using projection of vectors
      const dotBLTL = vBLTL.x * vBLTL.x + vBLTL.y * vBLTL.y;
      const dotBLBR = vBLBR.x * vBLBR.x + vBLBR.y * vBLBR.y;
      const dotBLTL_BL = vBL.x * vBLTL.x + vBL.y * vBLTL.y;
      const dotBLBR_BL = vBL.x * vBLBR.x + vBL.y * vBLBR.y;
      
      const relY = dotBLTL_BL / dotBLTL;
      const relX = dotBLBR_BL / dotBLBR;
      
      // Map to canvas coordinates
      const canvasX = canvasBottomLeft.x + relX * (canvasBottomRight.x - canvasBottomLeft.x);
      const canvasY = canvasBottomLeft.y - relY * (canvasBottomLeft.y - canvasTopLeft.y);
       
      return {
        id: comp.id,
        name: comp.name || `Component ${index + 1}`,
        x: canvasX,
        y: canvasY
      };
    });
    
    // Create relationships between the imported components
    const newRelationships = extractedRelationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      parent: rel.source,
      child: rel.target,
      type: rel.type || 'depends_on'
    }));
    
    // Add the new components to the map
    const updatedComponents = [...components, ...newComponents];
    const updatedRelationships = [...relationships, ...newRelationships];
    
    setComponents(updatedComponents);
    setRelationships(updatedRelationships);
    
    // Notify parent component if needed
    if (onMapChange) {
      onMapChange(updatedComponents, updatedRelationships);
    }
    
    // Close the dialog
    setOpenImport(false);
    
    // Reset import state
    setImagePreview(null);
    setExtractedComponents([]);
    setExtractedRelationships([]);
  };

  return (
    <Box ref={wrapperRef} sx={{ width: '100%', maxWidth: width, mx: 'auto', mt: 2 }}>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleAddComponentWithUpdate}
          sx={{ 
            background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Add Component
        </Button>
        <Button 
          variant={linkMode ? 'contained' : 'outlined'}
          sx={linkMode ? {
            ml: 1,
            background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
            color: 'white',
            fontWeight: 'bold'
          } : {
            ml: 1,
            borderColor: '#2196f3',
            color: '#2196f3',
            fontWeight: 'bold'
          }}
          onClick={onToggleRelationship} 
          title={linkMode ? 
            "Click on components to connect them. First click selects source, second click selects target." : 
            "Click to start creating relationships between components"}
        >
          {linkMode ? 'Cancel Linking' : 'Add Relationship'}
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => setOpenNested(true)} 
          sx={{ 
            ml: 1,
            borderColor: '#3f51b5',
            color: '#3f51b5',
            fontWeight: 'bold'
          }}
        >
          Add Nested Chain
        </Button>
        <Button 
          variant="contained"
          onClick={() => {
            console.log('WardleyMap: Analyze button clicked, onAnalyze:', onAnalyze);
            if (typeof onAnalyze === 'function') onAnalyze();
          }} 
          sx={{ 
            ml: 1,
            background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
            boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Analyze Map
        </Button>
        <Button 
          variant="outlined"
          onClick={() => setOpenImport(true)}
          sx={{ 
            ml: 1,
            borderColor: '#9c27b0',
            color: '#9c27b0',
            fontWeight: 'bold'
          }}
        >
          Import Map
        </Button>
        <Button 
          variant="outlined"
          onClick={() => {
            // Confirm before clearing
            if (window.confirm("Are you sure you want to clear the map? This will remove all components and relationships.")) {
              setComponents([]);
              setRelationships([]);
              if (onMapChange) onMapChange([], []);
              setSelectedComponent(null);
            }
          }}
          sx={{ 
            ml: 1,
            borderColor: '#f44336',
            color: '#f44336',
            fontWeight: 'bold'
          }}
        >
          Clear Map
        </Button>
      </Box>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '12px', 
          display: 'block',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          background: colors.background,
          maxWidth: '100%',
          height: 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={handleMouseUp}
      />
      <Dialog 
        open={openNested} 
        onClose={() => setOpenNested(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(120deg, #3f51b5, #2196f3)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Add Nested Value Chain
        </DialogTitle>
        <DialogContent>
          <Table>
            <TableBody>
              {nestedRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <TextField label="Name" value={row.name} fullWidth size="small" onChange={e => {
                      const nr = [...nestedRows]; nr[i].name = e.target.value; setNestedRows(nr);
                    }} />
                  </TableCell>
                  <TableCell>
                    <TextField label="Indent" type="number" value={row.indent} size="small" onChange={e => {
                      const nr = [...nestedRows]; nr[i].indent = parseInt(e.target.value)||0; setNestedRows(nr);
                    }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => {
                      setNestedRows(nestedRows.filter((_,j) => j!==i));
                    }}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button 
            startIcon={<Add />} 
            onClick={handleAddRow} 
            sx={{ 
              mt: 2,
              background: 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)',
              boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Add Row
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
          <Button 
            onClick={() => setOpenNested(false)}
            sx={{ color: '#757575', fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // build components and relationships
              const comps = nestedRows.map((r,i) => ({ id: Date.now()+i, name: r.name, x: 100 + r.indent * 100, y: 80 + i * 80 }));
              // sequential chain connections
              let rels = [];
              for (let i = 0; i < comps.length - 1; i++) {
                rels.push({ parent: comps[i].id, child: comps[i+1].id });
              }
              // nested indent-based connections
              nestedRows.forEach((r, i) => {
                if (r.indent > 0) {
                  const pidx = nestedRows.slice(0, i).reverse().findIndex(pr => pr.indent === r.indent - 1);
                  if (pidx >= 0) {
                    const parentIndex = i - (pidx + 1);
                    rels.push({ parent: comps[parentIndex].id, child: comps[i].id });
                  }
                }
              });
              const updatedComponents = comps;
              const updatedRelationships = rels;
              setComponents(updatedComponents);
              setRelationships(updatedRelationships);
              if (onMapChange) onMapChange(updatedComponents, updatedRelationships);
              setOpenNested(false);
            }}
            sx={{ 
              background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Component Analysis Panel */}
      {selectedComponent && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Component Analysis</Typography>
          <Typography variant="subtitle1">{selectedComponent.name}</Typography>
          
          {/* Position Information */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
            <Typography variant="body2">
              <strong>Evolution:</strong> {Math.round(((selectedComponent.x - 40) / (width - 80)) * 100)}%
            </Typography>
            <Typography variant="body2">
              <strong>Visibility:</strong> {Math.round(((height - 40 - selectedComponent.y) / (height - 80)) * 100)}%
            </Typography>
          </Box>
          
          {/* Evolution Stage */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Evolution Stage:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {getEvolutionStage(selectedComponent.x, width)}
          </Typography>
          
          {/* Characteristics */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Characteristics:
          </Typography>
          <Box component="ul" sx={{ mt: 0, pl: 2 }}>
            {getCharacteristics(selectedComponent.x, width).map((item, index) => (
              <Box component="li" key={index} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
          
          {/* Market Properties */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Market Properties:
          </Typography>
          <Box component="ul" sx={{ mt: 0, pl: 2 }}>
            {getMarketProperties(selectedComponent.x, width).map((item, index) => (
              <Box component="li" key={index} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
          
          {/* Strategic Recommendations */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 2 }}>
            Strategic Recommendations:
          </Typography>
          <Box component="ul" sx={{ mt: 0, pl: 2 }}>
            {getStrategicRecommendations(selectedComponent.x, selectedComponent.y, width, height).map((item, index) => (
              <Box component="li" key={index} sx={{ mb: 0.5 }}>
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setSelectedComponent(null)}
            sx={{ mt: 2 }}
          >
            Clear Selection
          </Button>
        </Box>
      )}
      
      {/* Import Map Dialog */}
      <Dialog 
        open={openImport} 
        onClose={() => setOpenImport(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(120deg, #3f51b5, #2196f3)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Import Wardley Map from Image
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {!imagePreview ? (
            <Box 
              sx={{ 
                border: '2px dashed #2196f3', 
                borderRadius: 2, 
                p: 5, 
                textAlign: 'center',
                background: 'rgba(33, 150, 243, 0.05)',
                cursor: 'pointer',
                '&:hover': {
                  background: 'rgba(33, 150, 243, 0.1)',
                }
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setImagePreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <CloudUpload sx={{ fontSize: 60, color: '#2196f3', mb: 2 }} />
              <Typography variant="h6" color="primary" fontWeight="bold">
                Click to upload a Wardley Map image
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: PNG, JPG, JPEG, GIF, SVG
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box 
                sx={{ 
                  p: 1, 
                  position: 'relative',
                  height: 500,
                  overflow: 'hidden',
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              >
                {processing && (
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
                      background: 'rgba(255,255,255,0.7)',
                      zIndex: 10
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Processing image...
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'relative',
                    overflow: 'auto'
                  }}
                  onMouseMove={(e) => {
                    if (draggingComponent) {
                      e.preventDefault();
                      const dx = e.clientX - dragStartPos.x;
                      const dy = e.clientY - dragStartPos.y;
                      
                      // Check if we're dragging an orientation point or a component
                      if (['bottomLeft', 'topLeft', 'bottomRight'].includes(draggingComponent)) {
                        // Update orientation point
                        setOrientationPoints(prev => ({
                          ...prev,
                          [draggingComponent]: {
                            x: prev[draggingComponent].x + dx,
                            y: prev[draggingComponent].y + dy
                          }
                        }));
                      } else {
                        // Update component position
                        setExtractedComponents(prev => 
                          prev.map(comp => {
                            if (comp.id === draggingComponent) {
                              return {
                                ...comp,
                                x: comp.x + dx,
                                y: comp.y + dy
                              };
                            }
                            return comp;
                          })
                        );
                      }
                      
                      setDragStartPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseUp={() => {
                    setDraggingComponent(null);
                  }}
                  onMouseLeave={() => {
                    setDraggingComponent(null);
                  }}
                >
                  <img 
                    src={imagePreview} 
                    alt="Wardley Map Preview" 
                    style={{ 
                      maxWidth: '100%',
                      display: 'block'
                    }} 
                  />
                  
                  {/* Show detected components */}
                  {extractedComponents.map((comp, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        position: 'absolute',
                        left: comp.x,
                        top: comp.y,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid #2196f3',
                        background: 'rgba(33, 150, 243, 0.2)',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 0,
                        zIndex: 10,
                        cursor: 'move',
                        boxShadow: '0 0 4px rgba(33, 150, 243, 0.5)'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingComponent(comp.id);
                        setDragStartPos({ x: e.clientX, y: e.clientY });
                      }}
                    >
                    </Box>
                  ))}
                  
                  {/* Show orientation points */}
                  {[
                    { id: 'bottomLeft', label: 'Genesis/Invisible', color: '#e91e63' },
                    { id: 'topLeft', label: 'Genesis/Visible', color: '#9c27b0' },
                    { id: 'bottomRight', label: 'Commodity/Invisible', color: '#673ab7' }
                  ].map((point) => (
                    <Box
                      key={point.id}
                      sx={{
                        position: 'absolute',
                        left: orientationPoints[point.id].x,
                        top: orientationPoints[point.id].y,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `3px solid ${point.color}`,
                        background: 'rgba(255, 255, 255, 0.8)',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: point.color,
                        zIndex: 20,
                        cursor: 'move',
                        boxShadow: `0 0 8px ${point.color}`
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingComponent(point.id);
                        setDragStartPos({ x: e.clientX, y: e.clientY });
                      }}
                    >
                      {point.id === 'bottomLeft' ? 'BL' : 
                       point.id === 'topLeft' ? 'TL' : 'BR'}
                    </Box>
                  ))}
                  
                  {/* Show detected relationships */}
                  {extractedRelationships.map((rel, idx) => {
                    const source = extractedComponents.find(c => c.id === rel.source);
                    const target = extractedComponents.find(c => c.id === rel.target);
                    if (!source || !target) return null;
                    
                    return (
                      <Box
                        key={`rel-${idx}`}
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 5
                        }}
                      >
                        <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
                          <line
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="#2196f3"
                            strokeWidth={2}
                            strokeOpacity={0.8}
                            strokeDasharray="4,2"
                          />
                          {/* Arrow head */}
                          <polygon
                            points={`${target.x},${target.y} ${target.x-8},${target.y-4} ${target.x-8},${target.y+4}`}
                            transform={`rotate(${Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI}, ${target.x}, ${target.y})`}
                            fill="#2196f3"
                            fillOpacity={0.8}
                          />
                        </svg>
                      </Box>
                    );
                  })}
                  
                  {/* Component Labels */}
                  {extractedComponents.map((comp, idx) => (
                    <Box
                      key={`label-${idx}`}
                      sx={{
                        position: 'absolute',
                        left: comp.x,
                        top: comp.y + 15,
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#2196f3',
                        textAlign: 'center',
                        maxWidth: '80px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        zIndex: 10
                      }}
                    >
                      {comp.name}
                    </Box>
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setImagePreview(null);
                    setExtractedComponents([]);
                    setExtractedRelationships([]);
                  }}
                  sx={{
                    borderColor: '#757575',
                    color: '#757575',
                    fontWeight: 'bold'
                  }}
                >
                  Change Image
                </Button>
                
                <Button 
                  variant="contained" 
                  onClick={processImage}
                  disabled={processing}
                  sx={{ 
                    background: 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {processing ? 'Processing...' : 'Detect Components'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
          <Button 
            onClick={() => setOpenImport(false)}
            sx={{ color: '#757575', fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={importDetectedComponents}
            disabled={extractedComponents.length === 0 && extractedRelationships.length === 0}
            sx={{ 
              background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
              boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Import Map
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper functions for detailed component analysis based on Wardley Map evolution stages
const getEvolutionStage = (x, width) => {
  const normalizedX = (x - 40) / (width - 80);
  
  if (normalizedX < 0.25) {
    return "Genesis (I) - Novel, unmodeled, and uncertain";
  } else if (normalizedX < 0.5) {
    return "Custom (II) - Emerging, divergent, with rapid learning";
  } else if (normalizedX < 0.75) {
    return "Product (III) - Convergent, good fit for purpose, increasing certainty";
  } else {
    return "Commodity/Utility (IV) - Accepted, modeled, and standardized";
  }
};

const getCharacteristics = (x, width) => {
  const normalizedX = (x - 40) / (width - 80);
  
  if (normalizedX < 0.25) {
    return [
      "Uniquity: Unique/rare",
      "Certainty: Poorly understood/exploring the unknown",
      "Market: Undefined market",
      "Knowledge management: Uncertain",
      "Market perception: Chaotic/non-linear/domain of the unknown"
    ];
  } else if (normalizedX < 0.5) {
    return [
      "Uniquity: Slowly increasing",
      "Certainty: Rapid increases in learning/discovery becoming refining",
      "Market: Forming market with competing forms and different models",
      "Knowledge management: Learning on use/focused on testing prediction",
      "Market perception: Domain of 'experts'"
    ];
  } else if (normalizedX < 0.75) {
    return [
      "Uniquity: Rapidly increasing",
      "Certainty: Rapid increases in use/increasing fit for purpose",
      "Market: Growing market/consolidation to a few competing but accepted forms",
      "Knowledge management: Learning on operation/using prediction for verification",
      "Market perception: Increasing expectation of use/domain of 'professionals'"
    ];
  } else {
    return [
      "Uniquity: Widespread in applicable market ecosystem",
      "Certainty: Commonly understood (in terms of use)",
      "Market: Mature market stabilized to an accepted form",
      "Knowledge management: Known/accepted",
      "Market perception: Ordered/perceived as being linear/domain to be applied"
    ];
  }
};

const getMarketProperties = (x, width) => {
  const normalizedX = (x - 40) / (width - 80);
  
  if (normalizedX < 0.25) {
    return [
      "User perception: Different/confusing/exciting/surprising/dangerous",
      "Perception in industry: Future source of competitive advantage/unpredictable/unknown",
      "Focus of value: High future worth but immediate investment",
      "Failure: High/tolerated/assumed to be wrong",
      "Market action: Gambling/driven by gut",
      "Decision drivers: Heritage/culture"
    ];
  } else if (normalizedX < 0.5) {
    return [
      "User perception: Leading edge/emerging/uncertainty over results",
      "Perception in industry: Seen as competitive advantage/differential/looking for ROI",
      "Focus of value: Seeking ways to profit/ROI seeking confirmation of value",
      "Failure: Moderate/unsurprising if wrong but disappointing",
      "Market action: Exploring a 'found' value",
      "Decision drivers: Analysis & synthesis"
    ];
  } else if (normalizedX < 0.75) {
    return [
      "User perception: Increasingly common/disappointed if not used or available/trailing edge if not",
      "Perception in industry: Advantage through implementation/features/this model is better than that",
      "Focus of value: High profitability per unit/valuable model/feeling of understanding/focus on optimization",
      "Failure: Not tolerated/assumed to be due to lack of improvement/resistance to change in the model",
      "Market action: Market analysis/listening to customers",
      "Decision drivers: Analysis & synthesis"
    ];
  } else {
    return [
      "User perception: Standard/expected/feeling of shock if not used",
      "Perception in industry: Cost of doing business/operational/specific accepted models",
      "Focus of value: High volume/reducing margin/essential but increasingly invisible component of something more complex",
      "Failure: Surprised by failure/focus on operational efficiency",
      "Market action: Metric driven/build what is needed",
      "Decision drivers: Previous experience"
    ];
  }
};

const getStrategicRecommendations = (x, y, width, height) => {
  const normalizedX = (x - 40) / (width - 80);
  const normalizedY = (height - 40 - y) / (height - 80);
  const visibilityLevel = normalizedY > 0.5 ? "high" : "low";
  
  // Base recommendations on evolution stage
  let recommendations = [];
  
  if (normalizedX < 0.25) {
    // Genesis
    recommendations = [
      "Invest in research and exploration of this novel component",
      "Expect and tolerate high failure rates",
      "Focus on learning and discovery rather than efficiency",
      "Consider in-house development to maintain control of intellectual property"
    ];
  } else if (normalizedX < 0.5) {
    // Custom
    recommendations = [
      "Begin standardizing practices around this component",
      "Document learning and establish best practices",
      "Consider building for reuse within the organization",
      "Measure ROI and validate value proposition"
    ];
  } else if (normalizedX < 0.75) {
    // Product
    recommendations = [
      "Focus on feature differentiation and implementation quality",
      "Consider buying products rather than building custom solutions",
      "Optimize for operational efficiency",
      "Establish metrics and KPIs for performance"
    ];
  } else {
    // Commodity
    recommendations = [
      "Outsource or use utility services where possible",
      "Focus on cost reduction and operational excellence",
      "Standardize interfaces and integration points",
      "Automate management and maintenance"
    ];
  }
  
  // Add visibility-specific recommendations
  if (visibilityLevel === "high") {
    recommendations.push("This component is highly visible to users - prioritize user experience and reliability");
    if (normalizedX < 0.5) {
      recommendations.push("Consider how to manage user expectations with this evolving component");
    }
  } else {
    recommendations.push("This component has low visibility to users - focus on operational efficiency and cost");
    if (normalizedX < 0.5) {
      recommendations.push("Be cautious of hidden technical debt in this evolving infrastructure component");
    }
  }
  
  return recommendations;
};

export default WardleyMap;
