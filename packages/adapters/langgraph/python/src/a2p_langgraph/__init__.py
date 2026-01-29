"""
a2p LangGraph Adapter

Integrates a2p profiles with LangGraph for stateful, personalized agents.
"""

from typing import Any, Dict, List, Optional, TypedDict
import re

from a2p import (
    create_agent_client,
)


class UserContext(TypedDict, total=False):
    """User context loaded from a2p profile."""

    preferences: Dict[str, Any]
    memories: List[str]
    context_string: str
    profile: Dict[str, Any]


class A2PMemorySaver:
    """
    a2p-backed memory saver for LangGraph.

    This class provides methods to load user context into LangGraph state
    and propose memories back to user profiles.

    Example:
        ```python
        from a2p_langgraph import A2PMemorySaver, format_user_context_for_prompt
        from langgraph.graph import StateGraph

        # Create memory saver
        memory_saver = A2PMemorySaver(
            agent_did="did:a2p:agent:local:my-agent",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        user_context = await memory_saver.load_user_context(user_did)

        # Use in graph node
        def chatbot_node(state):
            system_prompt = f"User context:\\n{state['user_context']}"
            # ... generate response
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
        Initialize the memory saver.

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
        self._loaded_profiles: Dict[str, Dict] = {}

    async def load_user_context(
        self,
        user_did: str,
        scopes: Optional[List[str]] = None,
    ) -> UserContext:
        """
        Load user context from a2p profile.

        Args:
            user_did: The user's DID
            scopes: Scopes to request (defaults to default_scopes)

        Returns:
            UserContext dict with preferences, memories, and formatted string
        """
        profile = await self.client.get_profile(
            user_did=user_did,
            scopes=scopes or self.default_scopes,
        )

        self._loaded_profiles[user_did] = profile

        return self._profile_to_context(profile)

    def _profile_to_context(self, profile: Dict) -> UserContext:
        """Convert profile to UserContext format."""
        context: UserContext = {
            "preferences": {},
            "memories": [],
            "context_string": "",
            "profile": profile,
        }

        # Extract preferences
        common = profile.get("common", {})
        prefs = common.get("preferences", {})
        context["preferences"] = prefs

        # Extract memories
        memories_list: List[str] = []
        memories = profile.get("memories", {})

        # Professional
        prof = memories.get("a2p:professional", {})
        if prof:
            if prof.get("occupation"):
                memories_list.append(f"Occupation: {prof['occupation']}")
            if prof.get("skills"):
                memories_list.append(f"Skills: {', '.join(prof['skills'])}")

        # Interests
        interests = memories.get("a2p:interests", {})
        if interests:
            if interests.get("topics"):
                memories_list.append(f"Interests: {', '.join(interests['topics'])}")

        # Episodic memories
        episodic = memories.get("a2p:episodic", [])
        if episodic:
            for mem in episodic[:10]:  # Limit to 10
                if mem.get("status") == "approved":
                    memories_list.append(mem["content"])

        context["memories"] = memories_list
        context["context_string"] = self._format_context_string(prefs, memories_list)

        return context

    def _format_context_string(self, preferences: Dict, memories: List[str]) -> str:
        """Format preferences and memories as a string."""
        parts = []

        # Preferences
        comm = preferences.get("communication", {})
        if comm.get("style"):
            parts.append(f"- Communication style: {comm['style']}")
        if comm.get("formality"):
            parts.append(f"- Formality: {comm['formality']}")
        if preferences.get("language"):
            parts.append(f"- Language: {preferences['language']}")

        # Memories
        if memories:
            parts.append("- User context:")
            for mem in memories:
                parts.append(f"  • {mem}")

        return "\n".join(parts) if parts else "No user context available."

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
            category: Memory category (e.g., 'a2p:preferences')
            memory_type: Memory type (episodic, semantic, procedural). Defaults to "episodic"
            confidence: Confidence score (0-1)
            context: Context about why this is proposed

        Returns:
            Proposal response with ID and status
        """
        return await self.client.propose_memory(
            user_did=user_did,
            content=content,
            category=category,
            memory_type=memory_type,
            confidence=confidence,
            context=context or "Learned during LangGraph conversation",
        )

    async def extract_and_propose(
        self,
        user_did: str,
        messages: List[Dict[str, str]],
        context: Optional[str] = None,
    ) -> List[Dict]:
        """
        Extract potential memories from messages and propose them.

        Args:
            user_did: The user's DID
            messages: List of message dicts with 'role' and 'content'
            context: Context for proposals

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
            (r"I use (.+)", "a2p:preferences.tools"),
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
                            context=context,
                        )
                        proposals.append(proposal)
                        break  # Only one proposal per message

        return proposals

    def get_loaded_profile(self, user_did: str) -> Optional[Dict]:
        """Get a previously loaded profile."""
        return self._loaded_profiles.get(user_did)

    def clear_cache(self) -> None:
        """Clear the profile cache."""
        self._loaded_profiles.clear()


def create_memory_saver(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_propose: bool = True,
    storage: Optional[Any] = None,
) -> A2PMemorySaver:
    """
    Create an a2p memory saver for LangGraph.

    Args:
        agent_did: The agent's DID
        default_scopes: Default scopes to request
        auto_propose: Whether to auto-propose memories
        storage: Optional storage backend

    Returns:
        A2PMemorySaver instance
    """
    return A2PMemorySaver(
        agent_did=agent_did,
        default_scopes=default_scopes,
        auto_propose=auto_propose,
        storage=storage,
    )


def format_user_context_for_prompt(context: UserContext) -> str:
    """
    Format user context for inclusion in LLM prompts.

    Args:
        context: UserContext from load_user_context()

    Returns:
        Formatted string for system prompts
    """
    return context.get("context_string", "")


def inject_context_into_state(
    state: Dict[str, Any],
    context: UserContext,
    context_key: str = "user_context",
) -> Dict[str, Any]:
    """
    Inject user context into LangGraph state.

    Args:
        state: Current graph state
        context: UserContext from load_user_context()
        context_key: Key to use in state

    Returns:
        Updated state with user context
    """
    return {
        **state,
        context_key: context["context_string"],
        "user_preferences": context["preferences"],
        "user_memories": context["memories"],
    }


__all__ = [
    "A2PMemorySaver",
    "UserContext",
    "create_memory_saver",
    "format_user_context_for_prompt",
    "inject_context_into_state",
]
