import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
from nltk.corpus import wordnet
from typing import List, Dict, Tuple, Set
import re
import spacy
from collections import defaultdict

# Download required NLTK data
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('maxent_ne_chunker')
nltk.download('words')
nltk.download('wordnet')

class TextProcessor:
    def __init__(self):
        self.nlp = spacy.load('en_core_web_sm')
        
        self.evolution_keywords = {
            'genesis': ['new', 'novel', 'innovative', 'emerging', 'undefined', 'experimental', 'research'],
            'custom': ['custom', 'built', 'specific', 'tailored', 'specialized', 'bespoke'],
            'product': ['product', 'standardized', 'mature', 'established', 'stable'],
            'commodity': ['commodity', 'utility', 'standard', 'common', 'generic', 'widespread']
        }
        
        self.value_keywords = {
            'high': ['critical', 'essential', 'core', 'key', 'vital', 'strategic', 'crucial'],
            'medium': ['important', 'necessary', 'needed', 'useful', 'valuable'],
            'low': ['supporting', 'auxiliary', 'optional', 'supplementary', 'peripheral']
        }
        
        self.relationship_patterns = {
            'depends_on': [
                r'(\w+)\s+(?:depends on|requires|needs|uses|relies on|based on)\s+(\w+)',
                r'(\w+)\s+(?:is dependent on|is reliant on)\s+(\w+)',
                r'without\s+(\w+),\s+(\w+)\s+cannot'
            ],
            'provides': [
                r'(\w+)\s+(?:provides|supports|enables|serves|helps)\s+(\w+)',
                r'(\w+)\s+(?:is provided by|is supported by|is enabled by)\s+(\w+)',
                r'(\w+)\s+(?:enhances|improves|optimizes)\s+(\w+)'
            ],
            'consists_of': [
                r'(\w+)\s+(?:consists of|contains|includes|comprises)\s+(\w+)',
                r'(\w+)\s+(?:is part of|belongs to)\s+(\w+)',
            ]
        }

    def extract_components(self, text: str) -> List[Dict]:
        """Extract components and their properties from text using advanced NLP."""
        doc = self.nlp(text)
        components = []
        component_mentions = defaultdict(list)
        
        # First pass: identify components and gather context
        for sent in doc.sents:
            for chunk in sent.noun_chunks:
                if self._is_valid_component(chunk):
                    comp_name = chunk.text
                    context = self._get_context_window(sent, chunk)
                    component_mentions[comp_name].append(context)
        
        # Second pass: analyze components with all their mentions
        for comp_name, contexts in component_mentions.items():
            evolution = self._determine_evolution(contexts)
            value = self._determine_value(contexts)
            maturity = self._analyze_component_maturity(contexts)
            
            # Adjust position based on maturity and context
            final_x = (evolution + maturity) / 2
            final_y = value
            
            components.append({
                'id': comp_name.lower().replace(' ', '_'),
                'name': comp_name,
                'x': final_x,
                'y': final_y,
                'description': self._generate_component_description(comp_name, contexts)
            })
        
        return components

    def extract_relationships(self, text: str, components: List[Dict]) -> List[Dict]:
        """Extract relationships between components using advanced pattern matching."""
        doc = self.nlp(text)
        relationships = []
        component_ids = {c['name'].lower(): c['id'] for c in components}
        seen_relationships = set()
        
        # Extract explicit relationships
        for rel_type, patterns in self.relationship_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text.lower())
                for match in matches:
                    source, target = match.groups()
                    rel = self._create_relationship(source, target, rel_type, component_ids)
                    if rel and self._is_new_relationship(rel, seen_relationships):
                        relationships.append(rel)
                        seen_relationships.add((rel['source'], rel['target'], rel['type']))
        
        # Extract implicit relationships from sentence structure
        for sent in doc.sents:
            root = sent.root
            if root.pos_ == 'VERB':
                self._extract_relationships_from_verb(root, relationships, component_ids, seen_relationships)
        
        return relationships

    def _is_valid_component(self, chunk) -> bool:
        """Check if a noun chunk is a valid component."""
        return (
            chunk.root.pos_ in ['NOUN', 'PROPN'] and
            not chunk.root.is_stop and
            len(chunk.text.split()) <= 4
        )

    def _get_context_window(self, sentence, chunk, window_size: int = 5) -> str:
        """Get the surrounding context of a component mention."""
        start = max(0, chunk.start - window_size)
        end = min(len(sentence), chunk.end + window_size)
        return sentence[start:end].text

    def _determine_evolution(self, contexts: List[str]) -> float:
        """Determine evolution stage based on all mentions of a component."""
        scores = []
        for context in contexts:
            context = context.lower()
            for stage, keywords in self.evolution_keywords.items():
                if any(keyword in context for keyword in keywords):
                    if stage == 'genesis':
                        scores.append(0.1)
                    elif stage == 'custom':
                        scores.append(0.4)
                    elif stage == 'product':
                        scores.append(0.7)
                    else:  # commodity
                        scores.append(0.9)
        
        return sum(scores) / len(scores) if scores else 0.5

    def _determine_value(self, contexts: List[str]) -> float:
        """Determine value based on all mentions of a component."""
        scores = []
        for context in contexts:
            context = context.lower()
            for value, keywords in self.value_keywords.items():
                if any(keyword in context for keyword in keywords):
                    if value == 'high':
                        scores.append(0.9)
                    elif value == 'medium':
                        scores.append(0.5)
                    else:  # low
                        scores.append(0.2)
        
        return sum(scores) / len(scores) if scores else 0.5

    def _analyze_component_maturity(self, contexts: List[str]) -> float:
        """Analyze the maturity of a component based on its context."""
        maturity_indicators = {
            'new': 0.1,
            'developing': 0.3,
            'stable': 0.6,
            'mature': 0.8,
            'legacy': 0.9
        }
        
        scores = []
        for context in contexts:
            context = context.lower()
            for indicator, score in maturity_indicators.items():
                if indicator in context:
                    scores.append(score)
        
        return sum(scores) / len(scores) if scores else 0.5

    def _generate_component_description(self, name: str, contexts: List[str]) -> str:
        """Generate a comprehensive description of a component."""
        # Use the most informative context
        best_context = max(contexts, key=len)
        return f"{name}: {best_context}"

    def _create_relationship(self, source: str, target: str, rel_type: str, component_ids: Dict[str, str]) -> Dict:
        """Create a relationship if both components exist."""
        source = source.strip()
        target = target.strip()
        
        if source in component_ids and target in component_ids:
            return {
                'source': component_ids[source],
                'target': component_ids[target],
                'type': rel_type
            }
        return None

    def _is_new_relationship(self, rel: Dict, seen: Set[Tuple]) -> bool:
        """Check if this is a new relationship."""
        return (rel['source'], rel['target'], rel['type']) not in seen

    def _extract_relationships_from_verb(self, verb, relationships: List, component_ids: Dict, seen: Set):
        """Extract relationships based on verb dependencies."""
        subjects = [token for token in verb.lefts if token.dep_ == 'nsubj']
        objects = [token for token in verb.rights if token.dep_ in ['dobj', 'pobj']]
        
        for subj in subjects:
            for obj in objects:
                if subj.text.lower() in component_ids and obj.text.lower() in component_ids:
                    rel_type = self._determine_relationship_type(verb.text)
                    rel = self._create_relationship(subj.text, obj.text, rel_type, component_ids)
                    if rel and self._is_new_relationship(rel, seen):
                        relationships.append(rel)
                        seen.add((rel['source'], rel['target'], rel['type']))

    def _determine_relationship_type(self, verb: str) -> str:
        """Determine relationship type based on verb semantics."""
        verb = verb.lower()
        if verb in ['depends', 'requires', 'needs', 'uses']:
            return 'depends_on'
        elif verb in ['provides', 'supports', 'enables', 'serves']:
            return 'provides'
        elif verb in ['contains', 'includes', 'comprises']:
            return 'consists_of'
        return 'depends_on'  # default relationship type
