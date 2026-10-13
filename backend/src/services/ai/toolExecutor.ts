import {
  getSpendingByDateRange,
  getCategorySpending,
  getFamilyTransactions,
  getMemberSpending,
  getMemberSpendingByDateRange,
  getIncomeSummary,
  getSpendingTrends,
  getMemberIncomeByDateRange,
} from "../transactionService.js";

export async function executeFinancialTool(
  toolName: string,
  familyId: number,
  arguments_: Record<string, unknown> = {},
) {
  switch (toolName) {
    case "get_spending": {
      const startDate = arguments_.startDate;
      const endDate = arguments_.endDate;

      if (
        typeof startDate !== "string" ||
        typeof endDate !== "string"
      ) {
        throw new Error(
          "startDate and endDate are required.",
        );
      }

      const start = new Date(`${startDate}T00:00:00Z`);
      const end = new Date(`${endDate}T00:00:00Z`);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        throw new Error(
          "Invalid date format. Use YYYY-MM-DD.",
        );
      }

      if (start >= end) {
        throw new Error(
          "startDate must be before endDate.",
        );
      }

      return getSpendingByDateRange(
        familyId,
        startDate,
        endDate,
      );
    }

    case "get_category_spending": {
      const categoryName =
        arguments_.categoryName;

      const startDate =
        arguments_.startDate;

      const endDate =
        arguments_.endDate;

      if (
        typeof categoryName !== "string" ||
        categoryName.trim().length === 0
      ) {
        throw new Error(
          "categoryName is required.",
        );
      }

      if (
        typeof startDate !== "string" ||
        typeof endDate !== "string"
      ) {
        throw new Error(
          "startDate and endDate are required.",
        );
      }

      const start = new Date(
        `${startDate}T00:00:00Z`,
      );

      const end = new Date(
        `${endDate}T00:00:00Z`,
      );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        throw new Error(
          "Invalid date format. Use YYYY-MM-DD.",
        );
      }

      if (start >= end) {
        throw new Error(
          "startDate must be before endDate.",
        );
      }

      return getCategorySpending(
        familyId,
        categoryName,
        startDate,
        endDate,
      );
    }

    case "get_family_transactions": {
      const rawLimit = arguments_.limit;
      const startDate = arguments_.startDate;
      const endDate = arguments_.endDate;

      const limit =
        typeof rawLimit === "number" && Number.isFinite(rawLimit)
          ? rawLimit
          : 10;

      if (startDate !== undefined || endDate !== undefined) {
        if (
          typeof startDate !== "string" ||
          typeof endDate !== "string"
        ) {
          throw new Error(
            "Both startDate and endDate must be provided together.",
          );
        }

        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);

        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          throw new Error(
            "Invalid date format. Use YYYY-MM-DD.",
          );
        }

        if (start >= end) {
          throw new Error(
            "startDate must be before endDate.",
          );
        }

        return getFamilyTransactions(
          familyId,
          limit,
          startDate,
          endDate,
        );
      }

      return getFamilyTransactions(familyId, limit);
    }

    case "get_member_spending": {
      const rawMemberName = arguments_.memberName;

      if (
        typeof rawMemberName !== "string" ||
        rawMemberName.trim().length === 0
      ) {
        throw new Error(
          "memberName is required for get_member_spending.",
        );
      }

      const memberName = rawMemberName.trim();
      const lowerMember = memberName.toLowerCase();
      const isPersonalPronoun =
        lowerMember === "i" ||
        lowerMember === "me" ||
        lowerMember === "my" ||
        lowerMember === "myself" ||
        lowerMember === "we" ||
        lowerMember === "our";

      let startDate: string;
      let endDate: string;

      if (
        typeof arguments_.startDate === "string" &&
        typeof arguments_.endDate === "string"
      ) {
        startDate = arguments_.startDate;
        endDate = arguments_.endDate;
      } else {
        const rawPeriod =
          typeof arguments_.period === "string" ? arguments_.period : "";
        const normalizedPeriod = rawPeriod
          .toLowerCase()
          .replace(/[\s-]+/g, "_");

        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();

        if (normalizedPeriod === "current_month") {
          startDate = new Date(Date.UTC(year, month, 1))
            .toISOString()
            .slice(0, 10);
          endDate = new Date(Date.UTC(year, month + 1, 1))
            .toISOString()
            .slice(0, 10);
        } else if (normalizedPeriod === "last_month") {
          startDate = new Date(Date.UTC(year, month - 1, 1))
            .toISOString()
            .slice(0, 10);
          endDate = new Date(Date.UTC(year, month, 1))
            .toISOString()
            .slice(0, 10);
        } else if (normalizedPeriod === "all" || !rawPeriod) {
          startDate = "2000-01-01";
          endDate = new Date(Date.UTC(year + 1, 0, 1))
            .toISOString()
            .slice(0, 10);
        } else {
          throw new Error(
            "startDate and endDate in YYYY-MM-DD format are required.",
          );
        }
      }

      const start = new Date(`${startDate}T00:00:00Z`);
      const end = new Date(`${endDate}T00:00:00Z`);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        throw new Error(
          "Invalid date format. Use YYYY-MM-DD.",
        );
      }

      if (start >= end) {
        throw new Error(
          "startDate must be before endDate.",
        );
      }

      if (isPersonalPronoun) {
        return getSpendingByDateRange(
          familyId,
          startDate,
          endDate,
        );
      }

      return getMemberSpendingByDateRange(
        familyId,
        memberName,
        startDate,
        endDate,
      );
    }

    case "get_income_summary": {
      const rawPeriod = arguments_.period;
      const period =
        typeof rawPeriod === "string"
          ? rawPeriod.toLowerCase().replace(/[\s-]+/g, "_")
          : "";

      if (
        period !== "current_month" &&
        period !== "last_month" &&
        period !== "all"
      ) {
        throw new Error(
          "Invalid period for get_income_summary.",
        );
      }

      return getIncomeSummary(
        familyId,
        period as "current_month" | "last_month" | "all",
      );
    }

    case "get_spending_trends": {
      const months = arguments_.months;

      if (
        typeof months !== "number" ||
        !Number.isFinite(months)
      ) {
        throw new Error(
          "A valid months value is required for get_spending_trends.",
        );
      }

      return getSpendingTrends(
        familyId,
        months,
      );
    }

    case "get_member_income": {
      const memberName =
        arguments_.memberName;

      const startDate =
        arguments_.startDate;

      const endDate =
        arguments_.endDate;

      if (
        typeof memberName !== "string" ||
        memberName.trim().length === 0
      ) {
        throw new Error(
          "memberName is required.",
        );
      }

      if (
        typeof startDate !== "string" ||
        typeof endDate !== "string"
      ) {
        throw new Error(
          "startDate and endDate are required.",
        );
      }

      const start = new Date(
        `${startDate}T00:00:00Z`,
      );

      const end = new Date(
        `${endDate}T00:00:00Z`,
      );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        throw new Error(
          "Invalid date format. Use YYYY-MM-DD.",
        );
      }

      if (start >= end) {
        throw new Error(
          "startDate must be before endDate.",
        );
      }

      return getMemberIncomeByDateRange(
        familyId,
        memberName.trim(),
        startDate,
        endDate,
      );
    }

    default:
      throw new Error(
        `Unknown financial tool: ${toolName}`,
      );
  }
}