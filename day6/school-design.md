# School Database Design

## Table Explanations

* **`students`**: This table stores the core personal information for each individual enrolled in the school. It holds a unique ID, the student's full name, and a unique email address to ensure no duplicate accounts are created.
* **`courses`**: This table acts as a catalog of all classes offered by the school. It contains a unique course ID and the title of the course.
* **`enrolments`**: This is a relational join table that records the event of a student signing up for a specific course. It stores its own unique ID, the foreign keys of the student and the course, and context-specific data such as the student's `grade` for that specific class.

## Relationships

The relationship between Students and Courses is **many-to-many**. A single student can enroll in multiple courses, and a single course can have multiple students enrolled in it.

Relational databases cannot natively store many-to-many relationships directly on the primary tables without duplicating data heavily. Therefore, we use `enrolments` as a **join table** (or junction table). This resolves the many-to-many relationship by breaking it down into two **one-to-many** relationships:

* One Student has many Enrolments.
* One Course has many Enrolments.

## Recommended Index

I would add an index on the `name` column in the `students` table:
`CREATE INDEX idx_student_name ON students(name);`

**Reason:** In a school system, administrators and teachers will frequently search for student records by their name rather than their internal numeric ID. As the database grows to thousands of students, this index will significantly speed up `SELECT` and `UPDATE` queries that filter via the `WHERE students.name = '...'` clause (as seen in our SQL queries), preventing the database from having to perform a slow, full table scan.

## SQL vs. NoSQL

For a school enrolment system, **SQL (Relational Database)** is heavily preferred over NoSQL. Educational records are highly structured and inherently relational; data consistency is critical. We need strict rules, such as ensuring a student cannot enroll in the exact same course twice, and preventing the deletion of a course without handling the enrolled students (using Foreign Keys and `ON DELETE CASCADE`). SQL databases provide ACID compliance to guarantee that these complex transactions and relational constraints are strictly enforced, whereas a document-based NoSQL database would require redundant data nesting and manual application-level checks to achieve the same level of integrity.