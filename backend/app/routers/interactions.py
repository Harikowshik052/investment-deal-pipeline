from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Deal, Comment, Vote, User, Activity, UserRole, board_members
from app.schemas import CommentCreate, CommentResponse, VoteCreate, VoteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/deals", tags=["Comments & Votes"])


def get_user_board_role(user_id: int, board_id: int, db: Session) -> UserRole:
    """Get a user's role for a specific board"""
    stmt = db.query(board_members.c.role).filter(
        board_members.c.board_id == board_id,
        board_members.c.user_id == user_id
    ).first()
    return stmt[0] if stmt else None


# Comments
@router.post("/{deal_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    deal_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a comment on a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    new_comment = Comment(
        deal_id=deal_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Create activity
    activity = Activity(
        deal_id=deal_id,
        user_id=current_user.id,
        action="commented",
        description=f"{current_user.full_name} commented on '{deal.name}'"
    )
    db.add(activity)
    db.commit()
    
    return new_comment


@router.get("/{deal_id}/comments", response_model=List[CommentResponse])
def get_comments(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all comments for a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    comments = db.query(Comment).filter(
        Comment.deal_id == deal_id
    ).order_by(Comment.created_at.desc()).all()
    
    return comments


# Votes
@router.post("/{deal_id}/votes", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
def create_vote(
    deal_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a vote (Admin or Partner board role can vote)"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check user's board role - ADMIN and PARTNER can vote
    user_board_role = get_user_board_role(current_user.id, deal.board_id, db)
    if user_board_role not in [UserRole.PARTNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins and partners can vote"
        )
    
    # Check if user already voted
    existing_vote = db.query(Vote).filter(
        Vote.deal_id == deal_id,
        Vote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update existing vote
        existing_vote.vote = vote_data.vote
        existing_vote.comment = vote_data.comment
        db.commit()
        db.refresh(existing_vote)
        vote = existing_vote
    else:
        # Create new vote
        vote = Vote(
            deal_id=deal_id,
            user_id=current_user.id,
            vote=vote_data.vote,
            comment=vote_data.comment
        )
        db.add(vote)
        db.commit()
        db.refresh(vote)
    
    # Create activity
    activity = Activity(
        deal_id=deal_id,
        user_id=current_user.id,
        action="voted",
        description=f"{current_user.full_name} voted to {vote_data.vote} '{deal.name}'"
    )
    db.add(activity)
    db.commit()
    
    return vote


@router.get("/{deal_id}/votes", response_model=List[VoteResponse])
def get_votes(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all votes for a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    votes = db.query(Vote).filter(Vote.deal_id == deal_id).all()
    
    return votes
