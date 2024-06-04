import "./App.css";

import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Container } from "@mui/material";
import { useUserAccounts } from "./hooks/useAccounts";

function App() {
  const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
  const toshlAPIKey = localStorage.getItem("toshlAPIKey");

  const navigate = useNavigate();
  const { userAccounts, loadUserAccounts, accountsSet, loadingAccounts } =
    useUserAccounts();

  useEffect(() => {
    // if (!splitwiseAPIKey || !toshlAPIKey) {
    //   navigate("/settings");
    // }
    if (!accountsSet) {
      console.log("Accounts not set");
      loadUserAccounts();
    } else {
      console.log("Accounts set");
    }
  }, [accountsSet, loadUserAccounts, navigate, splitwiseAPIKey, toshlAPIKey]);

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      <Typography variant="h2" component="h1" gutterBottom>
        Splitwise to Toshl
      </Typography>

      {accountsSet && (
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
          }}>
          <Typography
            variant="body1"
            component="div"
            sx={{
              textAlign: "right",
            }}
            gutterBottom>
            <div>Accounts:</div>
            <div>Splitwise: {userAccounts.splitwise.email} </div>
            <div>Toshl: {userAccounts.toshl.email} </div>
            <a href="/settings">Settings</a>
          </Typography>
        </Box>
      )}

      <Typography variant="h6" component="h2" gutterBottom>
        This is a tool to transfer your Splitwise transactions to Toshl.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        All processing is done on your machine.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        No data is stored on the server.
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        This tool is open source. You can view the code{" "}
      </Typography>

      <Box sx={{ mt: 5 }}>
        {loadingAccounts ? (
          <Box>
            <CircularProgress />
            <Typography>Loading Accounts...</Typography>
          </Box>
        ) : accountsSet ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate("/friends");
            }}>
            Start
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate("/settings");
            }}>
            Set API Keys
          </Button>
        )}
      </Box>
    </Container>
  );
}

export default App;
