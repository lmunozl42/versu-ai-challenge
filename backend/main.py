from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.resources.analytics import router as analytics_router
from app.resources.auth import router as auth_router
from app.resources.conversations import router as conversations_router
from app.resources.prompts import router as prompts_router
from app.resources.ws import router as ws_router
from app.infrastructure.seed import run_seed
from app.infrastructure.session import AsyncSessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as session:
        await run_seed(session)
    yield


app = FastAPI(title="Versu AI Dashboard", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(prompts_router)
app.include_router(analytics_router)
app.include_router(ws_router)

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

@app.get("/health")
async def health():
    return {"status": "ok"}
