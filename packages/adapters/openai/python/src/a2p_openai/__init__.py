"""
a2p OpenAI Adapter

Integrates a2p profiles with OpenAI APIs (Chat Completions and Assistants).
"""

from typing import Any, Dict, List, Optional
import re

from openai.types.chat import ChatCompletionMessageParam

from a2p import (
    create_agent_client,
)


class A2POpenAIAdapter:
    """
    a2p adapter for OpenAI Chat Completions API.

    This class helps inject user context into OpenAI chat completions
    and extract memories from conversations.

    Example:
        ```python
        from a2p_openai import A2POpenAIAdapter
        from openai import OpenAI

        # Create adapter
        adapter = A2POpenAIAdapter(
            agent_did="did:a2p:agent:local:my-assistant",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        context = await adapter.load_user_context("did:a2p:user:local:alice")

        # Create OpenAI client
        client = OpenAI()

        # Get personalized system prompt
        system_prompt = adapter.build_system_prompt(
            base_prompt="You are a helpful assistant.",
            user_context=context,
        )

        # Use with OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Help me with my project"},
            ]
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
        messages: List[ChatCompletionMessageParam],
        user_context: str,
        base_system_prompt: str = "You are a helpful assistant.",
    ) -> List[ChatCompletionMessageParam]:
        """
        Build messages list with user context in system prompt.

        Args:
            messages: Original messages list
            user_context: User context string
            base_system_prompt: Base system prompt if none exists

        Returns:
            Messages with context in system prompt
        """
        result = list(messages)

        # Check if there's already a system message
        has_system = any(m.get("role") == "system" for m in result)

        if has_system:
            # Append context to existing system message
            for i, msg in enumerate(result):
                if msg.get("role") == "system":
                    original = msg.get("content", "")
                    result[i] = {
                        "role": "system",
                        "content": self.build_system_prompt(
                            str(original), user_context
                        ),
                    }
                    break
        else:
            # Add new system message at the beginning
            system_prompt = self.build_system_prompt(base_system_prompt, user_context)
            result.insert(0, {"role": "system", "content": system_prompt})

        return result

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
            context=context or "Learned during OpenAI conversation",
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


class A2PAssistantAdapter:
    """
    a2p adapter for OpenAI Assistants API.

    This class helps create and manage OpenAI Assistants with
    a2p user context in their instructions.

    Example:
        ```python
        from a2p_openai import A2PAssistantAdapter
        from openai import OpenAI

        client = OpenAI()
        adapter = A2PAssistantAdapter(
            agent_did="did:a2p:agent:local:my-assistant",
        )

        # Load user context
        context = await adapter.load_user_context("did:a2p:user:local:alice")

        # Build personalized instructions
        instructions = adapter.build_instructions(
            base_instructions="You are a helpful coding assistant.",
            user_context=context,
        )

        # Create assistant with personalized instructions
        assistant = client.beta.assistants.create(
            name="Personalized Assistant",
            instructions=instructions,
            model="gpt-4-turbo",
        )
        ```
    """

    def __init__(
        self,
        agent_did: str,
        private_key: Optional[str] = None,
        default_scopes: Optional[List[str]] = None,
        storage: Optional[Any] = None,
    ):
        """Initialize the assistant adapter."""
        self.agent_did = agent_did
        self.client = create_agent_client(agent_did, private_key, storage)
        self.default_scopes = default_scopes or ["a2p:preferences", "a2p:context"]
        self._base_adapter = A2POpenAIAdapter(
            agent_did=agent_did,
            private_key=private_key,
            default_scopes=default_scopes,
            storage=storage,
        )

    async def load_user_context(
        self,
        user_did: str,
        scopes: Optional[List[str]] = None,
    ) -> str:
        """Load user context from a2p profile."""
        return await self._base_adapter.load_user_context(user_did, scopes)

    def build_instructions(
        self,
        base_instructions: str,
        user_context: str,
    ) -> str:
        """
        Build assistant instructions with user context.

        Args:
            base_instructions: Base instructions for the assistant
            user_context: User context from load_user_context()

        Returns:
            Complete instructions with user context
        """
        return self._base_adapter.build_system_prompt(
            base_instructions,
            user_context,
            context_header="USER PROFILE (use this to personalize all responses):",
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
        """Propose a memory to the user's profile."""
        return await self._base_adapter.propose_memory(
            user_did, content, category, memory_type, confidence, context
        )


def create_openai_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_propose: bool = True,
    storage: Optional[Any] = None,
) -> A2POpenAIAdapter:
    """Create an a2p adapter for OpenAI Chat Completions."""
    return A2POpenAIAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        auto_propose=auto_propose,
        storage=storage,
    )


def create_assistant_adapter(
    agent_did: str,
    default_scopes: Optional[List[str]] = None,
    storage: Optional[Any] = None,
) -> A2PAssistantAdapter:
    """Create an a2p adapter for OpenAI Assistants."""
    return A2PAssistantAdapter(
        agent_did=agent_did,
        default_scopes=default_scopes,
        storage=storage,
    )


__all__ = [
    "A2POpenAIAdapter",
    "A2PAssistantAdapter",
    "create_openai_adapter",
    "create_assistant_adapter",
]
