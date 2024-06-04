import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Define the shape of your context state
type UserAccounts = {
  splitwise: {
    id: number;
    email: string;
  };
  toshl: {
    id: number;
    email: string;
  };
};

type UserAccountsContextType = {
  userAccounts: UserAccounts;
  accountsSet: boolean;
  loadingAccounts: boolean;
  loadUserAccounts: () => Promise<boolean>;
};

// Create the context
const UserAccountsContext = createContext<UserAccountsContextType | undefined>(
  undefined
);

// Create a provider component
export const UserAccountsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [userAccounts, setUserAccounts] = useState<UserAccounts>({
    splitwise: {
      id: 0,
      email: "",
    },
    toshl: {
      id: 0,
      email: "",
    },
  });

  const accountsSet = useMemo(() => {
    return userAccounts.splitwise.id !== 0 && userAccounts.toshl.id !== 0;
  }, [userAccounts]);

  const loadUserAccounts = useCallback(async (): Promise<boolean> => {
    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    const toshlAPIKey = localStorage.getItem("toshlAPIKey");

    if (splitwiseAPIKey && toshlAPIKey) {
      setLoadingAccounts(true);
      try {
        const data = await fetch(`/api/splitwise/v3.0/get_current_user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${splitwiseAPIKey}`,
          },
        });
        const splitwiseUser = await data.json();
        setUserAccounts((prev) => ({
          ...prev,
          splitwise: {
            id: splitwiseUser.user.id,
            email: splitwiseUser.user.email,
          },
        }));
      } catch (e) {
        console.error(e);
        return false;
      }

      try {
        const data = await fetch(`/api/toshl/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${toshlAPIKey}`,
          },
        });
        const toshlUser = await data.json();
        setUserAccounts((prev) => ({
          ...prev,
          toshl: {
            id: toshlUser.id,
            email: toshlUser.email,
          },
        }));
      } catch (e) {
        console.error(e);
        return false;
      }

      console.log("Getting categories and tags");
      // Get catrgories from Toshl
      try {
        const data = await fetch(`/api/toshl/categories?per_page=500`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${toshlAPIKey}`,
          },
        });
        const toshlCategories = await data.json();

        console.log(toshlCategories);
      } catch (e) {
        console.error(e);
        return false;
      }

      try {
        const data = await fetch(`/api/toshl/tags?per_page=500`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${toshlAPIKey}`,
          },
        });
        const toshlTags = await data.json();

        console.log(toshlTags);
      } catch (e) {
        console.error(e);
        return false;
      }

      // Get tags from Toshl
    }
    setLoadingAccounts(false);
    return true;
  }, []);

  const value = {
    userAccounts,
    loadUserAccounts,
    accountsSet,
    loadingAccounts,
  };

  return (
    <UserAccountsContext.Provider value={value}>
      {children}
    </UserAccountsContext.Provider>
  );
};

// Create a custom hook to use the context
export const useUserAccounts = () => {
  const context = useContext(UserAccountsContext);
  if (context === undefined) {
    throw new Error(
      "useUserAccounts must be used within a UserAccountsProvider"
    );
  }
  return context;
};
