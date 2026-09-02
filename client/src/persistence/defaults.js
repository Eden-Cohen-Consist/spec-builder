import { makeContactRow, makeDepartmentRow } from "../lib.js";

export const defaultAdmin = () => ({
  clientName: "",
  pmName: "",
  contacts: [makeContactRow()],
  departmentCreated: false,
  departments: [makeDepartmentRow()],
});

export const defaultBusiness = () => ({ goal: "" });
