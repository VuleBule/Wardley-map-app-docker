from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import networkx as nx
from text_processor import TextProcessor
from strategic_analyzer import StrategicAnalyzer
from sqlalchemy.orm import Session
# Explicitly import all models so SQLAlchemy knows about them
from models import MapDB, MapVersionDB, Map, MapVersion, MapAnalysis, Component, Relationship
from database import SessionLocal, engine, Base
from datetime import datetime

# Ensure all models are registered before creating tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MapText(BaseModel):
    text: str

class Component(BaseModel):
    id: str
    name: str
    x: float  # Evolution (0-1)
    y: float  # Value (0-1)
    description: Optional[str] = None

class Relationship(BaseModel):
    source: str
    target: str
    type: str

class WardleyMap(BaseModel):
    components: List[Component]
    relationships: List[Relationship]
    description: str

class Map(BaseModel):
    name: str
    description: str
    owner_id: int
    current_version: WardleyMap

class MapVersion(BaseModel):
    components: List[Component]
    relationships: List[Relationship]
    comment: Optional[str] = None

def analyze_position(component: Component) -> Dict:
    """Analyze component based on its position in the map."""
    evolution_stage = ""
    if component.x < 0.25:
        evolution_stage = "Genesis"
        characteristics = ["Undefined", "Rapidly changing", "Uncertain", "High risk"]
    elif component.x < 0.5:
        evolution_stage = "Custom Built"
        characteristics = ["Emerging", "Improving", "Reducing risk", "High learning"]
    elif component.x < 0.75:
        evolution_stage = "Product"
        characteristics = ["Stable", "Feature-driven", "Market differentiation", "Scalable"]
    else:
        evolution_stage = "Commodity"
        characteristics = ["Standardized", "Cost-driven", "Reliable", "Utility-like"]
    
    value_classification = ""
    strategic_implications = []
    if component.y < 0.25:
        value_classification = "Low Value"
        strategic_implications = ["Outsource candidate", "Minimize investment", "Standardize"]
    elif component.y < 0.75:
        value_classification = "Medium Value"
        strategic_implications = ["Balance investment", "Maintain efficiency", "Consider partnerships"]
    else:
        value_classification = "High Value"
        strategic_implications = ["Core focus", "Strategic investment", "In-house development"]
    
    return {
        "evolution_stage": evolution_stage,
        "characteristics": characteristics,
        "value_classification": value_classification,
        "strategic_implications": strategic_implications,
        "strategic_importance": component.y > 0.7 and component.x < 0.5
    }

def analyze_relationships(G: nx.DiGraph) -> Dict:
    """Analyze the relationships in the map."""
    analysis = {
        "bottlenecks": [],
        "dependencies": [],
        "key_components": []
    }
    
    # Identify bottlenecks (high betweenness centrality)
    betweenness = nx.betweenness_centrality(G)
    bottlenecks = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:3]
    analysis["bottlenecks"] = [{"id": node, "score": score} for node, score in bottlenecks if score > 0.1]
    
    # Analyze dependency chains
    for node in G.nodes():
        predecessors = list(G.predecessors(node))
        successors = list(G.successors(node))
        if len(predecessors) > 2 or len(successors) > 2:
            analysis["dependencies"].append({
                "id": node,
                "dependencies_in": len(predecessors),
                "dependencies_out": len(successors)
            })
    
    # Identify key components (high pagerank)
    pagerank = nx.pagerank(G)
    key_components = sorted(pagerank.items(), key=lambda x: x[1], reverse=True)[:3]
    analysis["key_components"] = [{"id": node, "score": score} for node, score in key_components]
    
    return analysis

@app.post("/analyze-map")
async def analyze_map(wardley_map: MapVersion, db: Session = Depends(get_db)):
    """Analyze the entire Wardley Map."""
    analysis = {
        "components": {},
        "relationships": {},
        "overall": {}
    }
    
    # Create a graph for relationship analysis
    G = nx.DiGraph()
    
    # Add nodes and analyze positions
    for component in wardley_map.components:
        G.add_node(component.id)
        analysis["components"][component.id] = {
            "component": component.dict(),
            "position_analysis": analyze_position(component)
        }
    
    # Add edges and analyze relationships
    for rel in wardley_map.relationships:
        G.add_edge(rel.source, rel.target)
    
    # Analyze network properties
    analysis["relationships"] = analyze_relationships(G)
    
    # Overall map analysis
    comp_count = len(wardley_map.components)
    avg_evolution = (sum(c.x for c in wardley_map.components) / comp_count) if comp_count > 0 else 0
    avg_value = (sum(c.y for c in wardley_map.components) / comp_count) if comp_count > 0 else 0
    analysis["overall"] = {
        "complexity_score": nx.density(G),
        "component_count": comp_count,
        "relationship_count": len(wardley_map.relationships),
        "average_evolution": avg_evolution,
        "average_value": avg_value
    }
    
    # Generate strategic recommendations
    strategic_analyzer = StrategicAnalyzer()
    recommendations = strategic_analyzer.analyze_map(
        [c.dict() for c in wardley_map.components],
        [r.dict() for r in wardley_map.relationships]
    )
    analysis["recommendations"] = recommendations
    
    return analysis

@app.post("/create-map")
async def create_map(map_text: MapText, db: Session = Depends(get_db)):
    """Create a Wardley Map from text description."""
    processor = TextProcessor()
    
    # Extract components and relationships
    components = processor.extract_components(map_text.text)
    relationships = processor.extract_relationships(map_text.text, components)
    
    return {
        "components": components,
        "relationships": relationships,
        "description": map_text.text
    }

@app.post("/maps/")
async def create_new_map(map: Map, db: Session = Depends(get_db)):
    """Create a new map with version history."""
    db_map = MapDB(
        name=map.name,
        description=map.description,
        owner_id=map.owner_id
    )
    db.add(db_map)
    db.commit()
    db.refresh(db_map)
    
    if map.current_version:
        version = MapVersionDB(
            map_id=db_map.id,
            version=1,
            components=map.current_version.dict()["components"],
            relationships=map.current_version.dict()["relationships"],
            comment="Initial version"
        )
        db.add(version)
        db.commit()
    
    return {"id": db_map.id}

@app.post("/maps/{map_id}/versions")
async def create_map_version(
    map_id: int,
    version: MapVersion,
    db: Session = Depends(get_db)
):
    """Create a new version of an existing map."""
    db_map = db.query(MapDB).filter(MapDB.id == map_id).first()
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    # Get latest version number
    latest_version = db.query(MapVersionDB)\
        .filter(MapVersionDB.map_id == map_id)\
        .order_by(MapVersionDB.version.desc())\
        .first()
    
    new_version_num = 1 if not latest_version else latest_version.version + 1
    
    # Create new version
    db_version = MapVersionDB(
        map_id=map_id,
        version=new_version_num,
        components=version.dict()["components"],
        relationships=version.dict()["relationships"],
        comment=version.comment or f"Version {new_version_num}"
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    
    return db_version

@app.get("/maps/{map_id}/versions/{version_num}")
async def get_map_version(
    map_id: int,
    version_num: int,
    db: Session = Depends(get_db)
):
    """Get a specific version of a map."""
    version = db.query(MapVersionDB)\
        .filter(MapVersionDB.map_id == map_id, MapVersionDB.version == version_num)\
        .first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version

@app.get("/maps/{map_id}/versions")
async def list_map_versions(
    map_id: int,
    db: Session = Depends(get_db)
):
    """List all versions of a map."""
    versions = db.query(MapVersionDB)\
        .filter(MapVersionDB.map_id == map_id)\
        .order_by(MapVersionDB.version.desc())\
        .all()
    
    return versions
