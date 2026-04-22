import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.models import Prompt, User
from app.db.session import get_session
from app.schemas.prompts import PromptOut

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptOut])
async def list_prompts(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Prompt)
        .where(Prompt.org_id == current_user.org_id, Prompt.is_active == True)
        .order_by(Prompt.created_at)
    )
    return result.scalars().all()


@router.patch("/{prompt_id}/set-default", response_model=PromptOut)
async def set_default_prompt(
    prompt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Prompt).where(
            Prompt.org_id == current_user.org_id,
            Prompt.is_active == True,
        )
    )
    prompts = result.scalars().all()

    target = next((p for p in prompts if p.id == prompt_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Prompt not found")

    for p in prompts:
        p.is_default = p.id == prompt_id

    await session.commit()
    await session.refresh(target)
    return target
