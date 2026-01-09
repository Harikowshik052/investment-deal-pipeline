from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Deal, User, Activity, UserRole, DealStage, DealStatus, Board, board_members
from app.schemas import DealCreate, DealUpdate, DealResponse, ActivityResponse
from app.auth import get_current_user

router = APIRouter(prefix="/deals", tags=["Deals"])


def get_user_board_role(user_id: int, board_id: int, db: Session) -> UserRole:
    """Get a user's role for a specific board"""
    stmt = db.query(board_members.c.role).filter(
        board_members.c.board_id == board_id,
        board_members.c.user_id == user_id
    ).first()
    return stmt[0] if stmt else None


@router.get("", response_model=List[DealResponse])
def list_deals(
    board_id: Optional[int] = Query(None, description="Filter deals by board ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all deals, optionally filtered by board"""
    query = db.query(Deal)
    
    if board_id:
        # Check if user has access to this board
        board = db.query(Board).filter(Board.id == board_id).first()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        has_access = (
            board.created_by == current_user.id or 
            current_user in board.members
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this board"
            )
        
        query = query.filter(Deal.board_id == board_id)
    else:
        # If no board_id specified, show deals from all accessible boards
        accessible_boards = db.query(Board).filter(
            (Board.created_by == current_user.id) | 
            (Board.members.any(User.id == current_user.id))
        ).all()
        
        board_ids = [board.id for board in accessible_boards]
        query = query.filter(Deal.board_id.in_(board_ids))
    
    deals = query.all()
    return deals


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    return deal


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_data: DealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new deal (Admin or Analyst board role required)"""
    # Check if user has access to the board
    board = db.query(Board).filter(Board.id == deal_data.board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check user's board role - only ADMIN or ANALYST can create deals
    user_board_role = get_user_board_role(current_user.id, deal_data.board_id, db)
    if user_board_role not in [UserRole.ADMIN, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins and analysts can create deals"
        )
    
    new_deal = Deal(
        name=deal_data.name,
        company_url=deal_data.company_url,
        owner_id=current_user.id,
        board_id=deal_data.board_id,
        stage=deal_data.stage,
        round=deal_data.round,
        check_size=deal_data.check_size,
        status=DealStatus.ACTIVE
    )
    
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)
    
    # Create activity
    activity = Activity(
        deal_id=new_deal.id,
        user_id=current_user.id,
        action="created",
        description=f"{current_user.full_name} created deal '{new_deal.name}'"
    )
    db.add(activity)
    db.commit()
    
    return new_deal


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: int,
    deal_data: DealUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a deal (Admin or Analyst board role required)"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check user's board role - only ADMIN or ANALYST can update deals
    user_board_role = get_user_board_role(current_user.id, deal.board_id, db)
    if user_board_role not in [UserRole.ADMIN, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins and analysts can update deals"
        )
    
    # Track stage change
    old_stage = deal.stage
    
    # Update fields
    if deal_data.name is not None:
        deal.name = deal_data.name
    if deal_data.company_url is not None:
        deal.company_url = deal_data.company_url
    if deal_data.stage is not None:
        deal.stage = deal_data.stage
    if deal_data.round is not None:
        deal.round = deal_data.round
    if deal_data.check_size is not None:
        deal.check_size = deal_data.check_size
    if deal_data.status is not None:
        deal.status = deal_data.status
    
    db.commit()
    db.refresh(deal)
    
    # Create activity if stage changed
    if deal_data.stage and deal_data.stage != old_stage:
        activity = Activity(
            deal_id=deal.id,
            user_id=current_user.id,
            action="stage_change",
            description=f"{current_user.full_name} moved '{deal.name}' from {old_stage.value} to {deal.stage.value}"
        )
        db.add(activity)
        db.commit()
    
    return deal


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a deal (Admin or Analyst board role required)"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check user's board role - only ADMIN or ANALYST can delete deals
    user_board_role = get_user_board_role(current_user.id, deal.board_id, db)
    if user_board_role not in [UserRole.ADMIN, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins and analysts can delete deals"
        )
    
    db.delete(deal)
    db.commit()
    
    return None


@router.get("/{deal_id}/activities", response_model=List[ActivityResponse])
def get_deal_activities(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all activities for a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    activities = db.query(Activity).filter(Activity.deal_id == deal_id).order_by(Activity.created_at.desc()).all()
    return activities
