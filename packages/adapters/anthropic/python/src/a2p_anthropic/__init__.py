"""
a2p Anthropic Adapter

Integrates a2p profiles with Anthropic's Claude API.

Supports:
- Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
- 1M token context window
- Code execution tool
- MCP connector
- Files API
- Extended prompt caching
"""

from typing import Any, Dict, List, Optional
import re

from anthropic.types import MessageParam

from a2p import (
    create_agent_client,
)


class A2PAnthropicAdapter:
    """
    a2p adapter for Anthropic Claude API.

    This class helps inject user context into Claude conversations
    and extract memories from interactions.

    Example:
        ```python
        from anthropic import Anthropic
        from a2p_anthropic import A2PAnthropicAdapter

        # Create clients
        client = Anthropic()
        adapter = A2PAnthropicAdapter(
            agent_did="did:a2p:agent:my-assistant",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        context = await adapter.load_user_context("did:a2p:user:alice")

        # Build personalized system prompt
        system = adapter.build_system_prompt(
            "You are a helpful assistant.",
            context,
        )

        # Use with Claude
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": "Help me with my project"}],
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
                if digital.get("screenReader"):
                    parts.append("- Uses screen reader (provide text descriptions)")
                if digital.get("reducedMotion"):
                    parts.append("- Prefers reduced motion")

        # Memories
        memories = profile.get("memories", {})

        # Professional
        prof = memories.get("a2p:professional", {})
        if prof:
            if prof.get("occupation"):
                parts.append(f"- Occupation: {prof['occupation']}")
            if prof.get("skills"):
                parts.append(f"- Skills: {', '.join(prof['skills'])}")
            if prof.get("expertise_level"):
                parts.append(f"- Expertise level: {prof['expertise_level']}")

        # Interests
        interests = memories.get("a2p:interests", {})
        if interests:
            if interests.get("topics"):
                parts.append(f"- Interests: {', '.join(interests['topics'])}")

        # Context
        ctx = memories.get("a2p:context", {})
        if ctx:
            if ctx.get("current_project"):
                parts.append(f"- Current project: {ctx['current_project']}")

        # Episodic memories
        episodic = memories.get("a2p:episodic", [])
        if episodic:
            approved = [m for m in episodic if m.get("status") == "approved"]
            if approved:
                parts.append("- Known facts about user:")
                for mem in approved[:5]:
                    parts.append(f"  • {mem['content']}")

        return "\n".join(parts) if parts else "No user context available."

    def build_system_prompt(
        self,
        base_prompt: str,
        user_context: str,
        context_header: str = "USER CONTEXT (personalize responses based on this):",
    ) -> str:
        """
        Build a system prompt with user context.

        Args:
            base_prompt: Base system prompt
            user_context: User context from load_user_context()
            context_header: Header for the context section

        Returns:
            Complete system prompt
        """
        if not user_context or user_context == "No user context available.":
            return base_prompt

        return f"""{base_prompt}

{context_header}
{user_context}"""

    def build_messages_with_context(
        self,
        messages: List[MessageParam],
        user_context: str,
        base_system_prompt: str = "You are a helpful assistant.",
    ) -> tuple[str, List[MessageParam]]:
        """
        Build system prompt and messages with user context.

        Args:
            messages: Original messages list
            user_context: User context string
            base_system_prompt: Base system prompt

        Returns:
            Tuple of (system_prompt, messages)
        """
        system = self.build_system_prompt(base_system_prompt, user_context)
        return system, list(messages)

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
            context=context or "Learned during Claude conversation",
        )

    async def extract_and_propose(
        self,
        user_did: str,
        messages: List[Dict[str, str]],
    ) -> List[Dict]:
        """
        Extract potential memories from messages and propose them.

        Args:
            user_did: The user's DID
            messages: Conversation messages

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

        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
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

    def clear_cache(self) -> None:
        """Clear all caches."""
        self._loaded_contexts.clear()
        self._loaded_profiles.clear()


class A2PClaudeTools:
    """
    Helper for using Claude's advanced features with a2p context.

    Supports:
    - Code execution tool
    - MCP connector
    - Files API
    """

    @staticmethod
    def create_code_execution_context(
        user_context: str,
        allowed_languages: Optional[List[str]] = None,
    ) -> Dict:
        """
        Create context for code execution based on user preferences.

        Args:
            user_context: User context string
            allowed_languages: Languages to allow

        Returns:
            Code execution configuration
        """
        # Check for Python preference in context
        languages = allowed_languages or ["python"]
        if "python" in user_context.lower() or "pytorch" in user_context.lower():
            languages = ["python"] + [lang for lang in languages if lang != "python"]

        return {
            "type": "code_execution",
            "languages": languages,
        }


def create_anthropic_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_propose: bool = True,
) -> A2PAnthropicAdapter:
    """Create an a2p adapter for Anthropic Claude."""
    return A2PAnthropicAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        auto_propose=auto_propose,
    )


# Model constants for Claude 4.5 (as of January 2026)
CLAUDE_OPUS_4_5 = "claude-4-5-opus-20251124"
CLAUDE_SONNET_4_5 = "claude-4-5-sonnet-20250929"
CLAUDE_HAIKU_4_5 = "claude-4-5-haiku-20251015"


__all__ = [
    "A2PAnthropicAdapter",
    "A2PClaudeTools",
    "create_anthropic_adapter",
    "CLAUDE_OPUS_4_5",
    "CLAUDE_SONNET_4_5",
    "CLAUDE_HAIKU_4_5",
]
