# FinPilot AI — Production Architecture Document

## Executive Summary

**FinPilot AI** is a behavioral financial intelligence operating system designed for 100,000+ concurrent users. This document outlines production-grade architecture decisions, ML pipeline design, security protocols, and scalability strategies.

---

## 1. System Architecture Overview

### 1.1 Architecture Pattern: Microservices

**Decision Rationale:**
- **Scalability**: AI inference and CRUD operations have different scaling requirements
- **Fault Isolation**: ML service failure doesn't crash transaction recording
- **Technology Optimization**: Python for ML, Node.js for I/O-bound operations
- **Independent Deployment**: Update ML models without backend redeployment

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  Next.js 15 (App Router) + TailwindCSS + Recharts          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────────────────┐
│                   API Gateway Layer                          │
│    Node.js + Express + Redis Rate Limiting                  │
│         /api/v1/* → Service Router                          │
└──────┬────────────────────────────────┬────────────────────┘
       │                                 │
       │ REST                            │ REST
       │                                 │
┌──────▼─────────────┐          ┌───────▼──────────────────┐
│  Core API Service  │          │  AI Microservice         │
│  Node.js + Express │          │  FastAPI + Python        │
│                    │          │                          │
│  - Auth            │          │  - NLP Categorization    │
│  - Transactions    │          │  - Prophet Forecasting   │
│  - Budgets         │          │  - Isolation Forest      │
│  - Goals           │          │  - Health Score Engine   │
│  - User Management │          │  - Behavioral Analysis   │
└──────┬─────────────┘          └───────┬──────────────────┘
       │                                 │
       │                                 │
┌──────▼─────────────────────────────────▼─────────────────┐
│              Data Layer                                    │
│  MongoDB Atlas (Primary) + Redis (Cache + Queue)          │
└───────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│           Background Job Layer                           │
│  BullMQ (Node.js) - Transaction aggregation,            │
│  community stats, ML retraining triggers                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Justification

### 2.1 Frontend: Next.js 15 (App Router)

**Why Next.js over CRA:**
- **SSR + ISR**: Faster initial load for dashboard metrics
- **API Routes**: Can proxy sensitive AI requests server-side
- **Image Optimization**: Automatic WebP conversion for charts
- **Bundle Splitting**: Automatic code splitting per route

**Why App Router:**
- React Server Components for data fetching
- Streaming for progressive dashboard loading
- Native layout nesting for consistent shell

### 2.2 Backend: Node.js + Express

**Why Node.js:**
- **Event-Driven I/O**: Handles 10K+ concurrent connections efficiently
- **Ecosystem**: Mature fintech libraries (bcrypt, jsonwebtoken)
- **Developer Velocity**: Shared types with frontend via TypeScript

**Stateless Design:**
- All session state in JWT (no server-side sessions)
- Enables horizontal pod scaling in Kubernetes
- Redis only for rate limiting (shared state)

### 2.3 AI Microservice: FastAPI + Python

**Why FastAPI over Flask:**
- **Async Support**: Non-blocking ML inference
- **Automatic OpenAPI**: Auto-generated API docs
- **Pydantic Validation**: Type-safe request/response models
- **Performance**: 2-3x faster than Flask (Starlette + Uvicorn)

**Why Python for ML:**
- **Scikit-learn**: Production-proven, 10+ years stable
- **Prophet**: Facebook's time-series library, handles seasonality
- **Joblib**: Model serialization with numpy array optimization

### 2.4 Database: MongoDB Atlas

**Why MongoDB over PostgreSQL:**
- **Schema Flexibility**: Transaction metadata varies by source (bank API, manual entry, CSV import)
- **Horizontal Sharding**: Native support for user-based sharding (100K+ users)
- **Aggregation Pipeline**: Efficient category grouping, time-series rollups
- **Atlas Features**: Automated backups, point-in-time recovery, monitoring

**Sharding Strategy:**
```javascript
// Shard key: userId (hashed)
// Ensures user's entire financial history stays on one shard
sh.shardCollection("finpilot.transactions", { userId: "hashed" })
```

### 2.5 Caching: Redis

**Use Cases:**
1. **Rate Limiting**: Token bucket algorithm (100 req/15min per user)
2. **Session Blacklist**: Revoked JWT tokens (until expiry)
3. **AI Response Cache**: Cache forecast results for 24 hours
4. **Aggregation Cache**: Community percentiles (updated hourly)

**Why Redis:**
- **In-Memory Speed**: <1ms latency for cache hits
- **TTL Support**: Automatic expiry for stale forecasts
- **Atomic Operations**: INCR for rate limiting counters

---

## 3. Machine Learning Architecture

### 3.1 Design Philosophy: Explainable AI

**Core Principle:** Every ML output must include human-readable explanation.

**Anti-Pattern Rejected:**
```javascript
// ❌ Black box approach
{ "category": "Food", "confidence": 0.87 }
```

**Correct Pattern:**
```javascript
// ✅ Explainable AI
{
  "category": "Food",
  "confidence": 0.87,
  "reasoning": "Keywords 'pizza', 'delivery' matched Food category",
  "alternatives": [
    { "category": "Entertainment", "probability": 0.08 },
    { "category": "Shopping", "probability": 0.05 }
  ]
}
```

---

### 3.2 ML Service 1: NLP Smart Categorization

**Algorithm: TF-IDF + Logistic Regression**

**Why This Over Neural Networks:**
1. **Interpretability**: Can extract feature importance (which words drove classification)
2. **Training Speed**: Retrains in <30 seconds on 100K transactions
3. **Small Data Efficiency**: Performs well with 1,000-10,000 labeled examples
4. **Deployment Size**: Model file <5MB (vs. 500MB+ for BERT)
5. **Inference Speed**: <10ms per transaction (vs. 100ms+ for transformers)

**Architecture:**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Pipeline persists as single .joblib file
model = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),  # Unigrams + bigrams
        min_df=2,  # Ignore rare terms
        stop_words='english'
    )),
    ('classifier', LogisticRegression(
        multi_class='multinomial',
        max_iter=1000,
        class_weight='balanced'  # Handle imbalanced categories
    ))
])
```

**Training Data Requirements:**
- **Initial Bootstrap**: 10K pre-labeled transactions (crowdsourced)
- **User Feedback Loop**: Store corrections in `model_feedback` collection
- **Retraining Trigger**: Every 10K new feedback entries OR weekly schedule

**Retraining Workflow:**
```
1. BullMQ cron job triggers weekly
2. Fetch training data: bootstrap + user corrections
3. Train new model with version tag (v1.2.3)
4. Validate on holdout set (target: >85% accuracy)
5. If validation passes:
   - Upload model to S3/GCS with version tag
   - Update AI service config: MODEL_VERSION=v1.2.3
   - Rolling restart AI pods (zero downtime)
6. Store metrics in MongoDB:
   - accuracy, precision, recall per category
   - training_timestamp, sample_count
```

**API Contract:**
```typescript
POST /ai/v1/categorize
Request:
{
  "description": "UBER *TRIP 123ABC",
  "amount": -25.50,
  "merchant": "Uber Technologies"
}

Response:
{
  "prediction": {
    "category": "Transportation",
    "confidence": 0.92,
    "model_version": "v1.2.3"
  },
  "alternatives": [
    { "category": "Food & Dining", "probability": 0.05 },
    { "category": "Entertainment", "probability": 0.03 }
  ],
  "reasoning": {
    "keywords": ["uber", "trip"],
    "top_features": [
      { "term": "uber", "weight": 0.78 },
      { "term": "trip", "weight": 0.54 }
    ]
  }
}
```

---

### 3.3 ML Service 2: Time-Series Forecasting (Prophet)

**Algorithm: Facebook Prophet**

**Why Prophet Over LSTM:**

| Criteria | Prophet | LSTM |
|----------|---------|------|
| **Training Time** | 10-30 seconds | 30-60 minutes |
| **Data Requirements** | Works with 6 months data | Needs 2+ years |
| **Seasonality Handling** | Automatic (daily, weekly, yearly) | Manual feature engineering |
| **Trend Changes** | Built-in changepoint detection | Requires architecture tuning |
| **Explainability** | Decomposed components (trend + seasonality) | Black box |
| **Missing Data** | Handles gaps automatically | Requires imputation |
| **Production Readiness** | Battle-tested (Facebook scale) | High complexity |

**Prophet Design Decisions:**
```python
from prophet import Prophet

model = Prophet(
    daily_seasonality=True,    # Captures payday effects
    weekly_seasonality=True,   # Weekend spending spikes
    yearly_seasonality=False,  # User doesn't have years of data yet
    changepoint_prior_scale=0.05,  # Conservative trend changes
    seasonality_prior_scale=10.0,  # Prioritize seasonal patterns
    interval_width=0.80  # 80% confidence interval (realistic for finance)
)
```

**Forecasting Scenarios:**

**A. Month-End Balance Prediction**
```python
# Input: Daily balance history (last 90 days)
# Output: Predicted balance on day 30 + confidence interval
forecast = model.predict(future_dates)
```

**B. Category Overspending Probability**
```python
# Input: Daily spending per category (last 60 days)
# Compare forecast to budget threshold
overshoot_prob = (forecast['yhat'] > budget_limit).mean()
```

**C. Cash-Flow Runway**
```python
# Predict when balance will hit $0
runway_days = forecast[forecast['yhat'] < 0]['ds'].min()
```

**API Contract:**
```typescript
POST /ai/v1/forecast/balance
Request:
{
  "userId": "usr_abc123",
  "timeframe": "month",  // or "quarter"
  "include_upcoming_bills": true
}

Response:
{
  "prediction": {
    "date": "2026-03-31",
    "balance": 1250.00,
    "confidence_interval": {
      "lower": 980.00,    // 10th percentile
      "upper": 1520.00    // 90th percentile
    }
  },
  "trend_analysis": {
    "trend_direction": "stable",  // increasing | stable | decreasing
    "avg_daily_burn": -42.30,
    "seasonal_factors": [
      { "type": "weekly", "impact": "+12% on weekends" }
    ]
  },
  "risk_drivers": [
    { "category": "Food & Dining", "overshoot_probability": 0.68 }
  ]
}
```

---

### 3.4 ML Service 3: Anomaly Detection (Isolation Forest)

**Algorithm: Isolation Forest**

**Why Isolation Forest:**
- **Unsupervised**: No labeled "fraud" data needed
- **Efficient**: O(n log n) complexity
- **Anomaly Score**: Returns continuous score (not just binary)
- **Multi-Dimensional**: Considers amount, category, time, location simultaneously

**Feature Engineering:**
```python
features = [
    'amount',                    # Transaction amount
    'hour_of_day',               # 0-23
    'day_of_week',               # 0-6
    'category_encoded',          # Label encoded
    'amount_zscore_in_category', # How unusual for this category
    'days_since_last_similar',   # Time pattern deviation
    'merchant_frequency'         # New merchant = higher risk
]
```

**Training Strategy:**
```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=100,
    contamination=0.05,  # Expect 5% anomalies
    random_state=42
)

# Train on user's last 180 days of normal transactions
model.fit(user_transaction_features)
```

**Anomaly Classification:**
```python
score = model.decision_function(new_transaction)
# score < -0.5: HIGH anomaly
# -0.5 to 0: MODERATE
# > 0: NORMAL
```

**API Contract:**
```typescript
POST /ai/v1/anomaly/detect
Request:
{
  "transaction": {
    "amount": -500.00,
    "category": "Shopping",
    "merchant": "UNKNOWN VENDOR XYZ",
    "timestamp": "2026-02-20T23:45:00Z"
  },
  "userId": "usr_abc123"
}

Response:
{
  "is_anomaly": true,
  "severity": "high",  // high | moderate | low
  "anomaly_score": -0.82,  // -1 (most anomalous) to +1 (normal)
  "explanation": {
    "drivers": [
      {
        "factor": "amount",
        "contribution": 0.65,
        "message": "Amount is 3.2x your typical Shopping purchase"
      },
      {
        "factor": "time",
        "contribution": 0.20,
        "message": "Unusual purchase time (11:45 PM)"
      },
      {
        "factor": "merchant",
        "contribution": 0.15,
        "message": "First time purchasing from this merchant"
      }
    ]
  },
  "recommended_action": "review_transaction"
}
```

---

### 3.5 Financial Health Score (0-100)

**Formula Design (Weighted Multi-Factor Model):**

```python
def calculate_health_score(user_data):
    """
    Score Components:
    1. Savings Ratio (30%): Income saved vs. spent
    2. Budget Adherence (20%): Staying within budget limits
    3. Spending Volatility (20%): Consistency of expenses
    4. Income Consistency (15%): Income stream stability
    5. Emergency Buffer (15%): Months of expenses in savings
    """
    
    # 1. Savings Ratio (0-100)
    savings_rate = (income - expenses) / income
    savings_score = min(100, savings_rate * 100 * 3)  # 33%+ = 100 points
    
    # 2. Budget Adherence (0-100)
    categories_on_track = sum(1 for c in categories if c.spent <= c.budget)
    adherence_score = (categories_on_track / len(categories)) * 100
    
    # 3. Spending Volatility (0-100) - Lower volatility = higher score
    spending_std = np.std(daily_expenses)
    spending_mean = np.mean(daily_expenses)
    coef_variation = spending_std / spending_mean
    volatility_score = max(0, 100 - (coef_variation * 200))
    
    # 4. Income Consistency (0-100)
    income_std = np.std(monthly_incomes)
    income_mean = np.mean(monthly_incomes)
    income_consistency = 1 - (income_std / income_mean)
    income_score = income_consistency * 100
    
    # 5. Emergency Buffer (0-100)
    months_of_buffer = savings / avg_monthly_expenses
    buffer_score = min(100, months_of_buffer * 33.33)  # 3+ months = 100
    
    # Weighted Final Score
    final_score = (
        savings_score * 0.30 +
        adherence_score * 0.20 +
        volatility_score * 0.20 +
        income_score * 0.15 +
        buffer_score * 0.15
    )
    
    return {
        "score": round(final_score, 1),
        "grade": get_grade(final_score),
        "breakdown": {
            "savings_ratio": {"score": savings_score, "weight": 0.30},
            "budget_adherence": {"score": adherence_score, "weight": 0.20},
            "spending_volatility": {"score": volatility_score, "weight": 0.20},
            "income_consistency": {"score": income_score, "weight": 0.15},
            "emergency_buffer": {"score": buffer_score, "weight": 0.15}
        }
    }
```

**Risk Bands:**
```python
def get_grade(score):
    if score >= 80: return {"grade": "A", "status": "Excellent", "color": "green"}
    elif score >= 65: return {"grade": "B", "status": "Good", "color": "blue"}
    elif score >= 50: return {"grade": "C", "status": "Fair", "color": "yellow"}
    elif score >= 35: return {"grade": "D", "status": "At Risk", "color": "orange"}
    else: return {"grade": "F", "status": "Critical", "color": "red"}
```

---

### 3.6 Cash-Flow Risk Engine

**Algorithm: Monte Carlo Simulation + Logistic Regression**

**Process:**
```python
def predict_cashflow_risk(user_id):
    # Step 1: Load historical patterns
    income_history = get_income_pattern(user_id, days=90)
    expense_history = get_expense_pattern(user_id, days=90)
    
    # Step 2: Fit probability distributions
    income_dist = fit_distribution(income_history)  # Gamma or LogNormal
    expense_dist = fit_distribution(expense_history)
    
    # Step 3: Monte Carlo simulation (1000 runs)
    simulations = []
    for _ in range(1000):
        daily_balance = current_balance
        for day in range(30):  # Next 30 days
            daily_income = sample(income_dist)
            daily_expense = sample(expense_dist)
            daily_balance += (daily_income - daily_expense)
            
            if daily_balance < 0:
                simulations.append({"day": day, "balance": daily_balance})
                break
    
    # Step 4: Calculate risk metrics
    negative_balance_prob = len(simulations) / 1000
    avg_runway = np.mean([s["day"] for s in simulations]) if simulations else 30
    
    # Step 5: Identify risk drivers
    risk_categories = get_highest_variance_categories(expense_history)
    
    return {
        "risk_level": classify_risk(negative_balance_prob),
        "probability": negative_balance_prob,
        "runway_days": int(avg_runway),
        "drivers": risk_categories[:3]  # Top 3 risky categories
    }
```

**API Response:**
```json
{
  "risk_assessment": {
    "level": "moderate",
    "probability_of_overdraft": 0.23,
    "confidence": 0.85
  },
  "timeline": {
    "estimated_runway_days": 18,
    "next_income_date": "2026-03-05",
    "days_until_income": 13
  },
  "risk_drivers": [
    {
      "category": "Food & Dining",
      "contribution": 0.45,
      "avg_daily_spend": 38.50,
      "budget_status": "overbudget",
      "recommendation": "Reduce by $15/day to eliminate risk"
    },
    {
      "category": "Shopping",
      "contribution": 0.32,
      "spike_detected": true,
      "message": "Spending 2.1x normal in last 7 days"
    }
  ]
}
```

---

### 3.7 Behavioral Finance Analysis

**Pattern Detection Algorithms:**

**A. Weekend Overspending**
```python
weekend_avg = transactions[transactions.day_of_week.isin([5,6])].amount.mean()
weekday_avg = transactions[~transactions.day_of_week.isin([5,6])].amount.mean()

if weekend_avg > weekday_avg * 1.5:
    return {
        "pattern": "weekend_overspending",
        "severity": "moderate",
        "impact": f"+{(weekend_avg - weekday_avg) * 8} per month",
        "suggestion": "Set weekend spending limit of ${weekday_avg * 1.2}"
    }
```

**B. Late-Night Impulse Spending**
```python
late_night_txns = transactions[(transactions.hour >= 22) | (transactions.hour <= 4)]
if len(late_night_txns) > 10:
    avg_late_night = late_night_txns.amount.mean()
    daytime_avg = transactions[~late_night_filter].amount.mean()
    
    if avg_late_night > daytime_avg:
        return {
            "pattern": "late_night_impulse",
            "frequency": len(late_night_txns),
            "avg_amount": avg_late_night,
            "suggestion": "Enable spending freeze after 10 PM"
        }
```

**C. Subscription Leakage Detection**
```python
# Find recurring transactions (same merchant, similar amount, ~30 day interval)
subscriptions = detect_recurring_patterns(transactions)

unused_subs = []
for sub in subscriptions:
    if sub.last_transaction_days_ago > 60:  # Not used in 2 months
        unused_subs.append(sub)

return {
    "pattern": "subscription_leakage",
    "unused_subscriptions": unused_subs,
    "monthly_waste": sum(s.amount for s in unused_subs)
}
```

---

### 3.8 Savings Simulation Engine

**Interactive What-If Analysis:**

```python
def simulate_savings_scenario(user_id, scenario):
    """
    Scenario format:
    {
      "changes": [
        {"category": "Food", "adjustment": -0.20},  # -20%
        {"category": "Transport", "adjustment": -0.15}
      ],
      "timeframe_months": 12
    }
    """
    
    # Get baseline
    current_spending = get_category_spending(user_id)
    current_savings_rate = get_savings_rate(user_id)
    
    # Apply adjustments
    new_spending = current_spending.copy()
    for change in scenario["changes"]:
        cat = change["category"]
        new_spending[cat] *= (1 + change["adjustment"])
    
    # Calculate projected impact
    monthly_savings_increase = sum(current_spending.values()) - sum(new_spending.values())
    
    # Compound projection (assume 4% annual return)
    projected_savings = []
    balance = 0
    for month in range(scenario["timeframe_months"]):
        balance += monthly_savings_increase
        balance *= (1 + 0.04/12)  # Monthly compounding
        projected_savings.append(balance)
    
    # Health score impact
    new_health_score = calculate_health_score_with_adjustments(user_id, new_spending)
    score_delta = new_health_score - get_current_health_score(user_id)
    
    return {
        "monthly_savings_increase": monthly_savings_increase,
        "total_savings_12mo": projected_savings[-1],
        "health_score_impact": f"+{score_delta:.1f}",
        "goal_success_probability": calculate_goal_probability(user_id, projected_savings)
    }
```

---

### 3.9 Goal-Based Financial Planning

**Probability Calculation (Monte Carlo):**

```python
def calculate_goal_success_probability(goal, user_history):
    """
    goal = {
        "target_amount": 10000,
        "deadline_months": 12,
        "current_saved": 2000
    }
    """
    
    required_monthly = (goal.target_amount - goal.current_saved) / goal.deadline_months
    
    # Historical savings distribution
    historical_savings = get_monthly_savings_history(user_history)
    savings_mean = np.mean(historical_savings)
    savings_std = np.std(historical_savings)
    
    # Monte Carlo: Can user hit required savings?
    successes = 0
    for _ in range(10000):
        simulated_total = goal.current_saved
        for month in range(goal.deadline_months):
            monthly_savings = np.random.normal(savings_mean, savings_std)
            simulated_total += max(0, monthly_savings)
        
        if simulated_total >= goal.target_amount:
            successes += 1
    
    probability = successes / 10000
    
    return {
        "probability": probability,
        "required_monthly": required_monthly,
        "current_trajectory": savings_mean,
        "gap": required_monthly - savings_mean,
        "recommendation": get_goal_recommendation(probability, required_monthly, savings_mean)
    }
```

---

### 3.10 Community Intelligence (Anonymous Aggregation)

**Privacy-First Design:**

**Aggregation Rules:**
1. **Minimum Group Size**: Only show percentiles if group has 50+ users
2. **Noise Injection**: Add Laplace noise to percentile values (ε-differential privacy)
3. **No User Linking**: Aggregate stats never link to individual user IDs
4. **Opt-Out Default**: Users must explicitly opt-in to community benchmarking

**Aggregation Pipeline:**
```javascript
// MongoDB Aggregation (runs hourly via cron)
db.users.aggregate([
  // Stage 1: Filter to users who opted in
  { $match: { "privacy.community_benchmarking": true } },
  
  // Stage 2: Group by age bracket
  {
    $bucket: {
      groupBy: "$age",
      boundaries: [18, 25, 30, 35, 40, 50],
      default: "50+",
      output: {
        users: { $push: "$$ROOT" }
      }
    }
  },
  
  // Stage 3: Calculate percentiles per group
  {
    $project: {
      age_group: "$_id",
      total_users: { $size: "$users" },
      savings_percentiles: {
        p25: { $percentile: { input: "$users.metrics.savings_rate", p: [0.25] } },
        p50: { $percentile: { input: "$users.metrics.savings_rate", p: [0.50] } },
        p75: { $percentile: { input: "$users.metrics.savings_rate", p: [0.75] } }
      },
      spending_percentiles: { /* similar */ },
      health_score_percentiles: { /* similar */ }
    }
  },
  
  // Stage 4: Add differential privacy noise
  {
    $addFields: {
      "savings_percentiles.p50_noised": {
        $add: ["$savings_percentiles.p50", { $rand: -2, 2 }]  // ±2% noise
      }
    }
  },
  
  // Stage 5: Store in community_aggregates collection
  { $out: "community_aggregates" }
])
```

**API Response:**
```json
{
  "user_percentiles": {
    "savings_rate": {
      "value": 0.18,
      "percentile": 67,
      "age_group": "25-30",
      "message": "You save more than 67% of peers in your age group"
    },
    "spending_volatility": {
      "value": 0.32,
      "percentile": 45,
      "message": "Your spending consistency is average"
    }
  },
  "group_stats": {
    "age_group": "25-30",
    "sample_size": 2847,
    "avg_savings_rate": 0.15,
    "median_health_score": 68
  },
  "privacy_note": "All data is anonymized and aggregated across 2800+ users"
}
```

---

## 4. Database Schema Design

### 4.1 MongoDB Collections

**users**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "user@example.com",  // unique, indexed
  password: "$2b$12$...",  // bcrypt hashed
  profile: {
    name: "John Doe",
    age: 26,
    occupation: "Software Engineer",
    currency: "USD",
    timezone: "Asia/Kolkata"
  },
  settings: {
    language: "en",  // "en" | "hi"
    theme: "dark",
    notifications: {
      budget_alerts: true,
      anomaly_alerts: true,
      weekly_insights: true
    }
  },
  privacy: {
    community_benchmarking: false,  // Opt-in required
    data_sharing_consent: false
  },
  auth: {
    refresh_token_version: 1,  // Increment to invalidate all tokens
    last_login: ISODate("2026-02-20T10:30:00Z"),
    failed_login_attempts: 0
  },
  created_at: ISODate("2025-08-15T12:00:00Z"),
  updated_at: ISODate("2026-02-20T10:30:00Z")
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "auth.refresh_token_version": 1 })
```

---

**transactions**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("507f1f77bcf86cd799439011"),  // Shard key
  type: "expense",  // "income" | "expense" | "transfer"
  amount: -45.50,  // Negative for expenses
  category: "Food & Dining",
  subcategory: "Restaurants",
  description: "CHIPOTLE #2847",
  merchant: {
    name: "Chipotle Mexican Grill",
    location: "San Francisco, CA"
  },
  date: ISODate("2026-02-19T18:45:00Z"),
  
  // ML metadata
  ml_metadata: {
    category_prediction: {
      model_version: "v1.2.3",
      confidence: 0.94,
      alternatives: [
        { category: "Fast Food", probability: 0.04 }
      ],
      user_corrected: false
    },
    anomaly_score: 0.12,  // -1 to 1, higher = more normal
    is_anomalous: false
  },
  
  // Import metadata
  source: "manual",  // "manual" | "bank_api" | "csv_import"
  imported_at: null,
  
  tags: ["weekend", "social"],
  notes: "Dinner with friends",
  
  created_at: ISODate("2026-02-19T18:50:00Z"),
  updated_at: ISODate("2026-02-19T18:50:00Z")
}
```

**Indexes:**
```javascript
db.transactions.createIndex({ userId: 1, date: -1 })  // User's recent transactions
db.transactions.createIndex({ userId: 1, category: 1, date: -1 })  // Category analysis
db.transactions.createIndex({ userId: 1, "ml_metadata.is_anomalous": 1 })  // Anomaly queries
```

**Sharding:**
```javascript
sh.shardCollection("finpilot.transactions", { userId: "hashed" })
```

---

**budgets**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  period: "monthly",  // "weekly" | "monthly" | "yearly"
  start_date: ISODate("2026-02-01T00:00:00Z"),
  end_date: ISODate("2026-02-29T23:59:59Z"),
  
  categories: [
    {
      category: "Food & Dining",
      budgeted: 400.00,
      spent: 287.50,  // Updated real-time via aggregation
      percentage: 71.88,
      status: "on_track",  // "on_track" | "warning" | "exceeded"
      forecast: {
        projected_end_of_month: 385.00,
        overshoot_probability: 0.15
      }
    },
    {
      category: "Shopping",
      budgeted: 200.00,
      spent: 245.80,
      percentage: 122.90,
      status: "exceeded",
      exceeded_by: 45.80
    }
  ],
  
  total_budgeted: 1500.00,
  total_spent: 987.30,
  remaining: 512.70,
  
  created_at: ISODate("2026-02-01T00:00:00Z"),
  updated_at: ISODate("2026-02-20T10:30:00Z")
}
```

---

**goals**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  title: "Emergency Fund",
  description: "Save 6 months of expenses",
  target_amount: 15000.00,
  current_amount: 4200.00,
  deadline: ISODate("2027-08-01T00:00:00Z"),
  
  // ML-powered projections
  projections: {
    required_monthly_savings: 450.00,
    current_trajectory: 320.00,  // Based on historical savings rate
    success_probability: 0.62,
    last_calculated: ISODate("2026-02-20T00:00:00Z"),
    confidence_interval: {
      optimistic: 16200.00,  // 90th percentile
      pessimistic: 10800.00  // 10th percentile
    }
  },
  
  category: "emergency_fund",  // "emergency_fund" | "vacation" | "purchase" | "debt" | "investment"
  status: "in_progress",  // "not_started" | "in_progress" | "completed" | "abandoned"
  
  milestones: [
    {
      percentage: 25,
      amount: 3750.00,
      achieved: true,
      achieved_at: ISODate("2025-12-15T00:00:00Z")
    },
    {
      percentage: 50,
      amount: 7500.00,
      achieved: false
    }
  ],
  
  created_at: ISODate("2025-08-01T00:00:00Z"),
  updated_at: ISODate("2026-02-20T10:30:00Z")
}
```

---

**insights**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  type: "behavioral",  // "behavioral" | "forecast" | "anomaly" | "recommendation"
  
  // For behavioral insights
  insight: {
    pattern: "weekend_overspending",
    severity: "moderate",
    detected_at: ISODate("2026-02-20T00:00:00Z"),
    data: {
      weekend_avg: 85.50,
      weekday_avg: 42.30,
      monthly_impact: 692.00,
      frequency: "consistent_last_8_weeks"
    },
    recommendation: {
      title: "Set Weekend Spending Limit",
      description: "You spend 2x more on weekends. Setting a $50/day weekend limit could save you $692/month.",
      action: "set_weekend_limit",
      estimated_savings: 692.00
    }
  },
  
  // User actions
  status: "active",  // "active" | "dismissed" | "actioned"
  user_action: {
    action_taken: "set_budget_limit",
    actioned_at: ISODate("2026-02-21T08:00:00Z")
  },
  
  expires_at: ISODate("2026-03-20T00:00:00Z"),  // Insights expire after 30 days
  created_at: ISODate("2026-02-20T00:00:00Z")
}
```

---

**community_aggregates**
```javascript
{
  _id: ObjectId("..."),
  age_group: "25-30",
  calculation_date: ISODate("2026-02-20T00:00:00Z"),
  sample_size: 2847,  // Must be >50 for privacy
  
  metrics: {
    savings_rate: {
      p10: 0.05,
      p25: 0.10,
      p50: 0.15,
      p75: 0.22,
      p90: 0.35
    },
    health_score: {
      p10: 42,
      p25: 58,
      p50: 68,
      p75: 79,
      p90: 88
    },
    spending_volatility: {
      p10: 0.15,
      p25: 0.22,
      p50: 0.30,
      p75: 0.42,
      p90: 0.60
    },
    category_averages: {
      "Food & Dining": { mean: 385.50, median: 350.00 },
      "Transportation": { mean: 180.20, median: 165.00 }
      // ... other categories
    }
  },
  
  // Privacy metadata
  privacy: {
    noise_applied: true,
    epsilon: 2.0,  // Differential privacy parameter
    minimum_group_size: 50
  },
  
  next_update: ISODate("2026-02-21T00:00:00Z")
}
```

---

**model_feedback**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  transaction_id: ObjectId("..."),
  
  model_type: "category_prediction",  // "category_prediction" | "anomaly_detection"
  
  // Original prediction
  prediction: {
    category: "Entertainment",
    confidence: 0.78,
    model_version: "v1.2.3"
  },
  
  // User correction
  correction: {
    actual_category: "Food & Dining",
    corrected_at: ISODate("2026-02-20T10:30:00Z")
  },
  
  // Feature snapshot for retraining
  features: {
    description: "AMC THEATERS #4231",
    amount: -28.50,
    merchant: "AMC Entertainment"
  },
  
  // Training metadata
  used_in_training: false,
  training_batch: null,
  
  created_at: ISODate("2026-02-20T10:30:00Z")
}
```

**Indexes:**
```javascript
db.model_feedback.createIndex({ used_in_training: 1 })  // Find unused feedback for retraining
db.model_feedback.createIndex({ model_type: 1, created_at: -1 })
```

---

## 5. API Architecture

### 5.1 REST API Design Principles

**Versioning:** Path-based (`/api/v1/...`)

**Authentication:** JWT Bearer tokens

**Rate Limiting:** 100 requests per 15 minutes per user

**Response Format:**
```typescript
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2026-02-20T10:30:00Z",
    "version": "v1"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY",
    "message": "Category 'Foo' does not exist",
    "details": { "valid_categories": [...] }
  },
  "meta": {
    "timestamp": "2026-02-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

### 5.2 Core API Endpoints

**Authentication**
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

**Transactions**
```
GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id
DELETE /api/v1/transactions/:id

GET    /api/v1/transactions/stats
GET    /api/v1/transactions/export (CSV)
POST   /api/v1/transactions/import (CSV)
```

**Budgets**
```
GET    /api/v1/budgets/current
POST   /api/v1/budgets
GET    /api/v1/budgets/:id
PATCH  /api/v1/budgets/:id
DELETE /api/v1/budgets/:id

GET    /api/v1/budgets/:id/progress
```

**Goals**
```
GET    /api/v1/goals
POST   /api/v1/goals
GET    /api/v1/goals/:id
PATCH  /api/v1/goals/:id
DELETE /api/v1/goals/:id

GET    /api/v1/goals/:id/projections
POST   /api/v1/goals/:id/contributions
```

**Insights**
```
GET    /api/v1/insights
GET    /api/v1/insights/:id
POST   /api/v1/insights/:id/dismiss
POST   /api/v1/insights/:id/action
```

**Analytics**
```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/trends
GET    /api/v1/analytics/category-breakdown
GET    /api/v1/analytics/income-vs-expense
```

**Community**
```
GET    /api/v1/community/benchmarks
GET    /api/v1/community/percentiles
POST   /api/v1/community/opt-in
POST   /api/v1/community/opt-out
```

---

### 5.3 AI Microservice Endpoints

**NLP Categorization**
```
POST /ai/v1/categorize
Request:
{
  "description": "STARBUCKS #12345",
  "amount": -5.50,
  "merchant": "Starbucks"
}

Response:
{
  "prediction": {
    "category": "Food & Dining",
    "subcategory": "Coffee Shops",
    "confidence": 0.92,
    "model_version": "v1.2.3"
  },
  "alternatives": [
    { "category": "Entertainment", "probability": 0.05 }
  ],
  "reasoning": {
    "keywords": ["starbucks", "coffee"],
    "features": [...]
  }
}
```

**Forecast**
```
POST /ai/v1/forecast/balance
POST /ai/v1/forecast/category-spending
POST /ai/v1/forecast/runway
```

**Anomaly Detection**
```
POST /ai/v1/anomaly/detect
POST /ai/v1/anomaly/batch
```

**Health Score**
```
POST /ai/v1/health-score/calculate
POST /ai/v1/health-score/breakdown
```

**Behavioral Analysis**
```
POST /ai/v1/behavior/analyze
POST /ai/v1/behavior/patterns
```

**Simulation**
```
POST /ai/v1/simulate/savings
POST /ai/v1/simulate/goal-probability
```

**Model Management**
```
GET  /ai/v1/models/status
POST /ai/v1/models/retrain
GET  /ai/v1/models/metrics
```

---

## 6. Security Architecture

### 6.1 Authentication Flow (JWT + Refresh Token Rotation)

**Login Flow:**
```
1. User submits email + password
2. Server validates credentials (bcrypt.compare)
3. Server generates:
   - Access Token (JWT, 15 min expiry)
   - Refresh Token (JWT, 7 day expiry, httpOnly cookie)
4. Access token stored in memory (React state)
5. Refresh token stored in httpOnly cookie
```

**Access Token Payload:**
```javascript
{
  userId: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  tokenVersion: 1,  // Matches user.auth.refresh_token_version
  iat: 1708425000,
  exp: 1708425900  // 15 minutes
}
```

**Refresh Token Rotation:**
```
1. Access token expires
2. Frontend calls /api/v1/auth/refresh with refresh token cookie
3. Server validates refresh token
4. Server checks tokenVersion matches DB
5. Server generates NEW access + refresh tokens
6. Server increments tokenVersion in DB (invalidates old tokens)
7. Returns new tokens to client
```

**Logout:**
```
1. User clicks logout
2. Frontend calls /api/v1/auth/logout
3. Server increments user.auth.refresh_token_version
4. All existing tokens invalidated (version mismatch)
5. Clear cookies and local state
```

---

### 6.2 Security Middleware Stack

**Express Middleware Chain:**
```javascript
const app = express();

// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  maxAge: 86400
}));

// 3. Rate Limiting (Redis-backed)
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100,  // Number of requests
  duration: 900,  // Per 15 minutes
  blockDuration: 900  // Block for 15 min if exceeded
});

app.use(async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    await rateLimiter.consume(userId);
    next();
  } catch (err) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  }
});

// 4. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. MongoDB injection protection
app.use(mongoSanitize());

// 6. JWT authentication (protected routes only)
app.use('/api/v1/transactions', authenticateJWT);
app.use('/api/v1/budgets', authenticateJWT);
// ... other protected routes
```

---

### 6.3 Password Security

**Hashing:**
```javascript
const bcrypt = require('bcryptjs');

// Registration
const SALT_ROUNDS = 12;  // 2^12 iterations (250ms hash time)
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Password Policy:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special char
- Check against compromised password list (Have I Been Pwned API)

---

### 6.4 Sensitive Data Encryption

**Field-Level Encryption (MongoDB):**
```javascript
// Encrypt sensitive fields before storage
const crypto = require('crypto');

function encryptField(text) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Apply to sensitive fields
user.banking_details = encryptField(JSON.stringify(bankingData));
```

---

### 6.5 Audit Logging

**Log Structure:**
```javascript
{
  timestamp: ISODate("2026-02-20T10:30:00Z"),
  userId: ObjectId("..."),
  action: "transaction.delete",
  resource: "transactions/abc123",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0 ...",
  request_id: "req_xyz789",
  result: "success",
  metadata: {
    transaction_amount: -45.50,
    category: "Food & Dining"
  }
}
```

**Audit Trail Events:**
- Authentication (login, logout, password change)
- Data modification (create, update, delete transactions/budgets)
- Security events (failed login, rate limit, token refresh)
- Privacy actions (community opt-in/out, data export)

---

## 7. Deployment Architecture

### 7.1 Infrastructure Components

**Frontend: Vercel**
- Next.js App Router (SSR + ISR)
- Edge caching for static assets
- Automatic HTTPS
- Preview deployments per Git branch

**Backend: Render**
- Docker container (Node.js 20)
- Auto-scaling: 2-10 instances based on CPU
- Health check: `GET /health`
- Zero-downtime deployments (rolling restart)

**AI Service: Render (separate service)**
- Docker container (Python 3.11)
- GPU instance (optional, for future deep learning)
- Model files stored in S3/GCS
- Health check: `GET /ai/health`

**Database: MongoDB Atlas**
- M10 cluster (2GB RAM, auto-scaling storage)
- 3-node replica set (automatic failover)
- Daily automated backups (7-day retention)
- Point-in-time recovery (PITR)
- Sharding enabled (user-based shard key)

**Cache: Upstash Redis**
- Serverless Redis (pay-per-request)
- Global replication for low latency
- Automatic eviction (LRU policy)

**Job Queue: Render Background Workers**
- BullMQ with Redis backend
- Separate worker instances (1-3 based on queue depth)
- Jobs: aggregation, ML retraining, email notifications

---

### 7.2 Environment Variables

**Backend (.env)**
```bash
# Server
NODE_ENV=production
PORT=8080
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finpilot?retryWrites=true
REDIS_URL=redis://default:pass@redis-server:6379

# Security
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<256-bit-secret>
ENCRYPTION_KEY=<256-bit-hex-key>
BCRYPT_ROUNDS=12

# External Services
AI_SERVICE_URL=https://finpilot-ai.onrender.com
AI_SERVICE_API_KEY=<api-key>

# Frontend
FRONTEND_URL=https://finpilot.vercel.app

# Email (SendGrid/Resend)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=<key>

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
```

**AI Service (.env)**
```bash
# Server
PYTHON_ENV=production
PORT=8000

# Models
MODEL_VERSION=v1.2.3
MODEL_STORAGE_PATH=/app/models
MODEL_S3_BUCKET=finpilot-ml-models

# Database (read-only for training data)
MONGODB_URI_READONLY=mongodb+srv://readonly:pass@cluster.mongodb.net/finpilot

# Performance
WORKERS=4  # Uvicorn workers
MAX_BATCH_SIZE=100

# Monitoring
SENTRY_DSN=<sentry-dsn>
```

---

### 7.3 Docker Configuration

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8080

CMD ["node", "dist/server.js"]
```

**AI Service Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Download models on build (bake into image)
RUN python scripts/download_models.py

# Security: non-root user
RUN useradd -m -u 1001 python
USER python

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

### 7.4 CI/CD Pipeline (GitHub Actions)

**Backend Pipeline (.github/workflows/backend.yml):**
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Run linter
        run: npm run lint
        working-directory: ./backend
      
      - name: Run tests
        run: npm test -- --coverage
        working-directory: ./backend
        env:
          NODE_ENV: test
          MONGODB_URI: ${{ secrets.MONGODB_TEST_URI }}
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

**AI Service Pipeline (.github/workflows/ai-service.yml):**
```yaml
name: AI Service CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'ai-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
        working-directory: ./ai-service
      
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
        working-directory: ./ai-service
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_AI_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 8. Monitoring & Observability

### 8.1 Logging Strategy (Structured Logs)

**Log Format (JSON):**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'finpilot-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Example log
logger.info('Transaction created', {
  userId: 'abc123',
  transactionId: 'txn_xyz',
  amount: -45.50,
  category: 'Food',
  duration_ms: 23
});
```

**Log Aggregation:** Ship logs to Datadog/Logtail/Better Stack

---

### 8.2 Application Performance Monitoring (APM)

**Sentry Integration:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // Sample 10% of transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mongo()
  ]
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

**Custom Metrics:**
```javascript
// Track ML prediction latency
Sentry.setTag('ml_model_version', 'v1.2.3');
Sentry.addBreadcrumb({
  category: 'ml',
  message: 'Category prediction',
  level: 'info',
  data: { confidence: 0.92, latency_ms: 45 }
});
```

---

### 8.3 Health Checks

**Backend Health Endpoint:**
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };
  
  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = 'connected';
  } catch (err) {
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check Redis
  try {
    await redisClient.ping();
    health.services.redis = 'connected';
  } catch (err) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check AI service
  try {
    const aiHealth = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
    health.services.ai = aiHealth.data.status;
  } catch (err) {
    health.services.ai = 'unavailable';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### 8.4 ML Model Monitoring

**Model Drift Detection:**
```python
# Store prediction confidence over time
db.model_metrics.insert_one({
    "model_version": "v1.2.3",
    "timestamp": datetime.now(),
    "avg_confidence": 0.87,
    "predictions_count": 10000,
    "user_corrections": 450  # Correction rate: 4.5%
})

# Alert if correction rate > 10% (model degrading)
```

**Retraining Triggers:**
1. **Time-based:** Weekly retraining schedule
2. **Feedback-based:** Every 10,000 user corrections
3. **Drift-based:** Correction rate exceeds 10%

---

## 9. Scalability Strategy

### 9.1 Horizontal Scaling

**Stateless Services:**
- No in-memory session storage (use JWT)
- All state in MongoDB/Redis
- Enables load balancing across N instances

**Load Balancing Strategy:**
```
Render Load Balancer (Round Robin)
    ↓
┌───────┬───────┬───────┐
│ API-1 │ API-2 │ API-3 │ (Auto-scale 2-10 instances)
└───────┴───────┴───────┘
```

---

### 9.2 Caching Strategy

**Cache Layers:**

**L1: In-Memory (Node.js process)**
```javascript
// Cache category list (rarely changes)
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

function getCategories() {
  const cached = cache.get('categories');
  if (cached) return cached;
  
  const categories = db.categories.find();
  cache.set('categories', categories);
  return categories;
}
```

**L2: Redis (shared across instances)**
```javascript
// Cache user dashboard data (5 min TTL)
async function getDashboard(userId) {
  const cacheKey = `dashboard:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const dashboard = await computeDashboard(userId);
  await redis.setex(cacheKey, 300, JSON.stringify(dashboard));
  return dashboard;
}
```

**L3: MongoDB Read Replicas**
- Route analytics queries to read replicas
- Primary handles writes only

---

### 9.3 Database Optimization

**Indexes:**
```javascript
// Ensure all queries use indexes
db.transactions.createIndex({ userId: 1, date: -1 });
db.transactions.createIndex({ userId: 1, category: 1, date: -1 });
db.budgets.createIndex({ userId: 1, "period": 1 });

// Check query performance
db.transactions.find({ userId: "..." }).explain("executionStats");
// Should show "IXSCAN" not "COLLSCAN"
```

**Aggregation Optimization:**
```javascript
// Use $facet for multi-metric dashboard (1 query instead of 5)
db.transactions.aggregate([
  { $match: { userId: ObjectId(userId) } },
  {
    $facet: {
      totalSpent: [
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ],
      categoryBreakdown: [
        { $group: { _id: "$category", total: { $sum: "$amount" } } }
      ],
      recentTransactions: [
        { $sort: { date: -1 } },
        { $limit: 10 }
      ]
    }
  }
]);
```

---

### 9.4 Background Job Optimization

**Job Queue (BullMQ):**
```javascript
const { Queue, Worker } = require('bullmq');

// Define queues
const aggregationQueue = new Queue('aggregation', { connection: redis });
const mlRetrainingQueue = new Queue('ml-retraining', { connection: redis });

// Add jobs
await aggregationQueue.add('update-community-stats', {}, {
  repeat: { cron: '0 * * * *' }  // Hourly
});

// Worker processes jobs
const worker = new Worker('aggregation', async (job) => {
  if (job.name === 'update-community-stats') {
    await updateCommunityAggregates();
  }
}, { connection: redis, concurrency: 5 });
```

---

## 10. Production Folder Structure

```
finpilot/
├── frontend/                   # Next.js 15 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── budgets/
│   │   │   │   └── page.tsx
│   │   │   ├── goals/
│   │   │   │   └── page.tsx
│   │   │   ├── insights/
│   │   │   │   └── page.tsx
│   │   │   ├── community/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── NetWorthCard.tsx
│   │   │   │   ├── IncomeExpenseChart.tsx
│   │   │   │   ├── CategoryDonutChart.tsx
│   │   │   │   ├── HealthScoreMeter.tsx
│   │   │   │   └── RiskAlertBadge.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── TransactionList.tsx
│   │   │   │   ├── TransactionForm.tsx
│   │   │   │   ├── CategorySelector.tsx
│   │   │   │   └── TransactionFilters.tsx
│   │   │   ├── insights/
│   │   │   │   ├── ForecastChart.tsx
│   │   │   │   ├── AnomalyAlert.tsx
│   │   │   │   ├── BehavioralInsightCard.tsx
│   │   │   │   └── SavingsSimulator.tsx
│   │   │   ├── goals/
│   │   │   │   ├── GoalCard.tsx
│   │   │   │   ├── GoalForm.tsx
│   │   │   │   └── GoalProgressChart.tsx
│   │   │   ├── community/
│   │   │   │   ├── PercentileChart.tsx
│   │   │   │   ├── BenchmarkCard.tsx
│   │   │   │   └── PrivacyToggle.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LanguageSwitcher.tsx
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── budgets.ts
│   │   │   │   ├── goals.ts
│   │   │   │   ├── insights.ts
│   │   │   │   └── auth.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useTransactions.ts
│   │   │   │   ├── useBudgets.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── utils/
│   │   │   │   ├── formatCurrency.ts
│   │   │   │   ├── formatDate.ts
│   │   │   │   └── validation.ts
│   │   │   ├── store/
│   │   │   │   ├── authStore.ts
│   │   │   │   └── themeStore.ts
│   │   │   └── types/
│   │   │       ├── transaction.ts
│   │   │       ├── budget.ts
│   │   │       ├── goal.ts
│   │   │       └── api.ts
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── hi.json
│   │   └── styles/
│   │       ├── fonts.css
│   │       └── theme.css
│   ├── public/
│   │   ├── logo.svg
│   │   └── icons/
│   ├── .env.local
│   ├── .env.production
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── jwt.ts
│   │   │   └── environment.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── Budget.ts
│   │   │   ├── Goal.ts
│   │   │   ├── Insight.ts
│   │   │   ├── CommunityAggregate.ts
│   │   │   └── ModelFeedback.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── transactionController.ts
│   │   │   ├── budgetController.ts
│   │   │   ├── goalController.ts
│   │   │   ├── insightController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── communityController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── transactionService.ts
│   │   │   ├── budgetService.ts
│   │   │   ├── goalService.ts
│   │   │   ├── aiService.ts          # Proxy to AI microservice
│   │   │   ├── cacheService.ts
│   │   │   └── communityService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── routes/
│   │   │   ├── v1/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── budgets.ts
│   │   │   │   ├── goals.ts
│   │   │   │   ├── insights.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── community.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── jobs/
│   │   │   ├── aggregationJobs.ts
│   │   │   ├── mlRetrainingJobs.ts
│   │   │   └── notificationJobs.ts
│   │   ├── utils/
│   │   │   ├── encryption.ts
│   │   │   ├── validation.ts
│   │   │   ├── dateUtils.ts
│   │   │   └── errorCodes.ts
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   └── models.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   ├── auth.test.ts
│   │   │   ├── transactions.test.ts
│   │   │   └── budgets.test.ts
│   │   └── setup.ts
│   ├── .env
│   ├── .env.production
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── package.json
│   └── nodemon.json
│
├── ai-service/                 # FastAPI + ML Models
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── categorization.py
│   │   │   │   ├── forecasting.py
│   │   │   │   ├── anomaly_detection.py
│   │   │   │   ├── health_score.py
│   │   │   │   ├── behavioral_analysis.py
│   │   │   │   ├── simulation.py
│   │   │   │   └── models.py         # Model management
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   ├── ml/
│   │   │   ├── models/
│   │   │   │   ├── categorizer.py
│   │   │   │   ├── forecaster.py
│   │   │   │   ├── anomaly_detector.py
│   │   │   │   ├── health_scorer.py
│   │   │   │   └── base_model.py
│   │   │   ├── training/
│   │   │   │   ├── train_categorizer.py
│   │   │   │   ├── train_anomaly.py
│   │   │   │   └── train_forecaster.py
│   │   │   ├── preprocessing/
│   │   │   │   ├── text_processor.py
│   │   │   │   ├── feature_engineer.py
│   │   │   │   └── scalers.py
│   │   │   └── evaluation/
│   │   │       ├── metrics.py
│   │   │       └── validation.py
│   │   ├── schemas/
│   │   │   ├── categorization.py
│   │   │   ├── forecasting.py
│   │   │   ├── anomaly.py
│   │   │   └── common.py
│   │   ├── services/
│   │   │   ├── model_loader.py
│   │   │   ├── prediction_service.py
│   │   │   └── cache_service.py
│   │   ├── utils/
│   │   │   ├── helpers.py
│   │   │   └── validators.py
│   │   └── main.py
│   ├── models/                 # Trained model files
│   │   ├── categorizer_v1.2.3.joblib
│   │   ├── anomaly_detector_v1.0.1.joblib
│   │   └── model_metadata.json
│   ├── scripts/
│   │   ├── download_models.py
│   │   ├── retrain_all.py
│   │   └── evaluate_models.py
│   ├── tests/
│   │   ├── test_categorization.py
│   │   ├── test_forecasting.py
│   │   └── test_anomaly.py
│   ├── .env
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
│
├── shared/                     # Shared types/constants
│   ├── constants/
│   │   ├── categories.ts
│   │   ├── currencies.ts
│   │   └── errorCodes.ts
│   └── types/
│       └── api.ts
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── ML_MODELS.md
│   └── SECURITY.md
│
├── .github/
│   ├── workflows/
│   │   ├── frontend.yml
│   │   ├── backend.yml
│   │   └── ai-service.yml
│   └── CODEOWNERS
│
├── docker-compose.yml          # Local development
├── .gitignore
├── README.md
└── LICENSE
```

---

## 11. Testing Strategy

### 11.1 Backend Testing

**Unit Tests:**
```javascript
// tests/unit/services/transactionService.test.ts
describe('TransactionService', () => {
  describe('createTransaction', () => {
    it('should create transaction with ML categorization', async () => {
      const txn = await transactionService.create({
        userId: 'user123',
        amount: -45.50,
        description: 'STARBUCKS #12345'
      });
      
      expect(txn.category).toBe('Food & Dining');
      expect(txn.ml_metadata.confidence).toBeGreaterThan(0.8);
    });
  });
});
```

**Integration Tests:**
```javascript
// tests/integration/auth.test.ts
describe('POST /api/v1/auth/login', () => {
  it('should return JWT tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });
});
```

---

### 11.2 AI Service Testing

**Model Tests:**
```python
# tests/test_categorization.py
def test_categorizer_accuracy():
    model = load_model('categorizer_v1.2.3')
    test_data = load_test_dataset()
    
    predictions = model.predict(test_data['descriptions'])
    accuracy = accuracy_score(test_data['actual_categories'], predictions)
    
    assert accuracy > 0.85, f"Model accuracy {accuracy} below threshold"
```

**API Tests:**
```python
def test_categorization_endpoint():
    response = client.post('/ai/v1/categorize', json={
        'description': 'UBER TRIP',
        'amount': -25.50
    })
    
    assert response.status_code == 200
    assert response.json()['prediction']['category'] == 'Transportation'
    assert response.json()['prediction']['confidence'] > 0.7
```

---

## 12. Summary

This architecture document outlines a production-grade, scalable, and secure financial intelligence platform with:

✅ **Real ML (not rules):** TF-IDF, Prophet, Isolation Forest  
✅ **Explainable AI:** Every prediction includes reasoning  
✅ **Microservices:** Independently scalable, fault-isolated  
✅ **Security:** JWT rotation, bcrypt, rate limiting, encryption  
✅ **Privacy:** Anonymous aggregation, opt-in benchmarking  
✅ **Scalability:** Horizontal scaling, caching, sharding  
✅ **Observability:** Structured logging, APM, health checks  
✅ **CI/CD:** Automated testing and deployment  

**Next Steps:**
1. Review and approve architecture
2. Proceed with code generation
3. Set up infrastructure (MongoDB Atlas, Render, Vercel)
4. Deploy MVP with initial ML models
5. Iterate based on user feedback

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Prepared By:** Senior FinTech System Architect Team
