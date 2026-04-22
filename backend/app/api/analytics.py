from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.models import Conversation, Message, Prompt, User
from app.db.session import get_session
from app.schemas.analytics import (
    AnalyticsSummary,
    ChannelDistribution,
    DailyVolume,
    KPIs,
    PromptStats,
    RatingDistribution,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsSummary)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    org_id = current_user.org_id

    # --- KPIs ---
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    async def count_since(since: datetime) -> int:
        r = await session.execute(
            select(func.count(Conversation.id)).where(
                Conversation.org_id == org_id,
                Conversation.created_at >= since,
            )
        )
        return r.scalar_one()

    total_today = await count_since(today_start)
    total_week = await count_since(week_start)
    total_month = await count_since(month_start)

    # satisfaction rate (rating >= 4 / total rated)
    rated_result = await session.execute(
        select(func.count(Conversation.id)).where(
            Conversation.org_id == org_id,
            Conversation.rating.isnot(None),
        )
    )
    total_rated = rated_result.scalar_one()

    satisfied_result = await session.execute(
        select(func.count(Conversation.id)).where(
            Conversation.org_id == org_id,
            Conversation.rating >= 4,
        )
    )
    total_satisfied = satisfied_result.scalar_one()
    satisfaction_rate = (total_satisfied / total_rated * 100) if total_rated > 0 else 0.0

    # avg response time (ai messages only)
    avg_rt_result = await session.execute(
        select(func.avg(Message.response_time_ms)).where(
            Message.role == "ai",
            Message.response_time_ms.isnot(None),
            Message.conversation_id.in_(
                select(Conversation.id).where(Conversation.org_id == org_id)
            ),
        )
    )
    avg_response_time_ms = float(avg_rt_result.scalar_one() or 0)

    kpis = KPIs(
        total_today=total_today,
        total_week=total_week,
        total_month=total_month,
        satisfaction_rate=round(satisfaction_rate, 1),
        avg_response_time_ms=round(avg_response_time_ms, 1),
    )

    # --- Daily volume (last 30 days) ---
    daily_result = await session.execute(
        select(
            func.date(Conversation.created_at).label("day"),
            func.count(Conversation.id).label("cnt"),
        )
        .where(
            Conversation.org_id == org_id,
            Conversation.created_at >= month_start,
        )
        .group_by(func.date(Conversation.created_at))
        .order_by(func.date(Conversation.created_at))
    )
    daily_volume = [
        DailyVolume(date=str(row.day), count=row.cnt) for row in daily_result
    ]

    # --- Rating distribution ---
    rating_result = await session.execute(
        select(Conversation.rating, func.count(Conversation.id).label("cnt"))
        .where(
            Conversation.org_id == org_id,
            Conversation.rating.isnot(None),
        )
        .group_by(Conversation.rating)
        .order_by(Conversation.rating)
    )
    rows = rating_result.all()
    total_r = sum(r.cnt for r in rows) or 1
    rating_distribution = [
        RatingDistribution(
            rating=r.rating,
            count=r.cnt,
            percentage=round(r.cnt / total_r * 100, 1),
        )
        for r in rows
    ]

    # --- Channel distribution ---
    channel_result = await session.execute(
        select(Conversation.channel, func.count(Conversation.id).label("cnt"))
        .where(Conversation.org_id == org_id)
        .group_by(Conversation.channel)
    )
    ch_rows = channel_result.all()
    total_ch = sum(r.cnt for r in ch_rows) or 1
    channel_distribution = [
        ChannelDistribution(
            channel=r.channel,
            count=r.cnt,
            percentage=round(r.cnt / total_ch * 100, 1),
        )
        for r in ch_rows
    ]

    # --- Top 5 worst prompts ---
    # join conversations with their AI messages to get prompt_used and avg rating
    prompt_result = await session.execute(
        select(
            Message.prompt_used,
            func.avg(Conversation.rating).label("avg_rating"),
            func.count(Conversation.id.distinct()).label("conv_count"),
        )
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.org_id == org_id,
            Conversation.rating.isnot(None),
            Message.role == "ai",
            Message.prompt_used.isnot(None),
        )
        .group_by(Message.prompt_used)
        .order_by(func.avg(Conversation.rating))
        .limit(5)
    )

    # map prompt content to name via prompts table
    prompts_result = await session.execute(
        select(Prompt).where(Prompt.org_id == org_id)
    )
    prompt_map = {p.content: p.name for p in prompts_result.scalars()}

    worst_prompts = [
        PromptStats(
            prompt_name=prompt_map.get(row.prompt_used, row.prompt_used[:40] + "..."),
            avg_rating=round(float(row.avg_rating), 2),
            conversation_count=row.conv_count,
        )
        for row in prompt_result
    ]

    return AnalyticsSummary(
        kpis=kpis,
        daily_volume=daily_volume,
        rating_distribution=rating_distribution,
        channel_distribution=channel_distribution,
        worst_prompts=worst_prompts,
    )
