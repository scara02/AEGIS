from typing import Tuple, List
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.users import User
import re


async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_all_users(
        db: AsyncSession,
        search: str = None,
        page: int = 1,
        limit: int = 10,
        sort_field: str = None,
        sort_direction: str = 'asc'
) -> Tuple[List[User], int]:
    query = select(User)
    if search:
        search = search.lower()
        query = query.where(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )

    if sort_field:
        if sort_field in ['id', 'username', 'role', 'full_name', 'email', 'avatar_type', 'avatar', 'avatar_color', 'initials']:
            column = getattr(User, sort_field)
            query = query.order_by(column.asc() if sort_direction == 'asc' else column.desc())

    count_query = select(func.count()).select_from(User)
    if search:
        count_query = count_query.where(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )

    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    users = result.scalars().all()
    total = count_result.scalar()

    return users, total


async def create_user(db: AsyncSession, username: str, password: str, role: str = "user"):
    from core.security import hash_password
    hashed_pw = hash_password(password)
    initials = generate_initials(username)
    user = User(username=username, password_hash=hashed_pw, role=role, initials=initials)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user_id: int, update_data: dict):
    user = await get_user_by_id(db, user_id)
    if user:
        for key, value in update_data.items():
            setattr(user, key, value)
        await db.commit()
        await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: int):
    user = await get_user_by_id(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()
    return user


def generate_initials(username: str) -> str:
    clean_username = re.sub(r'^[^A-Za-z]+', '', username)
    parts = re.split(r'[._-]', clean_username)

    initials = []
    if parts:
        first_part = parts[0]
        if first_part:
            initials.append(first_part[0].upper())

    if len(parts) > 1 and parts[1]:
        initials.append(parts[1][0].upper())

    if not initials:
        for char in clean_username:
            if char.isalpha():
                initials.append(char.upper())
                if len(initials) == 2:
                    break

    if not initials:
        return 'U'

    return ''.join(initials[:2])


async def update_user(db: AsyncSession, user_id: int, update_data: dict):
    from core.security import hash_password
    user = await get_user_by_id(db, user_id)
    if user:
        if 'password' in update_data:
            update_data['password_hash'] = hash_password(update_data.pop('password'))
        for key, value in update_data.items():
            setattr(user, key, value)
        await db.commit()
        await db.refresh(user)
    return user
