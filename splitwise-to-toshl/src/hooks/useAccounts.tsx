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

export type ToshlCategory = {
  // Should only contain non deleted categories and expense categories
  id: string;
  name: string;
  entries: number;
};

export type ToshlTag = {
  // Should only contain non deleted tags and expense categories
  id: string;
  category_id: string;
  name: string;
  entries: number;
};

type UserAccountsContextType = {
  userAccounts: UserAccounts;
  accountsSet: boolean;
  loadingAccounts: boolean;
  loadUserAccounts: () => Promise<boolean>;
  setSelectedTag(id: string): void;
  selectedTag: ToshlTag | undefined;
  totalTags: number;
  totalCategories: number;
  allTags: ToshlTag[];
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

  const [categories, setCategories] = useState<ToshlCategory[]>([]);
  const [tags, setTags] = useState<ToshlTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>(
    localStorage.getItem("selectedTag") || ""
  );

  const accountsSet = useMemo(() => {
    return userAccounts.splitwise.id !== 0 && userAccounts.toshl.id !== 0;
  }, [userAccounts]);

  const loadUserAccounts = useCallback(async (): Promise<boolean> => {
    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    const toshlAPIKey = localStorage.getItem("toshlAPIKey");

    if (splitwiseAPIKey && toshlAPIKey) {
      setLoadingAccounts(true);

      const fetchSplitwiseUser = fetch(`/api/splitwise/v3.0/get_current_user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${splitwiseAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlUser = fetch(`/api/toshl/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlCategories = fetch(`/api/toshl/categories?per_page=500`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlTags = fetch(`/api/toshl/tags?per_page=500`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      try {
        const [splitwiseUser, toshlUser, toshlCategories, toshlTags] =
          await Promise.all([
            fetchSplitwiseUser,
            fetchToshlUser,
            fetchToshlCategories,
            fetchToshlTags,
          ]);

        setUserAccounts((prev) => ({
          ...prev,
          splitwise: {
            id: splitwiseUser.user.id,
            email: splitwiseUser.user.email,
          },
          toshl: {
            id: toshlUser.id,
            email: toshlUser.email,
          },
        }));

        const filteredCategories: ToshlCategory[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toshlCategories.forEach((c: any) => {
          if (!c?.deleted && c?.type === "expense") {
            filteredCategories.push({
              id: c?.id,
              name: c?.name,
              entries: c?.counts?.entries,
            });
          }
        });
        setCategories(filteredCategories);

        const filteredTags: ToshlTag[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toshlTags.forEach((t: any) => {
          if (!t?.deleted && t?.type === "expense") {
            filteredTags.push({
              id: t?.id,
              category_id: t?.category,
              name: t?.name,
              entries: t?.counts?.entries,
            });
          }
        });
        setTags(filteredTags);
      } catch (e) {
        console.error(e);
        setLoadingAccounts(false);
        return false;
      }

      setLoadingAccounts(false);
      return true;
    }
    return false;
  }, []);

  const totalTags = useMemo(() => {
    return tags.length;
  }, [tags]);

  const totalCategories = useMemo(() => {
    return categories.length;
  }, [categories]);

  const setSelectedTag = useCallback(
    (id: string) => {
      // Check if tag exists
      const tag = tags.find((t) => t.id === id);
      if (!tag) {
        return;
      }

      setSelectedTagId(id);
      localStorage.setItem("selectedTag", id);
    },
    [tags]
  );

  const selectedTag = useMemo(() => {
    return tags.find((t) => t.id === selectedTagId);
  }, [tags, selectedTagId]);

  const allTags = useMemo(() => {
    return tags;
  }, [tags]);

  const value = {
    userAccounts,
    loadUserAccounts,
    accountsSet,
    loadingAccounts,
    totalTags,
    totalCategories,
    setSelectedTag,
    selectedTag,
    allTags,
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
