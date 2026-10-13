export const financialTools = [
  {
    type: "function",
    function: {
      name: "get_spending",
      description:
        "Get total spending for a specific date range in YYYY-MM-DD format. Use this tool whenever the user asks about general spending, total expenses, or asks 'how much did I spend', 'how did I spend last month', 'what did we spend', or 'total spending for a period'. The startDate is inclusive and the endDate is exclusive.",
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
        "Get recent transactions belonging to the user's family. Use this when the user asks to see, list, or review family transactions. Provide startDate and endDate to filter by a specific date range, or omit them to get the most recent transactions across all time.",
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
      "Get the total income received by the user's family for a selected time period. Use this when the user asks about family income or earnings.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "current_month",
            "last_month",
            "all",
          ],
          description:
            "The time period for which to calculate total family income.",
        },
      },
      required: ["period"],
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
      "Get the total income earned by a specific family member during a specific date range. Use this whenever the user asks how much a particular family member earned during a period of time.",
    parameters: {
      type: "object",
      properties: {
        memberName: {
          type: "string",
          description:
            "The name of the family member whose income should be calculated.",
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
    },
  },
},
];