// OpenAPI/Swagger specification
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "QuickBooks Online API",
    version: "1.3.0",
    description: "API for integrating with QuickBooks Online. Provides OAuth authentication, entity management, and bill creation from OCR-processed invoices.",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "https://localhost:3000",
      description: "Development server (HTTPS)",
    },
    {
      url: "http://localhost:3000",
      description: "Development server (HTTP - not recommended)",
    },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Authentication", description: "OAuth 2.0 authentication endpoints" },
    { name: "Company", description: "Company information endpoints" },
    { name: "Entities", description: "QuickBooks entity management (customers, vendors, invoices, etc.)" },
    { name: "Search", description: "Search endpoints for customers and vendors" },
    { name: "Bills", description: "Bill creation and management" },
    { name: "Query", description: "Custom SQL query endpoints" },
    { name: "Expenses", description: "Expense category endpoints" },
    { name: "Transactions", description: "Transaction processing endpoints" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns the health status of the API",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    time: { type: "integer", description: "Unix timestamp" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/start": {
      get: {
        tags: ["Authentication"],
        summary: "Start OAuth flow",
        description: "Initiates the OAuth 2.0 authorization flow with Intuit/QuickBooks",
        responses: {
          "302": {
            description: "Redirects to Intuit OAuth authorization page",
          },
        },
      },
    },
    "/api/auth/callback": {
      get: {
        tags: ["Authentication"],
        summary: "OAuth callback",
        description: "Handles the OAuth callback from Intuit after user authorization",
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Authorization code from Intuit",
          },
          {
            name: "realmId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "QuickBooks company realm ID",
          },
          {
            name: "state",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "OAuth state parameter",
          },
        ],
        responses: {
          "200": {
            description: "Authorization successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Authorization successful" },
                    realm_id: { type: "string" },
                    scopes: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing required parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/tokens": {
      get: {
        tags: ["Authentication"],
        summary: "Inspect tokens",
        description: "Returns the current OAuth tokens (redacted for security)",
        responses: {
          "200": {
            description: "Token information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tokens: {
                      type: "object",
                      nullable: true,
                      properties: {
                        access_token: { type: "string", description: "Redacted access token" },
                        refresh_token: { type: "string", description: "Redacted refresh token" },
                        token_type: { type: "string" },
                        expires_in: { type: "integer" },
                        realm_id: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/companyinfo": {
      get: {
        tags: ["Company"],
        summary: "Get company information",
        description: "Retrieves company information from QuickBooks",
        responses: {
          "200": {
            description: "Company information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks company info response",
                },
              },
            },
          },
          "400": {
            description: "Not authorized or missing tokens",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/query": {
      get: {
        tags: ["Query"],
        summary: "Execute custom SQL query",
        description: "Executes a custom QuickBooks SQL query",
        parameters: [
          {
            name: "sql",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "QuickBooks SQL query (e.g., 'select * from Customer')",
            example: "select * from Customer startposition 1 maxresults 10",
          },
        ],
        responses: {
          "200": {
            description: "Query results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks query response",
                },
              },
            },
          },
          "400": {
            description: "Missing sql parameter",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/{entity}": {
      get: {
        tags: ["Entities"],
        summary: "List entities",
        description: "Lists QuickBooks entities (customers, vendors, invoices, bills, etc.)",
        parameters: [
          {
            name: "entity",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: [
                "customers",
                "vendors",
                "items",
                "accounts",
                "invoices",
                "bills",
                "payments",
                "purchases",
                "employees",
                "estimates",
                "credit_memos",
                "journal_entries",
                "classes",
                "departments",
                "taxcodes",
              ],
            },
            description: "Entity type (plural form)",
          },
          {
            name: "where",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Optional WHERE clause (e.g., 'DisplayName like \\'A%%\\'')",
          },
          {
            name: "orderby",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Optional ORDER BY clause (e.g., 'MetaData.CreateTime desc')",
          },
          {
            name: "start",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Start position (1-based)",
          },
          {
            name: "max",
            in: "query",
            required: false,
            schema: { type: "integer", default: 100, minimum: 1, maximum: 1000 },
            description: "Maximum number of results",
          },
        ],
        responses: {
          "200": {
            description: "List of entities",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks query response",
                },
              },
            },
          },
          "400": {
            description: "Invalid entity type or parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/{entity}/{id}": {
      get: {
        tags: ["Entities"],
        summary: "Get entity by ID",
        description: "Retrieves a specific QuickBooks entity by its ID",
        parameters: [
          {
            name: "entity",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: [
                "customers",
                "vendors",
                "items",
                "accounts",
                "invoices",
                "bills",
                "payments",
                "purchases",
                "employees",
                "estimates",
                "credit_memos",
                "journal_entries",
                "classes",
                "departments",
                "taxcodes",
              ],
            },
            description: "Entity type (plural form)",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Entity ID",
          },
        ],
        responses: {
          "200": {
            description: "Entity details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks entity response",
                },
              },
            },
          },
          "400": {
            description: "Invalid entity type or ID",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/customers/search": {
      get: {
        tags: ["Search"],
        summary: "Search customers",
        description: "Searches for customers by name, email, or phone",
        parameters: [
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "DisplayName (exact or prefix)",
          },
          {
            name: "email",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "PrimaryEmailAddr.Address",
          },
          {
            name: "phone",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "PrimaryPhone.FreeFormNumber",
          },
          {
            name: "prefix",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "If true, name is treated as prefix (like 'Acme%')",
          },
          {
            name: "max",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1, maximum: 1000 },
            description: "Maximum number of results",
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks query response with Customer entities",
                },
              },
            },
          },
        },
      },
    },
    "/api/vendors/search": {
      get: {
        tags: ["Search"],
        summary: "Search vendors",
        description: "Searches for vendors by name, email, or phone",
        parameters: [
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "DisplayName (exact or prefix)",
          },
          {
            name: "email",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "PrimaryEmailAddr.Address",
          },
          {
            name: "phone",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "PrimaryPhone.FreeFormNumber",
          },
          {
            name: "prefix",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "If true, name is treated as prefix",
          },
          {
            name: "max",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1, maximum: 1000 },
            description: "Maximum number of results",
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "QuickBooks query response with Vendor entities",
                },
              },
            },
          },
        },
      },
    },
    "/api/bills/from-ocr": {
      post: {
        tags: ["Bills"],
        summary: "Create bill from OCR invoice",
        description: "Creates a QuickBooks bill from an OCR-processed invoice. Called by SmythOS agent.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["line_items", "subtotal", "tax", "total"],
                properties: {
                  vendor_name: {
                    type: "string",
                    nullable: true,
                    description: "Vendor name (must exist in QuickBooks)",
                  },
                  invoice_number: { type: "string", nullable: true },
                  invoice_date: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    description: "ISO date string (YYYY-MM-DD)",
                  },
                  due_date: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    description: "ISO date string (YYYY-MM-DD)",
                  },
                  currency: { type: "string", nullable: true },
                  line_items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["quantity", "unit_price", "amount"],
                      properties: {
                        description: { type: "string", nullable: true },
                        quantity: { type: "number", minimum: 0 },
                        unit_price: { type: "number", minimum: 0 },
                        amount: { type: "number", minimum: 0 },
                      },
                    },
                  },
                  subtotal: { type: "number" },
                  tax: { type: "number" },
                  total: { type: "number" },
                  source: { type: "string", nullable: true },
                  original_subject: { type: "string", nullable: true },
                  sender_email: { type: "string", format: "email", nullable: true },
                  file_url: { type: "string", nullable: true },
                },
                example: {
                  vendor_name: "CPB SOFTWARE (GERMANO GMBH",
                  invoice_number: "123100401",
                  invoice_date: "2024-03-01",
                  due_date: null,
                  currency: "EUR",
                  line_items: [
                    {
                      description: "Software License",
                      quantity: 1,
                      unit_price: 308.78,
                      amount: 308.78,
                    },
                  ],
                  subtotal: 308.78,
                  tax: 72.41,
                  total: 381.19,
                  source: "OCR",
                  file_url: "https://example.com/invoice.pdf",
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Bill created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "bill_created" },
                    internal_invoice_id: { type: "string", format: "uuid" },
                    vendor_name: { type: "string", nullable: true },
                    total: { type: "number" },
                    quickbooks_bill_id: { type: "string", nullable: true },
                    quickbooks_link: { type: "string", nullable: true },
                    quickbooks_raw_response: {
                      type: "object",
                      nullable: true,
                      description: "Raw QuickBooks API response",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Could not resolve vendor or invalid request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error or missing configuration",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/bills/process-pdf": {
      post: {
        tags: ["Bills"],
        summary: "Process PDF and create bill",
        description: "Takes a PDF URL, sends it to SmythOS for OCR processing, transforms the response to invoice format, and creates a QuickBooks bill. This endpoint handles the entire workflow from PDF to bill creation.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pdf_url"],
                properties: {
                  pdf_url: {
                    type: "string",
                    format: "uri",
                    description: "URL of the PDF invoice to process",
                    example: "https://example.com/invoices/invoice-123.pdf",
                  },
                  url: {
                    type: "string",
                    format: "uri",
                    description: "Alternative field name for PDF URL (alias for pdf_url)",
                  },
                  pdfUrl: {
                    type: "string",
                    format: "uri",
                    description: "Alternative field name for PDF URL (camelCase alias)",
                  },
                },
                example: {
                  pdf_url: "https://example.com/invoices/invoice-123.pdf",
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF processed and bill created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "bill_created",
                    },
                    internal_invoice_id: {
                      type: "string",
                      format: "uuid",
                      description: "Internal tracking ID for the invoice",
                    },
                    vendor_name: {
                      type: "string",
                      nullable: true,
                      description: "Vendor name extracted from PDF",
                    },
                    total: {
                      type: "number",
                      description: "Total amount from the invoice",
                    },
                    quickbooks_bill_id: {
                      type: "string",
                      nullable: true,
                      description: "QuickBooks bill ID",
                    },
                    quickbooks_link: {
                      type: "string",
                      nullable: true,
                      format: "uri",
                      description: "Link to view the bill in QuickBooks",
                    },
                    quickbooks_raw_response: {
                      type: "object",
                      nullable: true,
                      description: "Raw QuickBooks API response",
                    },
                    smythos_response: {
                      type: "object",
                      description: "Raw response from SmythOS OCR processing",
                    },
                    transformed_invoice: {
                      type: "object",
                      description: "Transformed invoice data sent to bill creation",
                      properties: {
                        vendor_name: { type: "string", nullable: true },
                        invoice_number: { type: "string", nullable: true },
                        invoice_date: { type: "string", nullable: true },
                        due_date: { type: "string", nullable: true },
                        currency: { type: "string", nullable: true },
                        line_items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              description: { type: "string", nullable: true },
                              quantity: { type: "number" },
                              unit_price: { type: "number" },
                              amount: { type: "number" },
                            },
                          },
                        },
                        subtotal: { type: "number" },
                        tax: { type: "number" },
                        total: { type: "number" },
                        source: { type: "string", nullable: true },
                        file_url: { type: "string", nullable: true },
                      },
                    },
                  },
                },
                example: {
                  status: "bill_created",
                  internal_invoice_id: "550e8400-e29b-41d4-a716-446655440000",
                  vendor_name: "Acme Corporation",
                  total: 381.19,
                  quickbooks_bill_id: "123",
                  quickbooks_link: "https://app.sandbox.qbo.intuit.com/app/bill?txnId=123",
                  transformed_invoice: {
                    vendor_name: "Acme Corporation",
                    invoice_number: "INV-123",
                    invoice_date: "2024-03-01",
                    line_items: [
                      {
                        description: "Office Supplies",
                        quantity: 1,
                        unit_price: 308.78,
                        amount: 308.78,
                      },
                    ],
                    subtotal: 308.78,
                    tax: 72.41,
                    total: 381.19,
                    source: "SmythOS OCR",
                    file_url: "https://example.com/invoices/invoice-123.pdf",
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing PDF URL, invalid data, or vendor not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    vendor_name: { type: "string", nullable: true },
                    smythos_response: { type: "object", nullable: true },
                    transformed_invoice: { type: "object", nullable: true },
                  },
                },
              },
            },
          },
          "500": {
            description: "SmythOS API error, QuickBooks API error, or server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                    quickbooks_status: { type: "integer", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/expenses": {
      get: {
        tags: ["Expenses"],
        summary: "Get expense categories",
        description: "Returns QuickBooks expense categories, which are Accounts with AccountType in ('Expense', 'Other Expense', 'Cost of Goods Sold')",
        responses: {
          "200": {
            description: "List of expense categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    QueryResponse: {
                      type: "object",
                      properties: {
                        Account: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              Id: {
                                type: "string",
                                description: "Account ID",
                              },
                              Name: {
                                type: "string",
                                description: "Account name",
                              },
                              AccountType: {
                                type: "string",
                                enum: ["Expense", "Other Expense", "Cost of Goods Sold"],
                                description: "Type of expense account",
                              },
                              AccountSubType: {
                                type: "string",
                                nullable: true,
                                description: "Subtype of the account",
                              },
                            },
                          },
                        },
                        startPosition: {
                          type: "integer",
                          description: "Starting position of results",
                        },
                        maxResults: {
                          type: "integer",
                          description: "Maximum number of results",
                        },
                      },
                    },
                    time: {
                      type: "string",
                      description: "Timestamp of the response",
                    },
                  },
                },
                example: {
                  QueryResponse: {
                    Account: [
                      {
                        Id: "1",
                        Name: "Office Supplies",
                        AccountType: "Expense",
                        AccountSubType: "Supplies",
                      },
                      {
                        Id: "2",
                        Name: "Travel",
                        AccountType: "Expense",
                        AccountSubType: "Travel",
                      },
                    ],
                    startPosition: 1,
                    maxResults: 100,
                  },
                  time: "2024-01-01T00:00:00.000-08:00",
                },
              },
            },
          },
          "400": {
            description: "Not authorized or missing tokens",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Not authorized with QuickBooks. Complete the /auth/start → /auth/callback flow first.",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "QuickBooks API error or server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    status: { type: "integer" },
                    qbo_error: {
                      type: "object",
                      description: "QuickBooks API error details",
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/transactions/process": {
      post: {
        tags: ["Transactions"],
        summary: "Process natural language transaction and create purchase",
        description: "Takes a natural language transaction description, sends it to SmythOS for processing, organizes the JSON response, and creates a Purchase transaction in QuickBooks.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["user_message"],
                properties: {
                  user_message: {
                    type: "string",
                    description: "Natural language description of the transaction",
                    example: "Paid $150 to Office Supplies Co for printer paper on 2024-03-15",
                  },
                  message: {
                    type: "string",
                    description: "Alternative field name for user_message",
                  },
                  text: {
                    type: "string",
                    description: "Alternative field name for user_message",
                  },
                },
                example: {
                  user_message: "Paid $150 to Office Supplies Co for printer paper on 2024-03-15",
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction processed and purchase created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "purchase_created",
                    },
                    purchase_id: {
                      type: "string",
                      nullable: true,
                      description: "QuickBooks purchase ID",
                    },
                    purchase_link: {
                      type: "string",
                      nullable: true,
                      format: "uri",
                      description: "Link to view the purchase in QuickBooks",
                    },
                    vendor_name: {
                      type: "string",
                      nullable: true,
                      description: "Vendor name from transaction",
                    },
                    amount: {
                      type: "number",
                      description: "Transaction amount",
                    },
                    date: {
                      type: "string",
                      nullable: true,
                      description: "Transaction date",
                    },
                    quickbooks_response: {
                      type: "object",
                      description: "Raw QuickBooks API response",
                    },
                    organized_transaction: {
                      type: "object",
                      description: "Organized transaction data sent to QuickBooks",
                    },
                    smythos_response: {
                      type: "object",
                      description: "Raw response from SmythOS processing",
                    },
                  },
                },
                example: {
                  status: "purchase_created",
                  purchase_id: "123",
                  purchase_link: "https://app.sandbox.qbo.intuit.com/app/purchase?txnId=123",
                  vendor_name: "Office Supplies Co",
                  amount: 150,
                  date: "2024-03-15",
                },
              },
            },
          },
          "400": {
            description: "Missing user_message or invalid transaction data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    smythos_response: { type: "object", nullable: true },
                    organized_transaction: { type: "object", nullable: true },
                  },
                },
              },
            },
          },
          "500": {
            description: "SmythOS API error, QuickBooks API error, or server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string", nullable: true },
                    organized_transaction: { type: "object", nullable: true },
                    smythos_response: { type: "object", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/transactions/recategorize": {
      post: {
        tags: ["Transactions"],
        summary: "Recategorize a purchase or expense transaction",
        description: "Fetches a purchase/expense from QuickBooks, uses SmythOS to suggest a better category, and updates the transaction with the new category.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["transaction_id"],
                properties: {
                  transaction_id: {
                    type: "string",
                    description: "QuickBooks purchase or expense ID",
                    example: "123",
                  },
                  id: {
                    type: "string",
                    description: "Alternative field name for transaction_id",
                  },
                  purchase_id: {
                    type: "string",
                    description: "Alternative field name for transaction_id (for purchases)",
                  },
                  expense_id: {
                    type: "string",
                    description: "Alternative field name for transaction_id (for expenses)",
                  },
                  is_expense: {
                    type: "boolean",
                    description: "Whether this is an expense (false for purchase)",
                    default: true,
                  },
                  type: {
                    type: "string",
                    enum: ["purchase", "expense"],
                    description: "Transaction type",
                  },
                },
                example: {
                  transaction_id: "123",
                  is_expense: true,
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Transaction recategorized successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "success",
                    },
                    message: {
                      type: "string",
                      example: "Transaction recategorized successfully",
                    },
                    transaction_id: {
                      type: "string",
                      description: "The transaction ID that was updated",
                    },
                    old_category: {
                      type: "string",
                      nullable: true,
                      description: "Previous category name",
                    },
                    new_category: {
                      type: "string",
                      description: "New category name suggested by SmythOS",
                    },
                    new_account_id: {
                      type: "string",
                      description: "QuickBooks account ID for the new category",
                    },
                    updated_transaction: {
                      type: "object",
                      description: "Updated transaction object from QuickBooks",
                    },
                  },
                },
                example: {
                  status: "success",
                  message: "Transaction recategorized successfully",
                  transaction_id: "123",
                  old_category: "Stationery & Printing",
                  new_category: "Office Supplies",
                  new_account_id: "67",
                },
              },
            },
          },
          "400": {
            description: "Missing transaction_id or invalid request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "SmythOS API error, QuickBooks API error, or server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "OAuth 2.0 Bearer Token (handled automatically via /api/auth/start)",
      },
    },
  },
};

