import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Modal,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserAccounts } from "./hooks/useAccounts";

import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Expense, ExpenseElement } from "./ExpenseElement";
import { SplitwiseFriend } from "./Friends";

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
  const { categories, allTags, selectedTag } = useUserAccounts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const categoryOptions = useMemo(
    () =>
      categories
        ? categories.map((c) => {
            return { id: c.id, label: c.name };
          })
        : [],
    [categories]
  );

  const tagOptions = useMemo(() => {
    if (selectedCategory === null) {
      const tags = allTags;

      tags.sort((a, b) => b.entries - a.entries);

      return tags.map((tag) => {
        return { id: tag.id, label: tag.name };
      });
    }
    // Sort tags by entries
    const categoryTags = allTags.filter(
      (tag) => tag.category_id === selectedCategory
    );
    categoryTags.sort((a, b) => b.entries - a.entries);
    // Get tags that are not part of the selected category
    const otherTags = allTags.filter(
      (tag) => tag.category_id !== selectedCategory
    );
    // Sort tags by entries
    otherTags.sort((a, b) => b.entries - a.entries);

    return [
      ...categoryTags.map((tag) => {
        return { id: tag.id, label: tag.name };
      }),
      ...otherTags.map((tag) => {
        return { id: tag.id, label: tag.name };
      }),
    ];
  }, [allTags, selectedCategory]);

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
      <Stack
        sx={{
          my: 4,
        }}
        spacing={2}>
        <Autocomplete
          disableClearable
          disablePortal
          id="category"
          getOptionLabel={(option) => option.label}
          options={categoryOptions}
          sx={{ width: "100%" }}
          onChange={(e, value) => {
            setSelectedCategory(value?.id);
          }}
          renderInput={(params) => <TextField {...params} label="Category" />}
        />

        <Autocomplete
          multiple
          id="tags-standard"
          options={tagOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(e, value) => {
            console.log(value);
            setSelectedTags(value.map((v) => v.id));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Multiple values"
              placeholder="Favorites"
            />
          )}
        />
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"end"}>
          <Stack gap={1}>
            <Stack direction={"row"} gap={1} alignItems={"center"}>
              <Typography variant="subtitle1" component="div">
                Splitwise tag
              </Typography>
              <Tooltip
                title="This category will automatically be added to every expense. You can change this in the settings"
                placement="top">
                <HelpOutlineIcon />
              </Tooltip>
            </Stack>

            <Chip label={selectedTag?.name} />
          </Stack>

          <Button
            disabled={!selectedCategory}
            size="large"
            variant="contained"
            color="primary"
            sx={{
              px: 4,
            }}
            onClick={() => {
              console.log("Add to Toshl");
            }}>
            Add
          </Button>
        </Stack>
      </Stack>
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
                    key={expense.description + expense.date}
                    expense={expense}
                    selectExpense={() => {
                      setSelectedExpense(expense);
                    }}
                  />
                ))
            : expenses.map((expense) => (
                <ExpenseElement
                  key={expense.description + expense.date}
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
