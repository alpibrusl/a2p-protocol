"""
a2p CrewAI Adapter

Integrates a2p profiles with CrewAI agents.
"""

from a2p import (
    create_agent_client,
)


class A2PCrewMemory:
    """
    a2p-backed memory for CrewAI agents.

    This class provides methods to load user context and propose memories
    that can be used with CrewAI agents.

    Example:
        ```python
        from a2p_crewai import A2PCrewMemory
        from crewai import Agent, Crew, Task

        # Create a2p memory
        memory = A2PCrewMemory(
            agent_did="did:a2p:agent:my-crew-agent",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        user_did = "did:a2p:user:alice"
        context = await memory.load_user_context(user_did)

        # Create agent with context
        agent = Agent(
            role="Research Assistant",
            goal="Help the user with research",
            backstory=f"You know the following about the user: {context}",
        )
        ```
    """

    def __init__(
        self,
        agent_did: str,
        private_key: str | None = None,
        default_scopes: list[str] | None = None,
    ):
        self.client = create_agent_client(agent_did, private_key)
        self.default_scopes = default_scopes or ["a2p:preferences", "a2p:context"]
        self._user_contexts: dict[str, dict] = {}

    async def load_user_context(
        self,
        user_did: str,
        scopes: list[str] | None = None,
    ) -> str:
        """
        Load user context and return as a string for agent backstory.

        Args:
            user_did: The user's DID
            scopes: Scopes to request (defaults to default_scopes)

        Returns:
            Formatted string with user context
        """
        profile = await self.client.get_profile(
            user_did=user_did,
            scopes=scopes or self.default_scopes,
        )

        self._user_contexts[user_did] = profile
        return self._format_context(profile)

    def _format_context(self, profile: dict) -> str:
        """Format profile as context string"""
        parts = []

        # Preferences
        common = profile.get("common", {})
        prefs = common.get("preferences", {})
        if prefs:
            comm = prefs.get("communication", {})
            if comm.get("style"):
                parts.append(f"- Communication style: {comm['style']}")
            if comm.get("formality"):
                parts.append(f"- Formality preference: {comm['formality']}")

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
            parts.append("- Known facts:")
            for mem in episodic[:5]:  # Limit to 5 most recent
                if mem.get("status") == "approved":
                    parts.append(f"  • {mem['content']}")

        return "\n".join(parts) if parts else "No context available"

    async def propose_memory(
        self,
        user_did: str,
        content: str,
        category: str | None = None,
        confidence: float = 0.7,
        context: str | None = None,
    ) -> dict:
        """
        Propose a new memory based on agent interaction.

        Args:
            user_did: The user's DID
            content: Memory content
            category: Memory category (e.g., 'a2p:professional')
            confidence: Confidence score (0-1)
            context: Context about why this memory is proposed

        Returns:
            Proposal response with ID and status
        """
        return await self.client.propose_memory(
            user_did=user_did,
            content=content,
            category=category,
            confidence=confidence,
            context=context,
        )

    def get_cached_context(self, user_did: str) -> dict | None:
        """Get cached user context"""
        return self._user_contexts.get(user_did)

    def clear_cache(self) -> None:
        """Clear cached contexts"""
        self._user_contexts.clear()


def create_crew_memory(
    agent_did: str,
    private_key: str | None = None,
    default_scopes: list[str] | None = None,
) -> A2PCrewMemory:
    """Create an a2p memory instance for CrewAI"""
    return A2PCrewMemory(agent_did, private_key, default_scopes)


__all__ = ["A2PCrewMemory", "create_crew_memory"]
