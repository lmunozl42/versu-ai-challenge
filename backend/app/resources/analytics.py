from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.infrastructure.session import get_session
from app.entities.user import User
from app.repositories.analytics_repository import SQLAnalyticsRepository
from app.schemas.analytics import AnalyticsSummary
from app.application.analytics.use_case_get_analytics_summary import GetAnalyticsSummaryUseCase

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsSummary)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await GetAnalyticsSummaryUseCase(SQLAnalyticsRepository(session)).execute(current_user.org_id)
