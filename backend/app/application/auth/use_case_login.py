from app.core.security import create_access_token, verify_password
from app.entities.user import User
from app.interfaces.user_repository import IUserRepository


class LoginUseCase:
    def __init__(self, user_repo: IUserRepository):
        self._user_repo = user_repo

    async def execute(self, email: str, password: str) -> tuple[User, str]:
        user = await self._user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        token = create_access_token(str(user.id), str(user.org_id), user.email)
        return user, token
