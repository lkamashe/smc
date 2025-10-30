from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import numpy as np
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models

class Trade(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset: str = "XAUUSD"
    bias: str  # Bullish/Bearish
    setup: str
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: str
    confidence: int
    status: str = "Pending"  # Pending/Active/TP/SL
    chart_snapshot: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    result: Optional[str] = None  # Win/Loss
    closed_at: Optional[datetime] = None
    note: str = ""

class TradeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    asset: str
    bias: str
    setup: str
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: str
    confidence: int
    status: str
    timestamp: str
    result: Optional[str] = None
    note: str

class AnalysisResult(BaseModel):
    h4_bias: str  # Bullish/Bearish/Neutral
    m15_signal: Optional[dict] = None
    trade_signal: Optional[TradeResponse] = None
    message: str

class Stats(BaseModel):
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    avg_rr: float
    current_streak: int

# Helper Functions
async def get_user_from_cookie(request: Request) -> Optional[User]:
    """Get user from session token in cookie"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    if datetime.fromisoformat(session["expires_at"]) < datetime.now(timezone.utc):
        await db.sessions.delete_one({"session_token": session_token})
        return None
    
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if user and 'created_at' in user and isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user) if user else None

def generate_mock_candles(timeframe: str, count: int = 100):
    """Generate mock XAUUSD candles"""
    base_price = 2360.0
    candles = []
    current_price = base_price
    
    for i in range(count):
        volatility = 2.0 if timeframe == "H4" else 0.5
        change = np.random.normal(0, volatility)
        
        open_price = current_price
        close_price = current_price + change
        high_price = max(open_price, close_price) + abs(np.random.normal(0, volatility * 0.3))
        low_price = min(open_price, close_price) - abs(np.random.normal(0, volatility * 0.3))
        
        candles.append({
            "time": i,
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2)
        })
        
        current_price = close_price
    
    return candles

def analyze_structure(candles, timeframe="H4"):
    """Analyze market structure for BOS/CHoCH"""
    if len(candles) < 20:
        return {"bias": "Neutral", "reason": "Insufficient data"}
    
    # Find swing highs and lows
    swing_highs = []
    swing_lows = []
    
    for i in range(10, len(candles) - 10):
        is_swing_high = all(
            candles[i]["high"] > candles[j]["high"] 
            for j in range(i-5, i+6) if j != i
        )
        is_swing_low = all(
            candles[i]["low"] < candles[j]["low"] 
            for j in range(i-5, i+6) if j != i
        )
        
        if is_swing_high:
            swing_highs.append({"index": i, "price": candles[i]["high"]})
        if is_swing_low:
            swing_lows.append({"index": i, "price": candles[i]["low"]})
    
    if not swing_highs or not swing_lows:
        return {"bias": "Neutral", "reason": "No clear structure", "swing_highs": [], "swing_lows": []}
    
    # Check for BOS
    last_swing_high = swing_highs[-1] if swing_highs else None
    last_swing_low = swing_lows[-1] if swing_lows else None
    last_candle = candles[-1]
    
    bias = "Neutral"
    reason = "No clear breakout"
    
    if last_swing_high and last_candle["close"] > last_swing_high["price"]:
        bias = "Bullish"
        reason = "BOS above last swing high"
    elif last_swing_low and last_candle["close"] < last_swing_low["price"]:
        bias = "Bearish"
        reason = "BOS below last swing low"
    
    return {
        "bias": bias,
        "reason": reason,
        "swing_highs": swing_highs[-3:],
        "swing_lows": swing_lows[-3:],
        "last_swing_high": last_swing_high,
        "last_swing_low": last_swing_low
    }

def find_order_block(candles, bias, structure_info):
    """Find HTF order block"""
    if bias == "Neutral":
        return None
    
    # Find the last opposite candle before strong move
    for i in range(len(candles) - 10, max(0, len(candles) - 30), -1):
        if bias == "Bullish" and candles[i]["close"] < candles[i]["open"]:
            return {
                "type": "demand",
                "index": i,
                "high": candles[i]["high"],
                "low": candles[i]["low"],
                "open": candles[i]["open"],
                "close": candles[i]["close"]
            }
        elif bias == "Bearish" and candles[i]["close"] > candles[i]["open"]:
            return {
                "type": "supply",
                "index": i,
                "high": candles[i]["high"],
                "low": candles[i]["low"],
                "open": candles[i]["open"],
                "close": candles[i]["close"]
            }
    
    return None

def find_m15_setup(m15_candles, h4_bias, order_block):
    """Find M15 entry setup"""
    if h4_bias == "Neutral" or not order_block:
        return None
    
    # Simulate setup detection
    recent_candles = m15_candles[-50:]
    
    if h4_bias == "Bullish":
        # Look for liquidity sweep below recent low
        lows = [c["low"] for c in recent_candles[-20:]]
        local_low = min(lows)
        
        # Check if price swept below and recovered
        for i in range(len(recent_candles) - 5, len(recent_candles)):
            if recent_candles[i]["low"] < local_low and recent_candles[i]["close"] > recent_candles[i]["open"]:
                # Found potential setup
                entry = round(recent_candles[i]["close"] + 0.5, 2)
                sl = round(local_low - 0.8, 2)
                tp = round(entry + (entry - sl) * 2, 2)
                
                return {
                    "direction": "BUY",
                    "entry": entry,
                    "sl": sl,
                    "tp": tp,
                    "setup": "Sweep + CHoCH + OB Mitigation",
                    "confidence": random.randint(75, 85),
                    "sweep_low": local_low,
                    "ob_zone": order_block
                }
    
    elif h4_bias == "Bearish":
        # Look for liquidity sweep above recent high
        highs = [c["high"] for c in recent_candles[-20:]]
        local_high = max(highs)
        
        for i in range(len(recent_candles) - 5, len(recent_candles)):
            if recent_candles[i]["high"] > local_high and recent_candles[i]["close"] < recent_candles[i]["open"]:
                entry = round(recent_candles[i]["close"] - 0.5, 2)
                sl = round(local_high + 0.8, 2)
                tp = round(entry - (sl - entry) * 2, 2)
                
                return {
                    "direction": "SELL",
                    "entry": entry,
                    "sl": sl,
                    "tp": tp,
                    "setup": "Sweep + CHoCH + OB Mitigation",
                    "confidence": random.randint(75, 85),
                    "sweep_high": local_high,
                    "ob_zone": order_block
                }
    
    return None

# Auth Endpoints
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process session_id from Emergent Auth"""
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Get session data from Emergent
    try:
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        auth_response.raise_for_status()
        user_data = auth_response.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid session: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if not existing_user:
        # Create new user
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data["picture"]
        )
        user_dict = user.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
    else:
        user = User(**existing_user)
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = Session(
        session_token=session_token,
        user_id=user.id,
        expires_at=expires_at
    )
    
    session_dict = session.model_dump()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    
    await db.sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"user": user.model_dump(), "session_token": session_token}

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Trading Endpoints
@api_router.get("/analysis/scan")
async def scan_market(request: Request):
    """Perform full market analysis"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if there's already an active trade today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing_trade = await db.trades.find_one({
        "user_id": user.id,
        "timestamp": {"$gte": today_start.isoformat()},
        "status": {"$in": ["Pending", "Active"]}
    })
    
    if existing_trade:
        return {
            "h4_bias": existing_trade.get("bias", "N/A"),
            "message": "Active trade already exists for today",
            "trade_signal": None
        }
    
    # Generate mock data
    h4_candles = generate_mock_candles("H4", 100)
    m15_candles = generate_mock_candles("M15", 200)
    
    # Analyze H4 structure
    h4_analysis = analyze_structure(h4_candles, "H4")
    h4_bias = h4_analysis["bias"]
    
    if h4_bias == "Neutral":
        return {
            "h4_bias": "Neutral",
            "message": "No Trade Today - No clear structure",
            "h4_analysis": h4_analysis,
            "trade_signal": None
        }
    
    # Find order block
    order_block = find_order_block(h4_candles, h4_bias, h4_analysis)
    
    # Find M15 setup
    m15_setup = find_m15_setup(m15_candles, h4_bias, order_block)
    
    if not m15_setup:
        return {
            "h4_bias": h4_bias,
            "message": "No valid M15 setup found yet",
            "h4_analysis": h4_analysis,
            "order_block": order_block,
            "trade_signal": None
        }
    
    # Create trade
    rr = round(abs(m15_setup["tp"] - m15_setup["entry"]) / abs(m15_setup["entry"] - m15_setup["sl"]), 1)
    
    trade = Trade(
        user_id=user.id,
        bias=h4_bias,
        setup=m15_setup["setup"],
        entry_price=m15_setup["entry"],
        stop_loss=m15_setup["sl"],
        take_profit=m15_setup["tp"],
        risk_reward=f"1:{rr}",
        confidence=m15_setup["confidence"],
        status="Pending",
        chart_snapshot={
            "h4_candles": h4_candles[-50:],
            "m15_candles": m15_candles[-100:],
            "h4_analysis": h4_analysis,
            "order_block": order_block,
            "m15_setup": m15_setup
        },
        note="Immutable until TP or SL is hit"
    )
    
    trade_dict = trade.model_dump()
    trade_dict["timestamp"] = trade_dict["timestamp"].isoformat()
    
    await db.trades.insert_one(trade_dict)
    
    return {
        "h4_bias": h4_bias,
        "message": "New signal generated!",
        "h4_analysis": h4_analysis,
        "order_block": order_block,
        "m15_setup": m15_setup,
        "trade_signal": TradeResponse(
            id=trade.id,
            asset=trade.asset,
            bias=trade.bias,
            setup=trade.setup,
            entry_price=trade.entry_price,
            stop_loss=trade.stop_loss,
            take_profit=trade.take_profit,
            risk_reward=trade.risk_reward,
            confidence=trade.confidence,
            status=trade.status,
            timestamp=trade.timestamp.isoformat(),
            note=trade.note
        ).model_dump()
    }

@api_router.get("/trades/current")
async def get_current_trade(request: Request):
    """Get current active/pending trade"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    trade = await db.trades.find_one(
        {"user_id": user.id, "status": {"$in": ["Pending", "Active"]}},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not trade:
        return None
    
    return trade

@api_router.get("/trades/history")
async def get_trade_history(request: Request):
    """Get all historical trades"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    trades = await db.trades.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    return trades

@api_router.put("/trades/{trade_id}/status")
async def update_trade_status(trade_id: str, request: Request):
    """Update trade status (simulate TP/SL hit)"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    new_status = data.get("status")  # "TP" or "SL" or "Active"
    
    if new_status not in ["Active", "TP", "SL"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    trade = await db.trades.find_one({"id": trade_id, "user_id": user.id})
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    update_data = {"status": new_status}
    
    if new_status in ["TP", "SL"]:
        update_data["result"] = "Win" if new_status == "TP" else "Loss"
        update_data["closed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.trades.update_one(
        {"id": trade_id},
        {"$set": update_data}
    )
    
    return {"message": "Trade updated", "status": new_status}

@api_router.get("/stats")
async def get_stats(request: Request):
    """Get trading statistics"""
    user = await get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    all_trades = await db.trades.find(
        {"user_id": user.id, "result": {"$exists": True}},
        {"_id": 0}
    ).to_list(1000)
    
    if not all_trades:
        return Stats(
            total_trades=0,
            wins=0,
            losses=0,
            win_rate=0.0,
            avg_rr=0.0,
            current_streak=0
        ).model_dump()
    
    wins = sum(1 for t in all_trades if t.get("result") == "Win")
    losses = len(all_trades) - wins
    win_rate = (wins / len(all_trades)) * 100 if all_trades else 0
    
    # Calculate average RR
    rr_values = []
    for t in all_trades:
        if ":" in t.get("risk_reward", ""):
            rr = float(t["risk_reward"].split(":")[1])
            rr_values.append(rr)
    avg_rr = sum(rr_values) / len(rr_values) if rr_values else 0
    
    # Calculate streak
    streak = 0
    for t in sorted(all_trades, key=lambda x: x["timestamp"], reverse=True):
        if t.get("result") == "Win":
            streak += 1
        else:
            break
    
    return Stats(
        total_trades=len(all_trades),
        wins=wins,
        losses=losses,
        win_rate=round(win_rate, 1),
        avg_rr=round(avg_rr, 1),
        current_streak=streak
    ).model_dump()

@api_router.get("/")
async def root():
    return {"message": "XAU SMC Auto Trader API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()