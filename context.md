### **"UniSync" - The Student Life Dashboard**

**Concept:** Instead of a "smart" to-do list, this is a "smart" aggregator. It's a single dashboard designed to pull together a student's entire schedule—classes, assignment deadlines, work shifts, and personal events—into one unified timeline. The core data type isn't a "task," but an "Event" with different categories.

**Why this is a strong solution:** It directly tackles the "multiple platforms" and "chaos" problem mentioned in the prompt. It acknowledges that a student's time is consumed by more than just homework. By visualizing everything in one place, it helps students see the *real* picture of their available time, preventing conflicts and reducing mental overhead.



---

### How It Meets Each Requirement:

#### 1.  **Full CRUD Operations**
* The core data type is an **"Event"**. An event can be a `Class`, `Assignment`, `Exam`, `Work Shift`, or `Personal` appointment.
* **Create:** A single, clean "Add New" button opens a form. The user inputs the event title, start/end times, and selects a category.
* **Read:** Events are displayed across the three different views.
* **Update:** Users can click on any event to edit its details (e.g., change the time of a group meeting, update the location of a work shift).
* **Delete:** Users can remove events, like a cancelled class or a completed assignment.

#### 2.  **Persistent Storage**
* The app will use a remote database like **Supabase** or **Firebase**. This is crucial because students need to access their schedule from both their phone and laptop. `localStorage` alone is insufficient for this use case.
* The database will have a simple `events` table with columns like `id`, `user_id`, `title`, `start_time`, `end_time`, `category`, `location`, and `description`.

#### 3.  **Three Different Views of the Same Data**
This is where UniSync truly shines by providing context-specific views:

* **View 1: The "Today" Timeline (Dashboard View)**
    * A single-column, vertical timeline showing only today's events from morning to night.
    * It answers the question: **"What do I have to do *right now* and what's next?"**
    * It would clearly show blocks of free time between scheduled events, perfect for grabbing lunch or fitting in a quick study session. 

* **View 2: The Weekly Schedule (Planner View)**
    * A classic 7-day calendar grid, similar to Google Calendar.
    * This view is for planning and answers the question: **"How does my week look?"**
    * It would be pre-populated with recurring classes and allows students to drag-and-drop new events into open slots.

* **View 3: The Deadline Tracker (List/Kanban View)**
    * This view filters the data to show **only** events with a deadline, such as `Assignments` and `Exams`.
    * It answers the question: **"What work is due and when?"**
    * It could be displayed as a simple list sorted by a "days remaining" countdown or as a Kanban board with columns for "This Week," "Next Week," and "Future."

#### 4.  **Time/Date Handling**
* This is central to the app. Every event is built around `start_time` and `end_time`.
* The app will display "Time Until Next Event" on the dashboard.
* The Deadline Tracker view will calculate and show a "Countdown" (e.g., "Due in 3 days").
* It can send notifications 15 minutes before any scheduled event begins.

#### 5.  **Support for 20+ Items**
* This architecture handles this naturally. A typical student schedule already has 15-20 classes per week. Adding assignments, work, and social events easily pushes this past 20.
* The **Weekly View** is designed for density. The **Today View** is automatically filtered, preventing overload. The **Deadline Tracker** can use simple pagination or "load more" if the list becomes extremely long.

---

### Unique Features & Creative Insights This Idea Offers:

* **"AI Quick-Add" using Natural Language:**  Instead of clicking buttons and filling out a form with multiple fields, the user can create an event by typing or speaking a single, natural sentence. The AI will understand the sentence and fill in the details automatically