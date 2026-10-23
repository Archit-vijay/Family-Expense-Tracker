import { getBudgetsWithSpending } from "../budgetService.js";
import { getUpcomingBillsForAI } from "../recurringService.js";
import {
  getSpendingByDateRange,
  getCategorySpending,
  getFamilyTransactions,
  getMemberSpending,
  getMemberSpendingByDateRange,
  getIncomeSummary,
  getSpendingTrends,
  getMemberIncomeByDateRange,
  getAllMembersSpendingByDateRange,
  getAllMembersIncomeByDateRange,
  getIncomeByDateRange,
} from "../transactionService.js";

export async function executeFinancialTool(
  toolName: string,
  familyId: number,
  arguments_: Record<string, unknown> = {},
) {
  switch (toolName) {
    case "get_spending": {
      let startDate: string;
      let endDate: string;

      if (
        typeof arguments_.startDate === "string" &&
        typeof arguments_.endDate === "string"
      ) {
        startDate = arguments_.startDate;
        endDate = arguments_.endDate;
      } else {
        const now = new Date();
        const curYear = now.getUTCFullYear();
        const curMonth = now.getUTCMonth();
        startDate = new Date(Date.UTC(curYear, curMonth, 1))
          .toISOString()
          .slice(0, 10);
        endDate = new Date(Date.UTC(curYear, curMonth + 1, 1))
          .toISOString()
          .slice(0, 10);
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

    case "get_family_members_spending": {
      let startDate: string;
      let endDate: string;

      if (
        typeof arguments_.startDate === "string" &&
        typeof arguments_.endDate === "string"
      ) {
        startDate = arguments_.startDate;
        endDate = arguments_.endDate;
      } else {
        const now = new Date();
        const curYear = now.getUTCFullYear();
        const curMonth = now.getUTCMonth();
        startDate = new Date(Date.UTC(curYear, curMonth, 1))
          .toISOString()
          .slice(0, 10);
        endDate = new Date(Date.UTC(curYear, curMonth + 1, 1))
          .toISOString()
          .slice(0, 10);
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

      return getAllMembersSpendingByDateRange(
        familyId,
        startDate,
        endDate,
      );
    }

    case "get_family_members_income": {
      let startDate: string;
      let endDate: string;

      if (
        typeof arguments_.startDate === "string" &&
        typeof arguments_.endDate === "string"
      ) {
        startDate = arguments_.startDate;
        endDate = arguments_.endDate;
      } else {
        const now = new Date();
        const curYear = now.getUTCFullYear();
        const curMonth = now.getUTCMonth();
        startDate = new Date(Date.UTC(curYear, curMonth, 1))
          .toISOString()
          .slice(0, 10);
        endDate = new Date(Date.UTC(curYear, curMonth + 1, 1))
          .toISOString()
          .slice(0, 10);
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

      return getAllMembersIncomeByDateRange(
        familyId,
        startDate,
        endDate,
      );
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
      const startDate = arguments_.startDate;
      const endDate = arguments_.endDate;

      if (
        typeof startDate === "string" &&
        typeof endDate === "string"
      ) {
        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T00:00:00Z`);

        if (
          !Number.isNaN(start.getTime()) &&
          !Number.isNaN(end.getTime()) &&
          start < end
        ) {
          return getIncomeByDateRange(familyId, startDate, endDate);
        }
      }

      const rawPeriod = arguments_.period;
      const period =
        typeof rawPeriod === "string"
          ? rawPeriod.toLowerCase().replace(/[\s-]+/g, "_")
          : "current_month";

      if (
        period !== "current_month" &&
        period !== "last_month" &&
        period !== "all"
      ) {
        return getIncomeSummary(familyId, "current_month");
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
      const rawMemberName = arguments_.memberName;

      if (
        typeof rawMemberName !== "string" ||
        rawMemberName.trim().length === 0
      ) {
        throw new Error(
          "memberName is required for get_member_income.",
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

      if (isPersonalPronoun) {
        return getIncomeByDateRange(
          familyId,
          startDate,
          endDate,
        );
      }

      return getMemberIncomeByDateRange(
        familyId,
        memberName,
        startDate,
        endDate,
      );
    }
    case "get_budget_status": {
      const now = new Date();
      const month =
        typeof arguments_.month === "number" && arguments_.month >= 1 && arguments_.month <= 12
          ? arguments_.month
          : now.getUTCMonth() + 1;
      const year =
        typeof arguments_.year === "number" && arguments_.year >= 2000
          ? arguments_.year
          : now.getUTCFullYear();

      const summary = await getBudgetsWithSpending(familyId, month, year);

      if (summary.budgets.length === 0) {
        return {
          month,
          year,
          message: `No category budgets have been set for ${month}/${year}.`,
          totalMonthlyExpenses: `₹${Math.round(summary.totalMonthlyExpenses).toLocaleString("en-IN")}`,
          unbudgetedSpending: summary.unbudgeted.map((u) => ({
            category: u.categoryName,
            spent: `₹${Math.round(u.actualSpent).toLocaleString("en-IN")}`,
          })),
        };
      }

      return {
        month,
        year,
        totalBudgeted: `₹${Math.round(summary.totalBudgeted).toLocaleString("en-IN")}`,
        totalSpentBudgeted: `₹${Math.round(summary.totalSpentBudgeted).toLocaleString("en-IN")}`,
        totalRemaining: `₹${Math.round(summary.totalRemaining).toLocaleString("en-IN")}`,
        overallPercentage: `${summary.overallPercentage}%`,
        overallStatus: summary.overallStatus,
        overbudgetCount: summary.overbudgetCount,
        warningCount: summary.warningCount,
        categoryBudgets: summary.budgets.map((b) => ({
          category: b.categoryName,
          budgetAmount: `₹${Math.round(b.amount).toLocaleString("en-IN")}`,
          actualSpent: `₹${Math.round(b.actualSpent).toLocaleString("en-IN")}`,
          remaining: `₹${Math.round(b.remaining).toLocaleString("en-IN")}`,
          percentageUsed: `${b.percentage}%`,
          status: b.status,
        })),
        unbudgetedSpending: summary.unbudgeted.map((u) => ({
          category: u.categoryName,
          spent: `₹${Math.round(u.actualSpent).toLocaleString("en-IN")}`,
        })),
      };
    }


    case "get_upcoming_bills": {
      const daysAhead =
        typeof arguments_.daysAhead === "number"
          ? Math.max(1, arguments_.daysAhead)
          : 30;
      const bills = await getUpcomingBillsForAI(familyId, daysAhead);

      if (bills.length === 0) {
        return {
          count: 0,
          daysAhead,
          message: `No recurring bills, subscriptions, or income are due within the next ${daysAhead} days.`,
          items: [],
        };
      }

      const totalUpcomingExpenses = bills
        .filter((b) => b.type === "expense")
        .reduce((sum, b) => sum + b.amount, 0);

      const totalUpcomingIncome = bills
        .filter((b) => b.type === "income")
        .reduce((sum, b) => sum + b.amount, 0);

      return {
        count: bills.length,
        daysAhead,
        totalUpcomingExpenses: `₹${Math.round(totalUpcomingExpenses).toLocaleString("en-IN")}`,
        totalUpcomingIncome: `₹${Math.round(totalUpcomingIncome).toLocaleString("en-IN")}`,
        items: bills.map((b) => ({
          title: b.title,
          amount: `₹${Math.round(b.amount).toLocaleString("en-IN")}`,
          type: b.type,
          frequency: b.frequency,
          category: b.category,
          member: b.member,
          isSubscription: b.isSubscription,
          nextDueDate: b.nextDueDate,
          daysUntilDue:
            b.daysUntilDue === 0
              ? "Due today"
              : b.daysUntilDue < 0
                ? `Overdue by ${Math.abs(b.daysUntilDue)} days`
                : `Due in ${b.daysUntilDue} days`,
        })),
      };
    }

    default:
      throw new Error(
        `Unknown financial tool: ${toolName}`,
      );
  }
}