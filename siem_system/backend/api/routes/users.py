from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from databases.psql import get_db
from services.users import (
    get_user_by_username,
    get_user_by_id,
    get_all_users,
    create_user,
    update_user,
    delete_user
)
from core.security import get_current_admin, hash_password, get_current_user, change_password
from models.users import User, UserCreate, UserUpdate, UserResponse, PasswordChangeRequest, PasswordUpdate

router = APIRouter(prefix="/users")


@router.get("", dependencies=[Depends(get_current_admin)])
async def read_users(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_field: str = Query(None),
    sort_direction: str = Query('asc', regex='^(asc|desc)$'),
    db: AsyncSession = Depends(get_db)
):
    users, total = await get_all_users(db, search, page, limit, sort_field, sort_direction)
    return {"data": users, "total": total}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    user = UserResponse.model_validate(current_user, from_attributes=True)
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
        user_data: UserUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    update_dict = user_data.dict(exclude_unset=True)

    if 'password' in update_dict:
        update_dict['password_hash'] = hash_password(update_dict.pop('password'))

    return await update_user(db, current_user.id, update_dict)


@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_current_admin)])
async def read_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("", response_model=UserResponse, dependencies=[Depends(get_current_admin)])
async def create_new_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    new_user = await create_user(
        db,
        username=user_data.username,
        password=user_data.password,
        role=user_data.role
    )
    return new_user


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_current_admin)])
async def update_existing_user(
    user_id: int,
    update_dict: dict,
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    print(update_dict)

    return await update_user(db, user_id, update_dict)


@router.delete("/{user_id}", dependencies=[Depends(get_current_admin)])
async def delete_existing_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted successfully"}


@router.post("/update-password")
async def update_password(
        payload: PasswordChangeRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    result = await change_password(payload, current_user, db)
    return {"message": result}


@router.put("/{user_id}/password", dependencies=[Depends(get_current_admin)])
async def admin_update_password(
        user_id: int,
        password_update: PasswordUpdate,
        db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {"password": password_update.new_password}
    updated_user = await update_user(db, user_id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Failed to update password")

    return {"message": "Password updated successfully"}
