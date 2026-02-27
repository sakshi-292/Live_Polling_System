import { useState } from "react";

type Role = "teacher" | "student" | null;

export function useRole() {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("role") as Role) || null;
  });

  const setRole = (newRole: Role) => {
    if (newRole) {
      localStorage.setItem("role", newRole);
    } else {
      localStorage.removeItem("role");
    }
    setRoleState(newRole);
  };

  return { role, setRole };
}
