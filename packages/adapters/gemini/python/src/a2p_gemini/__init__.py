"""
a2p Gemini Adapter

Integrates a2p profiles with Google's Gemini API and Vertex AI
using the google-genai SDK.

Supports:
- Gemini 3 Pro, Flash, Nano models
- Vertex AI deployment
- Personalized system instructions
- Memory proposals from conversations
"""

from typing import Any, Dict, List, Optional
import re

from google.genai import types

from a2p import (
    create_agent_client,
)


class A2PGeminiAdapter:
    """
    a2p adapter for Google Gemini API (google-genai SDK).

    This class helps inject user context into Gemini conversations
    and extract memories from interactions.

    Example:
        ```python
        from a2p_gemini import A2PGeminiAdapter
        from google import genai

        # Configure client (API key or Vertex AI)
        client = genai.Client(api_key="YOUR_API_KEY")
        # Or for Vertex AI:
        # client = genai.Client(vertexai=True, project="your-project", location="us-central1")

        # Create adapter
        adapter = A2PGeminiAdapter(
            agent_did="did:a2p:agent:my-assistant",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        context = await adapter.load_user_context("did:a2p:user:alice")

        # Build personalized config
        config = adapter.build_generation_config(
            base_instruction="You are a helpful assistant.",
            user_context=context,
        )

        # Generate with personalization
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents="Help me with my project",
            config=config,
        )
        ```
    """

    def __init__(
        self,
        agent_did: str,
        private_key: Optional[str] = None,
        default_scopes: Optional[List[str]] = None,
        auto_propose: bool = True,
        storage: Optional[Any] = None,
    ):
        """
        Initialize the adapter.

        Args:
            agent_did: The agent's DID
            private_key: Optional private key for signing
            default_scopes: Default scopes to request
            auto_propose: Whether to auto-propose memories
            storage: Optional storage backend
        """
        self.agent_did = agent_did
        self.client = create_agent_client(agent_did, private_key, storage)
        self.default_scopes = default_scopes or ["a2p:preferences", "a2p:context"]
        self.auto_propose = auto_propose
        self._loaded_contexts: Dict[str, str] = {}
        self._loaded_profiles: Dict[str, Dict] = {}

    async def load_user_context(
        self,
        user_did: str,
        scopes: Optional[List[str]] = None,
    ) -> str:
        """
        Load user context from a2p profile.

        Args:
            user_did: The user's DID
            scopes: Scopes to request

        Returns:
            Formatted context string
        """
        profile = await self.client.get_profile(
            user_did=user_did,
            scopes=scopes or self.default_scopes,
        )

        self._loaded_profiles[user_did] = profile
        context = self._format_context(profile)
        self._loaded_contexts[user_did] = context

        return context

    def _format_context(self, profile: Dict) -> str:
        """Format profile as context string."""
        parts = []

        # Preferences
        common = profile.get("common", {})
        prefs = common.get("preferences", {})
        if prefs:
            comm = prefs.get("communication", {})
            if comm.get("style"):
                parts.append(f"- Communication style: {comm['style']}")
            if comm.get("formality"):
                parts.append(f"- Formality: {comm['formality']}")
            if prefs.get("language"):
                parts.append(f"- Preferred language: {prefs['language']}")

        # Accessibility
        accessibility = common.get("accessibility", {})
        if accessibility:
            digital = accessibility.get("digital", {})
            if digital:
                if digital.get("fontSize"):
                    parts.append(f"- Font size preference: {digital['fontSize']}")
                if digital.get("reducedMotion"):
                    parts.append("- Prefers reduced motion")
                if digital.get("screenReader"):
                    parts.append("- Uses screen reader")

        # Memories
        memories = profile.get("memories", {})

        # Professional
        prof = memories.get("a2p:professional", {})
        if prof:
            if prof.get("occupation"):
                parts.append(f"- Occupation: {prof['occupation']}")
            if prof.get("skills"):
                parts.append(f"- Skills: {', '.join(prof['skills'])}")

        # Interests
        interests = memories.get("a2p:interests", {})
        if interests:
            if interests.get("topics"):
                parts.append(f"- Interests: {', '.join(interests['topics'])}")

        # Episodic memories
        episodic = memories.get("a2p:episodic", [])
        if episodic:
            approved = [m for m in episodic if m.get("status") == "approved"]
            if approved:
                parts.append("- Known facts about user:")
                for mem in approved[:5]:
                    parts.append(f"  • {mem['content']}")

        return "\n".join(parts) if parts else "No user context available."

    def build_system_instruction(
        self,
        base_instruction: str,
        user_context: str,
        context_header: str = "USER CONTEXT (personalize responses based on this):",
    ) -> str:
        """
        Build a system instruction with user context for Gemini.

        Args:
            base_instruction: Base system instruction
            user_context: User context from load_user_context()
            context_header: Header for the context section

        Returns:
            Complete system instruction
        """
        if not user_context or user_context == "No user context available.":
            return base_instruction

        return f"""{base_instruction}

{context_header}
{user_context}"""

    def build_generation_config(
        self,
        base_instruction: str,
        user_context: str,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
        **kwargs,
    ) -> types.GenerateContentConfig:
        """
        Build a GenerateContentConfig with personalized system instruction.

        Args:
            base_instruction: Base system instruction
            user_context: User context string
            temperature: Generation temperature
            max_output_tokens: Max tokens to generate
            **kwargs: Additional config options

        Returns:
            Configured GenerateContentConfig instance
        """
        system_instruction = self.build_system_instruction(
            base_instruction,
            user_context,
        )

        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            **kwargs,
        )

    async def propose_memory(
        self,
        user_did: str,
        content: str,
        category: Optional[str] = None,
        memory_type: str = "episodic",
        confidence: float = 0.7,
        context: Optional[str] = None,
    ) -> Dict:
        """
        Propose a new memory to the user's profile.

        Args:
            user_did: The user's DID
            content: Memory content
            category: Memory category
            memory_type: Memory type (episodic, semantic, procedural). Defaults to "episodic"
            confidence: Confidence score (0-1)
            context: Context about why this is proposed

        Returns:
            Proposal response
        """
        return await self.client.propose_memory(
            user_did=user_did,
            content=content,
            category=category,
            memory_type=memory_type,
            confidence=confidence,
            context=context or "Learned during Gemini conversation",
        )

    async def extract_and_propose(
        self,
        user_did: str,
        chat_history: List[Dict[str, str]],
    ) -> List[Dict]:
        """
        Extract potential memories from chat history.

        Args:
            user_did: The user's DID
            chat_history: List of {"role": "user"|"model", "content": "..."}

        Returns:
            List of proposal responses
        """
        if not self.auto_propose:
            return []

        proposals = []
        patterns = [
            (r"I work (?:as|at|for) (.+)", "a2p:professional"),
            (r"I(?:'m| am) a (.+)", "a2p:professional"),
            (r"I like (.+)", "a2p:interests"),
            (r"I prefer (.+)", "a2p:preferences"),
            (r"I(?:'m| am) interested in (.+)", "a2p:interests"),
            (r"I(?:'m| am) learning (.+)", "a2p:context.learning"),
        ]

        for msg in chat_history:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                for pattern, category in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        proposal = await self.propose_memory(
                            user_did=user_did,
                            content=content,
                            category=category,
                            confidence=0.7,
                        )
                        proposals.append(proposal)
                        break

        return proposals

    def get_cached_context(self, user_did: str) -> Optional[str]:
        """Get cached user context."""
        return self._loaded_contexts.get(user_did)

    def get_cached_profile(self, user_did: str) -> Optional[Dict]:
        """Get cached user profile."""
        return self._loaded_profiles.get(user_did)


class A2PVertexAIAdapter(A2PGeminiAdapter):
    """
    a2p adapter specifically for Vertex AI deployments.

    Extends A2PGeminiAdapter with Vertex AI-specific features.

    Example:
        ```python
        from a2p_gemini import A2PVertexAIAdapter
        from google import genai

        # Configure Vertex AI client
        client = genai.Client(
            vertexai=True,
            project="your-project-id",
            location="us-central1",
        )

        # Create adapter
        adapter = A2PVertexAIAdapter(
            agent_did="did:a2p:agent:vertex-assistant",
            project_id="your-project-id",
            location="us-central1",
        )

        # Load and use context
        context = await adapter.load_user_context("did:a2p:user:alice")
        config = adapter.build_generation_config(
            "You are an enterprise assistant.",
            context,
        )
        ```
    """

    def __init__(
        self,
        agent_did: str,
        project_id: str,
        location: str = "us-central1",
        **kwargs,
    ):
        super().__init__(agent_did, **kwargs)
        self.project_id = project_id
        self.location = location


def create_gemini_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_propose: bool = True,
) -> A2PGeminiAdapter:
    """Create an a2p adapter for Google Gemini."""
    return A2PGeminiAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        auto_propose=auto_propose,
    )


def create_vertex_adapter(
    agent_did: str,
    project_id: str,
    location: str = "us-central1",
    default_scopes: Optional[List[str]] = None,
) -> A2PVertexAIAdapter:
    """Create an a2p adapter for Vertex AI."""
    return A2PVertexAIAdapter(
        agent_did=agent_did,
        project_id=project_id,
        location=location,
        default_scopes=default_scopes,
    )


__all__ = [
    "A2PGeminiAdapter",
    "A2PVertexAIAdapter",
    "create_gemini_adapter",
    "create_vertex_adapter",
]
