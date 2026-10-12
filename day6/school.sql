-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    -- Rule preventing the same student enrolling on the same course twice
    UNIQUE (student_id, course_id) 
);

-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

-- Insert 4 students (1 will have no enrolments for our query later)
INSERT INTO students (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('David Evans', 'david@example.com');

-- Insert 3 courses
INSERT INTO courses (title) VALUES 
('Introduction to SQL'),
('Advanced Python'),
('Web Development');

-- Insert 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'B'), -- Alice in SQL
(1, 2, 'A'), -- Alice in Python
(2, 1, 'C'), -- Bob in SQL
(2, 3, 'B'), -- Bob in Web Dev
(3, 2, 'A'); -- Charlie in Python


-- ==========================================
-- 3. QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name)
SELECT courses.title, enrolments.grade 
FROM courses
JOIN enrolments ON courses.course_id = enrolments.course_id
JOIN students ON enrolments.student_id = students.student_id
WHERE students.name = 'Alice Smith';

-- Query 2: All students on one course (by course title)
SELECT students.name, students.email, enrolments.grade
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE courses.title = 'Introduction to SQL';

-- Query 3: The number of students per course
SELECT courses.title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.title;

-- Query 4: Students who have no enrolments
SELECT students.name 
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;

-- Query 5: Update one enrolment's grade
UPDATE enrolments 
SET grade = 'A+' 
WHERE student_id = (SELECT student_id FROM students WHERE name = 'Bob Jones')
  AND course_id = (SELECT course_id FROM courses WHERE title = 'Introduction to SQL');

-- Verify the update
SELECT students.name, courses.title, enrolments.grade
FROM enrolments
JOIN students ON enrolments.student_id = students.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE students.name = 'Bob Jones' AND courses.title = 'Introduction to SQL';