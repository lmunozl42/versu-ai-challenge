from uuid import UUID

from app.interfaces.analytics_repository import IAnalyticsRepository
from app.schemas.analytics import AnalyticsSummary


class GetAnalyticsSummaryUseCase:
    def __init__(self, repo: IAnalyticsRepository):
        self._repo = repo

    async def execute(self, org_id: UUID) -> AnalyticsSummary:
        return await self._repo.get_summary(org_id)
