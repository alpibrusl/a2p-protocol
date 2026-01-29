"""
a2p + A2A Protocol Integration

Bridges user-owned profiles (a2p) with agent-to-agent communication (A2A).

Key Concept:
- A2A Protocol: How agents talk to each other
- a2p Protocol: What agents should know about the user

Together: Agents can communicate (A2A) while respecting user preferences (a2p)

Architecture:
    User ──[a2p]──▶ Agent A ──[A2A]──▶ Agent B
                      │                   │
                      └── Both agents respect user's a2p profile ──┘
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from a2p import (
    create_agent_client,
)


class A2AMessageType(str, Enum):
    """A2A Protocol message types."""

    TASK = "task"
    TASK_RESULT = "task_result"
    ARTIFACT = "artifact"
    STATUS = "status"
    ERROR = "error"


@dataclass
class A2PContext:
    """
    a2p user context that can be shared via A2A.

    This is the bridge between protocols:
    - Loaded from user's a2p profile
    - Attached to A2A messages
    - Respected by receiving agents
    """

    user_did: str
    preferences: Dict[str, Any]
    constraints: Dict[str, Any]
    context_summary: str
    scopes_granted: List[str]

    def to_a2a_metadata(self) -> Dict[str, Any]:
        """Convert to A2A metadata format."""
        return {
            "a2p_context": {
                "version": "1.0",
                "user_did": self.user_did,
                "preferences": self.preferences,
                "constraints": self.constraints,
                "summary": self.context_summary,
                "scopes": self.scopes_granted,
            }
        }

    @classmethod
    def from_a2a_metadata(cls, metadata: Dict[str, Any]) -> Optional["A2PContext"]:
        """Extract a2p context from A2A metadata."""
        a2p_data = metadata.get("a2p_context")
        if not a2p_data:
            return None

        return cls(
            user_did=a2p_data.get("user_did", ""),
            preferences=a2p_data.get("preferences", {}),
            constraints=a2p_data.get("constraints", {}),
            context_summary=a2p_data.get("summary", ""),
            scopes_granted=a2p_data.get("scopes", []),
        )


@dataclass
class A2AMessage:
    """
    A2A Protocol message with a2p context.

    This extends standard A2A messages to carry user preferences,
    enabling personalized agent-to-agent interactions.
    """

    type: A2AMessageType
    sender_agent: str
    content: Dict[str, Any]
    a2p_context: Optional[A2PContext] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize for A2A transport."""
        result = {
            "type": self.type.value,
            "sender": self.sender_agent,
            "content": self.content,
            "metadata": self.metadata.copy(),
        }

        # Attach a2p context to metadata
        if self.a2p_context:
            if isinstance(result["metadata"], dict):
                result["metadata"].update(self.a2p_context.to_a2a_metadata())

        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "A2AMessage":
        """Deserialize from A2A transport."""
        metadata = data.get("metadata", {})
        a2p_context = A2PContext.from_a2a_metadata(metadata)

        return cls(
            type=A2AMessageType(data["type"]),
            sender_agent=data["sender"],
            content=data["content"],
            a2p_context=a2p_context,
            metadata=metadata,
        )


class A2PA2AAdapter:
    """
    Adapter for integrating a2p with A2A Protocol.

    This enables:
    1. Loading user context from a2p profiles
    2. Attaching context to outgoing A2A messages
    3. Extracting context from incoming A2A messages
    4. Ensuring agents respect user preferences

    Example:
        ```python
        from a2p_a2a import A2PA2AAdapter, A2AMessage, A2AMessageType

        # Create adapter
        adapter = A2PA2AAdapter(
            agent_did="did:a2p:agent:my-agent",
            agent_name="ResearchAgent",
        )

        # Load user context
        context = await adapter.load_user_context("did:a2p:user:alice")

        # Create A2A message with a2p context
        message = adapter.create_message(
            type=A2AMessageType.TASK,
            content={"task": "research quantum computing"},
            a2p_context=context,
        )

        # Send via A2A (the receiving agent will see user preferences)
        await send_a2a_message(target_agent, message)
        ```
    """

    def __init__(
        self,
        agent_did: str,
        agent_name: str,
        private_key: Optional[str] = None,
        default_scopes: Optional[List[str]] = None,
        storage: Optional[Any] = None,
    ):
        """
        Initialize the adapter.

        Args:
            agent_did: The agent's DID
            agent_name: Human-readable agent name
            private_key: Optional private key
            default_scopes: Default scopes to request
            storage: Optional storage backend
        """
        self.agent_did = agent_did
        self.agent_name = agent_name
        self.client = create_agent_client(agent_did, private_key, storage)
        self.default_scopes = default_scopes or [
            "a2p:preferences",
            "a2p:constraints",
            "a2p:context",
        ]
        self._loaded_contexts: Dict[str, A2PContext] = {}

    async def load_user_context(
        self,
        user_did: str,
        scopes: Optional[List[str]] = None,
    ) -> A2PContext:
        """
        Load user context from a2p profile for A2A sharing.

        Args:
            user_did: The user's DID
            scopes: Scopes to request

        Returns:
            A2PContext that can be attached to A2A messages
        """
        requested_scopes = scopes or self.default_scopes

        profile = await self.client.get_profile(
            user_did=user_did,
            scopes=requested_scopes,
        )

        context = self._profile_to_context(user_did, profile, requested_scopes)
        self._loaded_contexts[user_did] = context

        return context

    def _profile_to_context(
        self,
        user_did: str,
        profile: Dict,
        scopes: List[str],
    ) -> A2PContext:
        """Convert profile to A2PContext."""
        common = profile.get("common", {})
        prefs = common.get("preferences", {})

        # Extract constraints (things the user requires/forbids)
        constraints = {}

        # Privacy constraints
        consent = profile.get("consent", {})
        if consent.get("dataSharingRestrictions"):
            constraints["data_sharing"] = consent["dataSharingRestrictions"]

        # Accessibility constraints
        accessibility = common.get("accessibility", {})
        if accessibility:
            constraints["accessibility"] = accessibility

        # Content constraints
        content_prefs = prefs.get("content", {})
        if content_prefs:
            constraints["content"] = content_prefs

        # Build summary
        summary = self._build_context_summary(prefs, profile.get("memories", {}))

        return A2PContext(
            user_did=user_did,
            preferences=prefs,
            constraints=constraints,
            context_summary=summary,
            scopes_granted=scopes,
        )

    def _build_context_summary(
        self,
        prefs: Dict,
        memories: Dict,
    ) -> str:
        """Build human-readable context summary."""
        parts = []

        # Communication preferences
        comm = prefs.get("communication", {})
        if comm.get("style"):
            parts.append(f"Communication: {comm['style']}")
        if comm.get("language"):
            parts.append(f"Language: {comm['language']}")

        # Professional context
        prof = memories.get("a2p:professional", {})
        if prof.get("occupation"):
            parts.append(f"Role: {prof['occupation']}")
        if prof.get("expertise_level"):
            parts.append(f"Level: {prof['expertise_level']}")

        return " | ".join(parts) if parts else "Standard preferences"

    def create_message(
        self,
        type: A2AMessageType,
        content: Dict[str, Any],
        a2p_context: Optional[A2PContext] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> A2AMessage:
        """
        Create an A2A message with a2p context.

        Args:
            type: Message type
            content: Message content
            a2p_context: User context to attach
            metadata: Additional metadata

        Returns:
            A2AMessage ready for transport
        """
        return A2AMessage(
            type=type,
            sender_agent=self.agent_name,
            content=content,
            a2p_context=a2p_context,
            metadata=metadata or {},
        )

    def create_task_message(
        self,
        task: str,
        a2p_context: A2PContext,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> A2AMessage:
        """Create a task message with user context."""
        return self.create_message(
            type=A2AMessageType.TASK,
            content={
                "task": task,
                "parameters": parameters or {},
            },
            a2p_context=a2p_context,
        )

    def create_result_message(
        self,
        result: Any,
        original_task: str,
        a2p_context: Optional[A2PContext] = None,
    ) -> A2AMessage:
        """Create a task result message."""
        return self.create_message(
            type=A2AMessageType.TASK_RESULT,
            content={
                "task": original_task,
                "result": result,
            },
            a2p_context=a2p_context,
        )

    def extract_context(self, message: A2AMessage) -> Optional[A2PContext]:
        """Extract a2p context from incoming A2A message."""
        return message.a2p_context

    def should_respect_preference(
        self,
        context: A2PContext,
        preference_key: str,
    ) -> Optional[Any]:
        """
        Check if a preference should be respected.

        Args:
            context: The a2p context
            preference_key: Dot-notation key (e.g., 'communication.style')

        Returns:
            Preference value if set, None otherwise
        """
        keys = preference_key.split(".")
        value = context.preferences

        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return None

        return value

    def check_constraint(
        self,
        context: A2PContext,
        constraint_key: str,
    ) -> Optional[Any]:
        """
        Check a constraint from user context.

        Args:
            context: The a2p context
            constraint_key: Constraint key

        Returns:
            Constraint value if set
        """
        return context.constraints.get(constraint_key)

    def get_cached_context(self, user_did: str) -> Optional[A2PContext]:
        """Get cached context for a user."""
        return self._loaded_contexts.get(user_did)


class A2AAgentWithA2P:
    """
    Base class for A2A agents that respect a2p profiles.

    Extend this class to create agents that:
    1. Receive tasks via A2A
    2. Extract and respect user preferences from a2p context
    3. Return results personalized to the user

    Example:
        ```python
        class ResearchAgent(A2AAgentWithA2P):
            async def handle_task(self, task: str, context: A2PContext):
                # Access user preferences
                style = context.preferences.get("communication", {}).get("style")

                # Do research respecting preferences
                result = await self.research(task, style=style)

                return result
        ```
    """

    def __init__(
        self,
        agent_did: str,
        agent_name: str,
    ):
        self.adapter = A2PA2AAdapter(
            agent_did=agent_did,
            agent_name=agent_name,
        )

    async def receive_message(self, raw_message: Dict[str, Any]) -> A2AMessage:
        """Parse incoming A2A message."""
        return A2AMessage.from_dict(raw_message)

    async def process_message(self, message: A2AMessage) -> Optional[A2AMessage]:
        """
        Process an incoming A2A message.

        Override this in subclasses for custom handling.
        """
        if message.type == A2AMessageType.TASK:
            task = message.content.get("task", "")
            context = message.a2p_context

            # Handle task with user context
            result = await self.handle_task(task, context)

            # Return result with context preserved
            return self.adapter.create_result_message(
                result=result,
                original_task=task,
                a2p_context=context,
            )

        return None

    async def handle_task(
        self,
        task: str,
        context: Optional[A2PContext],
    ) -> Any:
        """
        Handle a task with a2p context.

        Override this in subclasses.
        """
        raise NotImplementedError("Subclasses must implement handle_task")


def create_a2a_adapter(
    agent_did: str,
    agent_name: str,
    default_scopes: Optional[List[str]] = None,
) -> A2PA2AAdapter:
    """Create an a2p adapter for A2A Protocol."""
    return A2PA2AAdapter(
        agent_did=agent_did,
        agent_name=agent_name,
        default_scopes=default_scopes,
    )


__all__ = [
    "A2PA2AAdapter",
    "A2PContext",
    "A2AMessage",
    "A2AMessageType",
    "A2AAgentWithA2P",
    "create_a2a_adapter",
]
