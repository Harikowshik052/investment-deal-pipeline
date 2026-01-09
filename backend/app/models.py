from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Numeric, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
import random


def generate_random_id():
    """Generate a random 8-digit number for IDs"""
    return random.randint(10000000, 99999999)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    PARTNER = "PARTNER"


class DealStage(str, enum.Enum):
    SOURCED = "Sourced"
    SCREEN = "Screen"
    DILIGENCE = "Diligence"
    IC = "IC"
    INVESTED = "Invested"
    PASSED = "Passed"


class DealStatus(str, enum.Enum):
    ACTIVE = "active"
    APPROVED = "approved"
    DECLINED = "declined"


# Association table for board members (many-to-many relationship)
board_members = Table(
    'board_members',
    Base.metadata,
    Column('board_id', Integer, ForeignKey('boards.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role', Enum(UserRole), nullable=True),  # Board-specific role
    Column('joined_at', DateTime(timezone=True), server_default=func.now())
)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=True)  # Deprecated: use board roles instead
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owned_deals = relationship("Deal", back_populates="owner", foreign_keys="Deal.owner_id")
    activities = relationship("Activity", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    votes = relationship("Vote", back_populates="user")
    created_boards = relationship("Board", back_populates="creator", foreign_keys="Board.created_by")
    boards = relationship("Board", secondary=board_members, back_populates="members")


class Board(Base):
    __tablename__ = "boards"
    
    id = Column(Integer, primary_key=True, index=True, default=generate_random_id)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_boards", foreign_keys=[created_by])
    members = relationship("User", secondary=board_members, back_populates="boards")
    deals = relationship("Deal", back_populates="board", cascade="all, delete-orphan")



class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(Integer, primary_key=True, index=True, default=generate_random_id)
    name = Column(String, nullable=False)
    company_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    stage = Column(Enum(DealStage), nullable=False, default=DealStage.SOURCED)
    round = Column(String)  # e.g., "Seed", "Series A"
    check_size = Column(Numeric(15, 2))  # Investment amount
    status = Column(Enum(DealStatus), nullable=False, default=DealStatus.ACTIVE)
    color = Column(String, default="#3B82F6")  # Hex color for card (default blue)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_deals", foreign_keys=[owner_id])
    board = relationship("Board", back_populates="deals")
    activities = relationship("Activity", back_populates="deal", cascade="all, delete-orphan")
    ic_memo = relationship("ICMemo", back_populates="deal", uselist=False, cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="deal", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="deal", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "moved from Screen to Diligence"
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="activities")
    user = relationship("User", back_populates="activities")


class ICMemo(Base):
    __tablename__ = "ic_memos"
    
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False, unique=True)
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="ic_memo")
    versions = relationship("MemoVersion", back_populates="memo", cascade="all, delete-orphan", order_by="desc(MemoVersion.version)")


class MemoVersion(Base):
    __tablename__ = "memo_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    memo_id = Column(Integer, ForeignKey("ic_memos.id"), nullable=False)
    version = Column(Integer, nullable=False)
    
    # Fixed sections
    summary = Column(Text, default="")
    market = Column(Text, default="")
    product = Column(Text, default="")
    traction = Column(Text, default="")
    risks = Column(Text, default="")
    open_questions = Column(Text, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    memo = relationship("ICMemo", back_populates="versions")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote = Column(String, nullable=False)  # "approve" or "decline"
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="votes")
    user = relationship("User", back_populates="votes")
