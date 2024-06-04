import {
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserAccounts } from "./hooks/useAccounts";

export type SplitwiseFriend = {
  id: string;
  first_name: string;
  last_name: string;
  balance: {
    amount: number;
    currency_code: string;
  }[];
};

type Expense = {
  category: string;
  description: string;
  currency: string;
  total_amount: number;
  date: string;
  share_amount: number;
  friends: string[];
  involved: boolean;
};

const ExpenseElement = ({ expense }: { expense: Expense }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottom: "1px solid #ccc",
        padding: "1rem",
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <Typography variant="h6" component="h3" align="left">
          {expense.description}
        </Typography>
        <Typography variant="body2" component="h3" align="left">
          {expense.date}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Typography variant="body1" color="" align="right">
          Total: {expense.total_amount} {expense.currency}
        </Typography>
        {expense.involved ? (
          <Typography variant="body1" color="primary" align="right">
            My Share: {expense.share_amount} {expense.currency}
          </Typography>
        ) : (
          <Chip label="Not involved" />
        )}
      </Box>
      {expense.involved && (
        <Button
          variant="contained"
          color="primary"
          sx={{
            marginLeft: "1rem",
          }}
        >
          Add
        </Button>
      )}
    </Box>
  );
};

export function Friend() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState<SplitwiseFriend | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(20);
  const [showInvolved, setShowInvolved] = useState(true);

  const { userAccounts, accountsSet } = useUserAccounts();
  const navigate = useNavigate();
  useEffect(() => {
    if (!accountsSet) {
      navigate("/");
    }
  }, [accountsSet, navigate]);

  useEffect(() => {
    if (friendId === undefined) {
      return;
    }
    // Get friend details
    fetch(`/api/splitwise/v3.0/get_friend/${friendId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("splitwiseAPIKey")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFriend(data.friend as SplitwiseFriend);
      });

    // Get expenses
    fetch(
      `/api/splitwise/v3.0/get_expenses?friend_id=${friendId}&limit=${count}&offset=${
        page * count
      }`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("splitwiseAPIKey")}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const expensesArr = data.expenses;
        const normalisedExpenseArray = [];
        for (const e of expensesArr) {
          const expense: Expense = {
            category: e.category.name,
            description: e.description,
            currency: e.currency_code,
            total_amount: parseFloat(e.cost),
            date: e.date.split("T")[0],
            share_amount: 0,
            friends: [],
            involved: false,
          };

          const expenseUsers = e.users;
          for (const eu of expenseUsers) {
            if (eu.user.id != userAccounts.splitwise.id) {
              const fullName = [eu.user.first_name, eu.user.last_name]
                .filter(Boolean)
                .join(" ");
              expense.friends.push(fullName);
            }
          }
          for (const eu of expenseUsers) {
            if (eu.user_id == userAccounts.splitwise.id) {
              expense.share_amount = parseFloat(eu.owed_share);
              break;
            }
          }

          if (expense.share_amount > 0) {
            expense.involved = true;
          }
          normalisedExpenseArray.push(expense);
        }
        setExpenses(normalisedExpenseArray);
      });
  }, [count, friendId, page, userAccounts.splitwise.id]);

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      {friend ? (
        <Box>
          <Typography variant="h2" component="h1">
            {[friend.first_name, friend.last_name].filter(Boolean).join(", ")}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            {friend.balance[0]?.amount && friend.balance[0]?.amount > 0 && (
              <span
                style={{
                  color: "grey",
                  marginLeft: "0.5rem",
                }}
              >
                (
                {friend.balance
                  .map(
                    (balance) => `${balance.amount} ${balance.currency_code}`
                  )
                  .join(", ")}
                )
              </span>
            )}
          </Typography>
          <hr />
          <Box
            sx={{
              my: 2,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Page: {page + 1}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  value={showInvolved}
                  onChange={(e) => {
                    setShowInvolved(e.target.checked);
                  }}
                  defaultChecked
                />
              }
              label="Only show expenses I'm involved in"
            />
          </Box>

          {showInvolved
            ? expenses
                .filter((e) => e.involved)
                .map((expense) => <ExpenseElement expense={expense} />)
            : expenses.map((expense) => <ExpenseElement expense={expense} />)}

          <Box
            sx={{
              mt: 5,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page - 1);
              }}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page + 1);
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="h2" component="h1" gutterBottom>
          Loading...
        </Typography>
      )}
    </Container>
  );
}
