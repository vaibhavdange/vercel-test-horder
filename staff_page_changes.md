Got it, Vaibhav ✅ — let’s refactor your **StaffPage** into a clean, modular structure with the improvements I suggested.
I’ll give you a **drop-in ready folder structure + rewritten code** that you can copy straight into your project.

---

## 📂 New Folder Structure

```
/components/staff
  ├── StaffPage.tsx        ← main page
  ├── StaffTable.tsx       ← staff list
  ├── StaffForm.tsx        ← add/edit staff form
  ├── AttendanceTable.tsx  ← attendance list
  ├── AttendanceForm.tsx   ← add/edit attendance form
  ├── Tabs.tsx             ← reusable tab switcher
  ├── SearchBar.tsx        ← search + filter bar
  └── utils.ts             ← shared helpers (status icons/colors etc.)
```

---

## 🔹 Example Code (Fully Refactored)

Here’s the **main StaffPage.tsx** after refactor:

```tsx
"use client";

import React, { useState } from "react";
import { Tabs } from "./Tabs";
import { StaffTable } from "./StaffTable";
import { AttendanceTable } from "./AttendanceTable";
import { StaffForm } from "./StaffForm";
import { AttendanceForm } from "./AttendanceForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "attendance">("staff");
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Management</h1>

      {/* Tabs */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Actions */}
      <div className="flex justify-end mb-4">
        {activeTab === "staff" && (
          <Button onClick={() => setShowStaffForm(true)}>+ Add Staff</Button>
        )}
        {activeTab === "attendance" && (
          <Button onClick={() => setShowAttendanceForm(true)}>
            + Add Attendance
          </Button>
        )}
      </div>

      {/* Tables */}
      {activeTab === "staff" && <StaffTable />}
      {activeTab === "attendance" && <AttendanceTable />}

      {/* Modals */}
      <StaffForm open={showStaffForm} onClose={() => setShowStaffForm(false)} />
      <AttendanceForm
        open={showAttendanceForm}
        onClose={() => setShowAttendanceForm(false)}
      />
    </div>
  );
}
```

---

### 🔹 Tabs.tsx

```tsx
import React from "react";
import { Button } from "@/components/ui/button";

export function Tabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: "staff" | "attendance";
  setActiveTab: (tab: "staff" | "attendance") => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={activeTab === "staff" ? "default" : "outline"}
        onClick={() => setActiveTab("staff")}
      >
        Staff
      </Button>
      <Button
        variant={activeTab === "attendance" ? "default" : "outline"}
        onClick={() => setActiveTab("attendance")}
      >
        Attendance
      </Button>
    </div>
  );
}
```

---

### 🔹 StaffTable.tsx (simplified)

```tsx
"use client";
import React from "react";
import { useStaff, useDeleteStaff } from "@/lib/hooks/useStaff";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StaffTable() {
  const { data: staff, isLoading, error } = useStaff();
  const deleteStaff = useDeleteStaff();

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (error) return <p className="text-red-500">Error loading staff</p>;

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Salary</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff?.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="px-4 py-2">{s.fullName}</td>
              <td className="px-4 py-2">{s.email}</td>
              <td className="px-4 py-2">{s.role}</td>
              <td className="px-4 py-2">₹{s.salary}</td>
              <td className="px-4 py-2 space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    try {
                      await deleteStaff.mutateAsync(s.id);
                      toast.success("Staff deleted!");
                    } catch {
                      toast.error("Failed to delete staff");
                    }
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 🔹 StaffForm.tsx (React Hook Form + Zod)

```tsx
"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddStaff } from "@/lib/hooks/useStaff";
import { toast } from "sonner";

const staffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.string(),
  salary: z.number().min(0),
});

type StaffFormData = z.infer<typeof staffSchema>;

export function StaffForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  });

  const addStaff = useAddStaff();

  const onSubmit = async (data: StaffFormData) => {
    try {
      await addStaff.mutateAsync(data);
      toast.success("Staff added!");
      reset();
      onClose();
    } catch {
      toast.error("Failed to add staff");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("fullName")} placeholder="Full Name" className="w-full border p-2 rounded"/>
          {errors.fullName && <p className="text-red-500">{errors.fullName.message}</p>}

          <input {...register("email")} placeholder="Email" className="w-full border p-2 rounded"/>
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}

          <input {...register("role")} placeholder="Role" className="w-full border p-2 rounded"/>
          <input type="number" {...register("salary", { valueAsNumber: true })} placeholder="Salary" className="w-full border p-2 rounded"/>
          {errors.salary && <p className="text-red-500">{errors.salary.message}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

⚡ I’ve shown the **main page, tabs, staff table, and staff form**. Attendance works the same way (just copy this structure into `AttendanceTable.tsx` and `AttendanceForm.tsx`).

👉 Next step: Do you want me to **fully expand attendance code as well** (table + form), or is this partial refactor enough for you to start dropping it in?
