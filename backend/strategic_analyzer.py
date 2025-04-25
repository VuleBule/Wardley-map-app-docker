from typing import List, Dict
import networkx as nx
from models import StrategicRecommendation

class StrategicAnalyzer:
    def __init__(self):
        self.evolution_thresholds = {
            'genesis': 0.25,
            'custom': 0.5,
            'product': 0.75,
            'commodity': 1.0
        }
        
        self.value_thresholds = {
            'low': 0.25,
            'medium': 0.75,
            'high': 1.0
        }

    def analyze_map(self, components: List[Dict], relationships: List[Dict]) -> List[StrategicRecommendation]:
        """Generate strategic recommendations based on map analysis."""
        recommendations = []
        G = self._create_graph(components, relationships)
        
        # Analyze each component
        for component in components:
            recs = self._analyze_component(component, G, components)
            recommendations.extend(recs)
        
        # Analyze overall map structure
        structural_recs = self._analyze_structure(G, components)
        recommendations.extend(structural_recs)
        
        return recommendations

    def _analyze_component(self, component: Dict, G: nx.DiGraph, all_components: List[Dict]) -> List[StrategicRecommendation]:
        """Analyze individual component and generate recommendations."""
        recommendations = []
        
        # Check for strategic components in early evolution
        if component['y'] > 0.75 and component['x'] < 0.25:
            recommendations.append(StrategicRecommendation(
                component_id=component['id'],
                recommendation="Consider investing in R&D to evolve this strategic component",
                priority="high",
                impact=0.9,
                effort=0.8,
                rationale="High-value components in genesis stage need rapid evolution"
            ))
        
        # Check for commodity components with high investment
        if component['y'] > 0.75 and component['x'] > 0.75:
            recommendations.append(StrategicRecommendation(
                component_id=component['id'],
                recommendation="Consider outsourcing or using existing solutions",
                priority="medium",
                impact=0.7,
                effort=0.5,
                rationale="High-value commodity could be replaced with existing solutions"
            ))
        
        # Check for bottlenecks
        if self._is_bottleneck(component['id'], G):
            recommendations.append(StrategicRecommendation(
                component_id=component['id'],
                recommendation="Consider breaking down or duplicating this component",
                priority="high",
                impact=0.8,
                effort=0.7,
                rationale="Component is a potential bottleneck in the value chain"
            ))
        
        # Check for evolution opportunities
        next_stage = self._get_next_evolution_stage(component['x'])
        if next_stage:
            recommendations.append(StrategicRecommendation(
                component_id=component['id'],
                recommendation=f"Consider evolving to {next_stage} stage",
                priority="medium",
                impact=0.6,
                effort=0.6,
                rationale=f"Natural evolution path available to {next_stage}"
            ))
        
        return recommendations

    def _analyze_structure(self, G: nx.DiGraph, components: List[Dict]) -> List[StrategicRecommendation]:
        """Analyze overall map structure and generate recommendations."""
        recommendations = []
        
        # Check for isolated components
        isolated = list(nx.isolates(G))
        if isolated:
            for component_id in isolated:
                recommendations.append(StrategicRecommendation(
                    component_id=component_id,
                    recommendation="Consider integrating this isolated component",
                    priority="medium",
                    impact=0.5,
                    effort=0.4,
                    rationale="Isolated components may indicate missed opportunities"
                ))
        
        # Check for circular dependencies
        cycles = list(nx.simple_cycles(G))
        if cycles:
            for cycle in cycles:
                recommendations.append(StrategicRecommendation(
                    component_id=cycle[0],
                    recommendation="Consider breaking circular dependency",
                    priority="high",
                    impact=0.8,
                    effort=0.7,
                    rationale="Circular dependencies can cause maintenance issues"
                ))
        
        # Check for strategic clusters
        clusters = self._identify_strategic_clusters(G, components)
        for cluster in clusters:
            recommendations.append(StrategicRecommendation(
                component_id=cluster[0],
                recommendation="Consider creating a dedicated team for this strategic cluster",
                priority="high",
                impact=0.9,
                effort=0.8,
                rationale="Strategic components should be managed together"
            ))
        
        return recommendations

    def _create_graph(self, components: List[Dict], relationships: List[Dict]) -> nx.DiGraph:
        """Create a directed graph from components and relationships."""
        G = nx.DiGraph()
        
        # Add nodes
        for component in components:
            G.add_node(component['id'], **component)
        
        # Add edges
        for rel in relationships:
            G.add_edge(rel['source'], rel['target'], type=rel['type'])
        
        return G

    def _is_bottleneck(self, component_id: str, G: nx.DiGraph) -> bool:
        """Check if a component is a bottleneck."""
        betweenness = nx.betweenness_centrality(G)
        return betweenness.get(component_id, 0) > 0.5

    def _get_next_evolution_stage(self, current_x: float) -> str:
        """Determine the next evolution stage."""
        if current_x < self.evolution_thresholds['genesis']:
            return 'custom'
        elif current_x < self.evolution_thresholds['custom']:
            return 'product'
        elif current_x < self.evolution_thresholds['product']:
            return 'commodity'
        return None

    def _identify_strategic_clusters(self, G: nx.DiGraph, components: List[Dict]) -> List[List[str]]:
        """Identify clusters of strategic components."""
        strategic_components = [c['id'] for c in components if c['y'] > 0.75]
        clusters = []
        
        for comp_id in strategic_components:
            cluster = [comp_id]
            neighbors = list(G.neighbors(comp_id))
            strategic_neighbors = [n for n in neighbors if n in strategic_components]
            if strategic_neighbors:
                cluster.extend(strategic_neighbors)
                clusters.append(cluster)
        
        return clusters
