from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from database import Base

class MapDB(Base):
    __tablename__ = "maps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = Column(String, index=True)
    versions = relationship("MapVersionDB", back_populates="map")
    
class MapVersionDB(Base):
    __tablename__ = "map_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    version = Column(Integer)
    components = Column(JSON)
    relationships = Column(JSON)
    analysis = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    comment = Column(String)
    
    map = relationship("MapDB", back_populates="versions")

# Pydantic models for API
class Component(BaseModel):
    id: str
    name: str
    x: float
    y: float
    description: Optional[str] = None

class Relationship(BaseModel):
    source: str
    target: str
    type: str

class MapVersion(BaseModel):
    components: List[Component]
    relationships: List[Relationship]
    comment: Optional[str] = None

class Map(BaseModel):
    name: str
    description: str
    owner_id: str
    current_version: Optional[MapVersion] = None

class StrategicRecommendation(BaseModel):
    component_id: str
    recommendation: str
    priority: str  # high, medium, low
    impact: float  # 0-1
    effort: float  # 0-1
    rationale: str

class MapAnalysis(BaseModel):
    components: dict
    relationships: dict
    overall: dict
    recommendations: List[StrategicRecommendation]
