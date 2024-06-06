import {
  Autocomplete,
  Box,
  Button,
  Container,
  FormControlLabel,
  FormGroup,
  Modal,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserAccounts } from "./hooks/useAccounts";

import { Expense, ExpenseElement } from "./ExpenseElement";
import { SplitwiseFriend } from "./Friends";
import CloseIcon from "@mui/icons-material/Close";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 800,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

function AddExpense({
  expense,
  closeModal,
}: {
  expense: Expense | null;
  closeModal: () => void;
}) {
  const { categories } = useUserAccounts();

  const categoryOptions = useMemo(
    () => (categories ? categories.map((c) => c.name) : []),
    [categories]
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (expense === null) {
    return <>Error: No expense selected</>;
  }
  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="overline">
          <strong>Add Expense</strong>
        </Typography>
        <Button onClick={closeModal} size="large">
          <CloseIcon />
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}>
        <Box
          sx={{
            flexGrow: 1,
          }}>
          <Typography variant="h4" component="h1" align="left">
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
          }}>
          <Typography variant="body1" color="" align="right">
            Total: {expense.total_amount} {expense.currency}
          </Typography>
          <Typography variant="body1" color="primary" align="right">
            My Share: {expense.share_amount} {expense.currency}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          my: 4,
        }}>
        <Autocomplete
          disableClearable
          disablePortal
          id="category"
          options={categoryOptions}
          sx={{ width: "100%" }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              onChange={(e) => {
                setSelectedCategory(e.target.value);
              }}
            />
          )}
        />
        <FormGroup>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log("Add to Toshl");
            }}>
            Add
          </Button>
        </FormGroup>
      </Box>
    </Box>
  );
}

export function Friend() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState<SplitwiseFriend | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(0);
  const count = 30;
  const [showInvolved, setShowInvolved] = useState(true);

  const { userAccounts, accountsSet, loadUserAccounts } = useUserAccounts();
  const navigate = useNavigate();
  useEffect(() => {
    async function checkUserAccount() {
      if (!accountsSet) {
        if (!(await loadUserAccounts())) {
          navigate("/");
        }
      }
      return true;
    }
    checkUserAccount();
  }, [accountsSet, loadUserAccounts, navigate]);

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
                }}>
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
            }}>
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
              label="Only show expenses I have a share in"
            />
          </Box>

          {showInvolved
            ? expenses
                .filter((e) => e.involved)
                .map((expense) => (
                  <ExpenseElement
                    expense={expense}
                    selectExpense={() => {
                      setSelectedExpense(expense);
                    }}
                  />
                ))
            : expenses.map((expense) => (
                <ExpenseElement
                  expense={expense}
                  selectExpense={() => {
                    setSelectedExpense(expense);
                  }}
                />
              ))}

          <Box
            sx={{
              mt: 5,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page - 1);
              }}
              disabled={page === 0}>
              Previous
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page + 1);
              }}>
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="h2" component="h1" gutterBottom>
          Loading...
        </Typography>
      )}
      <Modal open={!!selectedExpense}>
        <AddExpense
          expense={selectedExpense}
          closeModal={() => {
            setSelectedExpense(null);
          }}
        />
      </Modal>
    </Container>
  );
}
