from abc import ABC, abstractmethod
from uuid import UUID

from app.schemas.analytics import AnalyticsSummary


class IAnalyticsRepository(ABC):
    @abstractmethod
    async def get_summary(self, org_id: UUID) -> AnalyticsSummary: ...
