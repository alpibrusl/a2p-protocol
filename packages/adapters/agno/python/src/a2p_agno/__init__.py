"""
a2p Agno Adapter

Integrates a2p user-owned profiles with Agno's agent framework.

This adapter bridges Agno's agent-side memory with a2p's user-side memory,
enabling personalized multi-agent systems where user preferences persist
across all agents.
"""

from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass

from a2p import (
    create_agent_client,
)


@dataclass
class A2PUserContext:
    """User context loaded from a2p profile."""

    user_did: str
    preferences: Dict[str, Any]
    memories: List[str]
    accessibility: Dict[str, Any]
    context_string: str
    raw_profile: Dict[str, Any]


class A2PAgnoAdapter:
    """
    a2p adapter for Agno agent framework.

    This adapter provides:
    - User context loading for agent personalization
    - Memory synchronization between agent and user profiles
    - Multi-agent coordination with consistent user preferences

    Key Concept:
    - Agno Memory: Agent-side (what the agent learned)
    - a2p Memory: User-side (what the user wants agents to know)

    Example:
        ```python
        from agno.agent import Agent
        from agno.models.openai import OpenAIChat
        from a2p_agno import A2PAgnoAdapter

        # Create adapter
        adapter = A2PAgnoAdapter(
            agent_did="did:a2p:agent:my-agent",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        user_context = await adapter.load_user_context("did:a2p:user:alice")

        # Create Agno agent with a2p context
        agent = Agent(
            model=OpenAIChat(id="gpt-4"),
            instructions=adapter.build_instructions(
                "You are a helpful assistant.",
                user_context,
            ),
        )

        # Run with personalization
        response = agent.run("Help me with my project")
        ```
    """

    def __init__(
        self,
        agent_did: str,
        private_key: Optional[str] = None,
        default_scopes: Optional[List[str]] = None,
        sync_memories: bool = True,
        storage: Optional[Any] = None,
    ):
        """
        Initialize the adapter.

        Args:
            agent_did: The agent's DID
            private_key: Optional private key for signing
            default_scopes: Default scopes to request
            sync_memories: Whether to sync agent memories to a2p
            storage: Optional storage backend
        """
        self.agent_did = agent_did
        self.client = create_agent_client(agent_did, private_key, storage)
        self.default_scopes = default_scopes or [
            "a2p:preferences",
            "a2p:context",
            "a2p:professional",
        ]
        self.sync_memories = sync_memories
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

        # Extract memory strings
        memories: List[str] = []

        # Professional
        prof = memories_dict.get("a2p:professional", {})
        if prof:
            if prof.get("occupation"):
                memories.append(f"Occupation: {prof['occupation']}")
            if prof.get("skills"):
                memories.append(f"Skills: {', '.join(prof['skills'])}")

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
            if ctx.get("learning"):
                memories.append(f"Learning: {', '.join(ctx['learning'])}")

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

        physical = accessibility.get("physical", {})
        if physical:
            if physical.get("mobility"):
                parts.append(f"- Mobility: {physical['mobility']}")

        # Memories
        if memories:
            parts.append("- User context:")
            for mem in memories:
                parts.append(f"  • {mem}")

        return "\n".join(parts) if parts else "No user context available."

    def build_instructions(
        self,
        base_instructions: str,
        user_context: A2PUserContext,
        context_header: str = "USER PROFILE (personalize based on this):",
    ) -> str:
        """
        Build agent instructions with user context.

        Args:
            base_instructions: Base agent instructions
            user_context: Context from load_user_context()
            context_header: Header for context section

        Returns:
            Complete instructions with user context
        """
        if (
            not user_context.context_string
            or user_context.context_string == "No user context available."
        ):
            return base_instructions

        return f"""{base_instructions}

{context_header}
{user_context.context_string}"""

    async def propose_memory(
        self,
        user_did: str,
        content: str,
        category: Optional[str] = None,
        confidence: float = 0.7,
        source_agent: Optional[str] = None,
    ) -> Dict:
        """
        Propose a memory to the user's a2p profile.

        This syncs agent-learned information back to the user's
        portable profile, so other agents can benefit.

        Args:
            user_did: The user's DID
            content: Memory content
            category: Memory category
            confidence: Confidence score (0-1)
            source_agent: Optional name of the agent that learned this

        Returns:
            Proposal response
        """
        context = "Learned by Agno agent"
        if source_agent:
            context = f"Learned by {source_agent} agent"

        return await self.client.propose_memory(
            user_did=user_did,
            content=content,
            category=category,
            confidence=confidence,
            context=context,
        )

    async def sync_agent_memory_to_a2p(
        self,
        user_did: str,
        agent_memories: List[Dict[str, Any]],
        source_agent: Optional[str] = None,
    ) -> List[Dict]:
        """
        Sync Agno agent memories to a2p profile.

        This allows agent-specific learnings to be proposed
        to the user's portable profile.

        Args:
            user_did: The user's DID
            agent_memories: List of Agno memory objects
            source_agent: Name of the source agent

        Returns:
            List of proposal responses
        """
        if not self.sync_memories:
            return []

        proposals = []
        for mem in agent_memories:
            # Extract content from Agno memory format
            content = mem.get("content") or mem.get("text") or str(mem)

            proposal = await self.propose_memory(
                user_did=user_did,
                content=content,
                category="a2p:episodic",
                confidence=0.7,
                source_agent=source_agent,
            )
            proposals.append(proposal)

        return proposals

    def create_memory_hook(
        self,
        user_did: str,
        source_agent: Optional[str] = None,
    ) -> Callable:
        """
        Create a hook function for Agno's memory system.

        This hook can be used to automatically sync new memories
        to the user's a2p profile.

        Args:
            user_did: The user's DID
            source_agent: Name of the agent

        Returns:
            Async hook function
        """

        async def memory_hook(memory: Dict[str, Any]) -> None:
            if self.sync_memories:
                await self.propose_memory(
                    user_did=user_did,
                    content=memory.get("content", str(memory)),
                    source_agent=source_agent,
                )

        return memory_hook

    def get_cached_context(self, user_did: str) -> Optional[A2PUserContext]:
        """Get cached user context."""
        return self._loaded_contexts.get(user_did)


class A2PMultiAgentCoordinator:
    """
    Coordinator for multi-agent systems with consistent a2p profiles.

    Ensures all agents in an Agno multi-agent setup share the same
    user context from a2p profiles.

    Example:
        ```python
        coordinator = A2PMultiAgentCoordinator(
            agent_did="did:a2p:agent:coordinator",
        )

        # Load user context once
        context = await coordinator.load_user_context(user_did)

        # Create multiple agents with same user context
        researcher = coordinator.create_agent_config("researcher", context)
        writer = coordinator.create_agent_config("writer", context)
        reviewer = coordinator.create_agent_config("reviewer", context)
        ```
    """

    def __init__(
        self,
        agent_did: str,
        default_scopes: Optional[List[str]] = None,
    ):
        self.adapter = A2PAgnoAdapter(
            agent_did=agent_did,
            default_scopes=default_scopes,
        )

    async def load_user_context(self, user_did: str) -> A2PUserContext:
        """Load user context for the entire agent team."""
        return await self.adapter.load_user_context(user_did)

    def create_agent_config(
        self,
        agent_name: str,
        user_context: A2PUserContext,
        role_instructions: str,
    ) -> Dict[str, Any]:
        """
        Create agent configuration with user context.

        Args:
            agent_name: Name of the agent
            user_context: Shared user context
            role_instructions: Role-specific instructions

        Returns:
            Configuration dict for Agno agent
        """
        instructions = self.adapter.build_instructions(
            role_instructions,
            user_context,
        )

        return {
            "name": agent_name,
            "instructions": instructions,
            "user_did": user_context.user_did,
        }


def create_agno_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    sync_memories: bool = True,
) -> A2PAgnoAdapter:
    """Create an a2p adapter for Agno."""
    return A2PAgnoAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        sync_memories=sync_memories,
    )


__all__ = [
    "A2PAgnoAdapter",
    "A2PUserContext",
    "A2PMultiAgentCoordinator",
    "create_agno_adapter",
]
