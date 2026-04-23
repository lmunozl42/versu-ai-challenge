from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.infrastructure.session import get_session
from app.entities.user import User
from app.repositories.user_repository import SQLUserRepository
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.application.auth.use_case_login import LoginUseCase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    use_case = LoginUseCase(SQLUserRepository(session))
    try:
        _, token = await use_case.execute(body.email, body.password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
