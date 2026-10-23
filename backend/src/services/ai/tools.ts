export const financialTools = [
  {
    type: "function",
    function: {
      name: "get_spending",
      description:
        "Get total spending for a specific date range in YYYY-MM-DD format. Use this tool whenever the user asks about general spending, total expenses, finances, or asks 'how much did I spend', 'what did we spend', 'how about spending?', or 'what about expenses?'. The startDate is inclusive and the endDate is exclusive.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description:
              "Start date of the spending period in YYYY-MM-DD format (inclusive).",
          },
          endDate: {
            type: "string",
            description:
              "End date of the spending period in YYYY-MM-DD format (exclusive).",
          },
        },
        required: ["startDate", "endDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_category_spending",
      description:
        "Get the total family spending for a specific expense category during a specific date range. Use this when the user asks how much the family spent on a particular category during a period of time.",
      parameters: {
        type: "object",
        properties: {
          categoryName: {
            type: "string",
            description:
              "The expense category to calculate spending for.",
          },
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format. This date is inclusive.",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format. This date is exclusive.",
          },
        },
        required: [
          "categoryName",
          "startDate",
          "endDate",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_family_transactions",
      description:
        "Get a list of recent transactions belonging to the user's family. Use this ONLY when the user explicitly asks to view, list, or see recent transactions (e.g. 'show my recent transactions' or 'what was my last purchase'). NEVER use this tool to calculate spending totals, income totals, or member breakdowns - use get_spending, get_income_summary, get_family_members_spending, or get_family_members_income instead.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format (inclusive). Provide together with endDate to filter transactions to a specific period.",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format (exclusive). Provide together with startDate to filter transactions to a specific period.",
          },
          limit: {
            type: "integer",
            description:
              "Maximum number of transactions to return. Defaults to 10 if not specified. Maximum is 20.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_family_members_spending",
      description:
        "Get the authoritative breakdown of expense spending by each family member for a specific date range. Use this whenever the user asks how much each member spent, who spent what, member-wise expenses, or asks how much 'everyone' or 'all members' or 'each member' or 'each person' in the family spent (e.g. 'how much did everyone in my family spend this month?' or 'member wise spending').",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format (inclusive).",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format (exclusive).",
          },
        },
        required: ["startDate", "endDate"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_family_members_income",
      description:
        "Get the authoritative breakdown of income earned by each family member for a specific date range. Use this whenever the user asks how much each member earned, who earned what, member-wise income, or asks how much 'everyone' or 'all members' or 'each member' or 'each person' in the family earned (e.g. 'how much did everyone in my family earn this month?' or 'member wise income').",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format (inclusive).",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format (exclusive).",
          },
        },
        required: ["startDate", "endDate"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_member_spending",
      description:
        "Get total expense spending for a specific named family member by their proper name (e.g. 'how much did Mummy spend?' or 'how much did John spend?'). Only use when a specific person's name is explicitly given. Do NOT use for 'I', 'me', or 'we' - use get_spending instead.",
      parameters: {
        type: "object",
        properties: {
          memberName: {
            type: "string",
            description:
              "The actual proper name of the family member (e.g. Mummy, Archit).",
          },
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format (inclusive).",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format (exclusive).",
          },
        },
        required: ["memberName", "startDate", "endDate"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_income_summary",
      description:
        "Get total income received by the user's family for a selected time period or date range. Use this tool whenever the user asks about income, earnings, or asks follow-up questions like 'what about income?', 'how about income?', 'and income?', 'tell me about income', or 'what was our income'.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description:
              "Start date in YYYY-MM-DD format (inclusive).",
          },
          endDate: {
            type: "string",
            description:
              "End date in YYYY-MM-DD format (exclusive).",
          },
          period: {
            type: "string",
            enum: [
              "current_month",
              "last_month",
              "all",
            ],
            description:
              "The named time period if specific startDate and endDate are not provided.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_spending_trends",
      description:
        "Get the user's family monthly expense totals over a selected number of recent months. Use this when the user asks about spending trends, changes in spending over time, or whether spending is increasing or decreasing.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "integer",
            description:
              "Number of recent months to analyze. Use 6 for a normal spending trend question unless the user specifies another period.",
          },
        },
        required: ["months"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_member_income",
      description:
        "Get total income earned by a specific named family member by their proper name (e.g. 'how much did Archit earn?' or 'how much did Mummy earn?'). Only use when a specific person's name is explicitly given. Do NOT use for 'everyone', 'all members', or family totals - use get_family_members_income or get_income_summary instead.",
      parameters: {
        type: "object",
        properties: {
          memberName: {
            type: "string",
            description:
              "The proper name of the family member whose income should be calculated.",
          },
          startDate: {
            type: "string",
            description:
              "Start date of the income period in YYYY-MM-DD format. This date is inclusive.",
          },
          endDate: {
            type: "string",
            description:
              "End date of the income period in YYYY-MM-DD format. This date is exclusive.",
          },
        },
        required: [
          "memberName",
          "startDate",
          "endDate",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_budget_status",
      description:
        "Get the authoritative monthly budget status, category spending limits, actual spending vs budget targets, remaining buffer, and overbudget alerts for a specific month and year. Use this whenever the user asks about budgets, monthly targets, whether they are over budget, remaining budget buffer, or how much budget is left in general or for a specific category.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "integer",
            description:
              "Calendar month number (1 to 12). If omitted, defaults to the current month.",
          },
          year: {
            type: "integer",
            description:
              "Calendar year (e.g. 2026). If omitted, defaults to the current year.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_upcoming_bills",
      description:
        "Get scheduled recurring bills, subscriptions, and recurring income due within a given number of days (default 30 days). Use this whenever the user asks about upcoming bills, due dates, subscriptions, rent due, EMIs, salary dates, or what payments are coming up soon.",
      parameters: {
        type: "object",
        properties: {
          daysAhead: {
            type: "integer",
            description:
              "Number of days ahead to inspect for due dates (e.g. 7, 14, 30). Defaults to 30.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];
