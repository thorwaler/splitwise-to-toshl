import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useUserAccounts } from "../hooks/useAccounts";
import { Expense } from "./ExpenseListItem";

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

export function AddExpenseForm({
  expense,
  closeModal,
}: {
  expense: Expense | null;
  closeModal: () => void;
}) {
  const { categories, allTags, selectedTag } = useUserAccounts();
  const categoryField = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // useEffect(() => {
  //   window.addEventListener("keydown", (e) => {
  //     if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
  //       console.log("Focus category field");
  //       categoryField.current?.click();
  //       e.preventDefault();
  //     }
  //   });
  //   return () => {
  //     window.removeEventListener("keydown", () => {});
  //   };
  // }, [closeModal]);

  const addExpenseToToshl = async () => {
    console.log("Add to Toshl");
    if (expense === null) {
      alert("Error: No expense selected");
      return;
    }
    // Data from python
    // data = {
    //   "amount": -abs(float(e['share_amount'])),
    //   "currency": {"code": e['currency']},
    //   "date": e['date'],
    //   "desc": e['description'],
    //   "category": selected_category['id'],
    //   "extra": {
    //     "friends": e['friends']
    //   }
    // }
    const data = {
      amount: -Math.abs(expense.share_amount),
      currency: { code: expense.currency },
      date: expense.date,
      desc: expense.description,
      category: selectedCategory,
      extra: {
        friends: selectedTags,
        expense_id: expense.id,
      },
      tags: [selectedTag?.id, ...selectedTags].filter((t) => t),
    };
    console.log(data);

    try {
      const res = await fetch("/api/toshl/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("toshlAPIKey")}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Expense added to Toshl");
      } else {
        alert("Error adding expense to Toshl");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding expense to Toshl");
    }
  };

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
        <Button tabIndex={4} onClick={closeModal} size="large">
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
          tabIndex={0}
          renderInput={(params) => (
            <TextField inputRef={categoryField} {...params} label="Category" />
          )}
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
          tabIndex={1}
          renderInput={(params) => (
            <TextField {...params} label="Tags" placeholder="Select tags" />
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
            tabIndex={3}
            sx={{
              px: 4,
            }}
            onClick={() => {
              addExpenseToToshl();
            }}>
            Add
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
