import uuid
from datetime import datetime, timedelta, timezone
from random import choice, randint

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Conversation, Message, Organization, Prompt, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PROMPTS = [
    {
        "name": "Asistente amigable y joven",
        "content": "Eres un asistente virtual joven, simpático y cercano. Usas lenguaje casual, emojis ocasionales y siempre tratas de animar al usuario. Respondes de forma breve y directa.",
        "is_default": True,
    },
    {
        "name": "Profesional formal y conciso",
        "content": "Eres un asistente virtual profesional y formal. Respondes con precisión, usas lenguaje corporativo y evitas cualquier expresión coloquial. Tus respuestas son directas y estructuradas.",
        "is_default": False,
    },
    {
        "name": "Gringo que habla español con dificultad",
        "content": "You are an assistant who speaks Spanish but it's not your native language. You make occasional grammar mistakes, mix in English words sometimes, and your phrasing is slightly awkward but endearing. Still try to be helpful.",
        "is_default": False,
    },
    {
        "name": "Experto técnico muy detallista",
        "content": "Eres un experto técnico extremadamente detallista. Cada respuesta incluye contexto técnico profundo, referencias a mejores prácticas y posibles casos borde. Prefieres la precisión a la brevedad.",
        "is_default": False,
    },
]

ORGS = [
    {"name": "Acme Corp", "slug": "acme", "email": "admin@acme.com", "password": "acme123", "user_name": "Admin Acme"},
    {"name": "Globex Inc", "slug": "globex", "email": "admin@globex.com", "password": "globex123", "user_name": "Admin Globex"},
]

CHANNELS = ["web", "whatsapp", "instagram"]
STATUSES = ["open", "closed"]


async def run_seed(session: AsyncSession) -> None:
    result = await session.execute(select(Organization).limit(1))
    if result.scalars().first():
        return  # already seeded

    now = datetime.now(timezone.utc)

    for org_data in ORGS:
        org = Organization(
            id=uuid.uuid4(),
            name=org_data["name"],
            slug=org_data["slug"],
            created_at=now,
        )
        session.add(org)
        await session.flush()

        user = User(
            id=uuid.uuid4(),
            email=org_data["email"],
            hashed_password=pwd_context.hash(org_data["password"]),
            name=org_data["user_name"],
            org_id=org.id,
            created_at=now,
        )
        session.add(user)

        for p in PROMPTS:
            session.add(Prompt(
                id=uuid.uuid4(),
                org_id=org.id,
                name=p["name"],
                content=p["content"],
                is_default=p["is_default"],
                is_active=True,
                created_at=now,
            ))

        # seed sample conversations (mix of channels, statuses, ratings)
        for i in range(20):
            channel = choice(CHANNELS)
            status = choice(STATUSES)
            created = now - timedelta(days=randint(0, 29), hours=randint(0, 23))
            conv = Conversation(
                id=uuid.uuid4(),
                org_id=org.id,
                status=status,
                channel=channel,
                rating=randint(1, 5) if status == "closed" else None,
                created_at=created,
                closed_at=created + timedelta(minutes=randint(2, 30)) if status == "closed" else None,
            )
            session.add(conv)
            await session.flush()

            # add a couple of messages per conversation
            user_msg = Message(
                id=uuid.uuid4(),
                conversation_id=conv.id,
                role="user",
                content="Hola, necesito ayuda con mi pedido.",
                created_at=created,
            )
            ai_msg = Message(
                id=uuid.uuid4(),
                conversation_id=conv.id,
                role="ai",
                content="¡Hola! Con gusto te ayudo. ¿Cuál es el número de tu pedido?",
                response_time_ms=randint(300, 2000),
                prompt_used=PROMPTS[0]["content"],
                created_at=created + timedelta(seconds=2),
            )
            session.add(user_msg)
            session.add(ai_msg)

    await session.commit()
