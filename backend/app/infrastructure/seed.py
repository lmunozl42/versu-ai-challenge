import uuid
from datetime import datetime, timedelta, timezone
from random import choice, randint, uniform

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models import Conversation, Message, Organization, Prompt, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ORGS = [
    {
        "name": "Acme Corp",
        "slug": "acme",
        "users": [
            {"email": "admin@acme.com", "password": "acme123", "name": "Ana García", "role": "Administrador", "puesto": "Customer Success Manager"},
            {"email": "soporte@acme.com", "password": "acme123", "name": "Carlos Ruiz", "role": "Agente", "puesto": "Agente de Soporte"},
            {"email": "analista@acme.com", "password": "acme123", "name": "María Torres", "role": "Analista", "puesto": "Analista de Datos"},
        ],
    },
    {
        "name": "Globex Inc",
        "slug": "globex",
        "users": [
            {"email": "admin@globex.com", "password": "globex123", "name": "Pedro Soto", "role": "Administrador", "puesto": "Head of Customer Experience"},
            {"email": "agente@globex.com", "password": "globex123", "name": "Lucía Mora", "role": "Agente", "puesto": "Especialista en Atención al Cliente"},
        ],
    },
]

PROMPTS = [
    {
        "name": "Asistente Amigable",
        "content": "Eres un asistente virtual amigable y empático. Respondes de forma cálida y accesible, usando un tono conversacional. Siempre buscas entender las necesidades del usuario antes de responder.",
        "is_default": True,
    },
    {
        "name": "Asistente Formal",
        "content": "Eres un asistente virtual profesional y formal. Utilizas un lenguaje preciso y estructurado. Tus respuestas son concisas, bien organizadas y orientadas a la resolución eficiente de problemas.",
        "is_default": False,
    },
    {
        "name": "El Gringo",
        "content": "You are a bilingual assistant who mixes English and Spanish naturally (Spanglish). You're casual, fun, and use expressions from both cultures. Keep it real and relatable, bro. Sometimes you say things like 'órale', 'no way', 'qué padre', etc.",
        "is_default": False,
    },
    {
        "name": "Experto Técnico",
        "content": "Eres un experto técnico especializado en tecnología y desarrollo de software. Proporcionas respuestas detalladas y precisas, con ejemplos de código cuando es relevante. Usas terminología técnica apropiada pero explicas conceptos complejos de forma clara.",
        "is_default": False,
    },
]

CHANNELS = ["web", "whatsapp", "instagram"]
STATUSES = ["open", "closed"]

USER_MESSAGES = [
    "Hola, necesito ayuda con mi cuenta.",
    "¿Cuáles son los horarios de atención?",
    "Tengo un problema con mi pedido.",
    "¿Cómo puedo actualizar mis datos?",
    "Quiero cancelar mi suscripción.",
    "¿Ofrecen descuentos para empresas?",
    "Necesito una factura de mi compra.",
    "¿Cuánto tarda el envío?",
    "No puedo acceder a mi cuenta.",
    "¿Tienen soporte en inglés?",
]

AI_MESSAGES = [
    "¡Hola! Con gusto te ayudo. ¿Podrías darme más detalles sobre tu consulta?",
    "Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 hrs.",
    "Entiendo tu situación. Por favor comparte el número de pedido para revisarlo.",
    "Puedes actualizar tus datos desde la sección 'Mi perfil' en el panel de usuario.",
    "Para cancelar tu suscripción, ve a Configuración > Suscripción > Cancelar.",
    "Sí, tenemos planes especiales para empresas. Te envío los detalles por correo.",
    "Generamos tu factura automáticamente. Revisa tu correo electrónico registrado.",
    "Los envíos normales tardan entre 3 y 5 días hábiles.",
    "Revisemos tu cuenta. ¿Puedes intentar restablecer tu contraseña?",
    "Yes! We also have support in English. How can I help you?",
]


async def run_seed(session: AsyncSession) -> None:
    now = datetime.now(timezone.utc)

    for org_data in ORGS:
        result = await session.execute(select(Organization).where(Organization.slug == org_data["slug"]))
        org = result.scalars().first()

        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name=org_data["name"],
                slug=org_data["slug"],
                created_at=now,
            )
            session.add(org)
            await session.flush()

        for u in org_data["users"]:
            result = await session.execute(select(User).where(User.email == u["email"]))
            existing_user = result.scalars().first()

            if existing_user:
                existing_user.role = u["role"]
                existing_user.puesto = u["puesto"]
            else:
                session.add(User(
                    id=uuid.uuid4(),
                    email=u["email"],
                    hashed_password=pwd_context.hash(u["password"]),
                    name=u["name"],
                    role=u["role"],
                    puesto=u["puesto"],
                    org_id=org.id,
                    created_at=now,
                ))

        for prompt_data in PROMPTS:
            session.add(
                Prompt(
                    id=uuid.uuid4(),
                    org_id=org.id,
                    name=prompt_data["name"],
                    content=prompt_data["content"],
                    is_default=prompt_data["is_default"],
                    is_active=True,
                    created_at=now,
                )
            )

        for i in range(20):
            created_at = now - timedelta(days=randint(0, 29), hours=randint(0, 23))
            status = choice(STATUSES)
            rating = randint(1, 5) if status == "closed" else None
            closed_at = created_at + timedelta(minutes=randint(5, 60)) if status == "closed" else None

            conv = Conversation(
                id=uuid.uuid4(),
                org_id=org.id,
                status=status,
                channel=choice(CHANNELS),
                rating=rating,
                closed_at=closed_at,
                created_at=created_at,
            )
            session.add(conv)
            await session.flush()

            prompt_content = choice(PROMPTS)["content"]
            msg_time = created_at
            for j in range(randint(2, 6)):
                idx = (i + j) % len(USER_MESSAGES)
                msg_time += timedelta(seconds=randint(10, 120))
                session.add(
                    Message(
                        id=uuid.uuid4(),
                        conversation_id=conv.id,
                        role="user",
                        content=USER_MESSAGES[idx],
                        created_at=msg_time,
                    )
                )
                msg_time += timedelta(seconds=randint(1, 10))
                session.add(
                    Message(
                        id=uuid.uuid4(),
                        conversation_id=conv.id,
                        role="ai",
                        content=AI_MESSAGES[idx],
                        response_time_ms=int(uniform(300, 3000)),
                        prompt_used=prompt_content,
                        created_at=msg_time,
                    )
                )

    await session.commit()
