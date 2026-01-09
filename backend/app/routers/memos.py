from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Deal, ICMemo, MemoVersion, User, Activity, UserRole, board_members
from app.schemas import ICMemoResponse, MemoUpdate, MemoVersionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/memos", tags=["IC Memos"])


def get_user_board_role(user_id: int, board_id: int, db: Session) -> UserRole:
    """Get a user's role for a specific board"""
    stmt = db.query(board_members.c.role).filter(
        board_members.c.board_id == board_id,
        board_members.c.user_id == user_id
    ).first()
    return stmt[0] if stmt else None


@router.get("/deal/{deal_id}", response_model=ICMemoResponse)
def get_memo(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get IC memo for a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    memo = db.query(ICMemo).filter(ICMemo.deal_id == deal_id).first()
    
    # Create memo if it doesn't exist
    if not memo:
        memo = ICMemo(deal_id=deal_id, current_version=1)
        db.add(memo)
        db.commit()
        db.refresh(memo)
        
        # Create initial version
        version = MemoVersion(
            memo_id=memo.id,
            version=1,
            summary="",
            market="",
            product="",
            traction="",
            risks="",
            open_questions=""
        )
        db.add(version)
        db.commit()
        db.refresh(memo)
    
    return memo


@router.put("/deal/{deal_id}", response_model=ICMemoResponse)
def update_memo(
    deal_id: int,
    memo_data: MemoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update IC memo - creates a new version (Admin or Analyst board role required)"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check user's board role - only ADMIN or ANALYST can update memos
    user_board_role = get_user_board_role(current_user.id, deal.board_id, db)
    if user_board_role not in [UserRole.ADMIN, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins and analysts can update IC memos"
        )
    
    memo = db.query(ICMemo).filter(ICMemo.deal_id == deal_id).first()
    
    # Create memo if it doesn't exist
    if not memo:
        memo = ICMemo(deal_id=deal_id, current_version=0)
        db.add(memo)
        db.commit()
        db.refresh(memo)
    
    # Get current version data
    current_version = db.query(MemoVersion).filter(
        MemoVersion.memo_id == memo.id,
        MemoVersion.version == memo.current_version
    ).first()
    
    # Prepare new version data
    new_version_num = memo.current_version + 1
    new_version = MemoVersion(
        memo_id=memo.id,
        version=new_version_num,
        summary=memo_data.summary if memo_data.summary is not None else (current_version.summary if current_version else ""),
        market=memo_data.market if memo_data.market is not None else (current_version.market if current_version else ""),
        product=memo_data.product if memo_data.product is not None else (current_version.product if current_version else ""),
        traction=memo_data.traction if memo_data.traction is not None else (current_version.traction if current_version else ""),
        risks=memo_data.risks if memo_data.risks is not None else (current_version.risks if current_version else ""),
        open_questions=memo_data.open_questions if memo_data.open_questions is not None else (current_version.open_questions if current_version else "")
    )
    
    db.add(new_version)
    memo.current_version = new_version_num
    db.commit()
    db.refresh(memo)
    
    # Create activity
    activity = Activity(
        deal_id=deal_id,
        user_id=current_user.id,
        action="memo_updated",
        description=f"{current_user.full_name} updated IC memo (version {new_version_num})"
    )
    db.add(activity)
    db.commit()
    
    return memo


@router.get("/deal/{deal_id}/versions", response_model=List[MemoVersionResponse])
def get_memo_versions(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a memo"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    memo = db.query(ICMemo).filter(ICMemo.deal_id == deal_id).first()
    if not memo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memo not found"
        )
    
    versions = db.query(MemoVersion).filter(
        MemoVersion.memo_id == memo.id
    ).order_by(MemoVersion.version.desc()).all()
    
    return versions


@router.get("/deal/{deal_id}/version/{version_num}", response_model=MemoVersionResponse)
def get_memo_version(
    deal_id: int,
    version_num: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific version of a memo"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    memo = db.query(ICMemo).filter(ICMemo.deal_id == deal_id).first()
    if not memo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memo not found"
        )
    
    version = db.query(MemoVersion).filter(
        MemoVersion.memo_id == memo.id,
        MemoVersion.version == version_num
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    return version
