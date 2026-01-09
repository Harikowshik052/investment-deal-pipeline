from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, DealStage, DealStatus


# Board Schemas
class BoardBase(BaseModel):
    name: str
    description: Optional[str] = None


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class BoardMemberResponse(BaseModel):
    id: int
    email: str
    full_name: str
    board_role: Optional[UserRole] = None  # User's role in this specific board
    
    model_config = {"from_attributes": True}
    
    @model_validator(mode='before')
    @classmethod
    def extract_board_role(cls, data):
        # If data is a SQLAlchemy model object
        if hasattr(data, '__dict__'):
            # Get the board_role attribute that was dynamically set
            board_role = getattr(data, 'board_role', None)
            return {
                'id': data.id,
                'email': data.email,
                'full_name': data.full_name,
                'board_role': board_role
            }
        return data


class BoardResponse(BoardBase):
    id: int
    created_by: int
    is_default: bool
    created_at: datetime
    updated_at: datetime
    members: List[BoardMemberResponse] = []
    
    model_config = {"from_attributes": True}


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: UserRole = UserRole.ANALYST


# Deal Schemas
class DealBase(BaseModel):
    name: str
    company_url: Optional[str] = None
    stage: DealStage = DealStage.SOURCED
    board_id: int
    round: Optional[str] = None
    check_size: Optional[float] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    name: Optional[str] = None
    company_url: Optional[str] = None
    stage: Optional[DealStage] = None
    round: Optional[str] = None
    check_size: Optional[float] = None
    status: Optional[DealStatus] = None


class DealResponse(DealBase):
    id: int
    owner_id: int
    status: DealStatus
    created_at: datetime
    updated_at: datetime
    owner: UserResponse
    
    class Config:
        from_attributes = True


# Activity Schemas
class ActivityResponse(BaseModel):
    id: int
    deal_id: int
    user_id: int
    action: str
    description: Optional[str] = None
    created_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True


# IC Memo Schemas
class MemoVersionResponse(BaseModel):
    id: int
    version: int
    summary: str
    market: str
    product: str
    traction: str
    risks: str
    open_questions: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class MemoUpdate(BaseModel):
    summary: Optional[str] = None
    market: Optional[str] = None
    product: Optional[str] = None
    traction: Optional[str] = None
    risks: Optional[str] = None
    open_questions: Optional[str] = None


class ICMemoResponse(BaseModel):
    id: int
    deal_id: int
    current_version: int
    created_at: datetime
    updated_at: datetime
    versions: List[MemoVersionResponse]
    
    class Config:
        from_attributes = True


# Comment Schemas
class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    deal_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True


# Vote Schemas
class VoteCreate(BaseModel):
    vote: str = Field(..., pattern="^(approve|decline)$")
    comment: Optional[str] = None


class VoteResponse(BaseModel):
    id: int
    deal_id: int
    user_id: int
    vote: str
    comment: Optional[str] = None
    created_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True
