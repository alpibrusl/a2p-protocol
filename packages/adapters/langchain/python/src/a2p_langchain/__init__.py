"""
a2p LangChain Adapter

Integrates a2p profiles with LangChain for personalized AI applications.
"""

from typing import Any, Dict, List, Optional
from langchain_core.memory import BaseMemory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.pydantic_v1 import Field

from a2p import (
    A2PClient,
    create_agent_client,
)


class A2PMemory(BaseMemory):
    """
    LangChain Memory class backed by a2p profiles.

    This memory class integrates with a2p to load user context
    and store conversation history alongside profile data.

    Example:
        ```python
        from a2p_langchain import A2PMemory
        from langchain_openai import ChatOpenAI
        from langchain.chains import ConversationChain

        # Create a2p-backed memory
        memory = A2PMemory(
            agent_did="did:a2p:agent:my-assistant",
            user_did="did:a2p:user:alice",
            default_scopes=["a2p:preferences", "a2p:professional"],
        )

        # Load user context
        await memory.load_user_context()

        # Use with LangChain
        llm = ChatOpenAI()
        chain = ConversationChain(llm=llm, memory=memory)
        ```
    """

    agent_did: str = Field(description="The agent's DID")
    user_did: str = Field(description="The user's DID")
    default_scopes: List[str] = Field(
        default=["a2p:preferences", "a2p:context"],
        description="Default scopes to request",
    )
    memory_key: str = Field(default="history", description="Key for chat history")
    user_context_key: str = Field(
        default="user_context", description="Key for user context"
    )

    # Internal state
    _client: Optional[A2PClient] = None
    _user_context: str = ""
    _chat_history: List[BaseMessage] = []
    _profile: Optional[Dict] = None

    class Config:
        arbitrary_types_allowed = True
        underscore_attrs_are_private = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._client = create_agent_client(self.agent_did)
        self._chat_history = []
        self._user_context = ""
        self._profile = None

    @property
    def memory_variables(self) -> List[str]:
        """Return memory variables."""
        return [self.memory_key, self.user_context_key]

    async def load_user_context(self, scopes: Optional[List[str]] = None) -> str:
        """
        Load user context from a2p profile.

        Args:
            scopes: Scopes to request (defaults to default_scopes)

        Returns:
            Formatted user context string
        """
        profile = await self._client.get_profile(
            user_did=self.user_did,
            scopes=scopes or self.default_scopes,
        )

        self._profile = profile
        self._user_context = self._format_context(profile)
        return self._user_context

    def _format_context(self, profile: Dict) -> str:
        """Format profile as context string for LLM."""
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
                parts.append(f"- Language: {prefs['language']}")

        # Memories
        memories = profile.get("memories", {})

        # Professional info
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
                parts.append("- Known facts:")
                for mem in approved[:5]:
                    parts.append(f"  • {mem['content']}")

        return "\n".join(parts) if parts else "No user context available."

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Load memory variables for chain."""
        return {
            self.memory_key: self._chat_history,
            self.user_context_key: self._user_context,
        }

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        """Save context from conversation."""
        input_key = list(inputs.keys())[0] if inputs else "input"
        output_key = list(outputs.keys())[0] if outputs else "output"

        self._chat_history.append(HumanMessage(content=inputs.get(input_key, "")))
        self._chat_history.append(AIMessage(content=outputs.get(output_key, "")))

    def clear(self) -> None:
        """Clear chat history."""
        self._chat_history = []

    async def propose_memory(
        self,
        content: str,
        category: Optional[str] = None,
        confidence: float = 0.7,
        context: Optional[str] = None,
    ) -> Dict:
        """
        Propose a new memory based on conversation.

        Args:
            content: Memory content
            category: Memory category (e.g., 'a2p:interests')
            confidence: Confidence score (0-1)
            context: Context about why this is proposed

        Returns:
            Proposal response
        """
        return await self._client.propose_memory(
            user_did=self.user_did,
            content=content,
            category=category,
            confidence=confidence,
            context=context or "Learned during LangChain conversation",
        )

    def get_user_context(self) -> str:
        """Get the loaded user context."""
        return self._user_context

    def get_profile(self) -> Optional[Dict]:
        """Get the loaded profile."""
        return self._profile


class A2PConversationMemory(A2PMemory):
    """
    Extended A2P Memory with automatic memory extraction.

    This class adds automatic extraction of potential memories
    from user messages based on patterns.
    """

    auto_extract: bool = Field(default=True, description="Auto-extract memories")

    _patterns = [
        (r"I work (?:as|at|for) (.+)", "a2p:professional"),
        (r"I(?:'m| am) a (.+)", "a2p:professional"),
        (r"I like (.+)", "a2p:interests"),
        (r"I prefer (.+)", "a2p:preferences"),
        (r"I(?:'m| am) interested in (.+)", "a2p:interests"),
        (r"I(?:'m| am) learning (.+)", "a2p:context.learning"),
        (r"I use (.+) for", "a2p:preferences.tools"),
    ]

    async def save_context_async(
        self, inputs: Dict[str, Any], outputs: Dict[str, str]
    ) -> None:
        """Save context and optionally extract memories."""
        self.save_context(inputs, outputs)

        if self.auto_extract:
            import re

            input_key = list(inputs.keys())[0] if inputs else "input"
            user_message = inputs.get(input_key, "")

            for pattern, category in self._patterns:
                match = re.search(pattern, user_message, re.IGNORECASE)
                if match:
                    await self.propose_memory(
                        content=user_message,
                        category=category,
                        confidence=0.7,
                    )
                    break


def create_a2p_memory(
    agent_did: str,
    user_did: str,
    default_scopes: Optional[List[str]] = None,
    auto_extract: bool = False,
) -> A2PMemory:
    """
    Create an a2p-backed memory for LangChain.

    Args:
        agent_did: The agent's DID
        user_did: The user's DID
        default_scopes: Default scopes to request
        auto_extract: Whether to auto-extract memories

    Returns:
        A2PMemory or A2PConversationMemory instance
    """
    if auto_extract:
        return A2PConversationMemory(
            agent_did=agent_did,
            user_did=user_did,
            default_scopes=default_scopes or ["a2p:preferences", "a2p:context"],
        )
    return A2PMemory(
        agent_did=agent_did,
        user_did=user_did,
        default_scopes=default_scopes or ["a2p:preferences", "a2p:context"],
    )


def format_context_for_prompt(context: str, prefix: str = "User Context:") -> str:
    """Format user context for inclusion in prompts."""
    if not context or context == "No user context available.":
        return ""
    return f"{prefix}\n{context}"


__all__ = [
    "A2PMemory",
    "A2PConversationMemory",
    "create_a2p_memory",
    "format_context_for_prompt",
]
