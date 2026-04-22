from pydantic import BaseModel


class KPIs(BaseModel):
    total_today: int
    total_week: int
    total_month: int
    satisfaction_rate: float  # % rating >= 4
    avg_response_time_ms: float


class DailyVolume(BaseModel):
    date: str
    count: int


class RatingDistribution(BaseModel):
    rating: int
    count: int
    percentage: float


class ChannelDistribution(BaseModel):
    channel: str
    count: int
    percentage: float


class PromptStats(BaseModel):
    prompt_name: str
    avg_rating: float
    conversation_count: int


class AnalyticsSummary(BaseModel):
    kpis: KPIs
    daily_volume: list[DailyVolume]
    rating_distribution: list[RatingDistribution]
    channel_distribution: list[ChannelDistribution]
    worst_prompts: list[PromptStats]
