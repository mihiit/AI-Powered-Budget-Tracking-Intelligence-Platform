# FinPilot AI — API Reference

Complete REST API documentation for backend integration.

---

## Authentication

All protected endpoints require JWT Bearer token in Authorization header:

```http
Authorization: Bearer <access_token>
```

### POST /api/v1/auth/register

Register new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "age": 26
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "meta": {
    "timestamp": "2026-02-20T10:30:00Z",
    "version": "v1"
  }
}
```

### POST /api/v1/auth/login

Authenticate user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/v1/auth/refresh

Refresh access token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Transactions

### GET /api/v1/transactions

Get user's transactions.

**Query Parameters:**

- `limit` (number, default: 50) - Number of transactions
- `offset` (number, default: 0) - Pagination offset
- `type` (string) - Filter by type: "income" | "expense" | "transfer"
- `category` (string) - Filter by category
- `startDate` (ISO date) - Filter from date
- `endDate` (ISO date) - Filter to date

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_xyz123",
        "type": "expense",
        "amount": -45.50,
        "category": "Food & Dining",
        "subcategory": "Restaurants",
        "description": "CHIPOTLE #2847",
        "merchant": {
          "name": "Chipotle Mexican Grill",
          "location": "San Francisco, CA"
        },
        "date": "2026-02-19T18:45:00Z",
        "mlMetadata": {
          "categoryPrediction": {
            "model_version": "v1.2.3",
            "confidence": 0.94,
            "alternatives": [
              { "category": "Fast Food", "probability": 0.04 }
            ],
            "userCorrected": false
          },
          "anomalyScore": 0.12,
          "isAnomalous": false
        },
        "source": "manual",
        "tags": ["weekend"],
        "notes": "Dinner with friends"
      }
    ],
    "pagination": {
      "total": 234,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### POST /api/v1/transactions

Create new transaction.

**Request Body:**

```json
{
  "type": "expense",
  "amount": -45.50,
  "description": "Grocery shopping",
  "date": "2026-02-20T14:30:00Z",
  "category": "Food & Dining",
  "subcategory": "Groceries",
  "merchant": "Whole Foods",
  "tags": ["weekend"],
  "notes": "Weekly groceries"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "transaction": { /* Full transaction object */ },
    "aiAnalysis": {
      "categorySuggestion": {
        "predicted": "Food & Dining",
        "confidence": 0.92,
        "reasoning": "Keywords 'grocery', 'food' matched Food & Dining",
        "alternatives": [
          { "category": "Shopping", "probability": 0.05 }
        ]
      },
      "anomalyDetection": {
        "isAnomalous": false,
        "score": 0.3,
        "message": "Transaction amount is within normal range"
      }
    }
  }
}
```

### PATCH /api/v1/transactions/:id

Update transaction.

**Request Body:**

```json
{
  "category": "Shopping",
  "notes": "Updated category"
}
```

**Response:** `200 OK`

### DELETE /api/v1/transactions/:id

Delete transaction.

**Response:** `204 No Content`

---

## Budgets

### GET /api/v1/budgets/current

Get current month's budget.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget_current",
      "period": "monthly",
      "startDate": "2026-02-01T00:00:00Z",
      "endDate": "2026-02-29T23:59:59Z",
      "categories": [
        {
          "category": "Food & Dining",
          "budgeted": 500.00,
          "spent": 387.50,
          "percentage": 77.5,
          "status": "on_track",
          "forecast": {
            "projectedEndOfMonth": 485.00,
            "overshootProbability": 0.15
          }
        }
      ],
      "totalBudgeted": 2000.00,
      "totalSpent": 1870.60,
      "remaining": 129.40
    }
  }
}
```

### POST /api/v1/budgets

Create new budget.

**Request Body:**

```json
{
  "period": "monthly",
  "categories": [
    {
      "category": "Food & Dining",
      "budgeted": 500.00
    },
    {
      "category": "Transportation",
      "budgeted": 300.00
    }
  ]
}
```

**Response:** `201 Created`

---

## Goals

### GET /api/v1/goals

Get all financial goals.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_1",
        "title": "Emergency Fund",
        "description": "Save 6 months of expenses",
        "targetAmount": 15000.00,
        "currentAmount": 4200.00,
        "deadline": "2027-08-01T00:00:00Z",
        "projections": {
          "requiredMonthlySavings": 450.00,
          "currentTrajectory": 320.00,
          "successProbability": 0.62,
          "lastCalculated": "2026-02-20T10:30:00Z",
          "confidenceInterval": {
            "optimistic": 16200.00,
            "pessimistic": 10800.00
          }
        },
        "category": "emergency_fund",
        "status": "in_progress",
        "milestones": [
          {
            "percentage": 25,
            "amount": 3750.00,
            "achieved": true,
            "achievedAt": "2025-12-15T00:00:00Z"
          }
        ]
      }
    ]
  }
}
```

### POST /api/v1/goals

Create new goal.

**Request Body:**

```json
{
  "title": "New MacBook",
  "description": "Save for MacBook Pro M3",
  "targetAmount": 2500.00,
  "deadline": "2026-07-01T00:00:00Z",
  "category": "purchase"
}
```

**Response:** `201 Created`

### GET /api/v1/goals/:id/projections

Get AI-powered goal projections.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "projections": {
      "requiredMonthlySavings": 330.00,
      "currentTrajectory": 200.00,
      "successProbability": 0.48,
      "monteCarlo": {
        "simulations": 10000,
        "successCount": 4800,
        "confidenceInterval": {
          "p10": 1900.00,
          "p50": 2350.00,
          "p90": 2800.00
        }
      },
      "recommendations": [
        {
          "action": "increase_monthly_savings",
          "amount": 130.00,
          "impact": "Raises success probability to 78%"
        }
      ]
    }
  }
}
```

---

## Insights

### GET /api/v1/insights

Get personalized insights.

**Query Parameters:**

- `type` (string) - Filter by type: "behavioral" | "forecast" | "anomaly" | "recommendation"
- `status` (string) - Filter by status: "active" | "dismissed" | "actioned"

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "insight_1",
        "type": "behavioral",
        "insight": {
          "pattern": "weekend_overspending",
          "severity": "moderate",
          "detectedAt": "2026-02-20T00:00:00Z",
          "data": {
            "weekendAvg": 85.50,
            "weekdayAvg": 42.30,
            "monthlyImpact": 692.00
          },
          "recommendation": {
            "title": "Set Weekend Spending Limit",
            "description": "You spend 2x more on weekends...",
            "action": "set_weekend_limit",
            "estimatedSavings": 692.00
          }
        },
        "status": "active",
        "expiresAt": "2026-03-20T00:00:00Z"
      }
    ]
  }
}
```

### POST /api/v1/insights/:id/dismiss

Dismiss an insight.

**Response:** `200 OK`

### POST /api/v1/insights/:id/action

Mark insight as actioned.

**Request Body:**

```json
{
  "actionTaken": "set_budget_limit",
  "notes": "Set weekend limit to $50/day"
}
```

**Response:** `200 OK`

---

## Analytics

### GET /api/v1/analytics/dashboard

Get dashboard summary.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": {
      "currentBalance": 4200.00,
      "monthlyIncome": 5000.00,
      "monthlyExpense": 1870.60,
      "savingsRate": 0.62
    },
    "healthScore": {
      "score": 72.5,
      "grade": "B",
      "breakdown": {
        "savingsRatio": { "score": 68, "weight": 0.30 },
        "budgetAdherence": { "score": 75, "weight": 0.20 }
      }
    },
    "cashFlowRisk": {
      "level": "moderate",
      "probabilityOfOverdraft": 0.23,
      "estimatedRunwayDays": 18
    }
  }
}
```

---

## AI Microservice Endpoints

### POST /ai/v1/categorize

Categorize transaction using ML.

**Request Body:**

```json
{
  "description": "UBER *TRIP 123ABC",
  "amount": -25.50,
  "merchant": "Uber Technologies"
}
```

**Response:** `200 OK`

```json
{
  "prediction": {
    "category": "Transportation",
    "subcategory": "Ride Share",
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

### POST /ai/v1/forecast/balance

Forecast future balance.

```json
{
  "userId": "usr_abc123",
  "timeframe": "month",
  "includeUpcomingBills": true
}
```

**Response:** `200 OK`

```json
{
  "prediction": {
    "date": "2026-03-31",
    "balance": 1250.00,
    "confidenceInterval": {
      "lower": 980.00,
      "upper": 1520.00
    }
  },
  "trendAnalysis": {
    "trendDirection": "stable",
    "avgDailyBurn": -42.30,
    "seasonalFactors": [
      { "type": "weekly", "impact": "+12% on weekends" }
    ]
  }
}
```

### POST /ai/v1/anomaly/detect

Detect transaction anomalies.

**Request Body:**

```json
{
  "transaction": {
    "amount": -500.00,
    "category": "Shopping",
    "merchant": "UNKNOWN VENDOR XYZ",
    "timestamp": "2026-02-20T23:45:00Z"
  },
  "userId": "usr_abc123"
}
```

**Response:** `200 OK`

```json
{
  "isAnomaly": true,
  "severity": "high",
  "anomalyScore": -0.82,
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
      }
    ]
  },
  "recommendedAction": "review_transaction"
}
```

### POST /ai/v1/health-score/calculate

Calculate financial health score.

**Request Body:**

```json
{
  "userId": "usr_abc123"
}
```

**Response:** `200 OK`

```json
{
  "score": 72.5,
  "grade": {
    "grade": "B",
    "status": "Good",
    "color": "blue"
  },
  "breakdown": {
    "savingsRatio": { "score": 68, "weight": 0.30, "value": 0.18 },
    "budgetAdherence": { "score": 75, "weight": 0.20, "value": 0.83 },
    "spendingVolatility": { "score": 82, "weight": 0.20, "value": 0.32 },
    "incomeConsistency": { "score": 95, "weight": 0.15, "value": 0.98 },
    "emergencyBuffer": { "score": 42, "weight": 0.15, "value": 1.2 }
  },
  "explanation": {
    "strengths": ["Consistent income", "Low spending volatility"],
    "weaknesses": ["Emergency buffer below 3 months"],
    "recommendations": ["Increase emergency fund by $300/month"]
  }
}
```

### POST /ai/v1/simulate/savings

Simulate savings scenarios.

**Request Body:**

```json
{
  "userId": "usr_abc123",
  "scenario": {
    "changes": [
      { "category": "Food & Dining", "adjustment": -0.20 },
      { "category": "Transportation", "adjustment": -0.15 }
    ],
    "timeframeMonths": 12
  }
}
```

**Response:** `200 OK`

```json
{
  "monthlySavingsIncrease": 123.50,
  "totalSavings12mo": 1482.00,
  "healthScoreImpact": "+4.2",
  "goalSuccessProbability": {
    "before": 0.62,
    "after": 0.78,
    "delta": 0.16
  },
  "compoundedGrowth": {
    "principal": 1482.00,
    "interest": 29.64,
    "total": 1511.64,
    "assumptions": "4% annual return"
  }
}
```

---

## Community Benchmarks

### GET /api/v1/community/benchmarks

Get anonymous community benchmarks.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "userPercentiles": {
      "savingsRate": {
        "value": 0.18,
        "percentile": 67,
        "ageGroup": "25-30",
        "message": "You save more than 67% of peers"
      },
      "spendingVolatility": {
        "value": 0.32,
        "percentile": 45,
        "message": "Your spending consistency is average"
      }
    },
    "groupStats": {
      "ageGroup": "25-30",
      "sampleSize": 2847,
      "avgSavingsRate": 0.15,
      "medianHealthScore": 68
    },
    "privacyNote": "All data anonymized across 2800+ users"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY",
    "message": "Category 'Foo' does not exist",
    "details": {
      "validCategories": ["Food & Dining", "Transportation", ...]
    }
  },
  "meta": {
    "timestamp": "2026-02-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid access token
- `FORBIDDEN` (403) - Valid token but insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (422) - Invalid request body
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per user
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 87`
  - `X-RateLimit-Reset: 1708425900` (Unix timestamp)

---

## API Versioning

All endpoints are versioned: `/api/v1/...`

Breaking changes will increment major version: `/api/v2/...`

---

## WebSocket Events (Future)

Real-time updates (planned):

- `transaction.created`
- `budget.exceeded`
- `insight.new`
- `goal.milestone`

---

**API Version:** v1.0  
**Last Updated:** 2026-02-20  
**Base URL:** `https://api.finpilot.ai`
