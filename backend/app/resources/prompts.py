import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.infrastructure.session import get_session
from app.entities.user import User
from app.repositories.prompt_repository import SQLPromptRepository
from app.schemas.prompts import PromptOut, PromptCreate, PromptUpdate
from app.application.prompts.use_case_list_prompts import ListPromptsUseCase
from app.application.prompts.use_case_set_default_prompt import SetDefaultPromptUseCase
from app.application.prompts.use_case_create_prompt import CreatePromptUseCase
from app.application.prompts.use_case_update_prompt import UpdatePromptUseCase
from app.application.prompts.use_case_delete_prompt import DeletePromptUseCase

router = APIRouter(prefix="/prompts", tags=["prompts"])


def _repo(session: AsyncSession) -> SQLPromptRepository:
    return SQLPromptRepository(session)


@router.get("", response_model=list[PromptOut])
async def list_prompts(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prompts = await ListPromptsUseCase(_repo(session)).execute(current_user.org_id)
    return [PromptOut.model_validate(p) for p in prompts]


@router.post("", response_model=PromptOut, status_code=201)
async def create_prompt(
    body: PromptCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    prompt = await CreatePromptUseCase(_repo(session)).execute(current_user.org_id, body.name, body.content)
    return PromptOut.model_validate(prompt)


@router.patch("/{prompt_id}/set-default", response_model=PromptOut)
async def set_default_prompt(
    prompt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        prompt = await SetDefaultPromptUseCase(_repo(session)).execute(prompt_id, current_user.org_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return PromptOut.model_validate(prompt)


@router.put("/{prompt_id}", response_model=PromptOut)
async def update_prompt(
    prompt_id: uuid.UUID,
    body: PromptUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        prompt = await UpdatePromptUseCase(_repo(session)).execute(prompt_id, current_user.org_id, body.name, body.content)
    except ValueError:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return PromptOut.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(
    prompt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        await DeletePromptUseCase(_repo(session)).execute(prompt_id, current_user.org_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
