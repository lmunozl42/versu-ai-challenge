from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models import Conversation, Message, Prompt
from app.interfaces.analytics_repository import IAnalyticsRepository
from app.schemas.analytics import (
    AnalyticsSummary,
    ChannelDistribution,
    DailyVolume,
    HourlyVolume,
    KPIs,
    PromptStats,
    RatingDistribution,
)


class SQLAnalyticsRepository(IAnalyticsRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def _satisfaction_rate(self, org_id: UUID, since: datetime, until: datetime) -> float:
        total_rated = (
            await self._session.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.org_id == org_id,
                    Conversation.rating.isnot(None),
                    Conversation.created_at >= since,
                    Conversation.created_at < until,
                )
            )
        ).scalar_one()
        if total_rated == 0:
            return 0.0
        satisfied = (
            await self._session.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.org_id == org_id,
                    Conversation.rating >= 4,
                    Conversation.created_at >= since,
                    Conversation.created_at < until,
                )
            )
        ).scalar_one()
        return round(satisfied / total_rated * 100, 1)

    async def _avg_response_time(self, org_id: UUID, since: datetime, until: datetime) -> float:
        result = await self._session.execute(
            select(func.avg(Message.response_time_ms)).where(
                Message.role == "ai",
                Message.response_time_ms.isnot(None),
                Message.conversation_id.in_(
                    select(Conversation.id).where(
                        Conversation.org_id == org_id,
                        Conversation.created_at >= since,
                        Conversation.created_at < until,
                    )
                ),
            )
        )
        return round(float(result.scalar_one() or 0), 1)

    async def get_summary(self, org_id: UUID) -> AnalyticsSummary:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        week_start = now - timedelta(days=7)
        prev_week_start = now - timedelta(days=14)
        month_start = now - timedelta(days=30)

        async def count_between(since: datetime, until: datetime) -> int:
            r = await self._session.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.org_id == org_id,
                    Conversation.created_at >= since,
                    Conversation.created_at < until,
                )
            )
            return r.scalar_one()

        async def count_since(since: datetime) -> int:
            r = await self._session.execute(
                select(func.count(Conversation.id)).where(
                    Conversation.org_id == org_id,
                    Conversation.created_at >= since,
                )
            )
            return r.scalar_one()

        kpis = KPIs(
            total_today=await count_since(today_start),
            total_yesterday=await count_between(yesterday_start, today_start),
            total_week=await count_since(week_start),
            total_month=await count_since(month_start),
            satisfaction_rate=await self._satisfaction_rate(org_id, week_start, now),
            avg_response_time_ms=await self._avg_response_time(org_id, week_start, now),
            prev_week_satisfaction_rate=await self._satisfaction_rate(org_id, prev_week_start, week_start),
            prev_week_avg_response_time_ms=await self._avg_response_time(org_id, prev_week_start, week_start),
        )

        daily_result = await self._session.execute(
            select(
                func.date(Conversation.created_at).label("day"),
                func.count(Conversation.id).label("cnt"),
            )
            .where(Conversation.org_id == org_id, Conversation.created_at >= month_start)
            .group_by(func.date(Conversation.created_at))
            .order_by(func.date(Conversation.created_at))
        )
        daily_volume = [DailyVolume(date=str(row.day), count=row.cnt) for row in daily_result]

        hourly_result = await self._session.execute(
            select(
                func.extract("hour", Conversation.created_at).label("hr"),
                func.count(Conversation.id).label("cnt"),
            )
            .where(Conversation.org_id == org_id, Conversation.created_at >= today_start)
            .group_by(func.extract("hour", Conversation.created_at))
            .order_by(func.extract("hour", Conversation.created_at))
        )
        hourly_volume = [HourlyVolume(hour=int(row.hr), count=row.cnt) for row in hourly_result]

        rating_result = await self._session.execute(
            select(Conversation.rating, func.count(Conversation.id).label("cnt"))
            .where(Conversation.org_id == org_id, Conversation.rating.isnot(None))
            .group_by(Conversation.rating)
            .order_by(Conversation.rating)
        )
        rows = rating_result.all()
        total_r = sum(r.cnt for r in rows) or 1
        rating_distribution = [
            RatingDistribution(rating=r.rating, count=r.cnt, percentage=round(r.cnt / total_r * 100, 1))
            for r in rows
        ]

        channel_result = await self._session.execute(
            select(Conversation.channel, func.count(Conversation.id).label("cnt"))
            .where(Conversation.org_id == org_id)
            .group_by(Conversation.channel)
        )
        ch_rows = channel_result.all()
        total_ch = sum(r.cnt for r in ch_rows) or 1
        channel_distribution = [
            ChannelDistribution(channel=r.channel, count=r.cnt, percentage=round(r.cnt / total_ch * 100, 1))
            for r in ch_rows
        ]

        prompt_result = await self._session.execute(
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
        prompts_map_result = await self._session.execute(
            select(Prompt).where(Prompt.org_id == org_id)
        )
        prompt_map = {p.content: p.name for p in prompts_map_result.scalars()}
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
            hourly_volume=hourly_volume,
            rating_distribution=rating_distribution,
            channel_distribution=channel_distribution,
            worst_prompts=worst_prompts,
        )
