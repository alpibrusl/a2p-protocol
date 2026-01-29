"""
a2p Google ADK Adapter

Integrates a2p profiles with Google's Agent Development Kit (ADK).

Google ADK provides:
- Agent orchestration and lifecycle management
- Tool integration and function calling
- Multi-agent coordination
- Gemini model integration

This adapter adds user-centric personalization via a2p profiles.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass
import re

from a2p import (
    create_agent_client,
)


@dataclass
class A2PUserContext:
    """User context loaded from a2p profile for ADK agents."""

    user_did: str
    preferences: Dict[str, Any]
    memories: List[str]
    accessibility: Dict[str, Any]
    constraints: Dict[str, Any]
    context_string: str
    raw_profile: Dict[str, Any]


class A2PADKAdapter:
    """
    a2p adapter for Google Agent Development Kit.

    This adapter provides:
    - User context loading for agent personalization
    - Instruction injection for ADK agents
    - Memory proposals from agent interactions
    - Multi-agent coordination with consistent preferences

    Example:
        ```python
        from google.adk import Agent, Runner
        from google.genai import Client
        from a2p_google_adk import A2PADKAdapter

        # Create a2p adapter
        adapter = A2PADKAdapter(
            agent_did="did:a2p:agent:my-adk-agent",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        user_context = await adapter.load_user_context("did:a2p:user:alice")

        # Create ADK agent with personalized instructions
        agent = Agent(
            name="PersonalizedAssistant",
            model="gemini-2.5-pro",
            instruction=adapter.build_instruction(
                "You are a helpful assistant.",
                user_context,
            ),
        )

        # Run agent
        runner = Runner(agent=agent, app_name="my-app")
        response = await runner.run(user_input)
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
        self.default_scopes = default_scopes or [
            "a2p:preferences",
            "a2p:context",
            "a2p:professional",
        ]
        self.auto_propose = auto_propose
        self._loaded_contexts: Dict[str, A2PUserContext] = {}

    async def load_user_context(
        self,
        user_did: str,
        scopes: Optional[List[str]] = None,
    ) -> A2PUserContext:
        """
        Load user context from a2p profile.

        Args:
            user_did: The user's DID
            scopes: Scopes to request

        Returns:
            A2PUserContext with preferences, memories, and formatted string
        """
        profile = await self.client.get_profile(
            user_did=user_did,
            scopes=scopes or self.default_scopes,
        )

        context = self._profile_to_context(user_did, profile)
        self._loaded_contexts[user_did] = context

        return context

    def _profile_to_context(self, user_did: str, profile: Dict) -> A2PUserContext:
        """Convert profile to A2PUserContext."""
        common = profile.get("common", {})
        prefs = common.get("preferences", {})
        accessibility = common.get("accessibility", {})
        memories_dict = profile.get("memories", {})

        # Extract constraints
        constraints = {}
        consent = profile.get("consent", {})
        if consent:
            constraints["consent"] = consent

        # Extract memory strings
        memories: List[str] = []

        # Professional
        prof = memories_dict.get("a2p:professional", {})
        if prof:
            if prof.get("occupation"):
                memories.append(f"Occupation: {prof['occupation']}")
            if prof.get("skills"):
                memories.append(f"Skills: {', '.join(prof['skills'])}")
            if prof.get("expertise_level"):
                memories.append(f"Expertise: {prof['expertise_level']}")

        # Interests
        interests = memories_dict.get("a2p:interests", {})
        if interests:
            if interests.get("topics"):
                memories.append(f"Interests: {', '.join(interests['topics'])}")

        # Context
        ctx = memories_dict.get("a2p:context", {})
        if ctx:
            if ctx.get("current_project"):
                memories.append(f"Current project: {ctx['current_project']}")

        # Episodic
        episodic = memories_dict.get("a2p:episodic", [])
        for mem in episodic[:10]:
            if mem.get("status") == "approved":
                memories.append(mem["content"])

        # Build context string
        context_string = self._format_context_string(prefs, accessibility, memories)

        return A2PUserContext(
            user_did=user_did,
            preferences=prefs,
            memories=memories,
            accessibility=accessibility,
            constraints=constraints,
            context_string=context_string,
            raw_profile=profile,
        )

    def _format_context_string(
        self,
        prefs: Dict,
        accessibility: Dict,
        memories: List[str],
    ) -> str:
        """Format context as string for agent instructions."""
        parts = []

        # Preferences
        comm = prefs.get("communication", {})
        if comm.get("style"):
            parts.append(f"- Communication style: {comm['style']}")
        if comm.get("formality"):
            parts.append(f"- Formality: {comm['formality']}")
        if prefs.get("language"):
            parts.append(f"- Language: {prefs['language']}")

        # Accessibility
        digital = accessibility.get("digital", {})
        if digital:
            if digital.get("screenReader"):
                parts.append("- Uses screen reader (provide text descriptions)")
            if digital.get("reducedMotion"):
                parts.append("- Prefers reduced motion")

        # Memories
        if memories:
            parts.append("- User context:")
            for mem in memories:
                parts.append(f"  • {mem}")

        return "\n".join(parts) if parts else "No user context available."

    def build_instruction(
        self,
        base_instruction: str,
        user_context: A2PUserContext,
        context_header: str = "USER PROFILE (personalize based on this):",
    ) -> str:
        """
        Build agent instruction with user context.

        This is used with ADK's Agent instruction parameter.

        Args:
            base_instruction: Base agent instruction
            user_context: Context from load_user_context()
            context_header: Header for context section

        Returns:
            Complete instruction with user context
        """
        if (
            not user_context.context_string
            or user_context.context_string == "No user context available."
        ):
            return base_instruction

        return f"""{base_instruction}

{context_header}
{user_context.context_string}"""

    def create_personalized_agent_config(
        self,
        name: str,
        base_instruction: str,
        user_context: A2PUserContext,
        model: str = "gemini-2.5-pro",
        tools: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create ADK agent configuration with personalization.

        Args:
            name: Agent name
            base_instruction: Base instruction
            user_context: User context
            model: Model to use
            tools: Optional tools list

        Returns:
            Configuration dict for ADK Agent
        """
        instruction = self.build_instruction(base_instruction, user_context)

        config = {
            "name": name,
            "model": model,
            "instruction": instruction,
        }

        if tools:
            config["tools"] = tools  # type: ignore[assignment]

        return config

    async def propose_memory(
        self,
        user_did: str,
        content: str,
        category: Optional[str] = None,
        memory_type: str = "episodic",
        confidence: float = 0.7,
        source_agent: Optional[str] = None,
    ) -> Dict:
        """
        Propose a memory to the user's a2p profile.

        Args:
            user_did: The user's DID
            content: Memory content
            category: Memory category
            memory_type: Memory type (episodic, semantic, procedural). Defaults to "episodic"
            confidence: Confidence score (0-1)
            source_agent: Optional name of the agent

        Returns:
            Proposal response
        """
        context = "Learned by ADK agent"
        if source_agent:
            context = f"Learned by {source_agent} ADK agent"

        return await self.client.propose_memory(
            user_did=user_did,
            content=content,
            category=category,
            memory_type=memory_type,
            confidence=confidence,
            context=context,
        )

    async def extract_and_propose(
        self,
        user_did: str,
        messages: List[Dict[str, str]],
        source_agent: Optional[str] = None,
    ) -> List[Dict]:
        """
        Extract memories from messages and propose them.

        Args:
            user_did: The user's DID
            messages: Conversation messages
            source_agent: Name of the agent

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
        ]

        for msg in messages:
            if msg.get("role") in ("user", "human"):
                content = msg.get("content", "")
                for pattern, category in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        proposal = await self.propose_memory(
                            user_did=user_did,
                            content=content,
                            category=category,
                            confidence=0.7,
                            source_agent=source_agent,
                        )
                        proposals.append(proposal)
                        break

        return proposals

    def get_cached_context(self, user_did: str) -> Optional[A2PUserContext]:
        """Get cached user context."""
        return self._loaded_contexts.get(user_did)


class A2PADKMultiAgentCoordinator:
    """
    Coordinator for ADK multi-agent systems with a2p profiles.

    Ensures all agents in an ADK application share the same
    user context for consistent personalization.

    Example:
        ```python
        coordinator = A2PADKMultiAgentCoordinator(
            agent_did="did:a2p:agent:coordinator",
        )

        # Load user context once
        context = await coordinator.load_user_context(user_did)

        # Create multiple agents with same context
        research_config = coordinator.create_agent_config(
            "researcher", "Research topics", context
        )
        writer_config = coordinator.create_agent_config(
            "writer", "Write content", context
        )
        ```
    """

    def __init__(
        self,
        agent_did: str,
        default_scopes: Optional[List[str]] = None,
    ):
        self.adapter = A2PADKAdapter(
            agent_did=agent_did,
            default_scopes=default_scopes,
        )

    async def load_user_context(self, user_did: str) -> A2PUserContext:
        """Load user context for the agent team."""
        return await self.adapter.load_user_context(user_did)

    def create_agent_config(
        self,
        name: str,
        instruction: str,
        user_context: A2PUserContext,
        model: str = "gemini-2.5-pro",
        tools: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """Create agent configuration with shared user context."""
        return self.adapter.create_personalized_agent_config(
            name=name,
            base_instruction=instruction,
            user_context=user_context,
            model=model,
            tools=tools,
        )


def create_adk_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_propose: bool = True,
) -> A2PADKAdapter:
    """Create an a2p adapter for Google ADK."""
    return A2PADKAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        auto_propose=auto_propose,
    )


__all__ = [
    "A2PADKAdapter",
    "A2PUserContext",
    "A2PADKMultiAgentCoordinator",
    "create_adk_adapter",
]
