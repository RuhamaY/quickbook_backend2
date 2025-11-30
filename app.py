import os
import json
import time
import base64
from pathlib import Path
from urllib.parse import urlencode
from typing import Optional, Dict, List
import uuid

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Path as FPath, File, UploadFile, Body
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, Field, EmailStr, InvoiceProcessedOut
from datetime import date
from models.py import In

# =================== CONFIG ===================
REDIRECT_URI = "http://localhost:8000/auth/callback"   # Must be in Dev → Keys & OAuth → Redirect URIs
SCOPE = "com.intuit.quickbooks.accounting"
AUTH_BASE_URL = "https://appcenter.intuit.com/connect/oauth2"
TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
API_HOST = "https://sandbox-quickbooks.api.intuit.com"   # Sandbox for Dev keys
TOKENS_FILE = Path("tokens.json")
MINOR_VERSION = "75"  # QBO minor version (safe default)

# SmythOS document processing
SMYTHOS_URL = "https://cmibggacvudrki1w959u2rb3g.agent.a.smyth.ai/api/process_document"
INVOICE_STORAGE_DIR = "invoices"  # Local folder for uploaded invoices



# ==============================================

# Load secrets
load_dotenv()
CLIENT_ID = (os.getenv("CLIENT_ID") or os.getenv("CLIENT_ID") or "").strip()
CLIENT_SECRET = (os.getenv("CLIENT_SECRET") or os.getenv("CLIENT_SECRET") or "").strip()
SMYTHOS_API_KEY = (os.getenv("SMYTHOS_API_KEY") or "").strip()

if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit("Missing INTUIT_CLIENT_aID / INTUIT_CLIENT_SECRET (or CLIENT_ID / CLIENT_SECRET) in env/.env")

app = FastAPI(title="QBO Sandbox API", version="1.3.0")

# QuickBooks Account IDs (set these to your actual QBO Account IDs)
AP_ACCOUNT_ID = (os.getenv("AP_ACCOUNT_ID") or "").strip()
EXPENSE_ACCOUNT_ID = (os.getenv("EXPENSE_ACCOUNT_ID") or "").strip()

print("DEBUG AP_ACCOUNT_ID:", repr(AP_ACCOUNT_ID))
print("DEBUG EXPENSE_ACCOUNT_ID:", repr(EXPENSE_ACCOUNT_ID))

# ============================================================
# TOKEN PERSISTENCE / AUTH HELPERS
# ============================================================

def save_tokens(tokens: dict):
    with TOKENS_FILE.open("w") as f:
        json.dump(tokens, f, indent=2)

def load_tokens():
    if not TOKENS_FILE.exists():
        return None
    with TOKENS_FILE.open() as f:
        return json.load(f)

def basic_auth_header():
    creds = f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    return base64.b64encode(creds).decode()

def ensure_tokens():
    tokens = load_tokens()
    if not tokens:
        raise HTTPException(status_code=400, detail="Not authorized yet. Hit /auth/start first.")
    if not tokens.get("access_token") or not tokens.get("realm_id"):
        raise HTTPException(status_code=400, detail="tokens.json missing access_token or realm_id. Re-auth at /auth/start.")
    return tokens

def exchange_code_for_tokens(code: str):
    headers = {
        "Authorization": f"Basic {basic_auth_header()}",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI}
    r = requests.post(TOKEN_URL, headers=headers, data=data, timeout=30)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

def refresh_tokens(refresh_token: str):
    headers = {
        "Authorization": f"Basic {basic_auth_header()}",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    r = requests.post(TOKEN_URL, headers=headers, data=data, timeout=30)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

# ============================================================
# QBO HELPERS (QUERY, GET, POST) WITH REFRESH
# ============================================================

def qbo_query(access_token: str, realm_id: str, sql: str):
    url = f"{API_HOST}/v3/company/{realm_id}/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/text",  # 'text/plain' also works
    }
    params = {"query": sql, "minorversion": MINOR_VERSION}
    return requests.get(url, headers=headers, params=params, timeout=30)

def qbo_get_by_id(access_token: str, realm_id: str, resource: str, entity_id: str):
    url = f"{API_HOST}/v3/company/{realm_id}/{resource}/{entity_id}"
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    params = {"minorversion": MINOR_VERSION}
    return requests.get(url, headers=headers, params=params, timeout=30)

def qbo_post(access_token: str, realm_id: str, resource: str, body: dict):
    """
    Generic POST helper for creating entities (Bill, Invoice, etc).
    """
    url = f"{API_HOST}/v3/company/{realm_id}/{resource}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    params = {"minorversion": MINOR_VERSION}
    return requests.post(url, headers=headers, params=params, data=json.dumps(body), timeout=30)

def with_refresh(request_fn, tokens, *args, **kwargs):
    access_token = tokens["access_token"]
    realm_id = tokens["realm_id"]
    resp = request_fn(access_token, realm_id, *args, **kwargs)
    if resp.status_code == 401 and tokens.get("refresh_token"):
        newt = refresh_tokens(tokens["refresh_token"])
        newt["realm_id"] = realm_id
        save_tokens(newt)
        resp = request_fn(newt["access_token"], realm_id, *args, **kwargs)
    return resp

def respond(resp):
    try:
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    if not resp.ok:
        raise HTTPException(status_code=resp.status_code, detail=data)
    return JSONResponse(content=data)

# ============================================================
# ENTITY MAP + GENERIC ROUTES
# ============================================================

ENTITY_MAP = {
    "customers":      ("Customer",     "customer"),
    "vendors":        ("Vendor",       "vendor"),
    "items":          ("Item",         "item"),
    "accounts":       ("Account",      "account"),
    "invoices":       ("Invoice",      "invoice"),
    "bills":          ("Bill",         "bill"),
    "payments":       ("Payment",      "payment"),
    "purchases":      ("Purchase",     "purchase"),      # expense transactions
    "employees":      ("Employee",     "employee"),
    "estimates":      ("Estimate",     "estimate"),
    "credit_memos":   ("CreditMemo",   "creditmemo"),
    "journal_entries":("JournalEntry", "journalentry"),
    "classes":        ("Class",        "class"),
    "departments":    ("Department",   "department"),
    "taxcodes":       ("TaxCode",      "taxcode"),
}

def list_route_factory(plural: str):
    entity, _resource = ENTITY_MAP[plural]

    @app.get(f"/{plural}")
    def list_entities(
        where: str | None = Query(None, description="Optional WHERE clause, e.g. DisplayName like 'A%%'"),
        orderby: str | None = Query(None, description="Optional ORDER BY, e.g. MetaData.CreateTime desc"),
        start: int = Query(1, ge=1, description="StartPosition (1-based)"),
        max: int = Query(100, ge=1, le=1000, description="MaxResults (1..1000)")
    ):
        tokens = ensure_tokens()
        sql = f"select * from {entity}"
        if where:
            sql += f" where {where}"
        if orderby:
            sql += f" order by {orderby}"
        sql += f" startposition {start} maxresults {max}"
        resp = with_refresh(qbo_query, tokens, sql)
        return respond(resp)

def by_id_route_factory(plural: str):
    _entity, resource = ENTITY_MAP[plural]

    @app.get(f"/{plural}/{{entity_id}}")
    def get_entity_by_id(entity_id: str = FPath(..., description="QBO entity Id")):
        tokens = ensure_tokens()
        resp = with_refresh(qbo_get_by_id, tokens, resource, entity_id)
        return respond(resp)

for plural in ENTITY_MAP.keys():
    list_route_factory(plural)
    by_id_route_factory(plural)

# ============================================================
# SEARCH HELPERS (CUSTOMERS / VENDORS)
# ============================================================

@app.get("/customers/search")
def customers_search(
    name: str | None = Query(None, description="DisplayName exact or prefix (see prefix flag)"),
    email: str | None = Query(None, description="PrimaryEmailAddr.Address"),
    phone: str | None = Query(None, description="PrimaryPhone.FreeFormNumber"),
    prefix: bool = Query(False, description="If true, name is treated as prefix (like 'Acme%%')"),
    max: int = Query(1, ge=1, le=1000)
):
    tokens = ensure_tokens()
    where_clauses = []
    if name:
        if prefix:
            where_clauses.append(f"DisplayName like '{name}%'")
        else:
            where_clauses.append(f"DisplayName = '{name}'")
    if email:
        where_clauses.append(f"PrimaryEmailAddr.Address = '{email}'")
    if phone:
        where_clauses.append(f"PrimaryPhone.FreeFormNumber = '{phone}'")
    where = " and ".join(where_clauses) if where_clauses else None
    sql = "select * from Customer"
    if where:
        sql += f" where {where}"
    sql += f" startposition 1 maxresults {max}"
    resp = with_refresh(qbo_query, tokens, sql)
    return respond(resp)

@app.get("/vendors/search")
def vendors_search(
    name: str | None = Query(None, description="DisplayName exact or prefix"),
    email: str | None = Query(None, description="PrimaryEmailAddr.Address"),
    phone: str | None = Query(None, description="PrimaryPhone.FreeFormNumber"),
    prefix: bool = Query(False, description="If true, name is treated as prefix"),
    max: int = Query(1, ge=1, le=1000)
):
    tokens = ensure_tokens()
    where_clauses = []
    if name:
        if prefix:
            where_clauses.append(f"DisplayName like '{name}%'")
        else:
            where_clauses.append(f"DisplayName = '{name}'")
    if email:
        where_clauses.append(f"PrimaryEmailAddr.Address = '{email}'")
    if phone:
        where_clauses.append(f"PrimaryPhone.FreeFormNumber = '{phone}'")
    where = " and ".join(where_clauses) if where_clauses else None
    sql = "select * from Vendor"
    if where:
        sql += f" where {where}"
    sql += f" startposition 1 maxresults {max}"
    resp = with_refresh(qbo_query, tokens, sql)
    return respond(resp)

# ============================================================
# BASIC CORE ROUTES
# ============================================================

@app.get("/health")
def health():
    return {"status": "ok", "time": int(time.time())}

@app.get("/auth/start")
def auth_start():
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "state": "random_state_123",
    }
    url = f"{AUTH_BASE_URL}?{urlencode(params)}"
    return RedirectResponse(url)

@app.get("/auth/callback")
def auth_callback(code: str, realmId: str, state: str | None = None):
    tokens = exchange_code_for_tokens(code)
    tokens["realm_id"] = realmId
    save_tokens(tokens)
    return {"message": "Authorization successful", "realm_id": realmId, "scopes": tokens.get("scope")}

@app.get("/auth/tokens")
def inspect_tokens():
    tokens = load_tokens()
    if not tokens:
        return {"tokens": None}
    redacted = dict(tokens)
    if "access_token" in redacted:
        redacted["access_token"] = redacted["access_token"][:16] + "…"
    if "refresh_token" in redacted:
        redacted["refresh_token"] = redacted["refresh_token"][:16] + "…"
    return {"tokens": redacted}

@app.get("/companyinfo")
def api_company_info():
    tokens = ensure_tokens()
    def call(access_token, realm_id):
        url = f"{API_HOST}/v3/company/{realm_id}/companyinfo/{realm_id}"
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        return requests.get(url, headers=headers, params={"minorversion": MINOR_VERSION}, timeout=30)
    resp = with_refresh(lambda at, rid: call(at, rid), tokens)
    return respond(resp)

@app.get("/query")
def api_query(sql: str = Query(..., description="QBO SQL, e.g. select * from Customer")):
    tokens = ensure_tokens()
    resp = with_refresh(qbo_query, tokens, sql)
    return respond(resp)

# ============================================================
# OCR → INVOICE MODELS
# ============================================================

class InvoiceLineItem(BaseModel):
    description: Optional[str] = None
    quantity: float = Field(ge=0)
    unit_price: float = Field(ge=0)
    amount: float = Field(ge=0)


class InvoiceIn(BaseModel):
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    invoice_date: Optional[date]
    due_date: Optional[date]
    currency: Optional[str]
    line_items: List[InvoiceLineItem]
    subtotal: float
    tax: float
    total: float
    source: Optional[str]
    original_subject: Optional[str]
    sender_email: Optional[EmailStr]
    file_url: Optional[str]


class InvoiceProcessedOut(BaseModel):
    status: str
    internal_invoice_id: str
    vendor_name: Optional[str]
    total: float
    quickbooks_bill_id: Optional[str] = None
    quickbooks_link: Optional[str] = None
    quickbooks_raw_response: Optional[Dict] = None


# ============================================================
# BILL HELPERS
# ============================================================

def resolve_vendor_id_from_qbo(vendor_name: Optional[str]) -> str:
    """
    Resolves vendor_name -> VendorRef.value in QuickBooks using a QBO query.
    """
    if not vendor_name:
        return ""

    tokens = ensure_tokens()
    # Exact match; you can relax this later
    where = f"DisplayName = '{vendor_name}'"
    sql = f"select * from Vendor where {where} startposition 1 maxresults 1"

    resp = with_refresh(qbo_query, tokens, sql)
    if not resp.ok:
        return ""

    try:
        data = resp.json()
    except Exception:
        return ""

    vendors = data.get("QueryResponse", {}).get("Vendor", [])
    if not vendors:
        return ""
    return vendors[0].get("Id", "")


def build_qbo_bill_from_invoice(
    invoice: InvoiceIn,
    vendor_id: str,
    ap_account_id: str,
    expense_account_id: str,
) -> Dict:
    """
    Convert InvoiceIn into a QuickBooks Bill payload.
    """
    if not vendor_id:
        raise ValueError("vendor_id is required to create a QuickBooks Bill")

    line_items = []
    for item in invoice.line_items:
        line_items.append({
            "DetailType": "AccountBasedExpenseLineDetail",
            "Amount": float(item.amount),
            "Description": item.description or "",
            "AccountBasedExpenseLineDetail": {
                "AccountRef": {
                    "value": expense_account_id
                }
            }
        })

    bill = {
        "VendorRef": {"value": vendor_id},
        "APAccountRef": {"value": ap_account_id},
        "Line": line_items,
    }
    HOME_CURRENCY = "USD"
    if invoice.invoice_number:
        bill["DocNumber"] = invoice.invoice_number
    if invoice.invoice_date:
        bill["TxnDate"] = invoice.invoice_date.isoformat()
    if invoice.due_date:
        bill["DueDate"] = invoice.due_date.isoformat()
    bill["CurrencyRef"] = {"value": HOME_CURRENCY}

    note_parts = []
    if invoice.source:
        note_parts.append(f"Source: {invoice.source}")
    if invoice.file_url:
        note_parts.append(f"File: {invoice.file_url}")
    if note_parts:
        bill["PrivateNote"] = " | ".join(note_parts)

    return bill


# ============================================================
# INVOICE → BILL ENDPOINT (SmythOS → QBO BILL)
# ============================================================

@app.post("/bills/from-ocr", response_model=InvoiceProcessedOut)
async def create_bill_from_ocr(invoice: InvoiceIn = Body(...)):
    """
    Called directly by SmythOS agent.

    Body is the structured invoice JSON, e.g.:

    {
      "vendor_name": "CPB SOFTWARE (GERMANO GMBH",
      "invoice_number": "123100401",
      "invoice_date": "2024-03-01",
      "due_date": null,
      "currency": "EUR",
      "line_items": [ ... ],
      "subtotal": 308.78,
      "tax": 72.41,
      "total": 381.19,
      "source": "OCR",
      "file_url": "https://..."
    }
    """

    # 1) Resolve vendor in QuickBooks from vendor_name
    vendor_id = resolve_vendor_id_from_qbo(invoice.vendor_name)
    if not vendor_id:
        raise HTTPException(
            status_code=400,
            detail="Could not resolve vendor in QuickBooks from vendor_name"
        )
    if not AP_ACCOUNT_ID or not EXPENSE_ACCOUNT_ID:
        raise HTTPException(
            status_code=500,
            detail="AP_ACCOUNT_ID or EXPENSE_ACCOUNT_ID is not set. Please set these as environment variables."
        )

    bill_payload = build_qbo_bill_from_invoice(
        invoice=invoice,
        vendor_id=vendor_id,
        ap_account_id=AP_ACCOUNT_ID,
        expense_account_id=EXPENSE_ACCOUNT_ID,
    )

    # 3) Create Bill in QuickBooks (reuse token plumbing)
    tokens = ensure_tokens()
    resp = with_refresh(qbo_post, tokens, "bill", bill_payload)

    if not resp.ok:
        try:
            data = resp.json()
        except Exception:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        raise HTTPException(status_code=resp.status_code, detail=data)

    qbo_data = resp.json()
    bill_obj = qbo_data.get("Bill") or qbo_data.get("bill") or {}
    bill_id = bill_obj.get("Id")
    bill_link = f"https://app.sandbox.qbo.intuit.com/app/bill?txnId={bill_id}" if bill_id else None

    internal_id = str(uuid.uuid4())

    return InvoiceProcessedOut(
        status="bill_created",
        internal_invoice_id=internal_id,
        vendor_name=invoice.vendor_name,
        total=invoice.total,
        quickbooks_bill_id=bill_id,
        quickbooks_link=bill_link,
        quickbooks_raw_response=qbo_data,
    )


