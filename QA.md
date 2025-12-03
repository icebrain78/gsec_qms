
# QA Document - Quality Management System (QMS)

## Project Context
- **Purpose:** Digitize quality data across production, inspection, shipping, and claims.
- **Target Stack:** React (Frontend) + Nginx/PHP/MySQL (Backend).
- **PRD Source:** Provided PDF.

## Q & A Log

### Q1. Build QMS based on PRD
**Request:**
Create a React web application based on the attached PRD. The goal is a system using Nginx+PHP+MySQL. Create a QA document to remember this conversation.

**Answer & Implementation Details:**
1.  **Framework:** React 18, TypeScript, Tailwind CSS.
2.  **File Structure:**
    - `types.ts`: Defined TS interfaces mirroring the DB schema proposed in PRD Section 6 (Project, Inspection, Defect, Claim).
    - `mockData.ts`: Created realistic mock data to populate the UI before PHP backend is ready.
    - `Components`: Modularized Dashboard, Project List, Inspection Form, etc.
3.  **Key Features Implemented:**
    - **Dashboard:** Visualizes KPIs (Defect Rate, Rework Rate) using `recharts`.
    - **Inspection:** Logic for "QR Scan -> Form Page" flow.
    - **Responsiveness:** "Mobile-First" design for field workers (large buttons, clear status indicators).
4.  **Backend Integration Plan (Future):**
    - The React app fetches data from `mockData.ts`. This should be replaced with `fetch('/api/projects.php')` calls.
    - Database schema should follow the definitions in `types.ts`.

### Q2. Future Maintenance
- Maintain this `QA.md` file to track architectural decisions and requirements changes.
- Ensure the PHP backend outputs JSON matching the interfaces in `types.ts`.

### Q3. UI Updates: Remove QA Tab & Add User Management
**Request:**
1. Hide the QA document from the main UI (keep it as a file).
2. Add a "User Management" menu.

**Implementation:**
- **QA Document:** Removed `components/QA.tsx` from the `App.tsx` routing. The content is preserved in this `QA.md` file.
- **User Management:**
    - Created `components/UserManager.tsx`.
    - Added `User` interface to `types.ts` and `mockUsers` to `services/mockData.ts`.
    - Implemented "Admin manual registration" UI as requested in the PRD (Security section).
    - Columns implemented: Name, ID, Dept, Role (Admin, Manager, Inspector, Worker), Status.

### Q4. Feature: Project Management - Add New Project
**Request:**
Implement the "Add New" feature in the Project Management menu using a modal.

**Implementation:**
- **App.tsx:** Lifted `projects` data from a static import to component state (`useState`) to allow dynamic updates. Created `handleAddProject` function.
- **ProjectManager.tsx:**
    - Added `showAddModal` state to toggle the modal.
    - Created a form with fields: Project ID, Name, Task No, Panel Count, Color, Spec, Start Date, Status.
    - Implemented form submission to update the parent state via `onAddProject`.

### Q5. Fix: Project Modal Visibility (Dark Input Issue)
**Request:**
1. The modal background is black (referring to input fields) and text is invisible. Make the text white.
2. Data entered is not showing (due to black-on-black text).

**Implementation:**
- **ProjectManager.tsx:** Updated all input and select fields in the "Add New Project" modal.
    - Changed CSS from default light style to explicit dark style: `bg-gray-700 text-white border-gray-600`.
    - Added `placeholder-gray-400` to ensure placeholders are visible on the dark background.
    - This ensures that even if the container or browser defaults are dark, the user can see what they are typing.

### Q6. Bug Fix: Missing Data in Project Table
**Request:**
"Data was entered (ID, Status shown), but Project Name, Task No, and Panel Count are empty. Check if it entered DB or if reading logic is wrong."

**Analysis & Fix:**
- **Cause:** The data *was* successfully added to the `projects` state (the "DB" in this frontend-only phase). However, in `ProjectManager.tsx`, the `<td>` elements for Name, Task No, and Panel Count did not have an explicit text color class. On a white table background, the text (likely defaulting to white/transparent due to previous dark mode attempts) was invisible.
- **Action:**
    - Added `text-gray-900` class to ALL `<td>` elements in the table.
    - Verified data binding in `useState` is correct (`taskNumber` vs `Task No` etc.).
    - Added a `console.log` in `App.tsx` to print the "DB" (state) contents to the browser console for verification.

### Q7. Feature: Group Projects by ID (Rowspan)
**Request:**
"If one project ID has multiple Tasks, group them together as shown in the reference image (merged cells for ID and Project Name)."

**Implementation:**
- **Mock Data:** Added "Battery Factory (4152221)" with 3 tasks (T111, T112, T203) to `services/mockData.ts` for immediate verification.
- **ProjectManager.tsx:**
    - Implemented grouping logic: Pre-process `projects` array into a Dictionary grouped by `id`.
    - Updated Table Rendering:
        - Iterated through groups, then tasks.
        - Used `rowSpan={group.length}` for "ID" and "Name" columns on the first row of each group.
        - Skipped rendering "ID" and "Name" columns for subsequent rows in the same group.
        - Added borders to visually separate different projects while keeping tasks within a project cohesive.

### Q8. Feature: Add Task to Existing Project (Hyperlink ID)
**Request:**
"If ID/Name are same but Task is different, make ID a hyperlink. Clicking it should auto-fill ID, Name, Color etc., and only allow input for Task No and Panel Count."

**Implementation:**
- **ProjectManager.tsx:**
    - Changed the Project ID cell in the table to a clickable `<button>` (styled as a blue link).
    - Added `isAddTaskMode` state.
    - **Logic:**
        - Clicking "+ New Registration": Opens empty modal, all fields editable.
        - Clicking "ID Link": Opens modal pre-filled with that project's common data (ID, Name, Color, Spec).
    - **Modal UI:**
        - If `isAddTaskMode` is true, common fields are `readOnly` and styled with `opacity-50` / `cursor-not-allowed`.
        - Task No and Panel Count remain editable.

### Q9. Feature: Update Project Status
**Request:**
"When the status badge (Planning, Production, Completed) is clicked, open a modal to change the status. Clicking a new status should save the change."

**Implementation:**
- **App.tsx:** Added `handleUpdateProject(project)` to update the `projects` state based on ID and Task Number.
- **ProjectManager.tsx:**
    - Converted Status Badge to a `<button>`.
    - Added `editingStatusProject` state to track which project is being modified.
    - Implemented a "Status Change Modal" with 3 large, touch-friendly buttons for status selection.
    - Integrated with `onUpdateProject` to persist changes.

### Q10. Feature: Select Panel & Navigate to Inspection
**Request:**
"When Panel Count is clicked, show a grid of buttons (1 to N). PC: 10 per row, Mobile: 5 per row. Clicking a number moves to the Inspection page."

**Implementation:**
- **ProjectManager.tsx:**
    - **Grid Modal:** Created a modal showing `project.panelCount` buttons.
    - **Responsive Layout:** Used Tailwind CSS Grid (`grid-cols-5 md:grid-cols-10`) to satisfy the layout requirement.
    - **Interaction:** Clicking the "Panel Count" cell opens this modal.
- **App.tsx:**
    - Added `handleSelectPanel` function.
    - When a panel button is clicked, the app logs the selection and switches `activeTab` to `inspections`.

### Q11. Database: Connect to Firebase
**Request:**
"I want to connect the DB to Firebase."

**Implementation:**
- **Infrastructure:**
    - `index.html`: Added Firebase App and Firestore via Import Map.
    - `services/firebase.ts`: Created config file.
    - `services/firestoreService.ts`: Created Service functions for Projects and Users.
- **Config Update:**
    - User provided real `firebaseConfig` credentials.
    - Updated `services/firebase.ts` with the provided API key, auth domain, and project ID (`gsecqc2025`).
    - Now the app connects to the live Firestore instance instead of using mock data (unless the connection fails or DB is empty).
