# models.py
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import date

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

